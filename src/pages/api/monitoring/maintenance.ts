/**
 * API endpoint for metrics maintenance tasks
 * POST: Run cleanup and aggregation tasks (Super Admin only)
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { runMetricsMaintenanceTask } from '@/lib/metricsCleanup';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only Super Admins can run maintenance tasks
  if (req.user.role !== 'Super Admin') {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Only Super Admins can run maintenance tasks'
    });
  }

  if (req.method === 'POST') {
    try {
      console.log('[Maintenance API] Starting metrics maintenance task...');
      
      const result = await runMetricsMaintenanceTask();
      
      return res.status(200).json({ 
        message: 'Maintenance task completed successfully',
        result
      });
    } catch (error) {
      console.error('[Maintenance API] Error running maintenance task:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to run maintenance task',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
