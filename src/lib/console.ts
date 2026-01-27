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
