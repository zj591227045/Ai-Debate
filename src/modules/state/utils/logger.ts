import { StoreError } from '../types/error';

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 日志条目
 */
export interface LogEntry {
  level: LogLevel;
  namespace: string;
  message: string;
  timestamp: number;
  data?: any;
}

/**
 * 状态管理日志工具
 */
export class StateLogger {
  private static instance: StateLogger;
  private enabled: boolean = true;
  private logs: LogEntry[] = [];

  private constructor() {
    console.log('StateLogger 实例已创建，日志已启用');
  }

  static getInstance(): StateLogger {
    if (!StateLogger.instance) {
      StateLogger.instance = new StateLogger();
    }
    return StateLogger.instance;
  }

  /**
   * 记录调试信息
   */
  debug(namespace: string, message: string, data?: any) {
    this.log('debug', namespace, message, data);
  }

  /**
   * 记录普通信息
   */
  info(namespace: string, message: string, data?: any) {
    this.log('info', namespace, message, data);
  }

  /**
   * 记录警告信息
   */
  warn(namespace: string, message: string, data?: any) {
    this.log('warn', namespace, message, data);
  }

  /**
   * 记录错误信息
   */
  error(namespace: string, message: string, error?: Error | StoreError) {
    if (error instanceof StoreError) {
      this.log('error', namespace, message, error.getDebugInfo());
    } else {
      this.log('error', namespace, message, error);
    }
  }

  /**
   * 获取日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 清除日志
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 启用日志
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用日志
   */
  disable(): void {
    this.enabled = false;
  }

  private log(level: LogLevel, namespace: string, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      namespace,
      message,
      timestamp: Date.now(),
      data
    };

    this.logs.push(entry);

    const style = this.getLogStyle(level);
    const timestamp = new Date(entry.timestamp).toISOString();
    const logPrefix = `%c[${timestamp}] [${level.toUpperCase()}] [${namespace}]`;
    
    const stack = new Error().stack?.split('\n').slice(3).join('\n');
    
    console.groupCollapsed(
      logPrefix,
      style,
      message
    );
    
    if (data) {
      console.log('详细数据:', data);
    }
    
    console.log('调用栈:', stack);
    console.groupEnd();
  }

  private getLogStyle(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return 'color: #666666';
      case 'info':
        return 'color: #1890ff';
      case 'warn':
        return 'color: #faad14';
      case 'error':
        return 'color: #f5222d';
      default:
        return '';
    }
  }
} 