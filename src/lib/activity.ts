/**
 * Activity Logging Utilities
 * 
 * This module provides functions for logging user actions
 */

import prisma from './prisma';
import { NextApiRequest } from 'next';

export type ActionType =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'create_role'
  | 'update_role'
  | 'delete_role'
  | 'assign_permission'
  | 'remove_permission'
  | 'view_logs'
  | 'server_command'
  | 'server_start'
  | 'server_stop'
  | 'server_restart'
  | 'server_config_update'
  | 'server_status_change'
  | 'server_update'
  | 'config_update'
  | 'player_action'
  | '2fa_enabled'
  | '2fa_disabled'
  | '2fa_failed'
  | '2fa_method_changed'
  | 'create_error_report'
  | 'update_error_report'
  | 'create_scheduled_task'
  | 'update_scheduled_task'
  | 'delete_scheduled_task'
  | 'upload_file'
  | 'edit_file'
  | 'rename_file'
  | 'delete_file'
  | 'list_files'
  | 'read_file'
  | 'plugin_update';

export interface LogActivityParams {
  userId: string;
  actionType: ActionType;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  req?: NextApiRequest;
}

/**
 * Log a user activity
 * 
 * @param params - Activity log parameters
 * @returns Promise<void>
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const { userId, actionType, resource, resourceId, details, req } = params;

    await prisma.activityLog.create({
      data: {
        userId,
        actionType,
        resource: resource || null,
        resourceId: resourceId || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: req ? getIpAddress(req) : null,
        userAgent: req ? req.headers['user-agent'] || null : null,
      },
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - logging failure shouldn't break the main functionality
  }
}

/**
 * Get IP address from request
 * Handles proxies (X-Forwarded-For, X-Real-IP)
 * 
 * @param req - NextApiRequest
 * @returns string - IP address
 */
function getIpAddress(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const real = req.headers['x-real-ip'];

  if (forwarded) {
    return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
  }

  if (real) {
    return typeof real === 'string' ? real : real[0];
  }

  return req.socket.remoteAddress || 'unknown';
}

/**
 * Get recent activity logs
 * 
 * @param limit - Number of logs to fetch (default: 50)
 * @param userId - Optional user ID filter
 * @param hours - Optional time range in hours (default: 24)
 * @returns Promise<ActivityLog[]>
 */
export async function getRecentActivity(
  limit = 50,
  userId?: string,
  hours = 24
) {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const logs = await prisma.activityLog.findMany({
      where: {
        ...(userId && { userId }),
        timestamp: { gte: since },
      },
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
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return logs;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

/**
 * Get activity logs with filters
 * 
 * @param params - Filter parameters
 * @returns Promise<ActivityLog[]>
 */
export async function getActivityLogs(params: {
  page?: number;
  limit?: number;
  userId?: string;
  actionType?: ActionType;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      actionType,
      startDate,
      endDate,
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (actionType) {
      where.actionType = actionType;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
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
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return {
      logs: [],
      total: 0,
      page: 1,
      limit: 50,
      pages: 0,
    };
  }
}
