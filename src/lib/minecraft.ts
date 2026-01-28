/**
 * Minecraft Server Integration Utilities
 * Provides functions to interact with Minecraft servers and retrieve player data
 */

import { tmuxSessionExists, sendCommandAndCapture } from './console';

/**
 * Get current player count from Minecraft server
 * Sends a 'list' command to the server console and parses the response
 * 
 * @param serverName - Name of the tmux session running the server
 * @returns Promise<number> - Number of online players, or 0 if unable to fetch
 */
export async function getPlayerCount(serverName: string = process.env.MINECRAFT_SERVER_SESSION || 'minecraft-server'): Promise<number> {
  try {
    console.log(`[Minecraft] Fetching player count for server: ${serverName}`);
    
    // Check if the server tmux session exists
    const sessionExists = await tmuxSessionExists(serverName);
    if (!sessionExists) {
      console.log(`[Minecraft] Server session '${serverName}' not found. Server is likely offline.`);
      return 0;
    }
    
    console.log(`[Minecraft] Server session exists, sending 'list' command...`);
    
    // Send 'list' command to get online players
    // Minecraft outputs something like: "There are 3 of a max of 20 players online: Player1, Player2, Player3"
    const output = await sendCommandAndCapture(serverName, 'list', 1500);
    
    if (!output) {
      console.log(`[Minecraft] No output received from server. Server may be starting or unresponsive.`);
      return 0;
    }
    
    console.log(`[Minecraft] Raw output received (last 200 chars): ${output.slice(-200)}`);
    
    // Parse the output to extract player count
    // Look for patterns like "There are X of" or "X players online" or "players online: X"
    const playerCount = parsePlayerCountFromOutput(output);
    
    console.log(`[Minecraft] Parsed player count: ${playerCount}`);
    return playerCount;
    
  } catch (error) {
    console.error('[Minecraft] Error fetching player count:', error);
    return 0;
  }
}

/**
 * Parse player count from Minecraft console output
 * Handles various output formats from different Minecraft versions
 * 
 * @param output - Raw console output
 * @returns number - Extracted player count, or 0 if unable to parse
 */
function parsePlayerCountFromOutput(output: string): number {
  try {
    // Pattern 1: "There are X of a max of Y players online"
    const pattern1 = /There are (\d+) of a max (?:of )?(\d+) players online/i;
    const match1 = output.match(pattern1);
    if (match1) {
      return parseInt(match1[1], 10);
    }
    
    // Pattern 2: "There are X/Y players online"
    const pattern2 = /There are (\d+)\/(\d+) players online/i;
    const match2 = output.match(pattern2);
    if (match2) {
      return parseInt(match2[1], 10);
    }
    
    // Pattern 3: "X players online" or "players online: X"
    const pattern3 = /(\d+) players? online/i;
    const match3 = output.match(pattern3);
    if (match3) {
      return parseInt(match3[1], 10);
    }
    
    // Pattern 4: Look for last occurrence of "online:" followed by player names
    // Format: "players online: Player1, Player2" or "online: Player1, Player2"
    const pattern4 = /online:\s*([^\n]*)/i;
    const match4 = output.match(pattern4);
    if (match4) {
      const playerList = match4[1].trim();
      // If empty, 0 players
      if (!playerList || playerList === '') {
        return 0;
      }
      // Count comma-separated names
      const players = playerList.split(',').filter(p => p.trim() !== '');
      return players.length;
    }
    
    console.log('[Minecraft] Could not parse player count from output, returning 0');
    return 0;
  } catch (error) {
    console.error('[Minecraft] Error parsing player count:', error);
    return 0;
  }
}

/**
 * Get list of online players from Minecraft server
 * Sends a 'list' command and parses player names
 * 
 * @param serverName - Name of the tmux session running the server
 * @returns Promise<string[]> - Array of player names
 */
export async function getOnlinePlayers(serverName: string = process.env.MINECRAFT_SERVER_SESSION || 'minecraft-server'): Promise<string[]> {
  try {
    console.log(`[Minecraft] Fetching online players for server: ${serverName}`);
    
    // Check if the server tmux session exists
    const sessionExists = await tmuxSessionExists(serverName);
    if (!sessionExists) {
      console.log(`[Minecraft] Server session '${serverName}' not found. Server is offline.`);
      return [];
    }
    
    // Send 'list' command
    const output = await sendCommandAndCapture(serverName, 'list', 1500);
    
    if (!output) {
      console.log(`[Minecraft] No output received from server.`);
      return [];
    }
    
    // Parse player names from output
    // Look for "online: Player1, Player2, Player3" or similar
    const players = parsePlayerNamesFromOutput(output);
    
    console.log(`[Minecraft] Found ${players.length} online players: ${players.join(', ')}`);
    return players;
    
  } catch (error) {
    console.error('[Minecraft] Error fetching online players:', error);
    return [];
  }
}

/**
 * Parse player names from Minecraft console output
 * 
 * @param output - Raw console output
 * @returns string[] - Array of player names
 */
function parsePlayerNamesFromOutput(output: string): string[] {
  try {
    // Look for "online: Player1, Player2" pattern
    const pattern = /online:\s*([^\n]*)/i;
    const match = output.match(pattern);
    
    if (match) {
      const playerList = match[1].trim();
      if (!playerList || playerList === '') {
        return [];
      }
      
      // Split by comma and clean up whitespace
      const players = playerList
        .split(',')
        .map(p => p.trim())
        .filter(p => p !== '');
      
      return players;
    }
    
    return [];
  } catch (error) {
    console.error('[Minecraft] Error parsing player names:', error);
    return [];
  }
}

/**
 * Get server status information
 * Checks if server is running and retrieves basic information
 * 
 * @param serverName - Name of the tmux session running the server
 * @returns Promise<ServerStatus> - Server status information
 */
export async function getServerStatus(serverName: string = process.env.MINECRAFT_SERVER_SESSION || 'minecraft-server'): Promise<{
  online: boolean;
  playerCount: number;
  maxPlayers: number;
  version: string;
}> {
  try {
    console.log(`[Minecraft] Checking server status for: ${serverName}`);
    
    // Check if the server tmux session exists
    const sessionExists = await tmuxSessionExists(serverName);
    
    if (!sessionExists) {
      console.log(`[Minecraft] Server session '${serverName}' does not exist. Server is OFFLINE.`);
      return {
        online: false,
        playerCount: 0,
        maxPlayers: 0,
        version: 'Unknown',
      };
    }
    
    console.log(`[Minecraft] Server session exists. Verifying server is responsive...`);
    
    // Try to get player count - this verifies the server is actually responsive
    // Send the list command and see if we get output
    const output = await sendCommandAndCapture(serverName, 'list', 1500);
    
    // If we got no output, the server process might be frozen or starting
    if (!output) {
      console.log(`[Minecraft] Server session exists but not responsive. Server may be starting or frozen.`);
      return {
        online: false,
        playerCount: 0,
        maxPlayers: 0,
        version: 'Unknown',
      };
    }
    
    // Parse the player count from the output
    const playerCount = parsePlayerCountFromOutput(output);
    
    // If we successfully got and parsed output, server is online and responsive
    console.log(`[Minecraft] Server is ONLINE and responsive with ${playerCount} players`);
    
    return {
      online: true,
      playerCount,
      maxPlayers: 20, // Default max, could be parsed from server.properties
      version: '1.20+', // Could be parsed from server logs or properties
    };
    
  } catch (error) {
    console.error('[Minecraft] Error fetching server status:', error);
    return {
      online: false,
      playerCount: 0,
      maxPlayers: 0,
      version: 'Unknown',
    };
  }
}
