/**
 * Config File Backups API
 *
 * GET  - List backups for a config file (query: filename, path, instanceId)
 * POST - Restore a config file from a backup ({ filename, path, instanceId, backupId })
 *
 * Backups are created automatically whenever a config file is edited or deleted
 * (see api/files/[filename].ts). This endpoint exposes them to the panel.
 */

import { NextApiResponse } from 'next';
import { withAdmin, AuthenticatedRequest } from '@/lib/middleware';
import { logActivity } from '@/lib/activity';
import { sanitizeFilename } from '@/lib/fileUtils';
import { listBackups, restoreBackup } from '@/lib/backups';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const filenameRaw =
    typeof req.query.filename === 'string'
      ? req.query.filename
      : typeof req.body?.filename === 'string'
        ? req.body.filename
        : '';
  const relativePath =
    typeof req.query.path === 'string'
      ? req.query.path
      : typeof req.body?.path === 'string'
        ? req.body.path
        : '';
  const instanceId =
    typeof req.query.instanceId === 'string'
      ? req.query.instanceId
      : typeof req.body?.instanceId === 'string'
        ? req.body.instanceId
        : undefined;

  const sanitized = sanitizeFilename(filenameRaw);
  if (!sanitized) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Invalid or missing filename parameter',
    });
  }

  const fullRelativePath = relativePath ? `${relativePath}/${sanitized}` : sanitized;

  // GET - list backups for a file
  if (req.method === 'GET') {
    try {
      const backups = await listBackups(fullRelativePath, instanceId);
      return res.status(200).json({ filename: sanitized, path: relativePath, backups });
    } catch (error) {
      console.error('Error listing backups:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list backups',
      });
    }
  }

  // POST - restore a file from a backup
  if (req.method === 'POST') {
    const backupId = typeof req.body?.backupId === 'string' ? req.body.backupId : '';
    if (!backupId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing backupId',
      });
    }

    try {
      await restoreBackup(fullRelativePath, backupId, instanceId);

      await logActivity({
        userId: req.user.id,
        actionType: 'restore_file',
        resource: 'files',
        resourceId: fullRelativePath,
        instanceId,
        details: {
          filename: sanitized,
          path: relativePath || 'root',
          backupId,
          instanceId,
        },
        req,
      });

      return res.status(200).json({
        message: 'File restored from backup',
        filename: sanitized,
        path: relativePath,
        backupId,
      });
    } catch (error: unknown) {
      console.error('Error restoring backup:', error);
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : '';
      if (message === 'Backup not found') {
        return res.status(404).json({ error: 'Not found', message: 'Backup not found' });
      }
      if (message === 'Invalid backup id' || message === 'Invalid file path') {
        return res.status(400).json({ error: 'Bad request', message });
      }
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to restore backup',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAdmin(handler);
