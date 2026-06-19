/**
 * Plugins Management Page
 * Protected route - requires Admin or Super Admin role
 * Allows uploading, editing, renaming, and deleting plugin files
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Head from 'next/head';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plug,
  Upload,
  RefreshCw,
  ArrowLeft,
  FolderOpen,
  Folder,
  Coffee,
  FileJson,
  FileCog,
  FileText,
  Lock,
  ChevronRight,
  ChevronDown,
  Loader2,
  Pencil,
  Trash2,
  History,
  Save,
  RotateCcw,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import Spinner from '@/components/Spinner';
import Button from '@/components/Button';
import Card from '@/components/Card';
import AppShell from '@/components/AppShell';
import PluginUpdatesList from '@/components/PluginUpdatesList';
import { useInstance } from '@/contexts/InstanceContext';
import { cn } from '@/lib/cn';

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

interface BackupInfo {
  id: string;
  createdAt: string;
  size: number;
}

type ActionTone = 'green' | 'purple' | 'amber' | 'red';

const TONE_STYLES: Record<ActionTone, string> = {
  green: 'border-green-500/30 text-green-400 hover:bg-green-500/10',
  purple: 'border-purple-500/30 text-purple-300 hover:bg-purple-500/10',
  amber: 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10',
  red: 'border-red-500/30 text-red-300 hover:bg-red-500/10',
};

function actionBtnClass(tone: ActionTone, disabled = false): string {
  return cn(
    'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all',
    disabled ? 'border-white/5 text-gray-600 cursor-not-allowed' : TONE_STYLES[tone]
  );
}

/** File-type icon, matching the website's clean line-icon style. */
function FileTypeIcon({ file, expanded }: { file: FileInfo; expanded?: boolean }) {
  if (file.isDirectory) {
    return expanded ? (
      <FolderOpen className="h-5 w-5 text-green-400" />
    ) : (
      <Folder className="h-5 w-5 text-green-400" />
    );
  }
  const ext = file.extension;
  if (ext === '.jar') return <Coffee className="h-5 w-5 text-amber-400" />;
  if (ext === '.json') return <FileJson className="h-5 w-5 text-yellow-300" />;
  if (['.yml', '.yaml', '.properties', '.conf', '.cfg'].includes(ext))
    return <FileCog className="h-5 w-5 text-sky-300" />;
  return <FileText className="h-5 w-5 text-gray-300" />;
}

export default function Plugins({ user }: PluginsProps) {
  const { currentInstance } = useInstance();
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
  const [showBackupsModal, setShowBackupsModal] = useState(false);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [backupsFile, setBackupsFile] = useState<{ name: string; path: string } | null>(null);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [restoringBackupId, setRestoringBackupId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, FileInfo[]>>({});
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build a URL for the per-file API, always carrying the selected instance so
  // edits/reads target the correct server (dev vs live), including nested
  // plugin config folders.
  const buildFileUrl = useCallback((name: string, pathToUse: string) => {
    const params = new URLSearchParams();
    if (pathToUse) params.set('path', pathToUse);
    if (currentInstance) params.set('instanceId', currentInstance);
    const qs = params.toString();
    return `/apanel44/api/files/${encodeURIComponent(name)}${qs ? `?${qs}` : ''}`;
  }, [currentInstance]);

  // Build a URL for the backups API for a given file.
  const buildBackupsUrl = useCallback((name: string, pathToUse: string) => {
    const params = new URLSearchParams();
    params.set('filename', name);
    if (pathToUse) params.set('path', pathToUse);
    if (currentInstance) params.set('instanceId', currentInstance);
    return `/apanel44/api/files/backups?${params.toString()}`;
  }, [currentInstance]);

  const fetchFiles = useCallback(async (path: string = '') => {
    try {
      setLoading(true);
      const instanceParam = currentInstance ? `&instanceId=${encodeURIComponent(currentInstance)}` : '';
      const url = path
        ? `/apanel44/api/files?path=${encodeURIComponent(path)}${instanceParam}`
        : `/apanel44/api/files${currentInstance ? `?instanceId=${encodeURIComponent(currentInstance)}` : ''}`;
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
  }, [currentInstance]);

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
        type: 'error',
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
      if (currentInstance) {
        formData.append('instanceId', currentInstance);
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
      const response = await fetch(buildFileUrl(selectedFile.name, pathToUse), {
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
      const response = await fetch(buildFileUrl(selectedFile.name, pathToUse), {
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
      const response = await fetch(buildFileUrl(selectedFile.name, pathToUse), {
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
      const response = await fetch(buildFileUrl(fileWithPath.name, pathToUse));
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

  const fetchBackups = useCallback(async (name: string, path: string) => {
    setLoadingBackups(true);
    try {
      const response = await fetch(buildBackupsUrl(name, path));
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      } else {
        const data = await response.json().catch(() => ({ message: 'Failed to load backups' }));
        setToast({ message: data.message || 'Failed to load backups', type: 'error' });
        setBackups([]);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      setToast({ message: 'Error loading backups', type: 'error' });
      setBackups([]);
    } finally {
      setLoadingBackups(false);
    }
  }, [buildBackupsUrl]);

  const openBackupsModalWithPath = (fileWithPath: FileInfo & { _relativePath?: string }) => {
    const path = fileWithPath._relativePath || currentPath;
    setBackupsFile({ name: fileWithPath.name, path });
    setBackups([]);
    setShowBackupsModal(true);
    fetchBackups(fileWithPath.name, path);
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!backupsFile) return;
    try {
      setRestoringBackupId(backupId);
      const response = await fetch('/apanel44/api/files/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: backupsFile.name,
          path: backupsFile.path,
          instanceId: currentInstance || undefined,
          backupId,
        }),
      });
      if (response.ok) {
        setToast({ message: 'File restored from backup', type: 'success' });
        // The restore itself snapshots the prior content, so refresh the list.
        fetchBackups(backupsFile.name, backupsFile.path);
        fetchFiles(currentPath);
        // If the edit modal is open on this file, reload its content.
        if (showEditModal && selectedFile?.name === backupsFile.name) {
          const refreshed = await fetch(buildFileUrl(backupsFile.name, backupsFile.path));
          if (refreshed.ok) {
            const data = await refreshed.json();
            setEditedContent(data.content);
          }
        }
      } else {
        const data = await response.json().catch(() => ({ message: 'Failed to restore backup' }));
        setToast({ message: data.message || 'Failed to restore backup', type: 'error' });
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      setToast({ message: 'Error restoring backup', type: 'error' });
    } finally {
      setRestoringBackupId(null);
    }
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
      setExpandedFolders((prev) => {
        const newExpanded = { ...prev };
        delete newExpanded[folderPath];
        return newExpanded;
      });
      return;
    }

    // Otherwise, fetch and expand the folder
    try {
      setLoadingFolders((prev) => new Set([...prev, folderPath]));
      const instanceParam = currentInstance ? `&instanceId=${encodeURIComponent(currentInstance)}` : '';
      const url = `/apanel44/api/files?path=${encodeURIComponent(folderPath)}${instanceParam}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setExpandedFolders((prev) => ({
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
      setLoadingFolders((prev) => {
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
      minute: '2-digit',
    });
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
    const indentStyle = depth > 0 ? { paddingLeft: `${depth * 1.5}rem` } : {};
    // Config files are the same as editable files in this context
    const isConfig = isEditable(file);

    // Create a file object with path info for operations on nested files
    const fileWithPath = {
      ...file,
      // Store the relative path from currentPath for API calls
      _relativePath: parentPath || currentPath,
    };

    rows.push(
      <tr key={`${filePath}-${depth}-${rowIndex}`} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
        <td className="p-3" style={indentStyle}>
          {file.isDirectory ? (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => toggleFolder(filePath, e)}
                className="text-green-400 hover:text-green-300 w-6 h-6 flex items-center justify-center rounded hover:bg-green-500/10 transition-colors"
                aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
                disabled={isLoadingFolder}
              >
                {isLoadingFolder ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => navigateToFolder(filePath)}
                className="flex items-center gap-2 hover:text-green-400 transition-colors"
                title="Navigate into folder"
              >
                <FileTypeIcon file={file} expanded={isExpanded} />
                <span className="text-white font-medium">{file.name}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-6" />
              <FileTypeIcon file={file} />
              <span className="text-white font-medium">{file.name}</span>
              {isConfig && (
                <span
                  className="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium"
                  title="Configuration file - Protected from deletion and renaming"
                >
                  <Lock className="h-3 w-3" />
                  CONFIG
                </span>
              )}
            </div>
          )}
        </td>
        <td className="p-3 text-gray-400 font-mono text-sm">
          {file.isDirectory ? '—' : formatFileSize(file.size)}
        </td>
        <td className="p-3 text-gray-400 text-sm">{formatDate(file.modified)}</td>
        <td className="p-3">
          <div className="flex items-center justify-end gap-2">
            {isEditable(file) && (
              <button
                onClick={() => handleEditFileWithPath(fileWithPath)}
                className={actionBtnClass('green')}
                title="Edit file"
                aria-label={`Edit ${file.name}`}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            )}
            {isEditable(file) && (
              <button
                onClick={() => openBackupsModalWithPath(fileWithPath)}
                className={actionBtnClass('purple')}
                title="View and restore backups"
                aria-label={`Backups for ${file.name}`}
              >
                <History className="h-3.5 w-3.5" /> Backups
              </button>
            )}
            <button
              onClick={() => !isConfig && openRenameModalWithPath(fileWithPath)}
              disabled={isConfig}
              className={actionBtnClass('amber', isConfig)}
              title={isConfig ? 'Config files cannot be renamed' : 'Rename file'}
              aria-label={`Rename ${file.name}`}
            >
              <Pencil className="h-3.5 w-3.5" /> Rename
            </button>
            <button
              onClick={() => !isConfig && openDeleteModalWithPath(fileWithPath)}
              disabled={isConfig}
              className={actionBtnClass('red', isConfig)}
              title={isConfig ? 'Config files cannot be deleted' : 'Delete file'}
              aria-label={`Delete ${file.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
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

  const inputClass =
    'w-full rounded-xl bg-black/40 border border-green-500/15 text-gray-100 px-4 py-2 font-mono text-sm focus:outline-none focus:border-green-500/50 focus:glow-green-sm transition-all';

  return (
    <>
      <Head>
        <title>Plugin Management - SMP Admin Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AppShell user={user} active="plugins">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Page Header */}
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
              <Plug className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-green-400 text-glow">Plugin Management</h2>
              <p className="text-gray-400 text-sm">
                Upload .jar files, edit configurations, and restore backups
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-400" /> Upload Plugin
            </h3>
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
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all',
                    uploading
                      ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-400 text-black cursor-pointer hover:glow-green-sm'
                  )}
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading…' : 'Choose .jar File'}
                </label>
                <p className="text-gray-500 text-sm mt-2">
                  Maximum file size: 35MB &bull; Only .jar files are supported
                </p>
              </div>

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="bg-black/40 border border-green-500/15 rounded-lg h-7 overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all duration-300 flex items-center justify-center"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <span className="text-black font-bold text-xs">{uploadProgress}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Plugin Updates Section */}
          <PluginUpdatesList />

          {/* Files List */}
          <Card>
            {/* Breadcrumb Navigation */}
            <div className="mb-4 flex items-center gap-1.5 text-sm flex-wrap">
              {getBreadcrumbs().map((crumb, index, array) => (
                <div key={crumb.path} className="flex items-center gap-1.5">
                  <button
                    onClick={() => fetchFiles(crumb.path)}
                    className={cn(
                      'inline-flex items-center gap-1.5 font-medium hover:text-green-400 transition-colors',
                      index === array.length - 1 ? 'text-green-400' : 'text-gray-400'
                    )}
                  >
                    {index === 0 && <FolderOpen className="h-4 w-4" />}
                    {crumb.name}
                  </button>
                  {index < array.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-gray-600" />}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">
                  Files <span className="text-gray-500 font-normal">({files.length})</span>
                </h3>
                {currentPath && (
                  <Button variant="secondary" onClick={navigateBack} className="px-3 py-1.5 text-sm" aria-label="Go back to parent directory">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                )}
              </div>
              <Button variant="secondary" onClick={() => fetchFiles(currentPath)} disabled={loading} className="px-3 py-1.5 text-sm" aria-label="Refresh file list">
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <Spinner size="large" message="Loading files…" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Inbox className="h-10 w-10 mx-auto mb-3 text-gray-600" />
                <p>No files found in plugins directory</p>
                <p className="text-sm mt-1 text-gray-500">Upload a .jar file to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/30 border-b border-white/10">
                      <th className="text-left p-3 text-green-400 font-semibold text-sm">File</th>
                      <th className="text-left p-3 text-green-400 font-semibold text-sm">Size</th>
                      <th className="text-left p-3 text-green-400 font-semibold text-sm">Modified</th>
                      <th className="text-right p-3 text-green-400 font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>{files.flatMap((file, index) => renderFileRow(file, 0, '', index))}</tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      </AppShell>

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
            <label htmlFor="file-content" className="block text-gray-300 font-medium mb-2 text-sm">
              File Content
            </label>
            <textarea
              id="file-content"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className={cn(inputClass, 'h-96 resize-y')}
              placeholder="File content…"
              aria-describedby="file-content-description"
            />
          </div>
          <div className="flex justify-between items-center gap-4">
            <p className="text-gray-500 text-xs">A backup is saved automatically every time you save changes.</p>
            <div className="flex justify-end gap-3">
              {selectedFile && (
                <Button
                  variant="secondary"
                  onClick={() => openBackupsModalWithPath(selectedFile as FileInfo & { _relativePath?: string })}
                  disabled={isSaving}
                  className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                >
                  <History className="h-4 w-4" /> Backups
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEditModal(false);
                  setEditedContent('');
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveFile} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
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
            <label htmlFor="new-file-name" className="block text-gray-300 font-medium mb-2 text-sm">
              New File Name
            </label>
            <input
              id="new-file-name"
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className={inputClass}
              placeholder="Enter new filename…"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowRenameModal(false);
                setNewFileName('');
              }}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRenameFile} disabled={isRenaming || !newFileName.trim()}>
              {isRenaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              {isRenaming ? 'Renaming…' : 'Rename'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete File" size="small">
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-300 font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Warning
            </p>
            <p className="text-gray-200">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">{selectedFile?.name}</span>?
            </p>
            <p className="text-gray-500 text-sm mt-2">This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteFile} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Backups Modal */}
      <Modal
        isOpen={showBackupsModal}
        onClose={() => {
          setShowBackupsModal(false);
          setBackups([]);
          setBackupsFile(null);
        }}
        title={`Backups${backupsFile ? ` — ${backupsFile.name}` : ''}`}
        size="large"
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Restoring overwrites the current file with the selected backup. The current content is
            itself backed up first, so a restore can always be undone.
          </p>
          {loadingBackups ? (
            <div className="text-center py-8">
              <Spinner size="large" message="Loading backups…" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <History className="h-10 w-10 mx-auto mb-3 text-gray-600" />
              <p>No backups yet</p>
              <p className="text-sm mt-1 text-gray-500">A backup is created the next time this file is edited.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-white/5">
              <table className="w-full">
                <thead>
                  <tr className="bg-black/30 border-b border-white/10">
                    <th className="text-left p-3 text-green-400 font-semibold text-sm">Created</th>
                    <th className="text-left p-3 text-green-400 font-semibold text-sm">Size</th>
                    <th className="text-right p-3 text-green-400 font-semibold text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup, index) => (
                    <tr key={backup.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="p-3 text-white text-sm">
                        {formatDate(backup.createdAt)}
                        {index === 0 && (
                          <span className="ml-2 text-xs bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-medium">
                            latest
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-400 font-mono text-sm">{formatFileSize(backup.size)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRestoreBackup(backup.id)}
                          disabled={restoringBackupId !== null}
                          className={actionBtnClass('amber', restoringBackupId !== null)}
                          aria-label={`Restore backup from ${formatDate(backup.createdAt)}`}
                        >
                          {restoringBackupId === backup.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          {restoringBackupId === backup.id ? 'Restoring…' : 'Restore'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowBackupsModal(false);
                setBackups([]);
                setBackupsFile(null);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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
