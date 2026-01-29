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
