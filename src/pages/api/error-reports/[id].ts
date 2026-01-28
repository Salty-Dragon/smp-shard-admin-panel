/**
 * API endpoint for individual error report
 * PATCH: Update error report status (Super Admin only)
 * DELETE: Delete error report (Super Admin only)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid error report ID' });
  }

  if (req.method === 'PATCH') {
    try {
      // Only Super Admins can update error reports
      if (req.user.role !== 'Super Admin') {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only Super Admins can update error reports'
        });
      }

      const { status, resolution } = req.body;

      // Validate status
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status',
          message: 'Status must be one of: open, in_progress, resolved, closed'
        });
      }

      const updateData: any = {};

      if (status) {
        updateData.status = status;
        
        // If status is resolved or closed, update resolvedAt and resolvedById
        if (status === 'resolved' || status === 'closed') {
          updateData.resolvedAt = new Date();
          updateData.resolvedById = req.user.id;
        }
      }

      if (resolution) {
        updateData.resolution = resolution;
      }

      const errorReport = await prisma.errorReport.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'update_error_report',
        resource: 'error_report',
        resourceId: id,
        details: { status, resolution },
        req,
      });

      return res.status(200).json({ errorReport });
    } catch (error) {
      console.error('Error updating error report:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Only Super Admins can delete error reports
      if (req.user.role !== 'Super Admin') {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only Super Admins can delete error reports'
        });
      }

      await prisma.errorReport.delete({
        where: { id },
      });

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'update_error_report',
        resource: 'error_report',
        resourceId: id,
        details: { action: 'delete' },
        req,
      });

      return res.status(200).json({ message: 'Error report deleted' });
    } catch (error) {
      console.error('Error deleting error report:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
