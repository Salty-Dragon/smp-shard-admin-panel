/**
 * API endpoint for activity logs
 * GET: Fetch activity logs with filters
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { getActivityLogs } from '@/lib/activity';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Check if user has permission to view logs
      const canViewLogs = await hasPermission(req.user.id, 'logs', 'read');

      if (!canViewLogs) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You do not have permission to view logs'
        });
      }

      // Parse query parameters
      const {
        page = '1',
        limit = '50',
        userId,
        actionType,
        startDate,
        endDate,
      } = req.query;

      const params: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      if (userId && typeof userId === 'string') {
        params.userId = userId;
      }

      if (actionType && typeof actionType === 'string') {
        params.actionType = actionType;
      }

      if (startDate && typeof startDate === 'string') {
        params.startDate = new Date(startDate);
      }

      if (endDate && typeof endDate === 'string') {
        params.endDate = new Date(endDate);
      }

      const result = await getActivityLogs(params);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
