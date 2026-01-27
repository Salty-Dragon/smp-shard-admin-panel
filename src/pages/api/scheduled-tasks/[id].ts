/**
 * API endpoint for individual scheduled task
 * PATCH: Update scheduled task (Admin/Super Admin only)
 * DELETE: Delete scheduled task (Admin/Super Admin only)
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  if (req.method === 'PATCH') {
    try {
      // Only Super Admins and Admins can update scheduled tasks
      if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only Admins can update scheduled tasks'
        });
      }

      const { 
        name, 
        description, 
        status, 
        scheduleType, 
        cronExpression, 
        scheduledFor, 
        config 
      } = req.body;

      // Validate status
      if (status) {
        const validStatuses = ['active', 'paused', 'completed', 'failed'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ 
            error: 'Invalid status',
            message: 'Status must be one of: active, paused, completed, failed'
          });
        }
      }

      const updateData: any = {};

      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (status) updateData.status = status;
      if (scheduleType) updateData.scheduleType = scheduleType;
      if (cronExpression !== undefined) updateData.cronExpression = cronExpression;
      if (scheduledFor) {
        updateData.scheduledFor = new Date(scheduledFor);
        updateData.nextRunAt = new Date(scheduledFor);
      }
      if (config !== undefined) updateData.config = JSON.stringify(config);

      const task = await prisma.scheduledTask.update({
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
        actionType: 'update_scheduled_task',
        resource: 'scheduled_task',
        resourceId: id,
        details: updateData,
        req,
      });

      return res.status(200).json({ task });
    } catch (error) {
      console.error('Error updating scheduled task:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Only Super Admins and Admins can delete scheduled tasks
      if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only Admins can delete scheduled tasks'
        });
      }

      await prisma.scheduledTask.delete({
        where: { id },
      });

      // Log activity
      await logActivity({
        userId: req.user.id,
        actionType: 'delete_scheduled_task',
        resource: 'scheduled_task',
        resourceId: id,
        details: { action: 'delete' },
        req,
      });

      return res.status(200).json({ message: 'Scheduled task deleted' });
    } catch (error) {
      console.error('Error deleting scheduled task:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
