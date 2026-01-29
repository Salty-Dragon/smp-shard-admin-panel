# Server Management Commands Guide

## Overview
The SMP Admin Panel console provides special command handling for server management operations (start, restart, stop) to ensure the tmux session remains functional.

## The Problem We're Solving
When Minecraft's built-in `restart` or `stop` commands are executed directly in tmux, they terminate the Java process. This causes the tmux session to drop to a shell prompt, breaking the web console connection. Our solution intercepts and handles these commands properly.

## Special Commands

### 1. `start` Command
**Purpose**: Start the Minecraft server using the startup script  
**How it works**: Executes `./start.sh` in the tmux session

**Usage**:
```
start
```

**What happens**:
1. The web console sends the command to the API
2. API executes `./start.sh` in the tmux session
3. The start script launches the Minecraft server
4. Server output appears in the console

**Requirements**:
- The `./start.sh` script must exist in the server directory
- The tmux session must be running from the correct directory
- The script must be executable (`chmod +x start.sh`)

**Example start.sh**:
```bash
#!/bin/bash
java -Xms4G -Xmx4G -jar paper.jar --nogui
```

### 2. `restart` Command  
**Purpose**: Safely restart the Minecraft server  
**How it works**: Sends `stop` command, waits for shutdown, then executes `./start.sh`

**Usage**:
```
restart
```

**What happens**:
1. Sends `stop` command to the Minecraft server console
2. Waits 5 seconds for the server to save and shut down cleanly
3. Executes `./start.sh` to start the server again
4. Server restarts with a clean tmux session connection

**Timing**:
- Stop command: sent immediately
- Wait period: 5 seconds (configurable in code)
- Start script: executes after wait period

**Note**: The restart process takes time. Players will be disconnected during the restart.

### 3. `stop` Command
**Purpose**: Stop the Minecraft server  
**How it works**: Sends the standard stop command to the server

**Usage**:
```
stop
```

**Permissions**: Super Admin only (Admins cannot use this command)

**What happens**:
1. Sends `stop` command to Minecraft server
2. Server saves world and shuts down
3. tmux session returns to shell prompt
4. Use `start` command to restart the server

**Important**: After using `stop`, you'll need to use the `start` command to restart the server.

## Permission Levels

### Admins
- ✅ Can use: `list`, `kick`, `ban`, `whitelist`, etc. (all approved commands)
- ✅ Can use: `start`, `restart`
- ❌ Cannot use: `stop` (Super Admin only)

### Super Admins
- ✅ Can use: All commands including `start`, `restart`, `stop`

## Setup Requirements

### Required Files
1. **start.sh** - Server startup script in the server directory
   ```bash
   #!/bin/bash
   cd /path/to/server
   java -Xms4G -Xmx4G -jar paper.jar --nogui
   ```

2. **Make it executable**:
   ```bash
   chmod +x start.sh
   ```

### Environment Configuration
Ensure `MINECRAFT_SERVER_SESSION` in `.env` matches your tmux session name:
```env
MINECRAFT_SERVER_SESSION="minecraft-server"
```

### Tmux Session Setup
The tmux session should be started from the server directory:
```bash
cd /path/to/minecraft/server
tmux new-session -s minecraft-server
./start.sh
```

Then detach with `Ctrl+B` then `D`.

## Usage Examples

### Example 1: Starting a Stopped Server
If the server is stopped and you see a shell prompt:
```
> start
```
Output: `./start.sh` execution output and server startup logs

### Example 2: Restarting the Server
To apply plugin updates or configuration changes:
```
> restart
```
Output: `Server restart initiated: Stop command sent, waiting for shutdown, then starting with ./start.sh`

The server will:
1. Announce shutdown to players
2. Save the world
3. Stop gracefully
4. Wait 5 seconds
5. Start again with the startup script

### Example 3: Stopping the Server for Maintenance
Super Admin only:
```
> stop
```
The server will shut down. To restart, use:
```
> start
```

## Advanced Configuration

### Custom Wait Time for Restart
The restart command waits 5 seconds by default. To change this, edit `/src/lib/console.ts`:

```typescript
// In restartServer function
await new Promise(resolve => setTimeout(resolve, 5000)); // Change 5000 to desired milliseconds
```

### Custom Startup Script Location
If your startup script is named differently or in a different location, you can modify the paths in `/src/lib/console.ts` and `/src/pages/api/server/console.ts`.

### Multiple Server Support
For multiple servers with different startup scripts, you could modify the implementation to:
1. Store script paths in environment variables
2. Pass script name as a parameter
3. Use a configuration file

## Troubleshooting

### "start" command doesn't work
**Possible causes**:
1. `./start.sh` doesn't exist
   - Solution: Create the script in your server directory
2. Script is not executable
   - Solution: Run `chmod +x start.sh`
3. Tmux is in the wrong directory
   - Solution: Restart tmux from the server directory
4. Script has errors
   - Solution: Test the script manually in tmux

### "restart" command takes too long
**Explanation**: The restart command includes a 5-second wait period to ensure clean shutdown.

**If it's too long**: Reduce the wait time in the code  
**If it's too short**: Increase the wait time to ensure complete shutdown

### Server doesn't restart after "restart" command
**Check**:
1. Did the stop command succeed? Check logs
2. Does `./start.sh` work manually?
3. Is the tmux session still active? Run `tmux ls`

**Solution**: If restart fails, use `start` command manually

### Console shows shell prompt after "stop"
**This is expected behavior**. The `stop` command stops the server, returning to shell.

**Solution**: Use the `start` command to restart the server.

## Web Console UI

### Special Commands Info Box
The console page displays a green info box showing:
- `start` - Executes ./start.sh to start the server
- `restart` - Safely restarts by sending stop command, then executes ./start.sh
- `stop` - Stops the server (Super Admin only)

### Command Autocomplete
Special commands appear in autocomplete:
- Type `sta` → suggests `start`
- Type `res` → suggests `restart`  
- Type `sto` → suggests `stop` (Super Admin only)

## API Implementation Details

### Command Flow
1. User types command in web console
2. POST request to `/apanel44/api/server/console`
3. API checks permissions
4. API detects special commands:
   - `start` → calls `executeScriptInTmux()`
   - `restart` → calls `restartServer()`
   - Other commands → calls `sendCommandAndCapture()`
5. Command execution in tmux session
6. Output captured and returned to user

### Security
- All commands are validated and sanitized
- Script paths are validated (must start with `./`)
- Only alphanumeric and common script characters allowed
- Activity logging tracks all command executions
- Role-based access control enforced

## Comparison: Old vs New Approach

### Old Approach (Blocked Commands)
❌ Commands were completely blocked  
❌ Users couldn't restart from web console  
❌ Required manual tmux access  
❌ Poor user experience  

### New Approach (Command Handling)
✅ Commands are intercepted and handled properly  
✅ Users can restart from web console  
✅ Tmux session stays functional  
✅ Better user experience  
✅ Maintains security and logging  

## Best Practices

1. **Always use the web console** for regular commands
2. **Use `restart`** instead of the Minecraft `/restart` command
3. **Test your start.sh script** before using in production
4. **Schedule restarts** during low-traffic periods
5. **Announce restarts** to players first (use `say` command)
6. **Monitor logs** after restart to ensure successful startup

## Future Enhancements

Possible improvements for future versions:
1. Configurable wait time via admin panel
2. Pre-restart warnings to players
3. Automatic restart on crash
4. Multiple startup profiles
5. Restart scheduling
6. Real-time status during restart

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs in the tmux session
3. Check the activity logs in the admin panel
4. Consult the main README.md documentation
5. Check the CONSOLE_FEATURE_DOCUMENTATION.md

## Technical Details

### File Locations
- Command constants: `/src/lib/console-constants.ts`
- Command execution: `/src/lib/console.ts`
- API handler: `/src/pages/api/server/console.ts`
- UI component: `/src/pages/console.tsx`

### Key Functions
- `executeScriptInTmux()` - Executes shell scripts in tmux
- `restartServer()` - Handles the restart sequence
- `sendCommandAndCapture()` - Sends regular commands

---

**Last Updated**: 2026-01-29  
**Version**: 2.0 (Command Handling Implementation)
