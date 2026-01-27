/**
 * API endpoint for recent activity
 * GET: Fetch recent activity (last 24 hours)
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { getRecentActivity } from '@/lib/activity';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { limit = '50', hours = '24' } = req.query;

      const logs = await getRecentActivity(
        parseInt(limit as string),
        undefined,
        parseInt(hours as string)
      );

      return res.status(200).json({ logs });
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
