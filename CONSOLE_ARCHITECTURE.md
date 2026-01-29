# Server Console Feature Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Interface Layer                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Console Page (/console)                        │  │
│  │                                                                    │  │
│  │  ┌────────────────────┐  ┌──────────────────────────────────┐   │  │
│  │  │  Command Input     │  │   Command History Sidebar        │   │  │
│  │  │  - Autocomplete    │  │   - Recent executions           │   │  │
│  │  │  - Validation      │  │   - Status indicators           │   │  │
│  │  └────────────────────┘  │   - User attribution            │   │  │
│  │                          └──────────────────────────────────┘   │  │
│  │  ┌─────────────────────────────────────────────────────────┐   │  │
│  │  │         Terminal Output Display                         │   │  │
│  │  │         - Real-time command results                     │   │  │
│  │  │         - Scrollable history                            │   │  │
│  │  │         - Color-coded status                            │   │  │
│  │  └─────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API Layer (Next.js)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │         POST /apanel44/api/server/console                         │  │
│  │         GET  /apanel44/api/server/console                         │  │
│  │                                                                    │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Middleware Chain                         │  │  │
│  │  │  1. withAdmin() - Session validation                        │  │  │
│  │  │  2. Role check (Admin or Super Admin)                       │  │  │
│  │  │  3. Extract user info from session                          │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │                  Request Handlers                           │  │  │
│  │  │                                                              │  │  │
│  │  │  handlePost():                                              │  │  │
│  │  │    - Validate command (type, length, emptiness)            │  │  │
│  │  │    - Check role-based permissions                          │  │  │
│  │  │    - Sanitize command and session name                     │  │  │
│  │  │    - Verify tmux session exists                            │  │  │
│  │  │    - Execute command via console.ts                        │  │  │
│  │  │    - Log activity to database                              │  │  │
│  │  │    - Return output or error                                │  │  │
│  │  │                                                              │  │  │
│  │  │  handleGet():                                               │  │  │
│  │  │    - Validate pagination params                            │  │  │
│  │  │    - Query activity logs for server_command entries        │  │  │
│  │  │    - Parse JSON details safely                             │  │  │
│  │  │    - Return paginated results                              │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                    │                                │
                    │                                │
                    ▼                                ▼
┌──────────────────────────────┐    ┌──────────────────────────────────┐
│   Minecraft Server Layer     │    │      Database Layer (Prisma)     │
├──────────────────────────────┤    ├──────────────────────────────────┤
│                              │    │                                  │
│  ┌────────────────────────┐ │    │  ┌────────────────────────────┐ │
│  │  console.ts Utilities  │ │    │  │     ActivityLog Table      │ │
│  │                        │ │    │  │                            │ │
│  │  Functions:            │ │    │  │  Fields:                   │ │
│  │  - tmuxSessionExists() │ │    │  │  - id                      │ │
│  │  - sendCommandAndCapture│ │    │  │  - userId                  │ │
│  │  - sanitizeSessionName()│ │    │  │  - actionType             │ │
│  │  - sanitizeCommand()   │ │    │  │  - resource               │ │
│  │                        │ │    │  │  - details (JSON)          │ │
│  └────────────────────────┘ │    │  │  - ipAddress               │ │
│            │                │    │  │  - timestamp               │ │
│            ▼                │    │  └────────────────────────────┘ │
│  ┌────────────────────────┐ │    │                                  │
│  │    Tmux Session        │ │    │  Stores:                         │
│  │  "minecraft-server"    │ │    │  - All command executions        │
│  │                        │ │    │  - Success/denied/error status   │
│  │  Commands sent via:    │ │    │  - User attribution              │
│  │  tmux send-keys        │ │    │  - IP addresses for audit        │
│  │                        │ │    │                                  │
│  └────────────────────────┘ │    └──────────────────────────────────┘
│            │                │
│            ▼                │
│  ┌────────────────────────┐ │
│  │   PaperMC Server       │ │
│  │   (Minecraft)          │ │
│  │                        │ │
│  │   Executes commands    │ │
│  │   Returns output       │ │
│  └────────────────────────┘ │
└──────────────────────────────┘
```

## Data Flow

### Command Execution Flow

```
1. User Input
   └─> User types "list" in console page
       └─> Frontend validates input locally
           └─> Autocomplete suggests commands based on role

2. API Request
   └─> POST /apanel44/api/server/console
       Body: { command: "list" }
       Headers: Cookie (session token)

3. Authentication & Authorization
   └─> withAdmin middleware checks:
       ├─> Valid session? ✓
       ├─> User authenticated? ✓
       └─> Role is Admin or Super Admin? ✓

4. Command Validation
   └─> isCommandAllowed() checks:
       ├─> Command not empty? ✓
       ├─> Length <= 1000 chars? ✓
       └─> Command allowed for user role? ✓
           ├─> Super Admin: All commands allowed
           └─> Admin: Must be in ADMIN_ALLOWED_COMMANDS

5. Tmux Session Verification
   └─> tmuxSessionExists() checks:
       └─> Session "minecraft-server" exists? ✓

6. Command Execution
   └─> sendCommandAndCapture() executes:
       ├─> Sanitize session name (prevent injection)
       ├─> Sanitize command (escape quotes)
       ├─> Send via tmux: tmux send-keys -t session 'command' C-m
       ├─> Wait 2 seconds
       └─> Capture output: tmux capture-pane -t session -p

7. Activity Logging
   └─> logActivity() creates record:
       ├─> userId: "user-id"
       ├─> actionType: "server_command"
       ├─> resource: "console"
       ├─> details: { command, status: "executed", outputLength: 85 }
       ├─> ipAddress: "192.168.1.1"
       └─> timestamp: "2024-01-01T12:00:00.000Z"

8. Response
   └─> API returns:
       {
         "success": true,
         "command": "list",
         "output": "There are 3 of a max of 20 players...",
         "timestamp": "2024-01-01T12:00:00.000Z"
       }

9. UI Update
   └─> Console page displays:
       ├─> Add command to output display
       ├─> Show result in green
       ├─> Refresh command history sidebar
       └─> Show success toast notification
```

### Command History Retrieval Flow

```
1. Page Load / Refresh
   └─> GET /apanel44/api/server/console?limit=20

2. Authentication
   └─> withAdmin middleware validates session

3. Database Query
   └─> Query ActivityLog table:
       WHERE actionType = 'server_command'
         AND resource = 'console'
       ORDER BY timestamp DESC
       LIMIT 20

4. Response Processing
   └─> Parse JSON details safely
       └─> Return structured logs with user info

5. UI Display
   └─> Render in command history sidebar
       └─> Color-coded by status (green/red/yellow)
```

## Security Checkpoints

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Network Security                                   │
│  └─> HTTPS encryption (production)                           │
│      └─> Session cookies (httpOnly, secure)                  │
│                                                               │
│  Layer 2: Authentication                                     │
│  └─> NextAuth session validation                             │
│      └─> JWT token verification                              │
│                                                               │
│  Layer 3: Authorization                                      │
│  └─> Role-based access control (withAdmin)                   │
│      └─> Only Admin + Super Admin allowed                    │
│                                                               │
│  Layer 4: Input Validation                                   │
│  └─> Command validation (type, length, emptiness)            │
│      └─> Role-based command filtering                        │
│          ├─> Super Admin: All commands                       │
│          └─> Admin: 18 approved commands only                │
│                                                               │
│  Layer 5: Input Sanitization                                 │
│  └─> Session name: Allow only [a-zA-Z0-9_-]                  │
│      └─> Command: Escape single quotes                       │
│                                                               │
│  Layer 6: Safe Execution                                     │
│  └─> No direct shell access                                  │
│      └─> Commands via tmux send-keys only                    │
│                                                               │
│  Layer 7: Audit Logging                                      │
│  └─> All commands logged with full context                   │
│      └─> User, IP, command, status, timestamp                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Dependencies

```
console.tsx
  ├─> Imports
  │   ├─> next-auth/react (session management)
  │   ├─> @/components/Toast (notifications)
  │   ├─> @/components/Spinner (loading states)
  │   └─> @/lib/console-constants (shared constants)
  │
  └─> API Calls
      ├─> POST /apanel44/api/server/console (execute)
      └─> GET /apanel44/api/server/console (history)

api/server/console.ts
  ├─> Imports
  │   ├─> @/lib/middleware (withAdmin)
  │   ├─> @/lib/console (command execution)
  │   ├─> @/lib/activity (logging)
  │   ├─> @/lib/prisma (database)
  │   └─> @/lib/console-constants (shared constants)
  │
  └─> Functions
      ├─> isCommandAllowed() - validation
      ├─> handlePost() - execute commands
      └─> handleGet() - retrieve history

lib/console-constants.ts
  └─> Exports
      ├─> ADMIN_ALLOWED_COMMANDS (18 commands)
      └─> MAX_COMMAND_LENGTH (1000)
```

## Configuration Files

```
.env
  └─> MINECRAFT_SERVER_SESSION="minecraft-server"
      └─> Must match actual tmux session name

next.config.ts
  └─> basePath: '/apanel44'
      └─> All routes prefixed with /apanel44

prisma/schema.prisma
  └─> ActivityLog model
      └─> Stores all command executions
```

---

This architecture provides a secure, maintainable, and user-friendly interface for executing Minecraft server commands through the admin panel.
