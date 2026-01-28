# Server Status and Player Count Fix - Implementation Guide

## Overview

This document describes the implementation of real-time Minecraft server status checking and accurate player count retrieval for the SMP Admin Panel.

## Problem Statement

The admin panel was displaying incorrect statistics:
1. **Inaccurate Player Count**: Fluctuating random values (5-15) even when no players were online
2. **Incorrect Server Status**: Always showing "Online" even when the Minecraft server was stopped

## Root Cause

The `src/lib/minecraft.ts` module contained **mock implementations** that:
- Generated random player counts for demonstration purposes
- Always returned `online: true` regardless of actual server state

## Solution Architecture

### Components Modified

1. **`src/lib/minecraft.ts`** - Core Minecraft integration
2. **`src/lib/console.ts`** - Enhanced tmux session management
3. **`src/pages/api/monitoring/metrics.ts`** - Added logging
4. **`src/pages/api/monitoring/server-status.ts`** - New endpoint (created)
5. **`src/pages/dashboard.tsx`** - Updated UI to show real status
6. **`.env.example`** - Added configuration variables

### How It Works

#### 1. Server Status Detection

The system checks if the Minecraft server is online using tmux session detection:

```typescript
// Check if tmux session exists
const sessionExists = await tmuxSessionExists(serverName);

if (!sessionExists) {
  // Server is offline
  return { online: false, playerCount: 0 };
}
```

**Implementation Details:**
- Uses `tmux has-session -t <session-name>` command
- Exit code 0 = session exists (server running)
- Non-zero exit code = session doesn't exist (server offline)

#### 2. Player Count Retrieval

When server is online, the system sends a "list" command to get player count:

```typescript
// Send "list" command to Minecraft console
const output = await sendCommandAndCapture(serverName, 'list', 1500);

// Parse output to extract player count
const playerCount = parsePlayerCountFromOutput(output);
```

**Parsing Strategy:**
The parser handles multiple Minecraft output formats:

1. **Pattern 1**: `"There are 3 of a max of 20 players online"`
2. **Pattern 2**: `"There are 3/20 players online"`
3. **Pattern 3**: `"3 players online"`
4. **Pattern 4**: Counts comma-separated names after `"online: Player1, Player2, Player3"`

#### 3. Console Output Capture

The `sendCommandAndCapture()` function:
1. Sends command to tmux session
2. Waits for specified timeout (default 1.5 seconds)
3. Captures terminal pane output using `tmux capture-pane`
4. Returns captured text for parsing

```typescript
tmux send-keys -t ${serverName} "list" C-m
sleep 1.5
tmux capture-pane -t ${serverName} -p
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Minecraft Server Configuration
MINECRAFT_SERVER_SESSION="minecraft-server"
```

**Default Value**: If not set, defaults to `"minecraft-server"`

**Important**: This must match the tmux session name where your Minecraft server is running.

### How to Find Your Session Name

If you're not sure what tmux session your Minecraft server is using:

```bash
# List all tmux sessions
tmux list-sessions

# Or use shorthand
tmux ls
```

Output example:
```
minecraft-server: 1 windows (created Mon Jan 28 10:00:00 2026)
my-server: 1 windows (created Mon Jan 28 11:00:00 2026)
```

Use the session name (before the colon) in your `.env` file.

## API Endpoints

### GET `/api/monitoring/server-status`

Fetches current Minecraft server status and player count.

**Authentication**: Required (Admin or Super Admin)

**Response**:
```json
{
  "status": {
    "online": true,
    "playerCount": 3,
    "maxPlayers": 20,
    "version": "1.20+"
  }
}
```

**Example Usage**:
```javascript
const response = await fetch('/apanel44/api/monitoring/server-status');
const data = await response.json();
console.log('Server is', data.status.online ? 'online' : 'offline');
console.log('Players:', data.status.playerCount);
```

### GET `/api/monitoring/metrics`

Enhanced with better logging and player count integration.

**Response** (includes playerCount):
```json
{
  "metrics": {
    "cpuUsage": 45.2,
    "memoryUsagePercent": 62.8,
    "playerCount": 3,
    "dbStatus": "healthy",
    // ... other metrics
  }
}
```

## Dashboard UI Updates

The dashboard now displays:

- **Server Status Card**:
  - 🟢 Green "Online" when server is running
  - 🔴 Red "Offline" when server is stopped
  - ⚪ Gray "Checking..." during initial load

- **Player Count Card**:
  - Shows actual count from server
  - Updates every 10 seconds
  - Shows 0 when server is offline

## Logging and Debugging

### Console Logs

The implementation includes comprehensive logging:

```
[Minecraft] Fetching player count for server: minecraft-server
[Minecraft] Server session exists, sending 'list' command...
[Minecraft] Raw output received (last 200 chars): ...
[Minecraft] Parsed player count: 3
```

### Viewing Logs

When running in development mode:
```bash
npm run dev
```

Server logs will show:
- When player count is fetched
- Raw Minecraft console output (last 200 characters)
- Parsed player count
- Any errors encountered

### Production Logging

In production, logs are written to the console/log file. Monitor with:
```bash
# If using PM2
pm2 logs smp-admin-panel

# If using systemd
journalctl -u smp-admin-panel -f

# If running with npm start
# Check wherever your process manager logs
```

## Error Handling

### Scenario 1: Server Offline

**Behavior**:
- `tmuxSessionExists()` returns `false`
- Player count: `0`
- Server status: `"Offline"` (red)
- No "list" command is sent

**User Experience**:
- Dashboard shows "Offline" in red
- Player count shows 0
- No errors displayed to user

### Scenario 2: Server Starting Up

**Behavior**:
- Tmux session exists but server hasn't fully started
- "list" command may not respond yet
- Returns player count: `0`

**User Experience**:
- Server shows as "Online"
- Player count: 0 (until server is fully responsive)

### Scenario 3: Unresponsive Server

**Behavior**:
- Session exists but no output captured
- Parser receives empty string
- Returns player count: `0`

**Logs**:
```
[Minecraft] No output received from server. Server may be starting or unresponsive.
```

### Scenario 4: Parse Failures

**Behavior**:
- Output received but doesn't match any known patterns
- Logs raw output for debugging
- Returns player count: `0`

**Logs**:
```
[Minecraft] Could not parse player count from output, returning 0
[Minecraft] Raw output received (last 200 chars): <actual output>
```

## Testing

### Manual Testing Steps

#### Test 1: Server Online with Players

1. Start your Minecraft server in a tmux session
2. Have at least one player connect
3. Open the admin panel dashboard
4. **Expected Results**:
   - Server Status: "Online" (green)
   - Player Count: Actual number of players
   - Updates every 10 seconds

#### Test 2: Server Online with No Players

1. Ensure server is running but no players are online
2. Refresh the dashboard
3. **Expected Results**:
   - Server Status: "Online" (green)
   - Player Count: 0

#### Test 3: Server Offline

1. Stop your Minecraft server (kill the tmux session or run `/stop` in console)
2. Wait for the server to fully stop
3. Refresh the dashboard
4. **Expected Results**:
   - Server Status: "Offline" (red)
   - Player Count: 0

#### Test 4: Server Restart

1. Start with server running and players online
2. Restart the server (stop then start)
3. Monitor the dashboard during restart
4. **Expected Results**:
   - During shutdown: "Offline" + 0 players
   - After startup: "Online" + correct player count
   - Auto-updates within 10 seconds

### Automated Testing

Currently, no automated tests exist for this functionality. To add tests:

1. **Unit Tests**: Mock `tmuxSessionExists` and `sendCommandAndCapture`
2. **Integration Tests**: Test with actual tmux sessions
3. **E2E Tests**: Test full dashboard flow

## Troubleshooting

### Issue: Always Shows "Offline"

**Possible Causes**:
1. Wrong session name in `.env`
2. Tmux not installed
3. Insufficient permissions to check tmux sessions

**Solutions**:
```bash
# Check if tmux is installed
which tmux

# List all sessions to verify name
tmux ls

# Update MINECRAFT_SERVER_SESSION in .env
# Restart the admin panel
```

### Issue: Player Count Always 0

**Possible Causes**:
1. Server not responding to "list" command
2. Output format not recognized
3. Timeout too short for slow servers

**Solutions**:
1. Check server logs manually:
   ```bash
   tmux attach -t minecraft-server
   # Type: list
   # Observe output format
   ```

2. If output format is different, check logs:
   ```
   [Minecraft] Raw output received (last 200 chars): <check this>
   ```

3. Increase timeout in minecraft.ts:
   ```typescript
   const output = await sendCommandAndCapture(serverName, 'list', 3000); // 3 seconds
   ```

### Issue: High CPU Usage

**Possible Cause**: Polling every 10 seconds may be too frequent

**Solution**: Adjust polling interval in dashboard.tsx:
```typescript
const interval = setInterval(() => {
  fetchServerStatus();
}, 30000); // 30 seconds instead of 10
```

### Issue: Permissions Error

**Error**: `Permission denied` when checking tmux sessions

**Solution**: Ensure the Node.js process user has permission to access tmux sessions:
```bash
# Run admin panel as the same user who created the tmux session
# Or add user to appropriate group
```

## Performance Considerations

### Current Implementation

- **Polling Interval**: 10 seconds
- **API Response Time**: ~1.5-2 seconds (includes tmux command execution)
- **Database Impact**: Minimal (only when `?saveHistory=true`)

### Optimization Tips

1. **Increase Polling Interval**: 
   - For low-activity servers: 30-60 seconds
   - Reduces API calls and tmux overhead

2. **Cache Results**:
   - Cache server status for 5-10 seconds
   - Serve from cache if requested within window

3. **WebSocket Alternative**:
   - For real-time updates, consider WebSocket connection
   - Pushes updates only when status changes

## Future Enhancements

### Planned Improvements

1. **Minecraft Query Protocol**:
   - Direct UDP query to Minecraft server
   - More reliable than console parsing
   - Requires `enable-query=true` in server.properties

2. **RCON Integration**:
   - Remote console protocol
   - More efficient than tmux commands
   - Requires RCON password configuration

3. **Player List Display**:
   - Show names of online players, not just count
   - Click to view player details

4. **Historical Tracking**:
   - Graph player count over time
   - Peak hours analysis
   - Player retention metrics

5. **Alerts**:
   - Notify when server goes offline
   - Alert on crash or restart
   - Player threshold notifications

### Alternative Implementations

#### Option 1: Query Protocol (Recommended)

```bash
npm install minecraft-server-util
```

```typescript
import { status } from 'minecraft-server-util';

const response = await status('localhost', 25565);
console.log(response.players.online); // Player count
```

**Pros**:
- More reliable
- Faster response
- No tmux dependency

**Cons**:
- Requires server configuration
- Needs network access to server port

#### Option 2: RCON

```bash
npm install rcon-client
```

```typescript
import { Rcon } from 'rcon-client';

const rcon = await Rcon.connect({
  host: 'localhost',
  port: 25575,
  password: process.env.RCON_PASSWORD
});

const response = await rcon.send('list');
```

**Pros**:
- Secure authentication
- Direct command execution
- No console parsing needed

**Cons**:
- Requires RCON setup
- Password management
- Additional network port

## Security Considerations

### Current Implementation

1. **Authentication**: All endpoints require Admin/Super Admin role
2. **Input Validation**: Server name is sanitized in tmux commands
3. **Command Injection**: Protected by using parameter arrays

### Best Practices

1. **Never expose tmux session names to users**
2. **Validate MINECRAFT_SERVER_SESSION** environment variable
3. **Limit API rate** to prevent abuse
4. **Log all server status checks** for audit trail

## Conclusion

This implementation provides accurate, real-time server status and player count by:
- Checking actual tmux session existence
- Parsing real Minecraft console output
- Handling errors gracefully
- Providing comprehensive logging

The system is production-ready and can be deployed immediately with proper configuration.

For support or issues, check the logs first, then consult this documentation.
