/**
 * File Management Utilities
 * 
 * This module provides utilities for file operations with security checks
 */

import path from 'path';
import fs from 'fs/promises';

// Base directory for plugin files - all file operations are restricted to this directory
export const PLUGINS_DIR = '/opt/minecraft/dev/plugins';

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
 * Validate and resolve a path to ensure it's within the allowed directory
 * Prevents path traversal attacks
 * 
 * @param filename - Filename or relative path
 * @returns Absolute path if valid, null if invalid
 */
export function validateAndResolvePath(filename: string): string | null {
  try {
    // Sanitize the filename first
    const sanitized = sanitizeFilename(filename);
    
    if (!sanitized) {
      return null;
    }
    
    // Resolve the full path
    const fullPath = path.resolve(PLUGINS_DIR, sanitized);
    
    // Ensure the resolved path is within the plugins directory
    // This prevents path traversal attacks like ../../../etc/passwd
    if (!fullPath.startsWith(PLUGINS_DIR + path.sep) && fullPath !== PLUGINS_DIR) {
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
 * Check if a file size is within the allowed limit for uploads
 * 
 * @param size - File size in bytes
 * @returns True if size is within limit
 */
export function isFileSizeAllowed(size: number): boolean {
  return size <= MAX_JAR_SIZE;
}

/**
 * List all files in the plugins directory
 * 
 * @returns Promise<Array> - Array of file information
 */
export async function listFiles(): Promise<Array<{
  name: string;
  size: number;
  modified: Date;
  isDirectory: boolean;
  extension: string;
}>> {
  try {
    // Ensure directory exists
    await fs.mkdir(PLUGINS_DIR, { recursive: true });
    
    const entries = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });
    
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(PLUGINS_DIR, entry.name);
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
 * @returns Promise<string> - File content
 */
export async function readFileContent(filename: string): Promise<string> {
  const fullPath = validateAndResolvePath(filename);
  
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
 * @returns Promise<void>
 */
export async function writeFileContent(filename: string, content: string): Promise<void> {
  const fullPath = validateAndResolvePath(filename);
  
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
 * @returns Promise<void>
 */
export async function renameFile(oldFilename: string, newFilename: string): Promise<void> {
  const oldPath = validateAndResolvePath(oldFilename);
  const newPath = validateAndResolvePath(newFilename);
  
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
 * @returns Promise<void>
 */
export async function deleteFile(filename: string): Promise<void> {
  const fullPath = validateAndResolvePath(filename);
  
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
 * @returns Promise<boolean> - True if file exists
 */
export async function fileExists(filename: string): Promise<boolean> {
  const fullPath = validateAndResolvePath(filename);
  
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
