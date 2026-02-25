/**
 * Server Instance Configuration
 * 
 * This module manages multiple Minecraft server instances,
 * allowing the panel to work with both dev and live servers
 */

export interface ServerInstance {
  id: string;
  name: string;
  displayName: string;
  serverPath: string;
  pluginsPath: string;
  tmuxSession: string;
  databaseUrl: string;
  startScript: string;
  description?: string;
  isDefault?: boolean;
}

/**
 * Get all configured server instances from environment variables
 * 
 * Format for environment variables:
 * INSTANCES='[
 *   {
 *     "id": "dev",
 *     "name": "dev",
 *     "displayName": "Development Server",
 *     "serverPath": "/opt/minecraft/dev",
 *     "pluginsPath": "/opt/minecraft/dev/plugins",
 *     "tmuxSession": "minecraft-dev",
 *     "databaseUrl": "mysql://user:pass@localhost:3306/smp_admin_dev",
 *     "startScript": "./start.sh",
 *     "description": "Development environment for testing",
 *     "isDefault": true
 *   },
 *   {
 *     "id": "live",
 *     "name": "live",
 *     "displayName": "Live Server",
 *     "serverPath": "/opt/minecraft/live",
 *     "pluginsPath": "/opt/minecraft/live/plugins",
 *     "tmuxSession": "minecraft-live",
 *     "databaseUrl": "mysql://user:pass@localhost:3306/smp_admin_live",
 *     "startScript": "./start.sh",
 *     "description": "Production environment"
 *   }
 * ]'
 */
export function getServerInstances(): ServerInstance[] {
  // Try to read from INSTANCES environment variable first
  if (process.env.INSTANCES) {
    try {
      const instances = JSON.parse(process.env.INSTANCES);
      if (Array.isArray(instances) && instances.length > 0) {
        return instances;
      }
    } catch (error) {
      console.error('Error parsing INSTANCES environment variable:', error);
    }
  }

  // Fallback: Create instance from legacy environment variables
  const legacyInstance: ServerInstance = {
    id: 'default',
    name: 'default',
    displayName: process.env.INSTANCE_NAME || 'Minecraft Server',
    serverPath: process.env.SERVER_DIR || '/opt/minecraft/server',
    pluginsPath: process.env.PLUGINS_DIR || '/opt/minecraft/dev/plugins',
    tmuxSession: process.env.MINECRAFT_SERVER_SESSION || 'minecraft-server',
    databaseUrl: process.env.DATABASE_URL || '',
    startScript: process.env.MINECRAFT_START_SCRIPT || './start.sh',
    description: 'Default server instance',
    isDefault: true,
  };

  return [legacyInstance];
}

/**
 * Get a specific server instance by ID
 */
export function getServerInstance(instanceId?: string): ServerInstance | null {
  const instances = getServerInstances();
  
  if (!instanceId) {
    // Return default instance
    const defaultInstance = instances.find(i => i.isDefault);
    return defaultInstance || instances[0] || null;
  }

  return instances.find(i => i.id === instanceId) || null;
}

/**
 * Get the default server instance
 */
export function getDefaultInstance(): ServerInstance {
  const instances = getServerInstances();
  const defaultInstance = instances.find(i => i.isDefault);
  
  if (!defaultInstance && instances.length > 0) {
    return instances[0];
  }
  
  if (!defaultInstance) {
    throw new Error('No server instances configured');
  }
  
  return defaultInstance;
}

/**
 * Validate that an instance ID exists
 */
export function isValidInstanceId(instanceId: string): boolean {
  const instances = getServerInstances();
  return instances.some(i => i.id === instanceId);
}

/**
 * Get the database URL for a specific instance
 */
export function getInstanceDatabaseUrl(instanceId?: string): string {
  const instance = getServerInstance(instanceId);
  return instance?.databaseUrl || process.env.DATABASE_URL || '';
}
