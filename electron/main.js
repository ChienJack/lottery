import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !!process.env.VITE_DEV_SERVER_URL;

function loadRoute(win, route) {
  const distIndex = path.join(__dirname, '../dist/index.html');
  const fileUrl = pathToFileURL(distIndex).toString();
  const devUrl = process.env.VITE_DEV_SERVER_URL ? `${process.env.VITE_DEV_SERVER_URL}#${route}` : null;
  if (isDev && devUrl) {
    win.loadURL(devUrl).catch(() => {
      win.loadURL(`${fileUrl}#${route}`);
    });
    win.webContents.on('did-fail-load', () => {
      win.loadURL(`${fileUrl}#${route}`);
    });
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadURL(`${fileUrl}#${route}`);
  }
}

function createWindow(route = '/', options = {}) {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    ...options,
  });

  loadRoute(win, route);
  return win;
}

app.whenReady().then(() => {
  // 開兩個視窗：人資/操作者控台與觀眾投影
  let operatorWindow = createWindow('/');
  let audienceWindow = createWindow('/audience', { fullscreenable: true });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      operatorWindow = createWindow('/');
      audienceWindow = createWindow('/audience', { fullscreenable: true });
    }
  });

  // 若主控窗關閉，觀眾窗仍可保留；若全關則等待 activate 重建
  operatorWindow.on('closed', () => {
    operatorWindow = null;
  });
  audienceWindow.on('closed', () => {
    audienceWindow = null;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
