/**
 * API endpoint for Minecraft server status
 * GET: Fetch current server online/offline status
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { getServerStatus } from '@/lib/minecraft';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get optional instanceId from query parameter
      const instanceId = typeof req.query.instanceId === 'string' ? req.query.instanceId : undefined;
      
      console.log('[Server Status API] Fetching server status for instance:', instanceId || 'default');
      
      // Get server status from Minecraft integration
      const status = await getServerStatus(instanceId);
      
      console.log('[Server Status API] Server status retrieved:', status);
      
      return res.status(200).json({ status, instanceId });
    } catch (error) {
      console.error('[Server Status API] Error fetching server status:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch server status'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
