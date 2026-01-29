/**
 * API endpoint for server monitoring metrics
 * GET: Fetch current server metrics (Admin/Super Admin only)
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { collectMetrics } from '@/lib/metrics';

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

      // Log the metrics fetch attempt
      console.log('[Metrics API] Fetching server metrics...');

      // Collect system metrics
      const metrics = await collectMetrics();

      console.log('[Metrics API] Metrics collected successfully:', {
        cpuUsage: metrics.cpuUsage,
        memoryUsagePercent: metrics.memoryUsagePercent,
        playerCount: metrics.playerCount,
        dbStatus: metrics.dbStatus,
      });

      // Optionally save to database for historical tracking
      const { saveHistory } = req.query;
      if (saveHistory === 'true') {
        try {
          await prisma.serverMetrics.create({
            data: metrics,
          });
          console.log('[Metrics API] Metrics saved to database for historical tracking');
        } catch (saveError) {
          console.error('[Metrics API] Error saving metrics to database:', saveError);
          // Still return metrics even if save fails
          return res.status(200).json({ 
            metrics,
            warning: 'Metrics collected but failed to save to database for history'
          });
        }
      }

      return res.status(200).json({ metrics });
    } catch (error) {
      console.error('[Metrics API] Error fetching server metrics:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch server metrics'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
