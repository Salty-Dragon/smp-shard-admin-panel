# UI Preview: Server Management Commands

## Console Page (`/apanel44/console/`)

### Info Boxes Displayed

#### 1. Command Permissions Box (Blue)
```
┌────────────────────────────────────────────────────────────────┐
│ ℹ️  Command Permissions                                         │
│                                                                │
│ As a Super Admin, you have access to all commands.            │
│ (or)                                                           │
│ As an Admin, you have access to player management,            │
│ gameplay, and information commands.                            │
│                                                                │
│ Allowed commands: list, whitelist, ban, pardon, kick, tp,     │
│ give, gamemode, time, weather, difficulty, seed, say, tell,   │
│ msg, w, help, start, restart                                  │
└────────────────────────────────────────────────────────────────┘
```

#### 2. Special Commands Info Box (Green) - NEW!
```
┌────────────────────────────────────────────────────────────────┐
│ 🔧  Special Commands Available                                  │
│                                                                │
│ start - Executes ./start.sh to start the server               │
│                                                                │
│ restart - Safely restarts by sending stop command,            │
│           then executes ./start.sh                            │
│                                                                │
│ stop - Stops the server (Super Admin only)                    │
└────────────────────────────────────────────────────────────────┘
```

### Command Output Display

#### Example: Starting the Server
```
┌────────────────────────────────────────────────────────────────┐
│ Command Output                                    [Clear]      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ > start                                                        │
│ [13:45:21] [Server thread/INFO]: Starting minecraft server    │
│ [13:45:21] [Server thread/INFO]: Loading properties          │
│ [13:45:22] [Server thread/INFO]: Preparing level "world"     │
│ [13:45:23] [Server thread/INFO]: Done (1.8s)!                │
│ 2026-01-29T13:45:23.000Z                                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### Example: Restarting the Server
```
┌────────────────────────────────────────────────────────────────┐
│ Command Output                                    [Clear]      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ > restart                                                      │
│ Server restart initiated: Stop command sent, waited 5000ms,   │
│ then started with ./start.sh                                  │
│ 2026-01-29T13:50:15.000Z                                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### Example: Permission Denied (Admin trying to use stop)
```
┌────────────────────────────────────────────────────────────────┐
│ Command Output                                    [Clear]      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ > stop                                                         │
│ Error: The "stop" command is only available to Super Admins.  │
│ 2026-01-29T13:55:00.000Z                                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Command Input with Autocomplete

#### Typing "sta"
```
┌────────────────────────────────────────────────────────────────┐
│ [sta                                              ] [Execute]  │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ start                                                    │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

#### Typing "res"
```
┌────────────────────────────────────────────────────────────────┐
│ [res                                              ] [Execute]  │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ restart                                                  │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

#### Typing "sto" (Super Admin only)
```
┌────────────────────────────────────────────────────────────────┐
│ [sto                                              ] [Execute]  │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ stop                                                     │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Command History Sidebar

#### Recent Commands Display
```
┌────────────────────────────────────────┐
│ Command History                        │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ restart              [executed]    │ │
│ │ by Admin User                      │ │
│ │ 2026-01-29 13:50:15               │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ start                [executed]    │ │
│ │ by Admin User                      │ │
│ │ 2026-01-29 13:45:23               │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ stop                 [denied]      │ │
│ │ by Regular Admin                   │ │
│ │ 2026-01-29 13:55:00               │ │
│ │ The "stop" command is only...     │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

## Color Scheme

### Info Boxes
- **Blue Box** (Command Permissions): `bg-blue-900/30 border-blue-700`
- **Green Box** (Special Commands): `bg-green-900/30 border-green-700`

### Command Output
- **Success**: Green text (`text-green-400`)
- **Error**: Red text (`text-red-400`)
- **Timestamp**: Gray text (`text-stone-600`)

### Command History Status
- **Executed**: Green badge (`bg-green-900 text-green-300`)
- **Denied**: Red badge (`bg-red-900 text-red-300`)
- **Error**: Yellow badge (`bg-yellow-900 text-yellow-300`)

## User Experience Flow

### Scenario 1: Restarting the Server

1. User navigates to `/apanel44/console/`
2. Sees the green "Special Commands Available" info box
3. Types `restart` in the command input
4. Autocomplete suggests `restart`
5. User presses Enter or clicks Execute
6. Output shows: "Server restart initiated: Stop command sent, waited 5000ms, then started with ./start.sh"
7. Command history shows `restart [executed]`
8. Server restarts without breaking the tmux session

### Scenario 2: Starting a Stopped Server

1. User notices server is stopped (no response to `list` command)
2. Types `start` in the command input
3. Autocomplete suggests `start`
4. User executes the command
5. Output shows server startup logs from `./start.sh`
6. Server comes online
7. Console remains functional

### Scenario 3: Admin Tries to Use Stop (Permission Denied)

1. Admin user types `stop` in the command input
2. `stop` appears in autocomplete (showing it exists)
3. User executes the command
4. Output shows: "Error: The 'stop' command is only available to Super Admins."
5. Command is logged as [denied] in history
6. User understands they need Super Admin privileges

## Mobile Responsive Design

On mobile devices, the layout adjusts:
- Info boxes stack vertically
- Command history moves below the console
- Command input remains fixed at bottom
- Autocomplete dropdown adjusts to screen width

## Accessibility Features

- High contrast colors for readability
- Clear status indicators (colors + text)
- Keyboard navigation support
- Screen reader friendly labels
- Focus indicators on interactive elements

---

**Note**: The actual UI is rendered using React/TailwindCSS with the Minecraft-themed design (stone textures, green accents, pixelated font effects). This preview shows the functional layout and information displayed.
