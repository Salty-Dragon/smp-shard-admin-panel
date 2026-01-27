/**
 * API endpoint to verify log access password
 * POST: Verify password for log access
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { hasRole } from '@/lib/permissions';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Only Super Admins can access logs with password
    const isSuperAdmin = await hasRole(req.user.id, 'Super Admin');
    
    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { password } = req.body;

    // Verify password (in production, use environment variable)
    const correctPassword = process.env.LOG_ACCESS_PASSWORD || 'logaccess123';

    if (password === correctPassword) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error verifying log password:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);
