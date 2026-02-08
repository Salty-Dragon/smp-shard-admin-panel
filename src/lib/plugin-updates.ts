/**
 * Plugin Update Detection Library
 * 
 * Handles detecting and managing plugin updates from various sources
 */

import AdmZip from 'adm-zip';
import path from 'path';
import { PLUGINS_DIR } from './fileUtils';
import fs from 'fs/promises';

export interface PluginInfo {
  name: string;
  filename: string;
  version: string;
  apiVersion?: string;
  website?: string;
  description?: string;
}

export interface PluginUpdateInfo extends PluginInfo {
  latestVersion?: string;
  updateAvailable: boolean;
  downloadUrl?: string;
  updateSource?: 'hangar' | 'modrinth' | 'spiget' | 'manual' | 'none';
}

/**
 * Extract plugin.yml metadata from a JAR file
 * 
 * @param jarPath - Path to the JAR file
 * @returns Promise<PluginInfo | null> - Plugin information or null if not found
 */
export async function extractPluginMetadata(jarPath: string): Promise<PluginInfo | null> {
  try {
    const zip = new AdmZip(jarPath);
    const pluginYmlEntry = zip.getEntry('plugin.yml');
    
    if (!pluginYmlEntry) {
      console.warn(`No plugin.yml found in ${jarPath}`);
      return null;
    }
    
    const pluginYmlContent = pluginYmlEntry.getData().toString('utf8');
    
    // Parse YAML manually (simple key-value parsing)
    const metadata: PluginInfo = {
      name: '',
      filename: path.basename(jarPath),
      version: '',
    };
    
    const lines = pluginYmlContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('name:')) {
        metadata.name = trimmed.substring(5).trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('version:')) {
        metadata.version = trimmed.substring(8).trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('api-version:')) {
        metadata.apiVersion = trimmed.substring(12).trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('website:')) {
        metadata.website = trimmed.substring(8).trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('description:')) {
        metadata.description = trimmed.substring(12).trim().replace(/['"]/g, '');
      }
    }
    
    if (!metadata.name || !metadata.version) {
      console.warn(`Invalid plugin.yml in ${jarPath}: missing name or version`);
      return null;
    }
    
    return metadata;
  } catch (error) {
    console.error(`Error extracting metadata from ${jarPath}:`, error);
    return null;
  }
}

/**
 * Compare two version strings
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 * 
 * @param v1 - First version string
 * @param v2 - Second version string
 * @returns number - Comparison result
 */
function compareVersions(v1: string, v2: string): number {
  // Remove common prefixes like 'v' and normalize
  const normalize = (v: string) => v.replace(/^v/i, '').toLowerCase();
  const version1 = normalize(v1);
  const version2 = normalize(v2);
  
  // If versions are identical, return 0
  if (version1 === version2) return 0;
  
  // Split by dots and compare each segment
  const parts1 = version1.split(/[.-]/).filter(Boolean);
  const parts2 = version2.split(/[.-]/).filter(Boolean);
  
  const maxLength = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || '0';
    const part2 = parts2[i] || '0';
    
    // Try to parse as numbers
    const num1 = parseInt(part1, 10);
    const num2 = parseInt(part2, 10);
    
    if (!isNaN(num1) && !isNaN(num2)) {
      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    } else {
      // Lexicographic comparison
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
  }
  
  return 0;
}

/**
 * Check for updates on Hangar (PaperMC's official plugin repository)
 * 
 * @param pluginName - Plugin name
 * @param currentVersion - Current version
 * @returns Promise<{latestVersion: string, downloadUrl: string} | null>
 */
async function checkHangarUpdates(
  pluginName: string,
  currentVersion: string
): Promise<{ latestVersion: string; downloadUrl: string } | null> {
  try {
    // Convert plugin name to slug (lowercase, replace spaces with hyphens)
    const slug = pluginName.toLowerCase().replace(/\s+/g, '-');
    
    const response = await fetch(
      `https://hangar.papermc.io/api/v1/projects/${slug}/versions`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Get the latest version
    if (data.result && data.result.length > 0) {
      const latestVersion = data.result[0];
      const version = latestVersion.name;
      
      // Check if it's newer
      if (compareVersions(version, currentVersion) > 0) {
        // Construct download URL
        const downloadUrl = `https://hangar.papermc.io/api/v1/projects/${slug}/versions/${version}/PAPER/download`;
        return { latestVersion: version, downloadUrl };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error checking Hangar for ${pluginName}:`, error);
    return null;
  }
}

/**
 * Check for updates on Modrinth
 * 
 * @param pluginName - Plugin name
 * @param currentVersion - Current version
 * @returns Promise<{latestVersion: string, downloadUrl: string} | null>
 */
async function checkModrinthUpdates(
  pluginName: string,
  currentVersion: string
): Promise<{ latestVersion: string; downloadUrl: string } | null> {
  try {
    // Search for the plugin
    const searchResponse = await fetch(
      `https://api.modrinth.com/v2/search?query=${encodeURIComponent(pluginName)}&facets=[["project_type:mod"],["categories:paper"]]`,
      {
        headers: {
          'User-Agent': 'SMP-Shard-Admin-Panel/1.0',
        },
      }
    );
    
    if (!searchResponse.ok) {
      return null;
    }
    
    const searchData = await searchResponse.json();
    
    // Find exact match or closest match
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = searchData.hits?.find((hit: any) =>
      hit.title.toLowerCase() === pluginName.toLowerCase()
    ) || searchData.hits?.[0];
    
    if (!project) {
      return null;
    }
    
    // Get versions for this project
    const versionsResponse = await fetch(
      `https://api.modrinth.com/v2/project/${project.project_id}/version`,
      {
        headers: {
          'User-Agent': 'SMP-Shard-Admin-Panel/1.0',
        },
      }
    );
    
    if (!versionsResponse.ok) {
      return null;
    }
    
    const versions = await versionsResponse.json();
    
    // Get the latest version
    if (versions && versions.length > 0) {
      const latestVersion = versions[0];
      const version = latestVersion.version_number;
      
      // Check if it's newer
      if (compareVersions(version, currentVersion) > 0) {
        // Get download URL from the first file
        const downloadUrl = latestVersion.files?.[0]?.url;
        if (downloadUrl) {
          return { latestVersion: version, downloadUrl };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error checking Modrinth for ${pluginName}:`, error);
    return null;
  }
}

/**
 * Check for updates on Spiget (SpigotMC)
 * Note: Spiget requires a resource ID, which we don't have from plugin.yml
 * This is a placeholder for when we can extract or store resource IDs
 * 
 * @param resourceId - Spiget resource ID
 * @param currentVersion - Current version
 * @returns Promise<{latestVersion: string, downloadUrl?: string} | null>
 */
async function checkSpigetUpdates(
  resourceId: string,
  currentVersion: string
): Promise<{ latestVersion: string; downloadUrl?: string } | null> {
  try {
    const response = await fetch(
      `https://api.spiget.org/v2/resources/${resourceId}/versions/latest`,
      {
        headers: {
          'User-Agent': 'SMP-Shard-Admin-Panel/1.0',
        },
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const version = data.name;
    
    // Check if it's newer
    if (compareVersions(version, currentVersion) > 0) {
      // Spiget doesn't provide direct download URLs without authentication
      return { latestVersion: version };
    }
    
    return null;
  } catch (error) {
    console.error(`Error checking Spiget for resource ${resourceId}:`, error);
    return null;
  }
}

/**
 * Check for updates for a single plugin across all sources
 * 
 * @param pluginInfo - Plugin information
 * @returns Promise<PluginUpdateInfo> - Plugin update information
 */
export async function checkPluginUpdates(
  pluginInfo: PluginInfo
): Promise<PluginUpdateInfo> {
  const updateInfo: PluginUpdateInfo = {
    ...pluginInfo,
    updateAvailable: false,
    updateSource: 'none',
  };
  
  // Try Hangar first (official PaperMC repository)
  const hangarUpdate = await checkHangarUpdates(pluginInfo.name, pluginInfo.version);
  if (hangarUpdate) {
    updateInfo.latestVersion = hangarUpdate.latestVersion;
    updateInfo.downloadUrl = hangarUpdate.downloadUrl;
    updateInfo.updateAvailable = true;
    updateInfo.updateSource = 'hangar';
    return updateInfo;
  }
  
  // Try Modrinth
  const modrinthUpdate = await checkModrinthUpdates(pluginInfo.name, pluginInfo.version);
  if (modrinthUpdate) {
    updateInfo.latestVersion = modrinthUpdate.latestVersion;
    updateInfo.downloadUrl = modrinthUpdate.downloadUrl;
    updateInfo.updateAvailable = true;
    updateInfo.updateSource = 'modrinth';
    return updateInfo;
  }
  
  // Spiget requires resource ID, which we don't have
  // Could be extended in the future with a mapping file or database
  
  return updateInfo;
}

/**
 * Get all plugins in the plugins directory with update information
 * 
 * @param pluginsDir - Plugins directory path (optional, defaults to PLUGINS_DIR)
 * @returns Promise<PluginUpdateInfo[]> - Array of plugin update information
 */
export async function getAllPluginsWithUpdates(
  pluginsDir?: string
): Promise<PluginUpdateInfo[]> {
  const dir = pluginsDir || PLUGINS_DIR;
  
  try {
    const files = await fs.readdir(dir);
    
    // Filter for .jar files (not .disabled or .backup)
    const jarFiles = files.filter(
      (file) => file.endsWith('.jar') && !file.endsWith('.disabled') && !file.endsWith('.backup')
    );
    
    // Extract metadata and check updates for each plugin
    const pluginsWithUpdates = await Promise.all(
      jarFiles.map(async (jarFile) => {
        const jarPath = path.join(dir, jarFile);
        const metadata = await extractPluginMetadata(jarPath);
        
        if (!metadata) {
          // Return minimal info if metadata extraction failed
          return {
            name: jarFile.replace('.jar', ''),
            filename: jarFile,
            version: 'Unknown',
            updateAvailable: false,
            updateSource: 'none' as const,
          };
        }
        
        // Check for updates
        return await checkPluginUpdates(metadata);
      })
    );
    
    // Sort by update availability, then alphabetically
    pluginsWithUpdates.sort((a, b) => {
      if (a.updateAvailable !== b.updateAvailable) {
        return a.updateAvailable ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    return pluginsWithUpdates;
  } catch (error) {
    console.error('Error getting plugins with updates:', error);
    throw error;
  }
}
