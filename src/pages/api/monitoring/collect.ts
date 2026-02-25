/**
 * API endpoint for automated metrics collection
 * GET: Collect and save current metrics to database
 * This endpoint can be called by cron jobs or external schedulers
 * 
 * Security Note: The token is passed as a query parameter for ease of use with cron jobs.
 * Be aware that this token will appear in web server access logs. Consider using an Authorization
 * header if your scheduler supports it, or ensure log sanitization is in place.
 * 
 * Usage: Add this to your crontab to collect metrics every 5 minutes:
 * (cron pattern: every 5 minutes) curl -X GET "http://localhost:3000/apanel44/api/monitoring/collect?token=YOUR_SECRET_TOKEN" >> /var/log/metrics-collection.log 2>&1
 */

import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { collectMetrics } from '@/lib/metrics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Simple token-based authentication for automated calls
      const { token } = req.query;
      const expectedToken = process.env.METRICS_COLLECTION_TOKEN || process.env.DEBUG_TOKEN;
      
      if (!expectedToken) {
        console.error('[Metrics Collection] METRICS_COLLECTION_TOKEN not configured');
        return res.status(500).json({ 
          error: 'Configuration error',
          message: 'Metrics collection token not configured'
        });
      }
      
      if (token !== expectedToken) {
        console.error('[Metrics Collection] Invalid token provided');
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Invalid or missing token'
        });
      }

      console.log('[Metrics Collection] Starting automated metrics collection...');

      // Get instanceId from query parameter (optional)
      const instanceId = typeof req.query.instanceId === 'string' ? req.query.instanceId : undefined;

      // Collect system metrics using shared utility
      const metrics = await collectMetrics(instanceId);

      // Save to database
      try {
        await prisma.serverMetrics.create({
          data: metrics,
        });
        console.log('[Metrics Collection] Metrics saved successfully:', {
          cpuUsage: metrics.cpuUsage,
          memoryUsagePercent: metrics.memoryUsagePercent,
          playerCount: metrics.playerCount,
          serverOnline: metrics.serverOnline,
          dbStatus: metrics.dbStatus,
        });
      } catch (saveError) {
        console.error('[Metrics Collection] Error saving metrics to database:', saveError);
        return res.status(500).json({ 
          error: 'Database error',
          message: 'Failed to save metrics to database'
        });
      }

      return res.status(200).json({ 
        success: true,
        message: 'Metrics collected and saved successfully',
        timestamp: new Date().toISOString(),
        metrics: {
          cpuUsage: metrics.cpuUsage,
          memoryUsagePercent: metrics.memoryUsagePercent,
          playerCount: metrics.playerCount,
          serverOnline: metrics.serverOnline,
        }
      });
    } catch (error) {
      console.error('[Metrics Collection] Error during automated collection:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to collect metrics'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
