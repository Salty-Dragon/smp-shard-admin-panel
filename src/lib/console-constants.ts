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
 * Special commands that require custom handling
 * These commands are transformed before being sent to the server
 */
export const SPECIAL_COMMANDS = ['start', 'restart'] as const;

/**
 * Information messages for special commands
 */
export const SPECIAL_COMMAND_INFO: Record<string, string> = {
  'start': 'Executes the server startup script',
  'restart': 'Safely restarts the server by executing stop command followed by startup script',
};

/**
 * Server startup script path (relative to tmux working directory)
 * Can be overridden via MINECRAFT_START_SCRIPT environment variable
 */
export const DEFAULT_START_SCRIPT = './start.sh';

/**
 * Wait time in milliseconds after sending stop command during restart
 */
export const RESTART_WAIT_MS = 5000;
