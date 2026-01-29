/**
 * Server Console Constants
 * Shared configuration for server console commands
 */

/**
 * List of commands that Admins (non-Super Admins) are allowed to execute
 * Super Admins have access to all commands
 */
export const ADMIN_ALLOWED_COMMANDS = [
  'list',
  'whitelist',
  'ban',
  'pardon',
  'kick',
  'tp',
  'give',
  'gamemode',
  'time',
  'weather',
  'difficulty',
  'seed',
  'say',
  'tell',
  'msg',
  'w',
  'help',
] as const;

/**
 * Maximum allowed length for a command string
 */
export const MAX_COMMAND_LENGTH = 1000;

/**
 * Commands that are blocked from execution via the web console
 * These commands can cause the tmux session to become unresponsive or break the console connection
 */
export const BLOCKED_COMMANDS = [
  'restart', // Restarts the Java process, breaking tmux session connection
  'stop',    // Stops the server, breaking tmux session connection
] as const;

/**
 * Explanation messages for blocked commands
 */
export const BLOCKED_COMMAND_MESSAGES: Record<string, string> = {
  'restart': 'The "restart" command cannot be executed via the web console because it breaks the tmux session connection. To restart the server, please use tmux directly: 1) Attach to the session with "tmux attach -t minecraft-server", 2) Execute the restart command, or 3) Use a server management script if available.',
  'stop': 'The "stop" command cannot be executed via the web console because it breaks the tmux session connection. To stop the server, please use tmux directly or a server management script.',
};
