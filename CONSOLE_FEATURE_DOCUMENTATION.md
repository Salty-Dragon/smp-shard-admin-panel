# Server Console Feature Documentation

## Overview

The Server Console feature allows Admin and Super Admin users to execute commands on the Minecraft server directly through the admin panel interface. Commands are executed via the tmux session where the PaperMC server runs.

## Features

### 1. Role-Based Command Access

- **Super Admins**: Full access to all Minecraft server commands
- **Admins**: Restricted access to approved commands only

### 2. Approved Commands for Admins

Admins can execute the following commands:
- `list` - List online players
- `whitelist` - Manage whitelist
- `ban` - Ban players
- `pardon` - Unban players
- `kick` - Kick players
- `tp` - Teleport players
- `give` - Give items to players
- `gamemode` - Change gamemode
- `time` - Set time
- `weather` - Set weather
- `difficulty` - Change difficulty
- `seed` - View world seed
- `say` - Broadcast message
- `tell`, `msg`, `w` - Send private messages
- `help` - View help

### 3. Special Server Management Commands

The console provides special handling for server management commands:

- **`start`** - Executes `./start.sh` to start the server (Admins and Super Admins)
- **`restart`** - Safely restarts the server by stopping and running `./start.sh` (Admins and Super Admins)
- **`stop`** - Stops the server (Super Admins only)

These commands are handled specially to prevent the tmux session from becoming disconnected. See `SERVER_MANAGEMENT_GUIDE.md` for detailed usage.

### 4. Security Features

- **Authentication**: All requests require valid session authentication
- **Authorization**: Only Admin and Super Admin roles can access the console
- **Command Sanitization**: Session names and commands are sanitized to prevent injection attacks
- **Command Length Validation**: Commands are limited to 1000 characters maximum
- **Activity Logging**: All command executions are logged with:
  - User who executed the command
  - Command text
  - Execution status (executed/denied/error)
  - Timestamp
  - IP address

### 5. User Interface

- **Terminal-like Output Display**: Shows command results in a scrollable black terminal
- **Command Input**: Text field with autocomplete suggestions
- **Command History Sidebar**: Displays recent commands executed by all users
- **Visual Feedback**: Color-coded status indicators (green=executed, red=denied, yellow=error)
- **Full Navigation**: Consistent navigation bar with other admin pages

## Technical Implementation

### API Endpoints

#### POST `/apanel44/api/server/console`
Executes a command on the Minecraft server.

**Request Body:**
```json
{
  "command": "list"
}
```

**Response (Success):**
```json
{
  "success": true,
  "command": "list",
  "output": "There are 3 of a max of 20 players online: Player1, Player2, Player3",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Response (Denied):**
```json
{
  "error": "Forbidden",
  "message": "Command 'stop' is not allowed for Admin role. Only Super Admins can execute this command."
}
```

#### GET `/apanel44/api/server/console?limit=20&page=1`
Retrieves command history from activity logs.

**Query Parameters:**
- `limit` (optional): Number of logs to return (1-100, default: 50)
- `page` (optional): Page number for pagination (default: 1)

**Response:**
```json
{
  "logs": [
    {
      "id": "...",
      "user": {
        "name": "Admin User",
        "email": "admin@example.com",
        "role": { "name": "Admin" }
      },
      "timestamp": "2024-01-01T12:00:00.000Z",
      "ipAddress": "192.168.1.1",
      "details": {
        "command": "list",
        "status": "executed",
        "outputLength": 85
      }
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### Frontend Route

**URL**: `/apanel44/console`

**Access**: Admins and Super Admins only

**Features**:
- Real-time command execution
- Terminal-style output display
- Command autocomplete
- Command history sidebar
- Error handling with toast notifications

## Configuration

The console feature uses the `MINECRAFT_SERVER_SESSION` environment variable from `.env`:

```env
MINECRAFT_SERVER_SESSION="minecraft-server"
```

This should match the tmux session name where the Minecraft server is running.

## Usage Examples

### Example 1: List Online Players
1. Navigate to Console page from the navigation menu
2. Type `list` in the command input
3. Press Execute or hit Enter
4. View the output showing online players

### Example 2: Ban a Player (Admin)
1. Type `ban PlayerName Griefing`
2. Press Execute
3. View confirmation in output

### Example 3: Denied Command (Admin)
1. Type `stop` (not in allowed list)
2. Press Execute
3. Receive error: "Command 'stop' is not allowed for Admin role"

## Activity Logging

All console command executions are logged in the database with action type `server_command` and resource `console`. Logs include:

- User information (name, email, role)
- Command text
- Execution status (executed/denied/error)
- IP address
- Timestamp
- Additional details (error messages, output length)

Logs can be viewed in the Activity Logs page (`/apanel44/logs`) by Super Admins and Moderators.

## Files Changed/Added

### New Files
- `/src/pages/api/server/console.ts` - API endpoint for command execution and history
- `/src/pages/console.tsx` - Frontend console interface
- `/src/lib/console-constants.ts` - Shared constants for allowed commands

### Modified Files
- `/src/pages/dashboard.tsx` - Added console link to navigation
- `/src/pages/plugins.tsx` - Added console link to navigation

## Security Considerations

1. **Command Injection Prevention**: Session names and commands are sanitized using strict regex patterns
2. **Role-Based Access Control**: Only authorized roles can access the console
3. **Audit Trail**: All commands are logged for accountability
4. **Length Limits**: Commands are limited to prevent resource exhaustion
5. **Error Handling**: Failed JSON parsing and network errors are handled gracefully
6. **No Direct Shell Access**: Commands are executed through tmux, not direct shell access

## Maintenance

### Adding New Allowed Commands for Admins

Edit `/src/lib/console-constants.ts`:

```typescript
export const ADMIN_ALLOWED_COMMANDS = [
  'list',
  'whitelist',
  // ... existing commands
  'newcommand',  // Add new command here
] as const;
```

The change will automatically apply to both frontend and backend.

### Changing Command Length Limit

Edit `/src/lib/console-constants.ts`:

```typescript
export const MAX_COMMAND_LENGTH = 1000;  // Change this value
```

## Troubleshooting

### "Minecraft server tmux session not found"
- Verify the `MINECRAFT_SERVER_SESSION` environment variable matches your actual tmux session name
- Check if the Minecraft server is running: `tmux ls`
- Start the server if needed

### Commands not executing
- Verify user has Admin or Super Admin role
- Check if the command is in the allowed list (for Admins)
- Review activity logs for error details

### History not loading
- Check database connection
- Verify activity logs are being created
- Check browser console for network errors

### Special commands (start, restart, stop)
The console now provides special handling for server management commands:

**`start` command**: Executes `./start.sh` to start the server
- Requires `./start.sh` to exist in the server directory
- Script must be executable (`chmod +x start.sh`)
- Available to both Admins and Super Admins

**`restart` command**: Safely restarts the server
- Sends `stop` command to server
- Waits 5 seconds for clean shutdown
- Executes `./start.sh` to restart
- Available to both Admins and Super Admins

**`stop` command**: Stops the server
- Available to Super Admins only
- After stopping, use `start` command to restart

For detailed information, see `SERVER_MANAGEMENT_GUIDE.md`.
