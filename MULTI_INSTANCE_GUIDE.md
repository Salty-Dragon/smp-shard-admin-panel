# Multi-Instance Server Configuration Guide

This guide explains how to configure and manage multiple Minecraft server instances (e.g., development and production servers) using the SMP Admin Panel.

## Overview

The admin panel now supports managing multiple Minecraft server instances from a single interface. Each instance can have its own:
- Server directory and plugins folder
- Tmux session name
- Start script

All instances share the same database connection (DATABASE_URL) for user accounts, authentication, and activity logging.

## Configuration Methods

### Method 1: Multiple Instances via JSON Configuration (Recommended)

This is the recommended approach for managing multiple servers. Define all your instances in a single JSON configuration.

**Add to your `.env` file:**

```bash
INSTANCES='[
  {
    "id": "dev",
    "name": "dev",
    "displayName": "Development Server",
    "serverPath": "/opt/minecraft/dev",
    "pluginsPath": "/opt/minecraft/dev/plugins",
    "tmuxSession": "minecraft-dev",
    "startScript": "./start.sh",
    "description": "Development environment for testing",
    "isDefault": true
  },
  {
    "id": "live",
    "name": "live",
    "displayName": "Live Server",
    "serverPath": "/opt/minecraft/live",
    "pluginsPath": "/opt/minecraft/live/plugins",
    "tmuxSession": "minecraft-live",
    "startScript": "./start.sh",
    "description": "Production environment"
  }
]'
```

**Field Descriptions:**

- `id` (required): Unique identifier for the instance (used internally)
- `name` (required): Short name for the instance
- `displayName` (required): User-friendly name shown in the UI
- `serverPath` (required): Full path to the server directory
- `pluginsPath` (required): Full path to the plugins directory
- `tmuxSession` (required): Name of the tmux session running this server
- `startScript` (optional): Path to the start script (defaults to "./start.sh")
- `description` (optional): Description shown in instance selector
- `isDefault` (optional): Set to `true` for the default instance shown on login

### Method 2: Legacy Single Instance Configuration

If you don't configure the `INSTANCES` variable, the panel will automatically create a single instance from these legacy environment variables:

```bash
# Single server configuration (backward compatible)
INSTANCE_NAME="Minecraft Server"
MINECRAFT_SERVER_SESSION="minecraft-server"
SERVER_DIR="/opt/minecraft/server"
PLUGINS_DIR="/opt/minecraft/server/plugins"
MINECRAFT_START_SCRIPT="./start.sh"
```

This ensures backward compatibility with existing deployments.

## Setting Up Multiple Servers

### Example: Dev and Live Server Setup

1. **Create server directories:**
```bash
sudo mkdir -p /opt/minecraft/dev
sudo mkdir -p /opt/minecraft/live
```

2. **Copy your server files to each directory:**
```bash
# Copy server.jar, start scripts, etc. to each directory
sudo cp -r /path/to/server/* /opt/minecraft/dev/
sudo cp -r /path/to/server/* /opt/minecraft/live/
```

3. **Start each server in its own tmux session:**
```bash
# Start dev server
cd /opt/minecraft/dev
tmux new-session -d -s minecraft-dev './start.sh'

# Start live server
cd /opt/minecraft/live
tmux new-session -d -s minecraft-live './start.sh'
```

4. **Configure the INSTANCES environment variable** in your `.env` file as shown above.

5. **Restart the admin panel:**
```bash
pm2 restart smp-admin-panel
# or
systemctl restart smp-admin-panel
```

## Using the Instance Selector

### In the UI

1. After logging in, you'll see an **Instance Selector** at the top of the dashboard
2. Click the dropdown to switch between configured instances
3. The active instance is shown with a visual indicator (pulsing dot)
4. All actions (server commands, file management, etc.) will apply to the selected instance

### Features by Page

**Dashboard:**
- Shows server status for the selected instance
- Player count updates for the active instance
- Server monitoring metrics are instance-specific

**Console:**
- Commands are sent to the active instance's tmux session
- Command history shows which instance each command was executed on

**Plugins:**
- File browser shows plugins from the active instance
- Upload and edit operations affect the selected instance only

**Server Management:**
- Start/stop/restart commands target the active instance
- Version information is instance-specific

## Important Notes

### Database Sharing

All instances share the same database (configured via DATABASE_URL in your .env file) for user accounts and authentication. This means:
- ✅ Users only need one account to manage all servers
- ✅ Roles and permissions apply across all instances
- ✅ Activity logs track which instance actions were performed on
- ✅ No need to configure separate database connections for each instance

### Instance Isolation

Each instance is completely isolated:
- ❌ Server files are separate
- ❌ Plugin configurations are separate
- ❌ Tmux sessions are separate
- ❌ Server processes are independent

### Security Considerations

1. **Always label instances clearly** - Use descriptive `displayName` values to prevent mistakes
2. **Set the correct default** - Mark your safest instance (usually dev) as default
3. **Path validation** - All file operations are restricted to the instance's configured directories
4. **Separate tmux sessions** - Each instance must have a unique tmux session name

## Troubleshooting

### Instance not appearing in selector

**Check:**
1. Is the `INSTANCES` environment variable properly formatted JSON?
2. Did you restart the panel after changing the environment variable?
3. Check browser console for any errors

**Debug:**
```bash
# Check if panel can read the config
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/apanel44/api/instances
```

### Commands going to wrong server

**Check:**
1. Is the instance selector showing the correct active instance?
2. Does the instance have the correct `tmuxSession` configured?
3. Is the tmux session actually running?

**Verify:**
```bash
# List all tmux sessions
tmux list-sessions

# Should show both minecraft-dev and minecraft-live (or your configured names)
```

### File operations failing

**Check:**
1. Do the configured paths exist and have correct permissions?
2. Can the panel user (running the Node.js process) access the directories?

**Fix permissions:**
```bash
# Give panel access to server directories
sudo chown -R panel-user:panel-user /opt/minecraft/dev
sudo chown -R panel-user:panel-user /opt/minecraft/live
sudo chmod -R 755 /opt/minecraft/dev
sudo chmod -R 755 /opt/minecraft/live
```

## Migration from Single to Multi-Instance

If you're upgrading from a single-instance setup:

1. **Note your current configuration:**
   - Current `SERVER_DIR`
   - Current `MINECRAFT_SERVER_SESSION`
   - Current `PLUGINS_DIR`

2. **Create the INSTANCES configuration** using your current values as the first instance

3. **Add the new instance** (e.g., live server) as a second entry

4. **Test thoroughly** before using in production:
   - Switch between instances
   - Execute commands on each
   - Upload files to each
   - Verify isolation

## Example Production Configuration

Here's a complete example for a production setup with dev, staging, and live servers:

```bash
INSTANCES='[
  {
    "id": "dev",
    "name": "dev",
    "displayName": "🔧 Development",
    "serverPath": "/opt/minecraft/dev",
    "pluginsPath": "/opt/minecraft/dev/plugins",
    "tmuxSession": "mc-dev",
    "startScript": "./start.sh",
    "description": "For plugin development and testing",
    "isDefault": true
  },
  {
    "id": "staging",
    "name": "staging",
    "displayName": "🧪 Staging",
    "serverPath": "/opt/minecraft/staging",
    "pluginsPath": "/opt/minecraft/staging/plugins",
    "tmuxSession": "mc-staging",
    "startScript": "./start.sh",
    "description": "Pre-production testing environment"
  },
  {
    "id": "live",
    "name": "live",
    "displayName": "🚀 Production",
    "serverPath": "/opt/minecraft/live",
    "pluginsPath": "/opt/minecraft/live/plugins",
    "tmuxSession": "mc-live",
    "startScript": "./start.sh",
    "description": "⚠️ Live production server - be careful!"
  }
]'
```

## Best Practices

1. **Use emojis in display names** to make instances visually distinct
2. **Mark production with warnings** in the description
3. **Set dev as default** to prevent accidental production changes
4. **Use consistent naming** for tmux sessions (e.g., mc-dev, mc-staging, mc-live)
5. **Test on dev first** before applying changes to production
6. **Keep server versions in sync** between instances when possible
7. **Document your instance configuration** in your deployment notes

## Support

If you encounter issues with multi-instance configuration, check:
- Application logs for detailed error messages
- Browser developer console for API errors
- Tmux session status with `tmux list-sessions`

Report issues at: https://github.com/Salty-Dragon/smp-shard-admin-panel/issues
