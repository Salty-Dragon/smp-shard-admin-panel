/**
 * PaperMC Version Management Library
 * 
 * Handles fetching, comparing, and downloading PaperMC server versions
 */

import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { getServerInstance } from './serverInstances';

// Last-resort fallback if no instances and no SERVER_DIR are configured.
const DEFAULT_SERVER_DIR = '/opt/minecraft/server';

/**
 * Resolve the server directory for a given instance.
 *
 * Prefers the selected server instance's path (e.g. /opt/minecraft/dev or
 * /opt/minecraft/live), falling back to legacy SERVER_DIR, then the default.
 *
 * @param instanceId - Server instance ID (optional, uses default instance)
 * @returns Absolute path to the server directory
 */
export function resolveServerDir(instanceId?: string): string {
  const instance = getServerInstance(instanceId);
  return instance?.serverPath || process.env.SERVER_DIR || DEFAULT_SERVER_DIR;
}

export interface PaperMCVersion {
  currentVersion: string;
  currentBuild: number;
  latestVersion: string;
  latestBuild: number;
  updateAvailable: boolean;
  mcVersion: string;
}

/**
 * Fetch available builds for a specific Minecraft version from PaperMC API
 * 
 * @param mcVersion - Minecraft version (e.g., "1.21.1")
 * @returns Promise<number[]> - Array of available build numbers
 */
async function fetchAvailableBuilds(mcVersion: string): Promise<number[]> {
  try {
    const response = await fetch(
      `https://api.papermc.io/v2/projects/paper/versions/${mcVersion}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch builds for version ${mcVersion}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.builds || [];
  } catch (error) {
    console.error('Error fetching available builds:', error);
    throw error;
  }
}

/**
 * Parse current server version from version_history.json
 * 
 * @param serverDir - Server directory path
 * @returns Promise<{version: string, build: number} | null> - Current version info or null
 */
async function parseVersionFromHistory(
  serverDir: string
): Promise<{ version: string; build: number } | null> {
  try {
    const historyPath = path.join(serverDir, 'version_history.json');
    const historyData = await fs.readFile(historyPath, 'utf-8');
    const history = JSON.parse(historyData);

    const raw = history.currentVersion;
    if (typeof raw !== 'string') {
      return null;
    }

    // Modern Paper format: "1.21.11-127-bd74bf6 (MC: 1.21.11)"
    //   mcVersion comes from the "(MC: ...)" suffix; build is the number between
    //   the version and the commit hash.
    const mcMatch = raw.match(/\(MC:\s*([^)]+)\)/);
    const buildMatch = raw.match(/-(\d+)-[0-9a-fA-F]+\s*\(MC:/);
    if (mcMatch && buildMatch) {
      return {
        version: mcMatch[1].trim(),
        build: parseInt(buildMatch[1], 10),
      };
    }

    // Legacy/simple format: "1.21.1-123" -> version: "1.21.1", build: 123
    const simple = raw.match(/^(.+)-(\d+)$/);
    if (simple) {
      return {
        version: simple[1],
        build: parseInt(simple[2], 10),
      };
    }

    return null;
  } catch (error) {
    // File might not exist
    console.log('Version history file not found:', error);
    return null;
  }
}

/**
 * Parse current server version from jar filename
 * 
 * @param serverDir - Server directory path
 * @returns Promise<{version: string, build: number} | null> - Current version info or null
 */
async function parseVersionFromJarFilename(
  serverDir: string
): Promise<{ version: string; build: number } | null> {
  try {
    const files = await fs.readdir(serverDir);
    
    // Look for paper jar file (e.g., paper-1.21.1-123.jar)
    const paperJar = files.find((file) => 
      file.startsWith('paper-') && file.endsWith('.jar') && !file.endsWith('.backup')
    );
    
    if (!paperJar) {
      return null;
    }
    
    // Parse filename (paper-{mcVersion}-{build}.jar)
    const match = paperJar.match(/^paper-(.+)-(\d+)\.jar$/);
    if (match) {
      return {
        version: match[1],
        build: parseInt(match[2], 10),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing version from jar filename:', error);
    return null;
  }
}

/**
 * Get current server version information
 *
 * @param instanceId - Server instance ID (optional, uses default instance)
 * @returns Promise<{version: string, build: number} | null> - Current version info or null
 */
export async function getCurrentVersion(
  instanceId?: string
): Promise<{ version: string; build: number } | null> {
  const dir = resolveServerDir(instanceId);

  // Try version_history.json first
  let versionInfo = await parseVersionFromHistory(dir);
  
  // If not found, try parsing from jar filename
  if (!versionInfo) {
    versionInfo = await parseVersionFromJarFilename(dir);
  }
  
  return versionInfo;
}

/**
 * Get latest available build for a specific Minecraft version
 * 
 * @param mcVersion - Minecraft version (e.g., "1.21.1")
 * @returns Promise<number> - Latest build number
 */
export async function getLatestBuild(mcVersion: string): Promise<number> {
  const builds = await fetchAvailableBuilds(mcVersion);
  
  if (builds.length === 0) {
    throw new Error(`No builds found for version ${mcVersion}`);
  }
  
  // Return the highest build number
  return Math.max(...builds);
}

/**
 * Check for server updates
 *
 * @param instanceId - Server instance ID (optional, uses default instance)
 * @returns Promise<PaperMCVersion> - Version information with update status
 */
export async function checkForUpdates(instanceId?: string): Promise<PaperMCVersion> {
  const currentVersion = await getCurrentVersion(instanceId);
  
  if (!currentVersion) {
    throw new Error('Could not determine current server version');
  }
  
  const latestBuild = await getLatestBuild(currentVersion.version);
  
  return {
    currentVersion: currentVersion.version,
    currentBuild: currentVersion.build,
    latestVersion: currentVersion.version, // Same MC version
    latestBuild: latestBuild,
    updateAvailable: latestBuild > currentVersion.build,
    mcVersion: currentVersion.version,
  };
}

/**
 * Download a specific PaperMC build
 * 
 * @param mcVersion - Minecraft version (e.g., "1.21.1")
 * @param build - Build number
 * @param outputPath - Path where the jar should be saved
 * @returns Promise<void>
 */
export async function downloadBuild(
  mcVersion: string,
  build: number,
  outputPath: string
): Promise<void> {
  try {
    const downloadUrl = `https://api.papermc.io/v2/projects/paper/versions/${mcVersion}/builds/${build}/downloads/paper-${mcVersion}-${build}.jar`;
    
    console.log(`Downloading PaperMC build ${build} for version ${mcVersion}...`);
    console.log(`URL: ${downloadUrl}`);
    console.log(`Output: ${outputPath}`);
    
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download build: ${response.statusText}`);
    }
    
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Stream the download to file
    const fileStream = createWriteStream(outputPath);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await pipeline(response.body as any, fileStream);
    
    console.log(`Download completed: ${outputPath}`);
  } catch (error) {
    console.error('Error downloading build:', error);
    throw error;
  }
}

/**
 * Get the current jar filename
 *
 * @param instanceId - Server instance ID (optional, uses default instance)
 * @returns Promise<string | null> - Current jar filename or null
 */
export async function getCurrentJarFilename(instanceId?: string): Promise<string | null> {
  const dir = resolveServerDir(instanceId);

  try {
    const files = await fs.readdir(dir);
    
    // Look for paper jar file (e.g., paper-1.21.1-123.jar)
    const paperJar = files.find((file) => 
      file.startsWith('paper-') && file.endsWith('.jar') && !file.endsWith('.backup')
    );
    
    return paperJar || null;
  } catch (error) {
    console.error('Error getting current jar filename:', error);
    return null;
  }
}
