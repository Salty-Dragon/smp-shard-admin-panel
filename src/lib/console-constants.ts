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
export const SPECIAL_COMMANDS = {
  start: 'start',    // Aliased to "./start.sh" script
  restart: 'restart', // Hijacked to run stop + start.sh
} as const;

/**
 * Information messages for special commands
 */
export const SPECIAL_COMMAND_INFO: Record<string, string> = {
  'start': 'Executes the ./start.sh script to start the server',
  'restart': 'Safely restarts the server by executing stop command followed by ./start.sh',
};
