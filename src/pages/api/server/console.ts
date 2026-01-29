/**
 * Server Console API
 * 
 * Provides endpoints for executing Minecraft server commands via tmux
 * and retrieving command history
 */

import { NextApiResponse } from 'next';
import { withAdmin, AuthenticatedRequest } from '@/lib/middleware';
import { sendCommandAndCapture, tmuxSessionExists } from '@/lib/console';
import { logActivity } from '@/lib/activity';
import prisma from '@/lib/prisma';
import { ADMIN_ALLOWED_COMMANDS, MAX_COMMAND_LENGTH } from '@/lib/console-constants';

/**
 * Check if a command is allowed for the given user role
 */
function isCommandAllowed(command: string, userRole: string): { allowed: boolean; reason?: string } {
  const trimmedCommand = command.trim();
  
  if (!trimmedCommand) {
    return { allowed: false, reason: 'Command cannot be empty' };
  }

  // Check command length
  if (trimmedCommand.length > MAX_COMMAND_LENGTH) {
    return { 
      allowed: false, 
      reason: `Command exceeds maximum length of ${MAX_COMMAND_LENGTH} characters` 
    };
  }

  // Super Admins can execute any command
  if (userRole === 'Super Admin') {
    return { allowed: true };
  }

  // For Admins, check if the command is in the allowed list
  // Extract the base command (first word)
  const baseCommand = trimmedCommand.split(/\s+/)[0].toLowerCase();

  const isAllowed = ADMIN_ALLOWED_COMMANDS.some(
    allowedCmd => baseCommand === allowedCmd.toLowerCase()
  );

  if (!isAllowed) {
    return {
      allowed: false,
      reason: `Command '${baseCommand}' is not allowed for Admin role. Only Super Admins can execute this command.`
    };
  }

  return { allowed: true };
}

/**
 * POST /api/server/console
 * Execute a command on the Minecraft server
 */
async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { command } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Command is required and must be a string'
      });
    }

    // Check if command is allowed for user's role
    const { allowed, reason } = isCommandAllowed(command, req.user.role);
    if (!allowed) {
      // Log the denied attempt
      await logActivity({
        userId: req.user.id,
        actionType: 'server_command',
        resource: 'console',
        details: {
          command,
          status: 'denied',
          reason
        },
        req
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: reason || 'You do not have permission to execute this command'
      });
    }

    // Get the server session name from environment
    const serverSession = process.env.MINECRAFT_SERVER_SESSION || 'minecraft-server';

    // Check if tmux session exists
    const sessionExists = await tmuxSessionExists(serverSession);
    if (!sessionExists) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: `Minecraft server tmux session '${serverSession}' not found. Make sure the server is running.`
      });
    }

    // Execute the command and capture output
    const output = await sendCommandAndCapture(serverSession, command);

    // Log the command execution
    await logActivity({
      userId: req.user.id,
      actionType: 'server_command',
      resource: 'console',
      details: {
        command,
        status: 'executed',
        outputLength: output.length
      },
      req
    });

    return res.status(200).json({
      success: true,
      command,
      output,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing server command:', error);
    
    // Log the error
    if (req.body?.command) {
      await logActivity({
        userId: req.user.id,
        actionType: 'server_command',
        resource: 'console',
        details: {
          command: req.body.command,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        req
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to execute command'
    });
  }
}

/**
 * GET /api/server/console
 * Get command history from activity logs
 */
async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { limit = '50', page = '1' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    const pageNum = parseInt(page as string, 10);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Limit must be between 1 and 100'
      });
    }

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Page must be greater than 0'
      });
    }

    const skip = (pageNum - 1) * limitNum;

    // Fetch command history from activity logs
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          actionType: 'server_command',
          resource: 'console'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.activityLog.count({
        where: {
          actionType: 'server_command',
          resource: 'console'
        }
      })
    ]);

    // Parse details JSON for each log
    const parsedLogs = logs.map(log => {
      let details = null;
      if (log.details) {
        try {
          details = JSON.parse(log.details);
        } catch (e) {
          console.error('Failed to parse log details:', e);
          details = { error: 'Failed to parse details' };
        }
      }
      return {
        id: log.id,
        user: log.user,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
        details
      };
    });

    return res.status(200).json({
      logs: parsedLogs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching command history:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch command history'
    });
  }
}

/**
 * API Route Handler
 * Only Admins and Super Admins can access this endpoint
 */
export default withAdmin(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    return handlePost(req, res);
  } else if (req.method === 'GET') {
    return handleGet(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: `Method ${req.method} is not allowed for this endpoint`
    });
  }
});
