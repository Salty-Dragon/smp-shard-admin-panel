/**
 * Plugin Update Deployment API Endpoint
 * POST /apanel44/api/plugins/deploy-update
 * 
 * Deploys plugin updates with automatic rollback on failure
 */

import { NextApiResponse } from 'next';
import { withAdmin, AuthenticatedRequest } from '@/lib/middleware';
import { logActivity } from '@/lib/activity';
import { sanitizeFilename, PLUGINS_DIR } from '@/lib/fileUtils';
import { tmuxSessionExists, sendCommandAndCapture, executeScriptInTmux } from '@/lib/console';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

interface DeployUpdateRequestBody {
  pluginFilename: string;
  downloadUrl: string;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pluginFilename, downloadUrl } = req.body as DeployUpdateRequestBody;

    if (!pluginFilename || !downloadUrl) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'pluginFilename and downloadUrl are required',
      });
    }

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(pluginFilename);
    if (!sanitizedFilename.endsWith('.jar')) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Plugin filename must end with .jar',
      });
    }

    const sessionName = process.env.TMUX_SESSION_NAME || process.env.MINECRAFT_SERVER_SESSION || 'minecraft';
    const startScript = process.env.MINECRAFT_START_SCRIPT || './start.sh';

    const currentPluginPath = path.join(PLUGINS_DIR, sanitizedFilename);
    const disabledPluginPath = `${currentPluginPath}.disabled`;
    const tempPluginPath = path.join(PLUGINS_DIR, `${sanitizedFilename}.tmp`);

    console.log(`[Plugin Update] Starting plugin update: ${sanitizedFilename}`);
    console.log(`[Plugin Update] Download URL: ${downloadUrl}`);

    // Step 1: Download plugin update to temporary file
    console.log('[Plugin Update] Downloading plugin...');
    try {
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download plugin: ${response.statusText}`);
      }
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      // Ensure plugins directory exists
      await fs.mkdir(PLUGINS_DIR, { recursive: true });
      
      // Stream the download to temporary file
      const fileStream = createWriteStream(tempPluginPath);
      await pipeline(response.body as any, fileStream);
      
      console.log('[Plugin Update] Download completed');
    } catch (error) {
      console.error('[Plugin Update] Error downloading plugin:', error);
      
      // Cleanup temp file if it exists
      try {
        await fs.unlink(tempPluginPath);
      } catch (e) {
        // Ignore
      }
      
      return res.status(500).json({
        error: 'Download failed',
        message: 'Could not download plugin update',
      });
    }

    // Check if server is running
    const serverRunning = await tmuxSessionExists(sessionName);
    console.log(`[Plugin Update] Server running: ${serverRunning}`);

    // Step 2: Stop server if running
    if (serverRunning) {
      console.log('[Plugin Update] Stopping server...');
      try {
        await sendCommandAndCapture(sessionName, 'stop', 3000);
        
        // Wait up to 30 seconds for server to stop
        let stopAttempts = 0;
        const maxStopAttempts = 30;
        
        while (stopAttempts < maxStopAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const stillRunning = await tmuxSessionExists(sessionName);
          
          if (!stillRunning) {
            console.log('[Plugin Update] Server stopped successfully');
            break;
          }
          
          stopAttempts++;
          
          if (stopAttempts >= maxStopAttempts) {
            throw new Error('Server failed to stop within 30 seconds');
          }
        }
      } catch (error) {
        console.error('[Plugin Update] Error stopping server:', error);
        
        // Cleanup temp file
        try {
          await fs.unlink(tempPluginPath);
        } catch (e) {
          console.error('[Plugin Update] Error removing temp file:', e);
        }
        
        return res.status(500).json({
          error: 'Server stop failed',
          message: 'Could not stop server gracefully',
        });
      }
    }

    // Step 3: Rename current plugin to .disabled
    console.log('[Plugin Update] Disabling current plugin...');
    try {
      // Check if current plugin exists
      try {
        await fs.access(currentPluginPath);
        // Rename to .disabled
        await fs.rename(currentPluginPath, disabledPluginPath);
        console.log('[Plugin Update] Current plugin disabled');
      } catch (error) {
        // Plugin doesn't exist, this is fine (might be a new installation)
        console.log('[Plugin Update] No existing plugin found (new installation)');
      }
    } catch (error) {
      console.error('[Plugin Update] Error disabling current plugin:', error);
      
      // Cleanup temp file
      try {
        await fs.unlink(tempPluginPath);
      } catch (e) {
        console.error('[Plugin Update] Error removing temp file:', e);
      }
      
      return res.status(500).json({
        error: 'Disable failed',
        message: 'Could not disable current plugin',
      });
    }

    // Step 4: Move new plugin into place
    console.log('[Plugin Update] Installing new plugin...');
    try {
      await fs.rename(tempPluginPath, currentPluginPath);
      console.log('[Plugin Update] New plugin installed');
    } catch (error) {
      console.error('[Plugin Update] Error installing new plugin:', error);
      
      // Rollback: restore disabled plugin
      try {
        await fs.access(disabledPluginPath);
        await fs.rename(disabledPluginPath, currentPluginPath);
        console.log('[Plugin Update] Rollback: Disabled plugin restored');
      } catch (e) {
        console.error('[Plugin Update] Error restoring disabled plugin:', e);
      }
      
      // Cleanup temp file
      try {
        await fs.unlink(tempPluginPath);
      } catch (e) {
        // Ignore
      }
      
      return res.status(500).json({
        error: 'Install failed',
        message: 'Could not install new plugin',
      });
    }

    // Step 5: Log activity
    await logActivity({
      userId: req.user.id,
      actionType: 'plugin_update',
      resource: 'plugin',
      details: {
        filename: sanitizedFilename,
        downloadUrl,
      },
      req,
    });

    // Step 6: Start server
    console.log('[Plugin Update] Starting server...');
    try {
      await executeScriptInTmux(sessionName, startScript, 3000);
      
      // Wait 15 seconds and verify server started
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      const serverStarted = await tmuxSessionExists(sessionName);
      
      if (!serverStarted) {
        throw new Error('Server failed to start');
      }
      
      console.log('[Plugin Update] Server started successfully');
      
      // Step 7: Remove disabled plugin (only .jar files, preserve configs)
      try {
        // Only remove if it has .disabled.jar extension
        if (disabledPluginPath.endsWith('.jar.disabled')) {
          await fs.unlink(disabledPluginPath);
          console.log('[Plugin Update] Old plugin removed');
        }
      } catch (error) {
        console.error('[Plugin Update] Error removing old plugin:', error);
        // Non-fatal, update was successful
      }
      
      return res.status(200).json({
        success: true,
        message: `Plugin ${sanitizedFilename} updated successfully`,
        filename: sanitizedFilename,
      });
    } catch (error) {
      console.error('[Plugin Update] Server start failed, initiating rollback:', error);
      
      // ROLLBACK: Remove new plugin, restore disabled, restart
      try {
        console.log('[Plugin Update] Rolling back to previous version...');
        
        // Remove new plugin
        try {
          await fs.unlink(currentPluginPath);
        } catch (e) {
          console.error('[Plugin Update] Error removing new plugin:', e);
        }
        
        // Restore disabled plugin
        try {
          await fs.access(disabledPluginPath);
          await fs.rename(disabledPluginPath, currentPluginPath);
          console.log('[Plugin Update] Disabled plugin restored');
        } catch (e) {
          console.error('[Plugin Update] Error restoring disabled plugin:', e);
        }
        
        // Start server with old plugin
        await executeScriptInTmux(sessionName, startScript, 3000);
        
        // Wait and verify
        await new Promise(resolve => setTimeout(resolve, 15000));
        const serverStarted = await tmuxSessionExists(sessionName);
        
        console.log(`[Plugin Update] Rollback completed, server started: ${serverStarted}`);
        
        return res.status(500).json({
          error: 'Update failed',
          message: 'Server failed to start with new plugin. Rolled back to previous version.',
          rollback: true,
        });
      } catch (rollbackError) {
        console.error('[Plugin Update] Rollback failed:', rollbackError);
        return res.status(500).json({
          error: 'Update and rollback failed',
          message: 'Critical error: Plugin update failed and rollback also failed. Manual intervention required.',
          rollback: false,
        });
      }
    }
  } catch (error) {
    console.error('Error deploying plugin update:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to deploy plugin update',
    });
  }
}

export default withAdmin(handler);
