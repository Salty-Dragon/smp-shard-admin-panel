/**
 * Server Console Management Utilities
 * Uses node-pty to interact with tmux sessions for Minecraft server console
 * 
 * This module provides functions for:
 * - Creating new tmux sessions for servers
 * - Sending commands to server console
 * - Reading console output
 * - Managing multiple server instances
 * 
 * Note: This requires tmux to be installed on the system
 */

import * as pty from 'node-pty';
import { IPty } from 'node-pty';
import { exec } from 'child_process';

// Store active PTY instances
const activeSessions: Map<string, IPty> = new Map();

/**
 * Create a new tmux session for a Minecraft server
 * 
 * @param serverName - Unique identifier for the server
 * @param serverPath - Path to the server directory
 * @returns Promise<boolean> - True if session was created successfully
 */
export async function createServerSession(
  serverName: string,
  serverPath: string
): Promise<boolean> {
  try {
    // Check if session already exists
    if (activeSessions.has(serverName)) {
      console.warn(`Session ${serverName} already exists`);
      return false;
    }

    // Create a new PTY process with tmux
    const ptyProcess = pty.spawn('tmux', ['new-session', '-s', serverName], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: serverPath,
      env: process.env as { [key: string]: string },
    });

    // Store the PTY instance
    activeSessions.set(serverName, ptyProcess);

    // Set up data handler for console output
    ptyProcess.onData((data) => {
      // You can implement logging or real-time console streaming here
      console.log(`[${serverName}] ${data}`);
    });

    return true;
  } catch (error) {
    console.error(`Error creating server session ${serverName}:`, error);
    return false;
  }
}

/**
 * Send a command to a server console via tmux
 * 
 * @param serverName - Server identifier
 * @param command - Command to execute
 * @returns boolean - True if command was sent successfully
 */
export function sendCommand(serverName: string, command: string): boolean {
  try {
    const session = activeSessions.get(serverName);

    if (!session) {
      console.error(`Session ${serverName} not found`);
      return false;
    }

    // Send command to the PTY
    session.write(command + '\r');
    return true;
  } catch (error) {
    console.error(`Error sending command to ${serverName}:`, error);
    return false;
  }
}

/**
 * Close a server session
 * 
 * @param serverName - Server identifier
 * @returns boolean - True if session was closed successfully
 */
export function closeSession(serverName: string): boolean {
  try {
    const session = activeSessions.get(serverName);

    if (!session) {
      console.warn(`Session ${serverName} not found`);
      return false;
    }

    // Kill the PTY process
    session.kill();
    activeSessions.delete(serverName);

    return true;
  } catch (error) {
    console.error(`Error closing session ${serverName}:`, error);
    return false;
  }
}

/**
 * List all active server sessions
 * 
 * @returns string[] - Array of active server names
 */
export function listActiveSessions(): string[] {
  return Array.from(activeSessions.keys());
}

/**
 * Check if a server session is active
 * 
 * @param serverName - Server identifier
 * @returns boolean - True if session exists
 */
export function isSessionActive(serverName: string): boolean {
  return activeSessions.has(serverName);
}

/**
 * Attach to an existing tmux session
 * 
 * @param serverName - Server identifier
 * @returns Promise<boolean> - True if attached successfully
 */
export async function attachToSession(serverName: string): Promise<boolean> {
  try {
    // Check if we already have this session
    if (activeSessions.has(serverName)) {
      console.log(`Already attached to session ${serverName}`);
      return true;
    }

    // Attach to existing tmux session
    const ptyProcess = pty.spawn('tmux', ['attach-session', '-t', serverName], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      env: process.env as { [key: string]: string },
    });

    activeSessions.set(serverName, ptyProcess);

    ptyProcess.onData((data) => {
      console.log(`[${serverName}] ${data}`);
    });

    return true;
  } catch (error) {
    console.error(`Error attaching to session ${serverName}:`, error);
    return false;
  }
}

/**
 * Sanitize session name to prevent command injection
 * Only allows alphanumeric characters, dashes, and underscores
 * 
 * @param name - Session name to sanitize
 * @returns string - Sanitized session name
 * @throws Error if name contains invalid characters
 */
function sanitizeSessionName(name: string): string {
  // Only allow alphanumeric, dash, and underscore
  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '');
  
  if (sanitized !== name) {
    throw new Error(`Invalid session name: "${name}". Only alphanumeric characters, dashes, and underscores are allowed.`);
  }
  
  if (sanitized.length === 0) {
    throw new Error('Session name cannot be empty after sanitization');
  }
  
  return sanitized;
}

/**
 * Check if a tmux session exists using system command
 * This is more reliable than checking the activeSessions map
 * 
 * @param serverName - Server identifier
 * @returns Promise<boolean> - True if tmux session exists
 */
export async function tmuxSessionExists(serverName: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Sanitize session name to prevent command injection
      const safeName = sanitizeSessionName(serverName);
      
      // Use tmux has-session to check if session exists
      // Exit code 0 means session exists, non-zero means it doesn't
      exec(`tmux has-session -t ${safeName} 2>/dev/null`, (error: Error | null) => {
        resolve(error === null);
      });
    } catch (error) {
      console.error(`Error checking tmux session ${serverName}:`, error);
      resolve(false);
    }
  });
}

/**
 * Sanitize command string to prevent command injection
 * Escapes special shell characters
 * 
 * @param command - Command to sanitize
 * @returns string - Sanitized command
 */
function sanitizeCommand(command: string): string {
  // Escape single quotes by replacing ' with '\''
  return command.replace(/'/g, "'\\''");
}

/**
 * Send command to tmux session and capture output
 * This sends a command and attempts to read the console output
 * 
 * @param serverName - Server identifier  
 * @param command - Command to execute
 * @param timeoutMs - How long to wait for output (default: 2000ms)
 * @returns Promise<string> - Captured output from command
 */
export async function sendCommandAndCapture(
  serverName: string,
  command: string,
  timeoutMs: number = 2000
): Promise<string> {
  return new Promise((resolve) => {
    try {
      // Sanitize inputs to prevent command injection
      const safeName = sanitizeSessionName(serverName);
      const safeCommand = sanitizeCommand(command);
      
      // Use tmux capture-pane to get console output
      // Use single quotes around command to prevent shell expansion
      const captureCommand = `tmux send-keys -t ${safeName} '${safeCommand}' C-m 2>/dev/null && sleep ${timeoutMs / 1000} && tmux capture-pane -t ${safeName} -p 2>/dev/null`;
      
      exec(captureCommand, { maxBuffer: 1024 * 1024 }, (error: Error | null, stdout: string) => {
        if (error) {
          console.error(`Error capturing output from ${serverName}:`, error);
          resolve('');
          return;
        }
        
        // Return the captured output
        resolve(stdout || '');
      });
    } catch (error) {
      console.error(`Error in sendCommandAndCapture for ${serverName}:`, error);
      resolve('');
    }
  });
}

/**
 * Execute a shell script in the tmux session
 * This is used for special commands like "start" that need to run shell scripts
 * 
 * @param serverName - Server identifier
 * @param scriptPath - Path to the script to execute (e.g., "./start.sh")
 * @param timeoutMs - How long to wait for output (default: 2000ms)
 * @returns Promise<string> - Captured output from script execution
 */
export async function executeScriptInTmux(
  serverName: string,
  scriptPath: string,
  timeoutMs: number = 2000
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Sanitize session name
      const safeName = sanitizeSessionName(serverName);
      
      // Validate script path - must start with ./ and contain only safe characters
      // Only allow single-level relative paths (no directory traversal)
      if (!scriptPath.match(/^\.\/[a-zA-Z0-9_\-\.]+$/)) {
        const error = `Invalid script path: ${scriptPath}. Must start with ./ and contain only alphanumeric characters, dashes, underscores, and dots.`;
        console.error(error);
        reject(new Error(error));
        return;
      }
      
      // Validate timeout is a reasonable positive number
      if (!Number.isFinite(timeoutMs) || timeoutMs < 0 || timeoutMs > 60000) {
        const error = `Invalid timeout: ${timeoutMs}. Must be between 0 and 60000ms.`;
        console.error(error);
        reject(new Error(error));
        return;
      }
      
      // Sanitize the script path using the same approach as commands
      const safeScript = sanitizeCommand(scriptPath);
      
      // Send the script execution command to tmux
      const captureCommand = `tmux send-keys -t ${safeName} '${safeScript}' C-m 2>/dev/null && sleep ${timeoutMs / 1000} && tmux capture-pane -t ${safeName} -p 2>/dev/null`;
      
      exec(captureCommand, { maxBuffer: 1024 * 1024 }, (error: Error | null, stdout: string) => {
        if (error) {
          console.error(`Error executing script in ${serverName}:`, error);
          reject(error);
          return;
        }
        
        // Return the captured output
        resolve(stdout || '');
      });
    } catch (error) {
      console.error(`Error in executeScriptInTmux for ${serverName}:`, error);
      reject(error instanceof Error ? error : new Error('Unknown error'));
    }
  });
}

/**
 * Handle server restart by stopping and then starting
 * This is safer than using the built-in restart command which breaks tmux
 * 
 * @param serverName - Server identifier
 * @param startScript - Path to the start script (default from env or constant)
 * @param waitTimeMs - Time to wait after stop before starting (default from constant)
 * @returns Promise<{success: boolean, message: string}> - Status of the restart operation
 */
export async function restartServer(
  serverName: string,
  startScript?: string,
  waitTimeMs?: number
): Promise<{success: boolean, message: string}> {
  try {
    // Get start script from parameter, environment variable, or use default
    const scriptPath = startScript || process.env.MINECRAFT_START_SCRIPT || './start.sh';
    
    // Import wait time constant
    const { RESTART_WAIT_MS } = await import('./console-constants');
    const waitTime = waitTimeMs || RESTART_WAIT_MS;
    
    console.log(`[Console] Initiating server restart for ${serverName}`);
    console.log(`[Console] Using start script: ${scriptPath}`);
    console.log(`[Console] Wait time: ${waitTime}ms`);
    
    // First, send the stop command to the server
    console.log('[Console] Sending stop command...');
    try {
      await sendCommandAndCapture(serverName, 'stop', 3000);
    } catch (error) {
      console.error('[Console] Error sending stop command:', error);
      return {
        success: false,
        message: 'Failed to send stop command to server'
      };
    }
    
    // Wait for the server to fully stop (give it time to save and shut down)
    console.log(`[Console] Waiting ${waitTime}ms for server to stop...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Now execute the start script
    console.log('[Console] Executing start script...');
    try {
      await executeScriptInTmux(serverName, scriptPath, 3000);
      console.log('[Console] Restart sequence completed successfully');
      return {
        success: true,
        message: `Server restart initiated: Stop command sent, waited ${waitTime}ms, then started with ${scriptPath}`
      };
    } catch (error) {
      console.error('[Console] Error executing start script:', error);
      return {
        success: false,
        message: `Stop command succeeded, but failed to execute start script: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  } catch (error) {
    console.error(`Error restarting server ${serverName}:`, error);
    return {
      success: false,
      message: `Error during restart: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
