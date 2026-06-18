/**
 * Config File Backups
 *
 * Every edit (and delete) of a plugin config file creates a timestamped backup
 * so changes can be reviewed and restored from the panel. Backups are stored
 * outside the browsable plugins tree (under <serverPath>/.apanel-backups) so
 * they never appear in the plugin file browser and can't themselves be edited.
 *
 * Backups are per server instance and mirror the file's relative path, e.g.
 *   /opt/minecraft/dev/.apanel-backups/ShardsSMPv2/config.yml/2026-06-18T23-45-01-123Z.bak
 */

import path from 'path';
import fs from 'fs/promises';
import { getServerInstance } from './serverInstances';
import { getPluginsDir, validateAndResolvePath } from './fileUtils';

const BACKUP_DIR_NAME = '.apanel-backups';

// How many backups to retain per file. Older ones are pruned automatically.
export const MAX_BACKUPS_PER_FILE = 30;

// A valid backup id is a single path segment ending in .bak (no separators).
const BACKUP_ID_PATTERN = /^[\w.\-]+\.bak$/;

export interface BackupInfo {
  /** Backup filename, used as the id when restoring. */
  id: string;
  /** ISO timestamp of when the backup was created. */
  createdAt: string;
  /** Size of the backed-up content in bytes. */
  size: number;
}

/**
 * Root directory where backups for a given instance live.
 * Sits next to the plugins directory, never inside it.
 */
function getBackupRoot(instanceId?: string): string {
  const instance = getServerInstance(instanceId);
  const base = instance?.serverPath || path.dirname(getPluginsDir(instanceId));
  return path.join(base, BACKUP_DIR_NAME);
}

/**
 * Resolve `sub` under `root`, returning null if it would escape `root`.
 * Guards against path traversal in the backup tree.
 */
function resolveWithin(root: string, sub: string): string | null {
  const full = path.resolve(root, sub);
  if (full !== root && !full.startsWith(root + path.sep)) {
    return null;
  }
  return full;
}

/**
 * The directory that holds all backups for a single file.
 */
function backupDirForFile(relativePath: string, instanceId?: string): string | null {
  return resolveWithin(getBackupRoot(instanceId), relativePath);
}

/**
 * Remove the oldest backups beyond MAX_BACKUPS_PER_FILE.
 * Backup filenames are timestamp-prefixed, so a reverse lexical sort is chronological.
 */
async function pruneBackups(backupDir: string): Promise<void> {
  try {
    const entries = (await fs.readdir(backupDir)).filter((name) => name.endsWith('.bak'));
    if (entries.length <= MAX_BACKUPS_PER_FILE) {
      return;
    }
    const stale = entries.sort().reverse().slice(MAX_BACKUPS_PER_FILE);
    await Promise.all(
      stale.map((name) => fs.unlink(path.join(backupDir, name)).catch(() => {}))
    );
  } catch {
    // Pruning is best-effort; never fail an edit because cleanup failed.
  }
}

/**
 * Create a backup of the current on-disk content of a file before it is
 * overwritten or deleted. Returns the backup metadata, or null if there was
 * nothing to back up (file doesn't exist yet) or the path was invalid.
 */
export async function createBackup(relativePath: string, instanceId?: string): Promise<BackupInfo | null> {
  const source = validateAndResolvePath(relativePath, false, instanceId);
  if (!source) {
    return null;
  }

  let content: Buffer;
  try {
    content = await fs.readFile(source);
  } catch {
    // Nothing to back up (new file, or unreadable) — not an error.
    return null;
  }

  const backupDir = backupDirForFile(relativePath, instanceId);
  if (!backupDir) {
    return null;
  }

  const now = new Date();
  const id = `${now.toISOString().replace(/[:.]/g, '-')}.bak`;

  await fs.mkdir(backupDir, { recursive: true });
  await fs.writeFile(path.join(backupDir, id), content);
  await pruneBackups(backupDir);

  return { id, createdAt: now.toISOString(), size: content.length };
}

/**
 * List available backups for a file, newest first.
 */
export async function listBackups(relativePath: string, instanceId?: string): Promise<BackupInfo[]> {
  const backupDir = backupDirForFile(relativePath, instanceId);
  if (!backupDir) {
    return [];
  }

  let names: string[];
  try {
    names = (await fs.readdir(backupDir)).filter((name) => name.endsWith('.bak'));
  } catch {
    return [];
  }

  const backups = await Promise.all(
    names.map(async (name) => {
      const stats = await fs.stat(path.join(backupDir, name));
      return { id: name, createdAt: stats.mtime.toISOString(), size: stats.size };
    })
  );

  // Newest first.
  return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Restore a file from one of its backups. The current content is itself backed
 * up first, so a restore is always reversible.
 */
export async function restoreBackup(
  relativePath: string,
  backupId: string,
  instanceId?: string
): Promise<void> {
  if (!BACKUP_ID_PATTERN.test(backupId)) {
    throw new Error('Invalid backup id');
  }

  const backupDir = backupDirForFile(relativePath, instanceId);
  if (!backupDir) {
    throw new Error('Invalid file path');
  }

  const backupFile = path.join(backupDir, backupId);
  // BACKUP_ID_PATTERN forbids separators, so backupFile cannot escape backupDir.
  let content: Buffer;
  try {
    content = await fs.readFile(backupFile);
  } catch {
    throw new Error('Backup not found');
  }

  const dest = validateAndResolvePath(relativePath, false, instanceId);
  if (!dest) {
    throw new Error('Invalid file path');
  }

  // Snapshot the current content first so the restore can itself be undone.
  await createBackup(relativePath, instanceId);

  await fs.writeFile(dest, content);
}
