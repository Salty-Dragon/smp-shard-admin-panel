/**
 * API endpoint for server monitoring metrics
 * GET: Fetch current server metrics (Admin/Super Admin only)
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { collectMetrics } from '@/lib/metrics';
import { getMetricsSettings } from '@/lib/settings';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Only Super Admins and Admins can view server metrics
      if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only Admins can view server metrics'
        });
      }

      // Get metrics settings
      const settings = await getMetricsSettings();

      // Check if metrics are enabled
      if (!settings.metricsEnabled) {
        return res.status(503).json({
          error: 'Service unavailable',
          message: 'Metrics collection is currently disabled'
        });
      }

      // Log the metrics fetch attempt
      console.log('[Metrics API] Fetching server metrics...');

      // Collect system metrics with error handling
      let metrics;
      try {
        metrics = await collectMetrics();
      } catch (collectError) {
        console.error('[Metrics API] Error collecting metrics:', collectError);
        return res.status(500).json({ 
          error: 'Metrics collection failed',
          message: 'Unable to collect server metrics. The monitoring system may be experiencing issues.',
          details: collectError instanceof Error ? collectError.message : 'Unknown error'
        });
      }

      console.log('[Metrics API] Metrics collected successfully:', {
        cpuUsage: metrics.cpuUsage,
        memoryUsagePercent: metrics.memoryUsagePercent,
        playerCount: metrics.playerCount,
        dbStatus: metrics.dbStatus,
      });

      // Determine if we should save history
      const { saveHistory } = req.query;
      const shouldSaveHistory = saveHistory === 'true' || 
                               (saveHistory !== 'false' && settings.historyCollectionEnabled);

      if (shouldSaveHistory) {
        try {
          await prisma.serverMetrics.create({
            data: {
              ...metrics,
              isAggregated: false,
              aggregationPeriod: null,
            },
          });
          console.log('[Metrics API] Metrics saved to database for historical tracking');
        } catch (saveError) {
          console.error('[Metrics API] Error saving metrics to database:', saveError);
          
          // Check if it's a database connectivity issue
          if (saveError instanceof Error && saveError.message.includes('database')) {
            return res.status(200).json({ 
              metrics,
              warning: 'Metrics collected but database is unavailable. History not saved.',
              dbError: true
            });
          }
          
          // Still return metrics even if save fails
          return res.status(200).json({ 
            metrics,
            warning: 'Metrics collected but failed to save to database for history'
          });
        }
      }

      return res.status(200).json({ 
        metrics,
        historySaved: shouldSaveHistory 
      });
    } catch (error) {
      console.error('[Metrics API] Unexpected error in metrics endpoint:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to process metrics request',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
