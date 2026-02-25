/**
 * API endpoint for server instance management
 * GET: List all available server instances
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { getServerInstances, getDefaultInstance } from '@/lib/serverInstances';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const instances = getServerInstances();
      const defaultInstance = getDefaultInstance();
      
      // Only return safe information (no database URLs or sensitive data)
      const safeInstances = instances.map(instance => ({
        id: instance.id,
        name: instance.name,
        displayName: instance.displayName,
        description: instance.description,
        isDefault: instance.isDefault,
      }));
      
      return res.status(200).json({
        instances: safeInstances,
        defaultInstanceId: defaultInstance.id,
      });
    } catch (error) {
      console.error('Error fetching server instances:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch server instances'
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
