import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  getServerStatus: () => Promise<any>;
  triggerBackup: () => Promise<any>;
  getBackups: () => Promise<any>;
  getSettings: () => Promise<any>;
  updateSetting: (key: string, value: string) => Promise<any>;
  getSalesReport: (filter?: any) => Promise<any>;
  printReceipt: (receiptData: any) => Promise<any>;
  onServerEvent: (callback: (event: any) => void) => () => void;
  platform: string;
}

const api: ElectronAPI = {
  getServerStatus: () => ipcRenderer.invoke('pos:get-server-status'),
  triggerBackup: () => ipcRenderer.invoke('pos:trigger-backup'),
  getBackups: () => ipcRenderer.invoke('pos:get-backups'),
  getSettings: () => ipcRenderer.invoke('pos:get-settings'),
  updateSetting: (key: string, value: string) => ipcRenderer.invoke('pos:update-setting', { key, value }),
  getSalesReport: (filter?: any) => ipcRenderer.invoke('pos:get-sales-report', filter),
  printReceipt: (receiptData: any) => ipcRenderer.invoke('pos:print-receipt', receiptData),
  onServerEvent: (callback: (event: any) => void) => {
    const listener = (_: any, data: any) => callback(data);
    ipcRenderer.on('pos:server-event', listener);
    return () => {
      ipcRenderer.removeListener('pos:server-event', listener);
    };
  },
  platform: process.platform,
};

contextBridge.exposeInMainWorld('electronAPI', api);
