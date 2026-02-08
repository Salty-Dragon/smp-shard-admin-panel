/**
 * PaperMC Version Management Library
 * 
 * Handles fetching, comparing, and downloading PaperMC server versions
 */

import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

// Default server directory (can be overridden by environment variable)
const DEFAULT_SERVER_DIR = '/opt/minecraft/server';

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
    
    // Get the current version from the history
    if (history.currentVersion) {
      const version = history.currentVersion;
      // Parse version string (e.g., "1.21.1-123" -> version: "1.21.1", build: 123)
      const match = version.match(/^(.+)-(\d+)$/);
      if (match) {
        return {
          version: match[1],
          build: parseInt(match[2], 10),
        };
      }
    }
    
    return null;
  } catch (error) {
    // File might not exist
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
 * @param serverDir - Server directory path (optional, defaults to env or constant)
 * @returns Promise<{version: string, build: number} | null> - Current version info or null
 */
export async function getCurrentVersion(
  serverDir?: string
): Promise<{ version: string; build: number } | null> {
  const dir = serverDir || process.env.SERVER_DIR || DEFAULT_SERVER_DIR;
  
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
 * @param serverDir - Server directory path (optional, defaults to env or constant)
 * @returns Promise<PaperMCVersion> - Version information with update status
 */
export async function checkForUpdates(serverDir?: string): Promise<PaperMCVersion> {
  const currentVersion = await getCurrentVersion(serverDir);
  
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
 * @param serverDir - Server directory path (optional, defaults to env or constant)
 * @returns Promise<string | null> - Current jar filename or null
 */
export async function getCurrentJarFilename(serverDir?: string): Promise<string | null> {
  const dir = serverDir || process.env.SERVER_DIR || DEFAULT_SERVER_DIR;
  
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
