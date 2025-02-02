import cryptoBrowserify from 'crypto-browserify';
import 'buffer';
import 'process/browser';
import 'vm-browserify';

// 确保 process 在全局范围内可用
declare global {
  interface Window {
    process: any;
    Buffer: any;
  }
}

// 导出一个与Node.js crypto模块兼容的接口
export const crypto = cryptoBrowserify; 