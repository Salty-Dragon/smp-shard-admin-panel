# Update Management System Documentation

## Overview

The Update Management System provides a comprehensive solution for managing PaperMC server and plugin updates directly from the admin panel. It includes automatic update detection, one-click deployment, and automatic rollback on failure.

## Features

### 🔄 Server Version Management
- **Automatic Version Detection**: Automatically detects the current PaperMC server version from jar filename or version_history.json
- **Update Availability Check**: Queries the official PaperMC API to check for newer builds
- **One-Click Updates**: Deploy server updates with a single click from the dashboard
- **Automatic Rollback**: If the server fails to start after an update, it automatically rolls back to the previous version
- **Safe Update Process**: Server is gracefully stopped before updating and restarted after

### 🔌 Plugin Update Management
- **Multi-Source Update Detection**: Checks multiple plugin repositories:
  - **Hangar** (PaperMC's official repository)
  - **Modrinth** (Popular plugin hosting)
  - **Spiget** (SpigotMC API) - placeholder for future enhancement
- **Automatic Version Comparison**: Uses smart version comparison to detect available updates
- **Plugin Metadata Extraction**: Reads plugin.yml from JAR files to extract plugin information
- **Selective Updates**: Update individual plugins as needed
- **Rollback Protection**: If server fails to start after plugin update, old version is restored

## Architecture

### Core Libraries

#### `src/lib/papermc.ts`
Handles all PaperMC server version management:
- `checkForUpdates()`: Checks for available server updates
- `getCurrentVersion()`: Detects current server version
- `getLatestBuild()`: Fetches latest build number for a Minecraft version
- `downloadBuild()`: Downloads PaperMC server jar from official API
- `getCurrentJarFilename()`: Gets the current server jar filename

**Key Interfaces:**
```typescript
interface PaperMCVersion {
  currentVersion: string;     // e.g., "1.21.1"
  currentBuild: number;        // Current build number
  latestVersion: string;       // Latest MC version (same as current)
  latestBuild: number;         // Latest available build
  updateAvailable: boolean;    // Whether an update is available
  mcVersion: string;           // Minecraft version
}
```

#### `src/lib/plugin-updates.ts`
Handles plugin update detection and management:
- `extractPluginMetadata()`: Extracts metadata from plugin JAR files
- `checkPluginUpdates()`: Checks for updates across multiple sources
- `getAllPluginsWithUpdates()`: Gets all plugins with their update status
- Version comparison logic for detecting updates

**Key Interfaces:**
```typescript
interface PluginInfo {
  name: string;                // Plugin name from plugin.yml
  filename: string;            // JAR filename
  version: string;             // Current version
  apiVersion?: string;         // Minecraft API version
  website?: string;            // Plugin website
  description?: string;        // Plugin description
}

interface PluginUpdateInfo extends PluginInfo {
  latestVersion?: string;      // Latest available version
  updateAvailable: boolean;    // Whether an update is available
  downloadUrl?: string;        // Direct download URL
  updateSource?: 'hangar' | 'modrinth' | 'spiget' | 'manual' | 'none';
}
```

### API Endpoints

#### `GET /apanel44/api/server/version`
**Authentication**: Admin or Super Admin  
**Description**: Returns current and latest PaperMC version information

**Response:**
```json
{
  "currentVersion": "1.21.1",
  "currentBuild": 123,
  "latestVersion": "1.21.1",
  "latestBuild": 130,
  "updateAvailable": true,
  "mcVersion": "1.21.1"
}
```

#### `POST /apanel44/api/server/update`
**Authentication**: Super Admin only  
**Description**: Deploys a server update with automatic rollback

**Request Body:**
```json
{
  "targetBuild": 130
}
```

**Update Process:**
1. Check if server is running
2. Stop server gracefully (waits up to 30 seconds)
3. Backup current jar file (`.backup` extension)
4. Download new PaperMC build
5. Remove old jar file
6. Log activity
7. Start server with new jar
8. Wait 10 seconds and verify server started
9. If successful: remove backup and return success
10. If failed: restore backup, restart with old version, return error

**Success Response:**
```json
{
  "success": true,
  "message": "Server updated to build 130 successfully",
  "version": {
    "mcVersion": "1.21.1",
    "build": 130,
    "filename": "paper-1.21.1-130.jar"
  }
}
```

**Rollback Response:**
```json
{
  "error": "Update failed",
  "message": "Server failed to start with new version. Rolled back to previous version.",
  "rollback": true
}
```

#### `GET /apanel44/api/plugins/updates`
**Authentication**: Admin or Super Admin  
**Description**: Returns list of all plugins with update information

**Response:**
```json
{
  "total": 15,
  "updatesAvailable": 3,
  "plugins": [
    {
      "name": "EssentialsX",
      "filename": "EssentialsX-2.20.1.jar",
      "version": "2.20.1",
      "apiVersion": "1.21",
      "website": "https://essentialsx.net",
      "description": "Essential commands and features",
      "latestVersion": "2.20.2",
      "updateAvailable": true,
      "downloadUrl": "https://...",
      "updateSource": "hangar"
    }
  ]
}
```

#### `POST /apanel44/api/plugins/deploy-update`
**Authentication**: Admin or Super Admin  
**Description**: Deploys a plugin update with automatic rollback

**Request Body:**
```json
{
  "pluginFilename": "EssentialsX-2.20.1.jar",
  "downloadUrl": "https://..."
}
```

**Update Process:**
1. Sanitize filename
2. Download plugin to temporary file
3. Stop server if running (waits up to 30 seconds)
4. Rename current plugin to `.disabled`
5. Move new plugin into place
6. Log activity
7. Start server
8. Wait 15 seconds and verify server started
9. If successful: remove `.disabled` file and return success
10. If failed: restore `.disabled` plugin, remove new plugin, restart server, return error

**Success Response:**
```json
{
  "success": true,
  "message": "Plugin EssentialsX-2.20.1.jar updated successfully",
  "filename": "EssentialsX-2.20.1.jar"
}
```

### Frontend Components

#### `ServerVersionCard.tsx`
Displays on the dashboard page for Admin and Super Admin users.

**Features:**
- Displays current Minecraft version and build number
- Shows update availability status
- Displays latest build number when update is available
- Manual refresh button
- Auto-refresh every 5 minutes
- One-click update with confirmation dialog
- Warning about server restart
- Real-time update status
- Error handling with retry option

#### `PluginUpdatesList.tsx`
Displays on the plugins page as a separate section.

**Features:**
- Summary of total plugins and available updates
- List of all plugins with metadata
- Visual indicators for update availability
- Source badges (Hangar, Modrinth, etc.)
- Plugin descriptions and website links
- Current and latest version display
- One-click update with confirmation dialog
- Warning about server restart
- Disabled state for plugins without downloadable updates
- Real-time update status
- Manual refresh button

## Environment Variables

Add to your `.env` file:

```bash
# Server directory path - Path to the Minecraft server directory
# Used for server version detection and updates
# Default: /opt/minecraft/server
SERVER_DIR="/opt/minecraft/server"

# Minecraft start script - Path to the script used to start the server
# Used for server restarts and updates
# Default: ./start.sh
MINECRAFT_START_SCRIPT="./start.sh"

# TMUX session name (required for server control)
MINECRAFT_SERVER_SESSION="minecraft-server"
```

## Security Considerations

### Permissions
- **Server Updates**: Require Super Admin role (highest permission level)
- **Plugin Updates**: Require Admin or Super Admin role
- **Version Checking**: Require Admin or Super Admin role

### Safety Features
1. **Backup before Update**: Always creates backup before modifying files
2. **Automatic Rollback**: Restores previous version if server fails to start
3. **Graceful Shutdown**: Waits up to 30 seconds for server to stop properly
4. **Health Checks**: Verifies server started successfully after updates
5. **Filename Sanitization**: All filenames are sanitized to prevent path traversal
6. **Download Validation**: Only downloads from verified sources
7. **Activity Logging**: All update operations are logged with user ID and details

### Update Source Validation
- **PaperMC API**: Official API endpoints are hardcoded
- **Hangar**: Official PaperMC plugin repository
- **Modrinth**: Popular and trusted plugin hosting platform
- **Download URLs**: Validated before downloading

## Usage Guide

### Updating the Server

1. Navigate to the Dashboard
2. Find the "Server Version" card
3. If an update is available, you'll see:
   - Current build number
   - Latest build number
   - "Update Available" badge
   - "Update to Build X" button
4. Click the update button
5. Confirm the update in the dialog (read the warnings)
6. Wait for the update to complete (1-2 minutes)
7. Check the status message for success or failure

**Note**: Only Super Admins can perform server updates.

### Updating Plugins

1. Navigate to the Plugins page
2. Find the "Plugin Updates" section
3. Review the list of plugins:
   - Plugins with updates show "Update Available" badge
   - Latest version is displayed in green
   - Source badge shows where the update was found
4. Click "Update" button for the plugin you want to update
5. Confirm the update in the dialog (read the warnings)
6. Wait for the update to complete (1-2 minutes)
7. Check the status message for success or failure

**Note**: Plugins without automatic download URLs show "Manual Update Required".

### Manual Refresh

Both components have manual refresh buttons (🔄) to check for updates on demand.

### Automatic Refresh

The Server Version Card automatically refreshes every 5 minutes to check for updates.

## Troubleshooting

### "Could not determine current server version"
**Cause**: Unable to parse version from jar filename or version_history.json  
**Solution**: 
- Ensure jar file follows the naming pattern: `paper-{version}-{build}.jar`
- Check if `SERVER_DIR` environment variable is set correctly
- Verify file permissions

### "Server failed to stop within 30 seconds"
**Cause**: Server taking too long to shut down  
**Solution**:
- Check server logs for issues preventing shutdown
- Increase timeout in code if needed
- Manually stop server and retry

### "Update failed" / Rollback occurred
**Cause**: Server failed to start with new version  
**Solution**:
- Check server logs in `SERVER_DIR/logs/latest.log`
- Verify new version is compatible with plugins
- Check for plugin conflicts
- Server is automatically restored to previous version

### "No updates found" for plugin
**Cause**: Plugin not found in any supported repository  
**Solution**:
- Plugin may need manual update
- Check plugin's official website
- Consider adding plugin to supported repositories
- Update `plugin.yml` name if it doesn't match repository name

### Plugin update shows "Manual Update Required"
**Cause**: Plugin found but no direct download URL available  
**Solution**:
- Update manually through the file upload feature
- Check plugin's official download page

## Technical Details

### Version Comparison Algorithm
The system uses a smart version comparison algorithm that:
- Removes common prefixes like "v"
- Splits versions by dots and hyphens
- Compares numeric parts numerically
- Compares non-numeric parts lexicographically
- Handles varying version string formats

**Examples:**
- `1.2.3` < `1.2.4`
- `v1.0.0` = `1.0.0`
- `2.0-SNAPSHOT` < `2.0`
- `1.21.1` < `1.21.2`

### API Rate Limiting
Be aware of rate limits for external APIs:
- **PaperMC API**: No documented rate limits
- **Hangar API**: Standard rate limiting applies
- **Modrinth API**: Requires User-Agent header, has rate limits

### Caching Recommendations
For production deployments, consider implementing:
- Server version cache (5-minute expiry)
- Plugin update cache (15-minute expiry)
- Failed update tracking to avoid repeated failures

## Future Enhancements

Potential improvements for future versions:

1. **Spiget Integration**: Complete Spiget support with resource ID mapping
2. **Automatic Updates**: Schedule automatic updates during off-peak hours
3. **Update Notifications**: Email/Discord notifications for available updates
4. **Batch Updates**: Update multiple plugins at once
5. **Update History**: Track all updates with rollback capability
6. **Pre-update Backup**: Full server backup before updates
7. **Update Testing**: Dry-run mode to test updates before deploying
8. **Custom Repositories**: Support for custom plugin repositories
9. **Update Scheduling**: Schedule updates for specific times
10. **Change Logs**: Display change logs from plugin/server updates

## Dependencies

### NPM Packages
- `adm-zip@^0.5.10` - ZIP file extraction for plugin metadata
- `@types/adm-zip@^0.5.5` - TypeScript definitions

### System Requirements
- **tmux**: Required for server console management
- **Node.js 20+**: Required for Next.js
- **Disk Space**: Temporary space for downloads (up to 50MB per update)

## API Reference Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/apanel44/api/server/version` | GET | Admin | Get server version info |
| `/apanel44/api/server/update` | POST | Super Admin | Deploy server update |
| `/apanel44/api/plugins/updates` | GET | Admin | Get plugin update info |
| `/apanel44/api/plugins/deploy-update` | POST | Admin | Deploy plugin update |

## Activity Log Types

The following activity types are logged:
- `server_update` - Server update deployed
- `plugin_update` - Plugin update deployed

Each log entry includes:
- User ID who performed the update
- Timestamp
- Resource (plugin filename or server)
- Details (version numbers, build numbers)
- IP address
- User agent

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad request (invalid parameters) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found (resource not found) |
| 405 | Method not allowed |
| 500 | Internal server error (update failed) |

## Support

For issues or questions:
1. Check server logs in `SERVER_DIR/logs/`
2. Check activity logs in the admin panel
3. Review error messages in the UI
4. Check browser console for client-side errors
5. Verify environment variables are set correctly

---

**Last Updated**: 2026-02-08  
**Version**: 1.0.0  
**Author**: SMP Shard Admin Panel Team
