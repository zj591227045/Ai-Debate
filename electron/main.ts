import { app, BrowserWindow } from 'electron';
import * as path from 'path';

// 使用 app.isPackaged 来判断是否是开发环境
const isDev = !app.isPackaged;

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // 临时禁用以排查问题
    },
  });

  // 加载应用
  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  console.log('Loading URL:', startURL);
  console.log('Current directory:', __dirname);
  console.log('Build path:', path.join(__dirname, '../build/index.html'));

  mainWindow.loadURL(startURL)
    .catch((error: Error) => {
      console.error('Failed to load app:', error);
    });

  // 打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  } else {
    // 在生产环境也临时打开开发者工具以排查问题
    mainWindow.webContents.openDevTools();
  }

  // 添加错误处理
  mainWindow.webContents.on('did-fail-load', (
    _event: Electron.Event,
    errorCode: number,
    errorDescription: string
  ) => {
    console.error('Page failed to load:', errorCode, errorDescription);
  });

  // 添加页面加载完成的处理
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });

  // 监听渲染进程错误
  mainWindow.webContents.on('render-process-gone', (
    _event: Electron.Event,
    details: Electron.RenderProcessGoneDetails
  ) => {
    console.error('Render process gone:', details);
  });

  // 监听崩溃事件
  mainWindow.webContents.on('crashed', (_event: Electron.Event) => {
    console.error('Renderer process crashed');
  });
}

// 当 Electron 完成初始化时创建窗口
app.whenReady().then(() => {
  console.log('App is ready');
  createWindow();
});

// 添加应用程序错误处理
app.on('render-process-gone', (
  _event: Electron.Event,
  webContents: Electron.WebContents,
  details: Electron.RenderProcessGoneDetails
) => {
  console.error('Main process detected renderer crash:', details);
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 未捕获的异常处理
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled rejection:', error);
}); 