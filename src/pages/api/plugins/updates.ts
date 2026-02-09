/**
 * Plugin Updates Check API Endpoint
 * GET /apanel44/api/plugins/updates
 * 
 * Returns list of all plugins with update information
 */

import { NextApiResponse } from 'next';
import { withAdmin, AuthenticatedRequest } from '@/lib/middleware';
import { getAllPluginsWithUpdates, PluginUpdateInfo } from '@/lib/plugin-updates';

interface PluginUpdatesResponse {
  total: number;
  updatesAvailable: number;
  plugins: PluginUpdateInfo[];
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all plugins with update information
    const plugins = await getAllPluginsWithUpdates();
    
    // Count updates available
    const updatesAvailable = plugins.filter(p => p.updateAvailable).length;
    
    const response: PluginUpdatesResponse = {
      total: plugins.length,
      updatesAvailable,
      plugins,
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error checking plugin updates:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to check plugin updates',
    });
  }
}

export default withAdmin(handler);
