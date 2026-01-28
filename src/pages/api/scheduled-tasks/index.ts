/**
 * API endpoint for scheduled tasks
 * GET: Fetch scheduled tasks
 * POST: Create a new scheduled task (Admin/Super Admin only)
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Only Super Admins and Admins can view scheduled tasks
      if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only Admins can view scheduled tasks'
        });
      }

      // Parse query parameters
      const {
        page = '1',
        limit = '50',
        status,
        taskType,
      } = req.query;

      const where: any = {};

      if (status && typeof status === 'string') {
        where.status = status;
      }

      if (taskType && typeof taskType === 'string') {
        where.taskType = taskType;
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [tasks, total] = await Promise.all([
        prisma.scheduledTask.findMany({
          where,
          include: {
            user: {
              select: {
                name: true,
                email: true,
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string),
        }),
        prisma.scheduledTask.count({ where }),
      ]);

      return res.status(200).json({
        tasks,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      });
    } catch (error) {
      console.error('Error fetching scheduled tasks:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Only Super Admins and Admins can create scheduled tasks
      if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only Admins can create scheduled tasks'
        });
      }

      const { 
        name, 
        description, 
        taskType, 
        scheduleType, 
        cronExpression, 
        scheduledFor, 
        config 
      } = req.body;

      // Validate required fields
      if (!name || !taskType || !scheduleType) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Name, taskType, and scheduleType are required'
        });
      }

      // Validate taskType
      const validTaskTypes = ['backup', 'cleanup', 'ban', 'unban', 'custom'];
      if (!validTaskTypes.includes(taskType)) {
        return res.status(400).json({ 
          error: 'Invalid taskType',
          message: 'TaskType must be one of: backup, cleanup, ban, unban, custom'
        });
      }

      // Validate scheduleType
      const validScheduleTypes = ['once', 'recurring'];
      if (!validScheduleTypes.includes(scheduleType)) {
        return res.status(400).json({ 
          error: 'Invalid scheduleType',
          message: 'ScheduleType must be one of: once, recurring'
        });
      }

      // Validate schedule configuration
      if (scheduleType === 'once' && !scheduledFor) {
        return res.status(400).json({ 
          error: 'Missing scheduledFor',
          message: 'scheduledFor is required for one-time tasks'
        });
      }

      if (scheduleType === 'recurring' && !cronExpression) {
        return res.status(400).json({ 
          error: 'Missing cronExpression',
          message: 'cronExpression is required for recurring tasks'
        });
      }

      // Create scheduled task
      const task = await prisma.scheduledTask.create({
        data: {
          userId: req.user.id,
          name,
          description: description || null,
          taskType,
          scheduleType,
          cronExpression: cronExpression || null,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          nextRunAt: scheduledFor ? new Date(scheduledFor) : null,
          config: config ? JSON.stringify(config) : null,
        },
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
        actionType: 'create_scheduled_task',
        resource: 'scheduled_task',
        resourceId: task.id,
        details: { name, taskType, scheduleType },
        req,
      });

      return res.status(201).json({ task });
    } catch (error) {
      console.error('Error creating scheduled task:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
