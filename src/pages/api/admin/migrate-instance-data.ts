/**
 * Migration API - Backfill instanceId for existing data
 * 
 * This endpoint allows Super Admins to set a default instanceId for all
 * existing ActivityLog and ServerMetrics records that don't have one.
 * 
 * This is useful when upgrading from single-instance to multi-instance setup.
 */

import { NextApiResponse } from 'next';
import { withSuperAdmin, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { instanceId } = req.body;

      // Validate instanceId
      if (!instanceId || typeof instanceId !== 'string') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'instanceId is required and must be a string'
        });
      }

      console.log(`[Migration] Starting data migration to set default instanceId: ${instanceId}`);

      // Count records that need migration
      const [activityLogsToMigrate, serverMetricsToMigrate, scheduledTasksToMigrate] = await Promise.all([
        prisma.activityLog.count({
          where: { instanceId: null }
        }),
        prisma.serverMetrics.count({
          where: { instanceId: null }
        }),
        prisma.scheduledTask.count({
          where: { instanceId: null }
        })
      ]);

      console.log(`[Migration] Records to migrate:`, {
        activityLogs: activityLogsToMigrate,
        serverMetrics: serverMetricsToMigrate,
        scheduledTasks: scheduledTasksToMigrate
      });

      // Perform the migration
      const [activityLogsUpdated, serverMetricsUpdated, scheduledTasksUpdated] = await Promise.all([
        prisma.activityLog.updateMany({
          where: { instanceId: null },
          data: { instanceId }
        }),
        prisma.serverMetrics.updateMany({
          where: { instanceId: null },
          data: { instanceId }
        }),
        prisma.scheduledTask.updateMany({
          where: { instanceId: null },
          data: { instanceId }
        })
      ]);

      console.log(`[Migration] Migration completed:`, {
        activityLogsUpdated: activityLogsUpdated.count,
        serverMetricsUpdated: serverMetricsUpdated.count,
        scheduledTasksUpdated: scheduledTasksUpdated.count
      });

      // Log the migration activity
      await logActivity({
        userId: req.user.id,
        actionType: 'config_update',
        resource: 'database',
        resourceId: 'instance-migration',
        details: {
          action: 'migrate_instance_data',
          instanceId,
          activityLogsUpdated: activityLogsUpdated.count,
          serverMetricsUpdated: serverMetricsUpdated.count,
          scheduledTasksUpdated: scheduledTasksUpdated.count,
          totalRecordsUpdated: activityLogsUpdated.count + serverMetricsUpdated.count + scheduledTasksUpdated.count
        },
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Migration completed successfully',
        results: {
          activityLogs: {
            toMigrate: activityLogsToMigrate,
            migrated: activityLogsUpdated.count
          },
          serverMetrics: {
            toMigrate: serverMetricsToMigrate,
            migrated: serverMetricsUpdated.count
          },
          scheduledTasks: {
            toMigrate: scheduledTasksToMigrate,
            migrated: scheduledTasksUpdated.count
          },
          totalMigrated: activityLogsUpdated.count + serverMetricsUpdated.count + scheduledTasksUpdated.count
        },
        instanceId
      });
    } catch (error) {
      console.error('[Migration] Error during migration:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to migrate instance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET - Check migration status
  if (req.method === 'GET') {
    try {
      // Count records with and without instanceId
      const [
        activityLogsWithInstance,
        activityLogsWithoutInstance,
        serverMetricsWithInstance,
        serverMetricsWithoutInstance,
        scheduledTasksWithInstance,
        scheduledTasksWithoutInstance
      ] = await Promise.all([
        prisma.activityLog.count({
          where: { instanceId: { not: null } }
        }),
        prisma.activityLog.count({
          where: { instanceId: null }
        }),
        prisma.serverMetrics.count({
          where: { instanceId: { not: null } }
        }),
        prisma.serverMetrics.count({
          where: { instanceId: null }
        }),
        prisma.scheduledTask.count({
          where: { instanceId: { not: null } }
        }),
        prisma.scheduledTask.count({
          where: { instanceId: null }
        })
      ]);

      const needsMigration = 
        activityLogsWithoutInstance > 0 || 
        serverMetricsWithoutInstance > 0 || 
        scheduledTasksWithoutInstance > 0;

      return res.status(200).json({
        needsMigration,
        statistics: {
          activityLogs: {
            withInstance: activityLogsWithInstance,
            withoutInstance: activityLogsWithoutInstance,
            total: activityLogsWithInstance + activityLogsWithoutInstance
          },
          serverMetrics: {
            withInstance: serverMetricsWithInstance,
            withoutInstance: serverMetricsWithoutInstance,
            total: serverMetricsWithInstance + serverMetricsWithoutInstance
          },
          scheduledTasks: {
            withInstance: scheduledTasksWithInstance,
            withoutInstance: scheduledTasksWithoutInstance,
            total: scheduledTasksWithInstance + scheduledTasksWithoutInstance
          }
        }
      });
    } catch (error) {
      console.error('[Migration] Error checking migration status:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check migration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({
    error: 'Method Not Allowed',
    message: `Method ${req.method} is not allowed for this endpoint`
  });
}

export default withSuperAdmin(handler);
