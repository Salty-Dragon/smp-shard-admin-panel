/**
 * Files API - List and Upload Files
 * 
 * GET - List all files in the plugins directory
 * POST - Upload a new file (jar only)
 */

import { NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import { withAdmin, AuthenticatedRequest } from '@/lib/middleware';
import { logActivity } from '@/lib/activity';
import {
  listFiles,
  validateAndResolvePath,
  sanitizeFilename,
  isUploadAllowed,
  isFileSizeAllowed,
  fileExists,
  PLUGINS_DIR,
  MAX_JAR_SIZE,
} from '@/lib/fileUtils';

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // GET - List all files
  if (req.method === 'GET') {
    try {
      const files = await listFiles();

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'list_files',
        resource: 'files',
        details: { count: files.length },
        req,
      });

      return res.status(200).json({ files });
    } catch (error) {
      console.error('Error listing files:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list files',
      });
    }
  }

  // POST - Upload a new file
  if (req.method === 'POST') {
    try {
      // Parse the multipart form data
      const form = new IncomingForm({
        maxFileSize: MAX_JAR_SIZE,
        uploadDir: '/tmp',
        keepExtensions: true,
      });

      const { files } = await new Promise<{
        fields: Record<string, unknown>;
        files: Record<string, unknown>;
      }>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({ fields, files });
        });
      });

      // Get the uploaded file
      const uploadedFile = files.file;
      if (!uploadedFile) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'No file uploaded',
        });
      }

      // Handle both single file and array of files
      const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

      // Validate file type
      const originalFilename = file.originalFilename || 'unknown';
      if (!isUploadAllowed(originalFilename)) {
        // Clean up temp file
        await fs.unlink(file.filepath).catch(() => {});
        return res.status(400).json({
          error: 'Invalid file type',
          message: 'Only .jar files are allowed',
        });
      }

      // Validate file size
      const fileSize = file.size;
      if (!isFileSizeAllowed(fileSize)) {
        // Clean up temp file
        await fs.unlink(file.filepath).catch(() => {});
        return res.status(400).json({
          error: 'File too large',
          message: `File size must not exceed ${MAX_JAR_SIZE / (1024 * 1024)}MB`,
        });
      }

      // Sanitize filename
      const sanitized = sanitizeFilename(originalFilename);
      if (!sanitized) {
        // Clean up temp file
        await fs.unlink(file.filepath).catch(() => {});
        return res.status(400).json({
          error: 'Invalid filename',
          message: 'Filename contains invalid characters',
        });
      }

      // Check if file already exists
      const exists = await fileExists(sanitized);
      if (exists) {
        // Clean up temp file
        await fs.unlink(file.filepath).catch(() => {});
        return res.status(409).json({
          error: 'File exists',
          message: 'A file with this name already exists',
        });
      }

      // Validate and get destination path
      const destPath = validateAndResolvePath(sanitized);
      if (!destPath) {
        // Clean up temp file
        await fs.unlink(file.filepath).catch(() => {});
        return res.status(400).json({
          error: 'Invalid path',
          message: 'Invalid file path',
        });
      }

      // Ensure plugins directory exists
      await fs.mkdir(PLUGINS_DIR, { recursive: true });

      // Move the file from temp to destination
      await fs.rename(file.filepath, destPath);

      // Set appropriate permissions
      await fs.chmod(destPath, 0o644);

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'upload_file',
        resource: 'files',
        resourceId: sanitized,
        details: {
          filename: sanitized,
          size: fileSize,
          originalFilename,
        },
        req,
      });

      return res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          name: sanitized,
          size: fileSize,
        },
      });
    } catch (error: unknown) {
      console.error('Error uploading file:', error);

      // Handle specific errors
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message;
        if (errorMessage.includes('maxFileSize')) {
          return res.status(400).json({
            error: 'File too large',
            message: `File size must not exceed ${MAX_JAR_SIZE / (1024 * 1024)}MB`,
          });
        }
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to upload file',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAdmin(handler);
