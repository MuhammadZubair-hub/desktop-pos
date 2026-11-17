import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDatabase, closeDatabase, getAllSettings, setSetting, getSetting, getSalesReport } from './db';
import { startDailyBackupScheduler, stopBackupScheduler, performBackup, listBackups } from './db/backup';
import { startApiServer, stopApiServer, getActiveWsClientCount } from './server';
import { udpBeaconService } from './services/udp-beacon';
import { getLocalIpAddresses, getPrimaryLanIp } from './services/network-info';

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0F172A',
    title: "OCTOPIZZA'S Fast Food - Offline POS",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // In development, load Vite dev server; otherwise load dist/index.html
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  ipcMain.handle('pos:get-server-status', async () => {
    const primaryIp = getPrimaryLanIp();
    const localIps = getLocalIpAddresses();
    const pairingPin = getSetting('pairing_pin', '1234');
    const storeName = getSetting('store_name', "OCTOPIZZA'S Fast Food");
    const udpStatus = udpBeaconService.getStatus();
    const wsClients = getActiveWsClientCount();

    return {
      status: 'ONLINE',
      serverName: storeName,
      port: 5000,
      primaryIp,
      localIps,
      pairingPin,
      activeWsClients: wsClients,
      udpBeacon: udpStatus,
      timestamp: Date.now(),
    };
  });

  ipcMain.handle('pos:trigger-backup', async () => {
    return await performBackup();
  });

  ipcMain.handle('pos:get-backups', async () => {
    return listBackups();
  });

  ipcMain.handle('pos:get-settings', async () => {
    return getAllSettings();
  });

  ipcMain.handle('pos:update-setting', async (_event, { key, value }) => {
    setSetting(key, String(value));
    return { success: true, key, value };
  });

  ipcMain.handle('pos:get-sales-report', async (_event, filter) => {
    return getSalesReport(filter || {});
  });

  ipcMain.handle('pos:print-receipt', async (_event, receiptData) => {
    console.log('[Print] Receipt requested for invoice:', receiptData?.invoice_no);
    if (mainWindow) {
      // In a real desktop environment, webContents.print() can trigger physical thermal printers
      mainWindow.webContents.print({
        silent: false,
        printBackground: true,
        margins: { marginType: 'none' },
      }, (success, errorType) => {
        if (!success) console.log(`[Print] Print dialog cancelled or failed: ${errorType}`);
      });
    }
    return { success: true };
  });
}

app.whenReady().then(async () => {
  try {
    console.log('[Main] Starting Offline-First POS Host...');

    // 1. Initialize SQLite Database
    initDatabase();

    // 2. Start Automatic Backup Utility
    startDailyBackupScheduler();

    // 3. Start Express REST API & WebSocket Server on Port 5000
    await startApiServer(5000);

    // 4. Start UDP Broadcast Service on Port 5001 (every 3 seconds)
    udpBeaconService.start();

    // 5. Register IPC Bridges
    registerIpcHandlers();

    // 6. Launch Desktop Window
    await createWindow();

    console.log('[Main] POS Host successfully initialized!');
  } catch (error) {
    console.error('[Main] Failed to initialize application:', error);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// App Exit Handler: ensure clean database backup and graceful shutdown
let isQuitting = false;
app.on('before-quit', async (e) => {
  if (isQuitting) return;
  e.preventDefault();
  isQuitting = true;

  console.log('[Main] App quitting: Performing exit database backup and graceful cleanup...');

  try {
    // 1. Stop UDP Broadcaster
    udpBeaconService.stop();

    // 2. Stop Backup Scheduler
    stopBackupScheduler();

    // 3. Final safety backup on exit
    await performBackup();

    // 4. Stop API & WebSocket Server
    await stopApiServer();

    // 5. Close SQLite Database cleanly
    closeDatabase();
  } catch (err) {
    console.error('[Main] Error during shutdown:', err);
  } finally {
    app.exit(0);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
