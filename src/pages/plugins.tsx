/**
 * Plugins Management Page
 * Protected route - requires Admin or Super Admin role
 * Allows uploading, editing, renaming, and deleting plugin files
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import Spinner from '@/components/Spinner';

// Constants
const MAX_FILE_SIZE_BYTES = 35 * 1024 * 1024; // 35MB
const EDITABLE_EXTENSIONS = ['.yml', '.yaml', '.json', '.properties', '.txt', '.conf', '.cfg'];

interface PluginsProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface FileInfo {
  name: string;
  size: number;
  modified: string;
  isDirectory: boolean;
  extension: string;
}

interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default function Plugins({ user }: PluginsProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, FileInfo[]>>({});
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async (path: string = '') => {
    try {
      setLoading(true);
      const url = path ? `/apanel44/api/files?path=${encodeURIComponent(path)}` : '/apanel44/api/files';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
        setCurrentPath(path);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load files' }));
        setToast({ message: errorData.message || 'Failed to load files', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setToast({ message: 'Error loading files', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles('');
  }, [fetchFiles]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (both extension and MIME type)
    if (!file.name.endsWith('.jar')) {
      setToast({ message: 'Only .jar files are allowed', type: 'error' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Also check MIME type for additional security
    const validMimeTypes = ['application/java-archive', 'application/x-java-archive', 'application/zip'];
    if (file.type && !validMimeTypes.includes(file.type)) {
      setToast({ message: 'Invalid file type. Only JAR files are allowed.', type: 'error' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size (35MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setToast({ 
        message: `File size exceeds 35MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`, 
        type: 'error' 
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      if (currentPath) {
        formData.append('path', currentPath);
      }

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          setToast({ message: 'File uploaded successfully', type: 'success' });
          fetchFiles(currentPath);
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            setToast({ message: response.message || 'Failed to upload file', type: 'error' });
          } catch {
            setToast({ message: 'Failed to upload file', type: 'error' });
          }
        }
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        setToast({ message: 'Upload failed. Please try again.', type: 'error' });
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      });

      xhr.open('POST', '/apanel44/api/files');
      xhr.send(formData);
    } catch (error) {
      console.error('Error uploading file:', error);
      setToast({ message: 'Error uploading file', type: 'error' });
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;

    try {
      setIsSaving(true);
      const pathToUse = (selectedFile as FileInfo & { _relativePath?: string })._relativePath || currentPath;
      const url = pathToUse 
        ? `/apanel44/api/files/${encodeURIComponent(selectedFile.name)}?path=${encodeURIComponent(pathToUse)}`
        : `/apanel44/api/files/${encodeURIComponent(selectedFile.name)}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedContent }),
      });

      if (response.ok) {
        setToast({ message: 'File saved successfully', type: 'success' });
        setShowEditModal(false);
        setSelectedFile(null);
        setEditedContent('');
        fetchFiles(currentPath);
      } else {
        const data = await response.json().catch(() => ({ message: 'Failed to save file' }));
        setToast({ message: data.message || 'Failed to save file', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving file:', error);
      setToast({ message: 'Error saving file', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenameFile = async () => {
    if (!selectedFile || !newFileName.trim()) return;

    try {
      setIsRenaming(true);
      const pathToUse = (selectedFile as FileInfo & { _relativePath?: string })._relativePath || currentPath;
      const url = pathToUse 
        ? `/apanel44/api/files/${encodeURIComponent(selectedFile.name)}?path=${encodeURIComponent(pathToUse)}`
        : `/apanel44/api/files/${encodeURIComponent(selectedFile.name)}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newFilename: newFileName.trim() }),
      });

      if (response.ok) {
        setToast({ message: 'File renamed successfully', type: 'success' });
        setShowRenameModal(false);
        setSelectedFile(null);
        setNewFileName('');
        fetchFiles(currentPath);
      } else {
        const data = await response.json().catch(() => ({ message: 'Failed to rename file' }));
        setToast({ message: data.message || 'Failed to rename file', type: 'error' });
      }
    } catch (error) {
      console.error('Error renaming file:', error);
      setToast({ message: 'Error renaming file', type: 'error' });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!selectedFile) return;

    try {
      setIsDeleting(true);
      const pathToUse = (selectedFile as FileInfo & { _relativePath?: string })._relativePath || currentPath;
      const url = pathToUse 
        ? `/apanel44/api/files/${encodeURIComponent(selectedFile.name)}?path=${encodeURIComponent(pathToUse)}`
        : `/apanel44/api/files/${encodeURIComponent(selectedFile.name)}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (response.ok) {
        setToast({ message: 'File deleted successfully', type: 'success' });
        setShowDeleteModal(false);
        setSelectedFile(null);
        fetchFiles(currentPath);
      } else {
        const data = await response.json().catch(() => ({ message: 'Failed to delete file' }));
        setToast({ message: data.message || 'Failed to delete file', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setToast({ message: 'Error deleting file', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Wrapper functions for nested file operations
  const handleEditFileWithPath = async (fileWithPath: FileInfo & { _relativePath?: string }) => {
    const pathToUse = fileWithPath._relativePath || currentPath;
    
    // Check if file is editable
    if (!EDITABLE_EXTENSIONS.includes(fileWithPath.extension)) {
      setToast({ message: 'This file type cannot be edited', type: 'error' });
      return;
    }

    try {
      const url = pathToUse 
        ? `/apanel44/api/files/${encodeURIComponent(fileWithPath.name)}?path=${encodeURIComponent(pathToUse)}`
        : `/apanel44/api/files/${encodeURIComponent(fileWithPath.name)}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setEditedContent(data.content);
        // Store the file with its path info
        setSelectedFile({ ...fileWithPath, _relativePath: pathToUse } as FileInfo);
        setShowEditModal(true);
      } else {
        const data = await response.json().catch(() => ({ message: 'Failed to load file' }));
        setToast({ message: data.message || 'Failed to load file', type: 'error' });
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setToast({ message: 'Error loading file', type: 'error' });
    }
  };

  const openRenameModalWithPath = (fileWithPath: FileInfo & { _relativePath?: string }) => {
    // Store the file with its path info
    setSelectedFile({ ...fileWithPath, _relativePath: fileWithPath._relativePath || currentPath } as FileInfo);
    setNewFileName(fileWithPath.name);
    setShowRenameModal(true);
  };

  const openDeleteModalWithPath = (fileWithPath: FileInfo & { _relativePath?: string }) => {
    // Store the file with its path info
    setSelectedFile({ ...fileWithPath, _relativePath: fileWithPath._relativePath || currentPath } as FileInfo);
    setShowDeleteModal(true);
  };

  const navigateToFolder = (folderPath: string) => {
    fetchFiles(folderPath);
    // Clear expanded folders when navigating to avoid stale data
    setExpandedFolders({});
  };

  const toggleFolder = async (folderPath: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // If folder is already expanded, collapse it
    if (expandedFolders[folderPath]) {
      setExpandedFolders(prev => {
        const newExpanded = { ...prev };
        delete newExpanded[folderPath];
        return newExpanded;
      });
      return;
    }
    
    // Otherwise, fetch and expand the folder
    try {
      setLoadingFolders(prev => new Set([...prev, folderPath]));
      const url = `/apanel44/api/files?path=${encodeURIComponent(folderPath)}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setExpandedFolders(prev => ({
          ...prev,
          [folderPath]: data.files || [],
        }));
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load folder' }));
        setToast({ message: errorData.message || 'Failed to load folder', type: 'error' });
      }
    } catch (error) {
      console.error('Error loading folder:', error);
      setToast({ message: 'Error loading folder', type: 'error' });
    } finally {
      setLoadingFolders(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(folderPath);
        return newLoading;
      });
    }
  };

  const navigateBack = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    const parentPath = parts.join('/');
    fetchFiles(parentPath);
  };

  const getBreadcrumbs = () => {
    if (!currentPath) return [{ name: 'plugins', path: '' }];
    
    const parts = currentPath.split('/');
    const breadcrumbs = [{ name: 'plugins', path: '' }];
    
    let accumulatedPath = '';
    for (const part of parts) {
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
      breadcrumbs.push({ name: part, path: accumulatedPath });
    }
    
    return breadcrumbs;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1) return '< 1 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = Math.max(0, Math.min(i, sizes.length - 1));
    return Math.round((bytes / Math.pow(k, size)) * 100) / 100 + ' ' + sizes[size];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const getFileIcon = (file: FileInfo): string => {
    if (file.isDirectory) return '📁';
    if (file.extension === '.jar') return '☕';
    if (['.yml', '.yaml'].includes(file.extension)) return '📝';
    if (file.extension === '.json') return '📋';
    if (['.properties', '.conf', '.cfg'].includes(file.extension)) return '⚙️';
    if (file.extension === '.txt') return '📄';
    return '📄';
  };

  const isEditable = (file: FileInfo): boolean => {
    return EDITABLE_EXTENSIONS.includes(file.extension);
  };

  // Recursive render function for files with nested folders
  const renderFileRow = (file: FileInfo, depth: number = 0, parentPath: string = '', rowIndex: number = 0): React.JSX.Element[] => {
    const rows: React.JSX.Element[] = [];
    const filePath = parentPath ? `${parentPath}/${file.name}` : (currentPath ? `${currentPath}/${file.name}` : file.name);
    const isExpanded = !!expandedFolders[filePath];
    const isLoadingFolder = loadingFolders.has(filePath);
    const indentStyle = depth > 0 ? { paddingLeft: `${depth * 2}rem` } : {};
    
    // Create a file object with path info for operations on nested files
    const fileWithPath = { 
      ...file, 
      // Store the relative path from currentPath for API calls
      _relativePath: parentPath || currentPath
    };

    rows.push(
      <tr
        key={`${filePath}-${depth}-${rowIndex}`}
        className={`border-b-2 border-stone-700 ${
          rowIndex % 2 === 0 ? 'bg-stone-900/50' : 'bg-stone-900'
        }`}
      >
        <td className="p-3" style={indentStyle}>
          {file.isDirectory ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => toggleFolder(filePath, e)}
                className="text-green-400 hover:text-green-300 font-bold text-xl w-6 flex items-center justify-center"
                aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
                disabled={isLoadingFolder}
              >
                {isLoadingFolder ? '⏳' : isExpanded ? '−' : '+'}
              </button>
              <button
                onClick={() => navigateToFolder(filePath)}
                className="flex items-center space-x-2 hover:text-green-400 transition-colors"
                title="Navigate into folder"
              >
                <span className="text-2xl">{getFileIcon(file)}</span>
                <span className="text-white font-medium">{file.name}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="w-6"></span>
              <span className="text-2xl">{getFileIcon(file)}</span>
              <span className="text-white font-medium">{file.name}</span>
            </div>
          )}
        </td>
        <td className="p-3 text-stone-300">
          {file.isDirectory ? '—' : formatFileSize(file.size)}
        </td>
        <td className="p-3 text-stone-300">{formatDate(file.modified)}</td>
        <td className="p-3">
          <div className="flex items-center justify-end space-x-2">
            {isEditable(file) && (
              <button
                onClick={() => handleEditFileWithPath(fileWithPath)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 border-b-2 border-blue-800 active:border-b-0 active:mt-[2px] font-semibold text-sm"
                title="Edit file"
                aria-label={`Edit ${file.name}`}
              >
                ✏️ Edit
              </button>
            )}
            <button
              onClick={() => openRenameModalWithPath(fileWithPath)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 border-b-2 border-yellow-800 active:border-b-0 active:mt-[2px] font-semibold text-sm"
              title="Rename file"
              aria-label={`Rename ${file.name}`}
            >
              ✏️ Rename
            </button>
            <button
              onClick={() => openDeleteModalWithPath(fileWithPath)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 border-b-2 border-red-800 active:border-b-0 active:mt-[2px] font-semibold text-sm"
              title="Delete file"
              aria-label={`Delete ${file.name}`}
            >
              🗑️ Delete
            </button>
          </div>
        </td>
      </tr>
    );

    // If folder is expanded, render its contents
    if (isExpanded && expandedFolders[filePath]) {
      let childRowIndex = rowIndex + 1;
      expandedFolders[filePath].forEach((childFile) => {
        const childRows = renderFileRow(childFile, depth + 1, filePath, childRowIndex);
        rows.push(...childRows);
        childRowIndex += childRows.length;
      });
    }

    return rows;
  };

  return (
    <>
      <Head>
        <title>Plugin Management - SMP Admin Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-green-950 to-stone-900">
        {/* Header */}
        <header className="bg-stone-800 border-b-4 border-stone-700 shadow-lg">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-3xl">⛏️</span>
              <div>
                <h1 className="text-2xl font-bold text-green-400" style={{ 
                  textShadow: '2px 2px 0 rgba(0,0,0,0.8)'
                }}>
                  SMP Admin Panel
                </h1>
                <p className="text-stone-400 text-sm">Server Management System</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-semibold">{user.name}</p>
                <p className="text-stone-400 text-sm">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 border-b-4 border-red-800 active:border-b-0 active:mt-1 font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-stone-800/50 border-b-2 border-stone-700">
          <div className="container mx-auto px-4">
            <div className="flex space-x-1">
              <Link
                href="/dashboard"
                className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
              >
                📊 Dashboard
              </Link>
              {(user.role === 'Super Admin' || user.role === 'Admin') && (
                <>
                  <Link
                    href="/users"
                    className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                  >
                    👥 Users
                  </Link>
                  <Link
                    href="/console"
                    className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                  >
                    ⌨️ Console
                  </Link>
                  <Link
                    href="/plugins"
                    className="px-6 py-3 text-green-400 font-semibold border-b-4 border-green-500"
                  >
                    🔌 Plugins
                  </Link>
                </>
              )}
              {user.role === 'Super Admin' && (
                <Link
                  href="/roles"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  🛡️ Roles
                </Link>
              )}
              {(user.role === 'Super Admin' || user.role === 'Moderator') && (
                <Link
                  href="/logs"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  📋 Logs
                </Link>
              )}
              {user.role === 'Super Admin' && (
                <Link
                  href="/error-reports"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  🐛 Error Reports
                </Link>
              )}
              {(user.role === 'Super Admin' || user.role === 'Admin') && (
                <Link
                  href="/scheduled-tasks"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  ⏰ Tasks
                </Link>
              )}
              {user.role === 'Super Admin' && (
                <Link
                  href="/metrics-settings"
                  className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
                >
                  ⚙️ Metrics
                </Link>
              )}
              <Link
                href="/2fa-setup"
                className="px-6 py-3 text-stone-400 hover:text-green-400 font-semibold border-b-4 border-transparent hover:border-green-500"
              >
                🔐 2FA Setup
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="bg-stone-800 border-4 border-stone-700 p-6 mb-6">
            <h2 className="text-2xl font-bold text-green-400 mb-2">
              🔌 Plugin Management
            </h2>
            <p className="text-stone-400">
              Manage server plugins - upload .jar files, edit configurations, and more
            </p>
          </div>

          {/* Upload Section */}
          <div className="bg-stone-800 border-4 border-stone-700 p-6 mb-6">
            <h3 className="text-xl font-bold text-green-400 mb-4">Upload Plugin</h3>
            <div className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jar"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                  aria-label="Upload JAR file"
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-block ${
                    uploading 
                      ? 'bg-stone-600 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                  } text-white px-6 py-3 border-b-4 ${
                    uploading ? 'border-stone-800' : 'border-green-800'
                  } font-semibold`}
                >
                  {uploading ? 'Uploading...' : '📤 Choose .jar File'}
                </label>
                <p className="text-stone-400 text-sm mt-2">
                  Maximum file size: 35MB | Only .jar files are supported
                </p>
              </div>

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="bg-stone-900 border-2 border-stone-700 h-8 overflow-hidden">
                    <div
                      className="bg-green-600 h-full transition-all duration-300 flex items-center justify-center"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <span className="text-white font-semibold text-sm">
                        {uploadProgress}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Files List */}
          <div className="bg-stone-800 border-4 border-stone-700 p-6">
            {/* Breadcrumb Navigation */}
            <div className="mb-4 flex items-center space-x-2 text-stone-300">
              {getBreadcrumbs().map((crumb, index, array) => (
                <div key={crumb.path} className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchFiles(crumb.path)}
                    className={`hover:text-green-400 font-medium ${
                      index === array.length - 1 ? 'text-green-400' : 'text-stone-300'
                    }`}
                  >
                    {index === 0 ? '📁 ' : ''}{crumb.name}
                  </button>
                  {index < array.length - 1 && (
                    <span className="text-stone-500">/</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-green-400">
                  Files ({files.length})
                </h3>
                {currentPath && (
                  <button
                    onClick={navigateBack}
                    className="bg-stone-600 hover:bg-stone-700 text-white px-3 py-1 border-b-2 border-stone-800 active:border-b-0 active:mt-[2px] font-semibold text-sm"
                    aria-label="Go back to parent directory"
                  >
                    ⬅️ Back
                  </button>
                )}
              </div>
              <button
                onClick={() => fetchFiles(currentPath)}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 border-b-4 border-blue-800 active:border-b-0 active:mt-1 font-semibold disabled:opacity-50"
                aria-label="Refresh file list"
              >
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Spinner size="large" message="Loading files..." />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <p className="text-2xl mb-2">📂</p>
                <p>No files found in plugins directory</p>
                <p className="text-sm mt-2">Upload a .jar file to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-stone-900 border-2 border-stone-700">
                      <th className="text-left p-3 text-green-400 font-semibold">File</th>
                      <th className="text-left p-3 text-green-400 font-semibold">Size</th>
                      <th className="text-left p-3 text-green-400 font-semibold">Modified</th>
                      <th className="text-right p-3 text-green-400 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.flatMap((file, index) => renderFileRow(file, 0, '', index))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditedContent('');
        }}
        title={`Edit ${selectedFile?.name || 'File'}`}
        size="large"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="file-content" className="block text-stone-300 font-semibold mb-2">
              File Content
            </label>
            <textarea
              id="file-content"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-96 bg-stone-900 border-2 border-stone-700 text-white p-4 font-mono text-sm"
              placeholder="File content..."
              aria-describedby="file-content-description"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditedContent('');
              }}
              className="bg-stone-600 hover:bg-stone-700 text-white px-6 py-2 border-b-4 border-stone-800 active:border-b-0 active:mt-1 font-semibold"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFile}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 border-b-4 border-green-800 active:border-b-0 active:mt-1 font-semibold"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setNewFileName('');
        }}
        title={`Rename ${selectedFile?.name || 'File'}`}
        size="small"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="new-file-name" className="block text-stone-300 font-semibold mb-2">
              New File Name
            </label>
            <input
              id="new-file-name"
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-2"
              placeholder="Enter new filename..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowRenameModal(false);
                setNewFileName('');
              }}
              className="bg-stone-600 hover:bg-stone-700 text-white px-6 py-2 border-b-4 border-stone-800 active:border-b-0 active:mt-1 font-semibold"
              disabled={isRenaming}
            >
              Cancel
            </button>
            <button
              onClick={handleRenameFile}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 border-b-4 border-green-800 active:border-b-0 active:mt-1 font-semibold"
              disabled={isRenaming || !newFileName.trim()}
            >
              {isRenaming ? 'Renaming...' : '✏️ Rename'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
        }}
        title="Delete File"
        size="small"
      >
        <div className="space-y-4">
          <div className="bg-red-900/30 border-2 border-red-700 p-4">
            <p className="text-white font-semibold mb-2">⚠️ Warning</p>
            <p className="text-stone-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">{selectedFile?.name}</span>?
            </p>
            <p className="text-stone-400 text-sm mt-2">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="bg-stone-600 hover:bg-stone-700 text-white px-6 py-2 border-b-4 border-stone-800 active:border-b-0 active:mt-1 font-semibold"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteFile}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 border-b-4 border-red-800 active:border-b-0 active:mt-1 font-semibold"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : '🗑️ Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Check if user has Admin or Super Admin role
  if (session.user.role !== 'Admin' && session.user.role !== 'Super Admin') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };

  return {
    props: {
      user,
    },
  };
};
