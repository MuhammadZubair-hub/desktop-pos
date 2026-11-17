import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { getDb, getDatabasePath } from './index';

let backupInterval: NodeJS.Timeout | null = null;

export function getBackupsDirectory(): string {
  const baseDir = app ? app.getPath('userData') : path.join(__dirname, '..', '..');
  const backupDir = path.join(baseDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
}

export async function performBackup(): Promise<{ success: boolean; filePath: string; message: string }> {
  try {
    const backupDir = getBackupsDirectory();
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const backupFilename = `pos_backup_${timestamp}.db`;
    const destPath = path.join(backupDir, backupFilename);

    try {
      const db = getDb();
      // SQLite online backup API ensures consistent point-in-time snapshot with WAL
      await db.backup(destPath);
    } catch {
      // Fallback to file copy if online backup is unavailable
      const sourceDb = getDatabasePath();
      if (fs.existsSync(sourceDb)) {
        fs.copyFileSync(sourceDb, destPath);
      } else {
        throw new Error(`Source database file not found: ${sourceDb}`);
      }
    }

    // Prune backups keeping only last 30 files
    pruneOldBackups(backupDir, 30);

    console.log(`[Backup] Successful local database backup created: ${destPath}`);
    return {
      success: true,
      filePath: destPath,
      message: `Database backup created successfully: ${backupFilename}`,
    };
  } catch (error: any) {
    console.error('[Backup] Backup failed:', error);
    return {
      success: false,
      filePath: '',
      message: `Backup failed: ${error?.message || 'Unknown error'}`,
    };
  }
}

function pruneOldBackups(backupDir: string, maxBackups = 30): void {
  try {
    const files = fs.readdirSync(backupDir)
      .filter((f) => f.startsWith('pos_backup_') && f.endsWith('.db'))
      .map((f) => {
        const fullPath = path.join(backupDir, f);
        return {
          name: f,
          fullPath,
          time: fs.statSync(fullPath).mtime.getTime(),
        };
      })
      .sort((a, b) => b.time - a.time);

    if (files.length > maxBackups) {
      const toDelete = files.slice(maxBackups);
      for (const item of toDelete) {
        fs.unlinkSync(item.fullPath);
        console.log(`[Backup] Pruned old backup: ${item.name}`);
      }
    }
  } catch (err) {
    console.error('[Backup] Error pruning old backups:', err);
  }
}

export function startDailyBackupScheduler(): void {
  if (backupInterval) return;

  // Run initial check/backup shortly after startup
  setTimeout(() => {
    performBackup().catch(console.error);
  }, 10000);

  // Check every 6 hours; SQLite online backup is fast and lightweight
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  backupInterval = setInterval(() => {
    console.log('[Backup] Running scheduled periodic backup...');
    performBackup().catch(console.error);
  }, SIX_HOURS);
}

export function stopBackupScheduler(): void {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
  }
}

export function listBackups(): Array<{ name: string; size: number; date: string; path: string }> {
  try {
    const backupDir = getBackupsDirectory();
    return fs.readdirSync(backupDir)
      .filter((f) => f.endsWith('.db'))
      .map((f) => {
        const full = path.join(backupDir, f);
        const stat = fs.statSync(full);
        return {
          name: f,
          size: stat.size,
          date: stat.mtime.toISOString(),
          path: full,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}
