# Server Restart and Stop Guide

## Why restart/stop commands are blocked in the web console

The Minecraft server's built-in `restart` and `stop` commands cannot be used safely through the web console interface. Here's why:

### The Problem

When you execute the `restart` command through the web console:

1. **Command is sent to tmux session**: The web console sends the restart command to the tmux session where the Minecraft server is running
2. **Server process terminates**: The Minecraft server receives the command and begins shutting down
3. **Java process exits**: The Minecraft server's Java process completely terminates
4. **Tmux session becomes inactive**: The tmux session, which was running the Minecraft server, now has no active process
5. **Console breaks**: The tmux session drops to a shell prompt (e.g., `minecraft@server:~/dev$`)
6. **Commands fail**: Subsequent commands typed in the web console are sent to the shell, not to the Minecraft server

### What happens after the issue occurs

After the restart command breaks the console:
- The tmux session shows the current path (e.g., `minecraft@server:~/dev$`)
- The Minecraft server may be running in the background (if it auto-restarted somehow)
- Commands entered in the web console have no effect
- The web console appears "frozen" or unresponsive
- Checking `ps aux | grep java` shows the server process, but the console doesn't interact with it

### Why this happens

Minecraft's `restart` command is designed for environments where:
- A wrapper script automatically restarts the server when it exits
- The server is configured with automatic restart mechanisms
- The process manager (like systemd) handles restarts

When run directly in a tmux session without these mechanisms, the server simply exits and nothing restarts it.

## Solutions

### Option 1: Use tmux directly (Recommended for immediate restarts)

This is the safest method when you need to restart the server immediately:

1. **SSH into the server** where Minecraft is running

2. **Attach to the tmux session**:
   ```bash
   tmux attach -t minecraft-server
   ```
   Replace `minecraft-server` with your actual session name (check `MINECRAFT_SERVER_SESSION` in `.env`)

3. **Stop the server gracefully**:
   ```
   stop
   ```
   Wait for the server to fully shut down (watch for "Closing Server" messages)

4. **Start the server again**:
   ```bash
   java -Xms4G -Xmx4G -jar paper.jar --nogui
   ```
   Replace with your actual startup command

5. **Detach from tmux**:
   Press `Ctrl+B`, then press `D`

6. **Verify in web console**:
   Go back to the web console and try executing a `list` command to verify connectivity

### Option 2: Create a server management script

Create a wrapper script that automatically restarts the server when it exits:

1. **Create restart script** (`/home/minecraft/start-server.sh`):
   ```bash
   #!/bin/bash
   cd /home/minecraft/server
   
   while true; do
       echo "Starting Minecraft server..."
       java -Xms4G -Xmx4G -jar paper.jar --nogui
       
       # Check exit code
       EXIT_CODE=$?
       
       if [ $EXIT_CODE -eq 0 ]; then
           echo "Server stopped gracefully."
           break
       else
           echo "Server crashed with exit code $EXIT_CODE. Restarting in 10 seconds..."
           sleep 10
       fi
   done
   ```

2. **Make it executable**:
   ```bash
   chmod +x /home/minecraft/start-server.sh
   ```

3. **Start the server with the script in tmux**:
   ```bash
   tmux new-session -s minecraft-server -d
   tmux send-keys -t minecraft-server "/home/minecraft/start-server.sh" C-m
   ```

4. **Now restart works**: With this script, when you execute `restart` from the web console, the server will automatically restart within the same tmux session

### Option 3: Use systemd (Best for production)

For production servers, using systemd is the most robust solution:

1. **Create systemd service** (`/etc/systemd/system/minecraft.service`):
   ```ini
   [Unit]
   Description=Minecraft Server
   After=network.target

   [Service]
   Type=simple
   User=minecraft
   Group=minecraft
   WorkingDirectory=/home/minecraft/server
   ExecStart=/usr/bin/java -Xms4G -Xmx4G -jar paper.jar --nogui
   Restart=on-failure
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

2. **Enable and start the service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable minecraft
   sudo systemctl start minecraft
   ```

3. **View logs**:
   ```bash
   sudo journalctl -u minecraft -f
   ```

4. **Restart the server**:
   ```bash
   sudo systemctl restart minecraft
   ```

**Note**: When using systemd, you would need to modify the web console to integrate with systemd commands or document that manual restart via systemd is required.

### Option 4: Use a Minecraft-specific server management tool

Consider using dedicated server management tools like:
- **Pterodactyl Panel**: Full-featured game server management panel
- **McMyAdmin**: Commercial Minecraft server management
- **AMP (Application Management Panel)**: Multi-game server manager

These tools have built-in restart mechanisms that work correctly with tmux or other process managers.

## Prevention: What the web console now does

To prevent this issue, the SMP Admin Panel now:

1. **Blocks restart and stop commands**: The API will reject these commands with a clear error message
2. **Shows a warning**: The console page displays a warning box explaining that restart/stop are not available
3. **Provides guidance**: Error messages include instructions on how to properly restart the server
4. **Logs blocked attempts**: All blocked command attempts are logged for audit purposes

When you try to execute `restart` or `stop`, you'll see:

```
Error: The "restart" command cannot be executed via the web console because it 
breaks the tmux session connection. To restart the server, please use tmux 
directly: 1) Attach to the session with "tmux attach -t minecraft-server", 
2) Execute the restart command, or 3) Use a server management script if available.
```

## Verifying your setup

To check if your server is set up correctly:

1. **Check if tmux session exists**:
   ```bash
   tmux ls
   ```
   You should see your minecraft-server session

2. **Check if server is running**:
   ```bash
   ps aux | grep java
   ```
   You should see the Minecraft server process

3. **Attach to session and verify output**:
   ```bash
   tmux attach -t minecraft-server
   ```
   You should see Minecraft server logs, not a shell prompt

4. **Test web console**:
   - Go to `/apanel44/console/`
   - Execute `list` command
   - You should see player list or "There are 0 players online"

If you see a shell prompt in the tmux session, the console is broken and you need to manually start the server again.

## Recovery steps if console is already broken

If your console is already broken from a previous restart:

1. **Check for running processes**:
   ```bash
   ps aux | grep java
   ```

2. **If server is running in background**:
   ```bash
   # Find the PID
   ps aux | grep java | grep -v grep
   
   # Kill the process
   kill <PID>
   ```

3. **Attach to tmux session**:
   ```bash
   tmux attach -t minecraft-server
   ```
   You'll see a shell prompt

4. **Start the server**:
   ```bash
   cd /home/minecraft/server
   java -Xms4G -Xmx4G -jar paper.jar --nogui
   ```

5. **Detach from tmux**:
   Press `Ctrl+B`, then `D`

6. **Test the web console**:
   Execute `list` command to verify it works

## Recommendations

For the best experience with the SMP Admin Panel:

1. **Use a restart script** (Option 2 above) if you need restart functionality
2. **Or use systemd** (Option 3 above) for production deployments
3. **Avoid manual restarts** unless absolutely necessary
4. **Use the web console** for all regular commands (list, kick, ban, etc.)
5. **Document your setup** so other admins know the proper restart procedure
6. **Consider scheduling** restarts during low-traffic periods
7. **Test your restart procedure** in a development environment first

## Additional notes

- The `save-all` command is NOT blocked and can be used safely before manual restarts
- Plugins like Restart can be configured with countdown timers and automatic restart scripts
- Some server implementations (like Spigot) have plugins that handle restart properly
- Always test restart procedures in a development environment before using in production

## Questions?

If you have questions about server restart procedures, consult:
- Your server hosting provider's documentation
- The Minecraft server software documentation (Paper, Spigot, etc.)
- The tmux manual: `man tmux`
- The SMP Admin Panel documentation: `CONSOLE_FEATURE_DOCUMENTATION.md`
