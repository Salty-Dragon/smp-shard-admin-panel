/**
 * API endpoint for listing available permissions
 * GET: List all available permissions
 */

import { NextApiResponse } from 'next';
import { withSuperAdmin, AuthenticatedRequest } from '@/lib/middleware';
import { AVAILABLE_PERMISSIONS } from '@/lib/permissions';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      return res.status(200).json({ permissions: AVAILABLE_PERMISSIONS });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withSuperAdmin(handler);
