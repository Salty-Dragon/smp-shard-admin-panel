/**
 * Files API - Individual File Operations
 * 
 * GET - Get file content (for editing config files)
 * PUT - Rename or edit file content
 * DELETE - Delete a file
 * 
 * Note: For files in subdirectories, pass the directory path in the 'path' query parameter
 * and the filename in the 'filename' route parameter
 */

import { NextApiResponse } from 'next';
import { withAdmin, AuthenticatedRequest } from '@/lib/middleware';
import { logActivity } from '@/lib/activity';
import {
  readFileContent,
  writeFileContent,
  renameFile,
  deleteFile,
  fileExists,
  sanitizeFilename,
  sanitizePath,
  isEditAllowed,
  isConfigFile,
  hasSensitiveContent,
} from '@/lib/fileUtils';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { filename } = req.query;
  const relativePath = typeof req.query.path === 'string' ? req.query.path : '';

  // Validate filename parameter
  if (typeof filename !== 'string' || !filename) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Invalid or missing filename parameter',
    });
  }

  // Sanitize the filename
  const sanitized = sanitizeFilename(filename);
  if (!sanitized) {
    return res.status(400).json({
      error: 'Invalid filename',
      message: 'Filename contains invalid characters',
    });
  }

  // Combine path and filename for full relative path
  const fullRelativePath = relativePath ? `${relativePath}/${sanitized}` : sanitized;

  // GET - Read file content (for editing)
  if (req.method === 'GET') {
    try {
      // Check if file exists
      const exists = await fileExists(fullRelativePath);
      if (!exists) {
        return res.status(404).json({
          error: 'Not found',
          message: 'File not found',
        });
      }

      // Check if file type is editable
      if (!isEditAllowed(sanitized)) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: 'This file type cannot be edited',
        });
      }

      // Read file content
      const content = await readFileContent(fullRelativePath);

      // Check if file contains sensitive information (MySQL credentials)
      if (hasSensitiveContent(content)) {
        // Log attempt to access sensitive file
        await logActivity({
          userId: req.user.id,
          actionType: 'read_file',
          resource: 'files',
          resourceId: fullRelativePath,
          details: { 
            filename: sanitized, 
            path: relativePath || 'root', 
            action: 'view_blocked',
            reason: 'sensitive_content'
          },
          req,
        });

        return res.status(403).json({
          error: 'Sensitive content',
          message: 'This file contains sensitive information (MySQL credentials) and can only be modified via direct SSH access.',
          sensitive: true,
        });
      }

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'read_file',
        resource: 'files',
        resourceId: fullRelativePath,
        details: { filename: sanitized, path: relativePath || 'root', action: 'view' },
        req,
      });

      return res.status(200).json({
        filename: sanitized,
        path: relativePath,
        content,
      });
    } catch (error) {
      console.error('Error reading file:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to read file',
      });
    }
  }

  // PUT - Edit or rename file
  if (req.method === 'PUT') {
    try {
      // Check if file exists
      const exists = await fileExists(fullRelativePath);
      if (!exists) {
        return res.status(404).json({
          error: 'Not found',
          message: 'File not found',
        });
      }

      const { content, newFilename } = req.body;

      // Case 1: Rename file
      if (newFilename) {
        // Block renaming of configuration files
        if (isConfigFile(sanitized)) {
          // Log blocked rename attempt
          await logActivity({
            userId: req.user.id,
            actionType: 'rename_file',
            resource: 'files',
            resourceId: fullRelativePath,
            details: {
              filename: sanitized,
              path: relativePath || 'root',
              action: 'rename_blocked',
              reason: 'config_file_protection',
            },
            req,
          });

          return res.status(403).json({
            error: 'Operation not allowed',
            message: 'Configuration files cannot be renamed. Please use direct SSH access.',
          });
        }

        // Sanitize new filename
        const sanitizedNewFilename = sanitizeFilename(newFilename);
        if (!sanitizedNewFilename) {
          return res.status(400).json({
            error: 'Invalid filename',
            message: 'New filename contains invalid characters',
          });
        }

        // Construct new full path (keep same directory)
        const newFullRelativePath = relativePath ? `${relativePath}/${sanitizedNewFilename}` : sanitizedNewFilename;

        // Check if new filename already exists
        const newExists = await fileExists(newFullRelativePath);
        if (newExists) {
          return res.status(409).json({
            error: 'File exists',
            message: 'A file with the new name already exists',
          });
        }

        // Rename the file
        await renameFile(fullRelativePath, newFullRelativePath);

        // Log activity
        await logActivity({
          userId: req.user.id,
          actionType: 'rename_file',
          resource: 'files',
          resourceId: fullRelativePath,
          details: {
            oldFilename: sanitized,
            newFilename: sanitizedNewFilename,
            path: relativePath || 'root',
            oldFullPath: fullRelativePath,
            newFullPath: newFullRelativePath,
          },
          req,
        });

        return res.status(200).json({
          message: 'File renamed successfully',
          oldFilename: sanitized,
          newFilename: sanitizedNewFilename,
          path: relativePath,
        });
      }

      // Case 2: Edit file content
      if (content !== undefined) {
        // Check if file type is editable
        if (!isEditAllowed(sanitized)) {
          return res.status(400).json({
            error: 'Invalid file type',
            message: 'This file type cannot be edited',
          });
        }

        // Validate content is a string
        if (typeof content !== 'string') {
          return res.status(400).json({
            error: 'Bad request',
            message: 'Content must be a string',
          });
        }

        // Check if the new content contains sensitive information
        if (hasSensitiveContent(content)) {
          // Log blocked edit attempt
          await logActivity({
            userId: req.user.id,
            actionType: 'edit_file',
            resource: 'files',
            resourceId: fullRelativePath,
            details: {
              filename: sanitized,
              path: relativePath || 'root',
              action: 'edit_blocked',
              reason: 'sensitive_content',
            },
            req,
          });

          return res.status(403).json({
            error: 'Sensitive content',
            message: 'This file contains sensitive information (MySQL credentials) and can only be modified via direct SSH access.',
            sensitive: true,
          });
        }

        // Write new content
        await writeFileContent(fullRelativePath, content);

        // Log activity
        await logActivity({
          userId: req.user.id,
          actionType: 'edit_file',
          resource: 'files',
          resourceId: fullRelativePath,
          details: {
            filename: sanitized,
            path: relativePath || 'root',
            contentLength: content.length,
          },
          req,
        });

        return res.status(200).json({
          message: 'File updated successfully',
          filename: sanitized,
          path: relativePath,
        });
      }

      // Neither content nor newFilename provided
      return res.status(400).json({
        error: 'Bad request',
        message: 'Either content or newFilename must be provided',
      });
    } catch (error: unknown) {
      console.error('Error updating file:', error);

      // Handle specific errors
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message;
        if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
          return res.status(403).json({
            error: 'Permission denied',
            message: 'Insufficient permissions to modify this file',
          });
        }
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update file',
      });
    }
  }

  // DELETE - Delete file
  if (req.method === 'DELETE') {
    try {
      // Check if file exists
      const exists = await fileExists(fullRelativePath);
      if (!exists) {
        return res.status(404).json({
          error: 'Not found',
          message: 'File not found',
        });
      }

      // Block deletion of configuration files
      if (isConfigFile(sanitized)) {
        // Log blocked delete attempt
        await logActivity({
          userId: req.user.id,
          actionType: 'delete_file',
          resource: 'files',
          resourceId: fullRelativePath,
          details: {
            filename: sanitized,
            path: relativePath || 'root',
            action: 'delete_blocked',
            reason: 'config_file_protection',
          },
          req,
        });

        return res.status(403).json({
          error: 'Operation not allowed',
          message: 'Configuration files cannot be deleted. Please use direct SSH access.',
        });
      }

      // Delete the file
      await deleteFile(fullRelativePath);

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'delete_file',
        resource: 'files',
        resourceId: fullRelativePath,
        details: { filename: sanitized, path: relativePath || 'root' },
        req,
      });

      return res.status(200).json({
        message: 'File deleted successfully',
        filename: sanitized,
        path: relativePath,
      });
    } catch (error: unknown) {
      console.error('Error deleting file:', error);

      // Handle specific errors
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message;
        if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
          return res.status(403).json({
            error: 'Permission denied',
            message: 'Insufficient permissions to delete this file',
          });
        }
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete file',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAdmin(handler);
