const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const targetUrl = 'http://localhost:5173';
const mainScript = path.join(__dirname, 'dist-electron', 'main.js');

function checkVite() {
  return new Promise((resolve) => {
    const req = http.get(targetUrl, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForReady() {
  console.log('[DevRunner] Waiting for Vite server and Electron compiler...');
  let attempts = 0;
  while (attempts < 60) {
    const viteReady = await checkVite();
    const electronReady = fs.existsSync(mainScript);

    if (viteReady && electronReady) {
      console.log('[DevRunner] Vite and Electron compilation ready! Launching Electron...');
      const electronCmd = process.platform === 'win32' ? 'electron.cmd' : 'electron';
      const electronProcess = spawn(electronCmd, ['.'], {
        stdio: 'inherit',
        shell: true,
      });

      electronProcess.on('close', (code) => {
        process.exit(code || 0);
      });
      return;
    }

    await new Promise((r) => setTimeout(r, 600));
    attempts++;
  }

  console.error('[DevRunner] Timed out waiting for Vite / Electron compilation.');
  process.exit(1);
}

waitForReady();
