/**
 * Server Version API Endpoint
 * GET /apanel44/api/server/version
 * 
 * Returns current and latest PaperMC version information
 */

import { NextApiResponse } from 'next';
import { withAdmin, AuthenticatedRequest } from '@/lib/middleware';
import { checkForUpdates, PaperMCVersion } from '@/lib/papermc';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const serverDir = process.env.SERVER_DIR || '/opt/minecraft/server';
    
    // Check for updates
    const versionInfo: PaperMCVersion = await checkForUpdates(serverDir);
    
    return res.status(200).json(versionInfo);
  } catch (error) {
    console.error('Error checking server version:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to check server version',
    });
  }
}

export default withAdmin(handler);
