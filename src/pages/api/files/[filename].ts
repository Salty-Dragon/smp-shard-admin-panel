/**
 * Files API - Individual File Operations
 * 
 * GET - Get file content (for editing config files)
 * PUT - Rename or edit file content
 * DELETE - Delete a file
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
  isEditAllowed,
} from '@/lib/fileUtils';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { filename } = req.query;

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

  // GET - Read file content (for editing)
  if (req.method === 'GET') {
    try {
      // Check if file exists
      const exists = await fileExists(sanitized);
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
      const content = await readFileContent(sanitized);

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'list_files',
        resource: 'files',
        resourceId: sanitized,
        details: { filename: sanitized, action: 'view' },
        req,
      });

      return res.status(200).json({
        filename: sanitized,
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
      const exists = await fileExists(sanitized);
      if (!exists) {
        return res.status(404).json({
          error: 'Not found',
          message: 'File not found',
        });
      }

      const { content, newFilename } = req.body;

      // Case 1: Rename file
      if (newFilename) {
        // Sanitize new filename
        const sanitizedNewFilename = sanitizeFilename(newFilename);
        if (!sanitizedNewFilename) {
          return res.status(400).json({
            error: 'Invalid filename',
            message: 'New filename contains invalid characters',
          });
        }

        // Check if new filename already exists
        const newExists = await fileExists(sanitizedNewFilename);
        if (newExists) {
          return res.status(409).json({
            error: 'File exists',
            message: 'A file with the new name already exists',
          });
        }

        // Rename the file
        await renameFile(sanitized, sanitizedNewFilename);

        // Log activity
        await logActivity({
          userId: req.user.id,
          actionType: 'rename_file',
          resource: 'files',
          resourceId: sanitized,
          details: {
            oldFilename: sanitized,
            newFilename: sanitizedNewFilename,
          },
          req,
        });

        return res.status(200).json({
          message: 'File renamed successfully',
          oldFilename: sanitized,
          newFilename: sanitizedNewFilename,
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

        // Write new content
        await writeFileContent(sanitized, content);

        // Log activity
        await logActivity({
          userId: req.user.id,
          actionType: 'edit_file',
          resource: 'files',
          resourceId: sanitized,
          details: {
            filename: sanitized,
            contentLength: content.length,
          },
          req,
        });

        return res.status(200).json({
          message: 'File updated successfully',
          filename: sanitized,
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
      const exists = await fileExists(sanitized);
      if (!exists) {
        return res.status(404).json({
          error: 'Not found',
          message: 'File not found',
        });
      }

      // Delete the file
      await deleteFile(sanitized);

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'delete_file',
        resource: 'files',
        resourceId: sanitized,
        details: { filename: sanitized },
        req,
      });

      return res.status(200).json({
        message: 'File deleted successfully',
        filename: sanitized,
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
