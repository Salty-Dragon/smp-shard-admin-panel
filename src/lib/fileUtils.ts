/**
 * File Management Utilities
 * 
 * This module provides utilities for file operations with security checks
 * Supports multiple server instances
 */

import path from 'path';
import fs from 'fs/promises';
import { getServerInstance } from './serverInstances';

// Legacy constant for backward compatibility
// When INSTANCES env var is not set, this is used as fallback
export const PLUGINS_DIR = process.env.PLUGINS_DIR || '/opt/minecraft/dev/plugins';

/**
 * Get the plugins directory for a specific server instance
 * 
 * @param instanceId - Server instance ID (optional, uses default if not provided)
 * @returns Plugins directory path
 */
export function getPluginsDir(instanceId?: string): string {
  const instance = getServerInstance(instanceId);
  if (instance) {
    return instance.pluginsPath;
  }
  return PLUGINS_DIR;
}

// Maximum file size for .jar uploads (35MB in bytes)
export const MAX_JAR_SIZE = 35 * 1024 * 1024;

// Allowed file extensions for upload
export const ALLOWED_UPLOAD_EXTENSIONS = ['.jar'];

// Allowed file extensions for editing (config files)
export const ALLOWED_EDIT_EXTENSIONS = ['.yml', '.yaml', '.json', '.properties', '.txt', '.conf', '.cfg'];

/**
 * Sanitize a filename by removing or replacing dangerous characters
 * 
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path separators and null bytes
  let sanitized = filename.replace(/[\/\\]/g, '');
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove leading dots to prevent hidden files
  sanitized = sanitized.replace(/^\.+/, '');
  
  // Replace potentially dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    const name = sanitized.slice(0, 255 - ext.length);
    sanitized = name + ext;
  }
  
  return sanitized;
}

/**
 * Sanitize a relative path by normalizing and validating path segments
 * Allows forward slashes for directory navigation but prevents path traversal
 * 
 * @param relativePath - Relative path from plugins directory root
 * @returns Sanitized relative path or empty string if invalid
 */
export function sanitizePath(relativePath: string): string {
  if (!relativePath || relativePath === '/') {
    return '';
  }
  
  // Normalize the path and remove any leading/trailing slashes
  let normalized = relativePath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  
  // Remove null bytes
  normalized = normalized.replace(/\0/g, '');
  
  // Split into segments and validate each
  const segments = normalized.split('/').filter(segment => segment.length > 0);
  
  // Check for path traversal attempts
  for (const segment of segments) {
    // Reject segments that are just dots (., .., ..., etc.)
    if (/^\.+$/.test(segment)) {
      return '';
    }
    
    // Reject segments with dangerous characters
    if (/[<>:"|?*\0]/.test(segment)) {
      return '';
    }
  }
  
  // Reconstruct the path with forward slashes
  return segments.join('/');
}

/**
 * Validate and resolve a path to ensure it's within the allowed directory
 * Prevents path traversal attacks
 * 
 * @param filename - Filename or relative path (can include subdirectories like "folder/file.txt")
 * @param isDirectory - Whether this is a directory path (defaults to false)
 * @param instanceId - Server instance ID (optional, uses default if not provided)
 * @returns Absolute path if valid, null if invalid
 */
export function validateAndResolvePath(filename: string, isDirectory: boolean = false, instanceId?: string): string | null {
  try {
    const pluginsDir = getPluginsDir(instanceId);
    
    if (!filename) {
      return isDirectory ? pluginsDir : null;
    }
    
    // Check if this looks like a path with directories
    const hasDirectories = filename.includes('/') || filename.includes('\\');
    
    let sanitized: string;
    if (hasDirectories) {
      // Split the path into directory and filename parts
      const normalizedPath = filename.replace(/\\/g, '/');
      const parts = normalizedPath.split('/');
      const filenamePart = parts.pop() || '';
      const directoryPath = parts.join('/');
      
      // Sanitize directory path
      const sanitizedDir = sanitizePath(directoryPath);
      
      // Sanitize filename (unless it's a directory-only path)
      const sanitizedFile = isDirectory ? '' : sanitizeFilename(filenamePart);
      
      // Combine sanitized parts
      if (sanitizedDir && sanitizedFile) {
        sanitized = `${sanitizedDir}/${sanitizedFile}`;
      } else if (sanitizedDir && isDirectory) {
        sanitized = sanitizedDir;
      } else if (sanitizedFile) {
        sanitized = sanitizedFile;
      } else {
        return null;
      }
    } else {
      // Simple filename, no directories
      if (isDirectory) {
        sanitized = sanitizePath(filename);
      } else {
        sanitized = sanitizeFilename(filename);
      }
    }
    
    if (!sanitized && !isDirectory) {
      return null;
    }
    
    // Resolve the full path
    const fullPath = sanitized ? path.resolve(pluginsDir, sanitized) : pluginsDir;
    
    // Ensure the resolved path is within the plugins directory
    // This prevents path traversal attacks like ../../../etc/passwd
    if (!fullPath.startsWith(pluginsDir + path.sep) && fullPath !== pluginsDir) {
      return null;
    }
    
    return fullPath;
  } catch (error) {
    console.error('Error validating path:', error);
    return null;
  }
}

/**
 * Check if a file extension is allowed for upload
 * 
 * @param filename - Filename to check
 * @returns True if extension is allowed for upload
 */
export function isUploadAllowed(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_UPLOAD_EXTENSIONS.includes(ext);
}

/**
 * Check if a file extension is allowed for editing
 * 
 * @param filename - Filename to check
 * @returns True if extension is allowed for editing
 */
export function isEditAllowed(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EDIT_EXTENSIONS.includes(ext);
}

/**
 * Check if a file is a configuration file
 * In the context of plugin management, all editable files are configuration files
 * (as opposed to plugin JAR files which are not editable)
 * 
 * @param filename - Filename to check
 * @returns True if file is a configuration file
 */
export function isConfigFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EDIT_EXTENSIONS.includes(ext);
}

// Constants for sensitive content detection (defined once to avoid allocations)
const MYSQL_KEYWORDS = ['mysql', 'mariadb', 'jdbc:mysql'];
const CREDENTIAL_KEYWORDS = ['password', 'passwd', 'pwd'];

// Regex patterns for detecting MySQL/database credentials
const SENSITIVE_PATTERNS = [
  // Pattern 1: Key-value pairs with password (e.g., "password: secret" or "password=secret")
  /(?:password|passwd|pwd)\s*[:=]\s*\S+/i,
  
  // Pattern 2: JDBC connection strings with credentials
  /jdbc:(?:mysql|mariadb):\/\/.*(?:password|user)=/i,
  
  // Pattern 3: Database configuration blocks with user/password fields (limited to 500 chars for performance)
  /(?:mysql|mariadb|database)\s*[:{][\s\S]{0,500}?(?:password|passwd|user|username)/i,
];

/**
 * Detect if file content contains sensitive information like MySQL credentials
 * Uses pattern matching to identify database credentials in configuration files
 * 
 * @param content - File content to check
 * @returns True if content contains sensitive information
 */
export function hasSensitiveContent(content: string): boolean {
  const lowerContent = content.toLowerCase();
  
  // Check if any pattern matches
  const hasCredentialPattern = SENSITIVE_PATTERNS.some(pattern => pattern.test(content));
  
  // Fallback to keyword-based detection for simpler configurations
  // Only flag if we have BOTH MySQL reference AND credentials (not just user keyword)
  const hasMysqlRef = MYSQL_KEYWORDS.some(keyword => lowerContent.includes(keyword));
  const hasCredentials = CREDENTIAL_KEYWORDS.some(keyword => lowerContent.includes(keyword));
  
  // Consider content sensitive if it matches a pattern OR has MySQL + password
  return hasCredentialPattern || (hasMysqlRef && hasCredentials);
}

/**
 * Check if a file size is within the allowed limit for uploads
 * 
 * @param size - File size in bytes
 * @returns True if size is within limit
 */
export function isFileSizeAllowed(size: number): boolean {
  return size <= MAX_JAR_SIZE;
}

/**
 * List all files in the plugins directory or a subdirectory
 * 
 * @param relativePath - Relative path from plugins directory root (optional)
 * @param instanceId - Server instance ID (optional, uses default if not provided)
 * @returns Promise<Array> - Array of file information
 */
export async function listFiles(relativePath: string = '', instanceId?: string): Promise<Array<{
  name: string;
  size: number;
  modified: Date;
  isDirectory: boolean;
  extension: string;
}>> {
  try {
    // Validate and resolve the directory path
    const dirPath = validateAndResolvePath(relativePath, true, instanceId);
    
    if (!dirPath) {
      throw new Error('Invalid directory path');
    }
    
    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });
    
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        const stats = await fs.stat(fullPath);
        
        return {
          name: entry.name,
          size: stats.size,
          modified: stats.mtime,
          isDirectory: entry.isDirectory(),
          extension: path.extname(entry.name).toLowerCase(),
        };
      })
    );
    
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

/**
 * Read file content
 * 
 * @param filename - Filename to read
 * @param instanceId - Server instance ID (optional, uses default if not provided)
 * @returns Promise<string> - File content
 */
export async function readFileContent(filename: string, instanceId?: string): Promise<string> {
  const fullPath = validateAndResolvePath(filename, false, instanceId);
  
  if (!fullPath) {
    throw new Error('Invalid file path');
  }
  
  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
}

/**
 * Write file content
 * 
 * @param filename - Filename to write
 * @param content - Content to write
 * @param instanceId - Server instance ID (optional, uses default if not provided)
 * @returns Promise<void>
 */
export async function writeFileContent(filename: string, content: string, instanceId?: string): Promise<void> {
  const fullPath = validateAndResolvePath(filename, false, instanceId);
  
  if (!fullPath) {
    throw new Error('Invalid file path');
  }
  
  try {
    await fs.writeFile(fullPath, content, 'utf-8');
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
}

/**
 * Rename a file
 * 
 * @param oldFilename - Current filename
 * @param newFilename - New filename
 * @param instanceId - Server instance ID (optional, uses default if not provided)
 * @returns Promise<void>
 */
export async function renameFile(oldFilename: string, newFilename: string, instanceId?: string): Promise<void> {
  const oldPath = validateAndResolvePath(oldFilename, false, instanceId);
  const newPath = validateAndResolvePath(newFilename, false, instanceId);
  
  if (!oldPath || !newPath) {
    throw new Error('Invalid file path');
  }
  
  try {
    await fs.rename(oldPath, newPath);
  } catch (error) {
    console.error('Error renaming file:', error);
    throw error;
  }
}

/**
 * Delete a file
 * 
 * @param filename - Filename to delete
 * @param instanceId - Server instance ID (optional, uses default if not provided)
 * @returns Promise<void>
 */
export async function deleteFile(filename: string, instanceId?: string): Promise<void> {
  const fullPath = validateAndResolvePath(filename, false, instanceId);
  
  if (!fullPath) {
    throw new Error('Invalid file path');
  }
  
  try {
    await fs.unlink(fullPath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Check if a file exists
 * 
 * @param filename - Filename to check
 * @param instanceId - Server instance ID (optional, uses default if not provided)
 * @returns Promise<boolean> - True if file exists
 */
export async function fileExists(filename: string, instanceId?: string): Promise<boolean> {
  const fullPath = validateAndResolvePath(filename, false, instanceId);
  
  if (!fullPath) {
    return false;
  }
  
  try {
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}
