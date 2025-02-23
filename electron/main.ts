import { app, BrowserWindow } from 'electron';
import * as path from 'path';

// 使用 app.isPackaged 来判断是否是开发环境
const isDev = !app.isPackaged;

// 添加全局错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('未处理的 Promise 拒绝:', error);
});

function createWindow() {
  console.log('开始创建窗口');
  console.log('应用程序路径:', app.getAppPath());
  console.log('是否为打包环境:', app.isPackaged);
  
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      // 启用开发者工具
      devTools: true
    },
  });

  // 在生产环境中也打开开发者工具以便调试
  mainWindow.webContents.openDevTools();

  // 加载应用
  let startURL;
  if (isDev) {
    startURL = 'http://localhost:3000';
  } else {
    // 使用 app.getAppPath() 获取应用根目录
    const appPath = app.getAppPath();
    console.log('应用根目录:', appPath);
    
    // 尝试不同的可能路径
    const possiblePaths = [
      path.join(appPath, 'build', 'index.html'),
      path.join(appPath, 'Resources', 'build', 'index.html'),
      path.join(appPath, '..', 'build', 'index.html')
    ];
    
    // 打印所有可能的路径
    console.log('可能的路径:', possiblePaths);
    
    // 使用第一个路径
    startURL = `file://${possiblePaths[0]}`;
  }

  console.log('正在加载 URL:', startURL);

  mainWindow.loadURL(startURL)
    .then(() => {
      console.log('页面加载成功');
    })
    .catch((error) => {
      console.error('页面加载失败:', error);
      console.error('错误堆栈:', error.stack);
    });

  // 监听页面加载状态
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('页面开始加载');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('页面加载完成');
  });

  mainWindow.webContents.on('did-fail-load', (
    _event,
    errorCode,
    errorDescription,
    validatedURL
  ) => {
    console.error('页面加载失败:', {
      errorCode,
      errorDescription,
      validatedURL
    });
  });

  // 监听渲染进程错误
  mainWindow.webContents.on('render-process-gone', (
    _event,
    details
  ) => {
    console.error('渲染进程崩溃:', details);
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('渲染进程崩溃');
  });
}

// 当 Electron 完成初始化时创建窗口
app.whenReady().then(() => {
  console.log('应用程序就绪');
  createWindow();
});

// 添加应用程序错误处理
app.on('render-process-gone', (
  _event,
  webContents,
  details
) => {
  console.error('主进程检测到渲染器崩溃:', details);
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  console.log('所有窗口已关闭');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('应用程序激活');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 