/**
 * Server Update API Endpoint
 * POST /apanel44/api/server/update
 * 
 * Deploys PaperMC server updates with automatic rollback on failure
 */

import { NextApiResponse } from 'next';
import { withSuperAdmin, AuthenticatedRequest } from '@/lib/middleware';
import { logActivity } from '@/lib/activity';
import { downloadBuild, getCurrentJarFilename, resolveServerDir } from '@/lib/papermc';
import { getServerInstance } from '@/lib/serverInstances';
import { tmuxSessionExists, sendCommandAndCapture, executeScriptInTmux } from '@/lib/console';
import path from 'path';
import fs from 'fs/promises';

interface UpdateRequestBody {
  targetBuild: number;
  instanceId?: string;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { targetBuild, instanceId } = req.body as UpdateRequestBody;

    if (!targetBuild || typeof targetBuild !== 'number') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'targetBuild is required and must be a number',
      });
    }

    // Resolve all paths/sessions from the selected server instance (dev/live)
    // so the update targets the right server.
    const instance = getServerInstance(instanceId);
    const serverDir = resolveServerDir(instanceId);
    const sessionName =
      instance?.tmuxSession ||
      process.env.TMUX_SESSION_NAME ||
      process.env.MINECRAFT_SERVER_SESSION ||
      'minecraft';
    const startScript = instance?.startScript || process.env.MINECRAFT_START_SCRIPT || './start.sh';

    // Get current jar filename
    const currentJar = await getCurrentJarFilename(instanceId);
    if (!currentJar) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Could not find current server jar file',
      });
    }

    const currentJarPath = path.join(serverDir, currentJar);
    const backupJarPath = `${currentJarPath}.backup`;

    // Parse current version from jar filename
    const versionMatch = currentJar.match(/^paper-(.+)-(\d+)\.jar$/);
    if (!versionMatch) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Could not parse current server version',
      });
    }

    const mcVersion = versionMatch[1];
    const newJarFilename = `paper-${mcVersion}-${targetBuild}.jar`;
    const newJarPath = path.join(serverDir, newJarFilename);

    console.log(`[Update] Starting server update to build ${targetBuild}`);
    console.log(`[Update] Current jar: ${currentJar}`);
    console.log(`[Update] New jar: ${newJarFilename}`);

    // Check if server is running
    const serverRunning = await tmuxSessionExists(sessionName);
    console.log(`[Update] Server running: ${serverRunning}`);

    // Step 1: Stop server if running
    if (serverRunning) {
      console.log('[Update] Stopping server...');
      try {
        await sendCommandAndCapture(sessionName, 'stop', 3000);
        
        // Wait up to 30 seconds for server to stop
        let stopAttempts = 0;
        const maxStopAttempts = 30;
        
        while (stopAttempts < maxStopAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const stillRunning = await tmuxSessionExists(sessionName);
          
          if (!stillRunning) {
            console.log('[Update] Server stopped successfully');
            break;
          }
          
          stopAttempts++;
          
          if (stopAttempts >= maxStopAttempts) {
            throw new Error('Server failed to stop within 30 seconds');
          }
        }
      } catch (error) {
        console.error('[Update] Error stopping server:', error);
        return res.status(500).json({
          error: 'Server stop failed',
          message: 'Could not stop server gracefully',
        });
      }
    }

    // Step 2: Backup current jar
    console.log('[Update] Backing up current jar...');
    try {
      await fs.copyFile(currentJarPath, backupJarPath);
      console.log('[Update] Backup created successfully');
    } catch (error) {
      console.error('[Update] Error creating backup:', error);
      return res.status(500).json({
        error: 'Backup failed',
        message: 'Could not create backup of current jar',
      });
    }

    // Step 3: Download new build
    console.log('[Update] Downloading new build...');
    try {
      await downloadBuild(mcVersion, targetBuild, newJarPath);
      console.log('[Update] Download completed');
    } catch (error) {
      console.error('[Update] Error downloading build:', error);
      
      // Cleanup: remove backup
      try {
        await fs.unlink(backupJarPath);
      } catch (e) {
        console.error('[Update] Error removing backup:', e);
      }
      
      return res.status(500).json({
        error: 'Download failed',
        message: 'Could not download new server build',
      });
    }

    // Step 4: Remove old jar (only if download succeeded)
    console.log('[Update] Removing old jar...');
    try {
      await fs.unlink(currentJarPath);
      console.log('[Update] Old jar removed');
    } catch (error) {
      console.error('[Update] Error removing old jar:', error);
      // Non-fatal, continue
    }

    // Step 5: Log activity
    await logActivity({
      userId: req.user.id,
      actionType: 'server_update',
      resource: 'papermc_server',
      instanceId,
      details: {
        mcVersion,
        fromBuild: parseInt(versionMatch[2], 10),
        toBuild: targetBuild,
        filename: newJarFilename,
        instanceId,
      },
      req,
    });

    // Step 6: Start server with new jar
    console.log('[Update] Starting server with new jar...');
    try {
      // Create new tmux session and start server
      await executeScriptInTmux(sessionName, startScript, 3000);
      
      // Wait 10 seconds and verify server started
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const serverStarted = await tmuxSessionExists(sessionName);
      
      if (!serverStarted) {
        throw new Error('Server failed to start');
      }
      
      console.log('[Update] Server started successfully');
      
      // Step 7: Remove backup (update successful)
      try {
        await fs.unlink(backupJarPath);
        console.log('[Update] Backup removed');
      } catch (error) {
        console.error('[Update] Error removing backup:', error);
        // Non-fatal, update was successful
      }
      
      return res.status(200).json({
        success: true,
        message: `Server updated to build ${targetBuild} successfully`,
        version: {
          mcVersion,
          build: targetBuild,
          filename: newJarFilename,
        },
      });
    } catch (error) {
      console.error('[Update] Server start failed, initiating rollback:', error);
      
      // ROLLBACK: Restore backup and restart with old version
      try {
        console.log('[Update] Rolling back to previous version...');
        
        // Remove failed new jar
        try {
          await fs.unlink(newJarPath);
        } catch (e) {
          console.error('[Update] Error removing failed jar:', e);
        }
        
        // Restore backup
        await fs.copyFile(backupJarPath, currentJarPath);
        console.log('[Update] Backup restored');
        
        // Remove backup
        await fs.unlink(backupJarPath);
        
        // Start server with old jar
        await executeScriptInTmux(sessionName, startScript, 3000);
        
        // Wait and verify
        await new Promise(resolve => setTimeout(resolve, 10000));
        const serverStarted = await tmuxSessionExists(sessionName);
        
        console.log(`[Update] Rollback completed, server started: ${serverStarted}`);
        
        return res.status(500).json({
          error: 'Update failed',
          message: 'Server failed to start with new version. Rolled back to previous version.',
          rollback: true,
        });
      } catch (rollbackError) {
        console.error('[Update] Rollback failed:', rollbackError);
        return res.status(500).json({
          error: 'Update and rollback failed',
          message: 'Critical error: Server update failed and rollback also failed. Manual intervention required.',
          rollback: false,
        });
      }
    }
  } catch (error) {
    console.error('Error updating server:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to update server',
    });
  }
}

export default withSuperAdmin(handler);
