// 为缺失的模块声明类型
declare module '@babel/traverse' {
  const content: any;
  export default content;
}

declare module 'hast' {
  const content: any;
  export default content;
}

declare module 'http-cache-semantics' {
  const content: any;
  export default content;
}

declare module 'keyv' {
  const content: any;
  export default content;
}

declare module 'ms' {
  const content: any;
  export default content;
}

declare module 'responselike' {
  const content: any;
  export default content;
}

declare module 'unist' {
  const content: any;
  export default content;
}

declare module 'yauzl' {
  const content: any;
  export default content;
}

// 为一些特殊模块声明额外的类型
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

// 声明全局变量和类型
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PUBLIC_URL: string;
    REACT_APP_VERSION: string;
    // 添加其他环境变量
  }
}

// 为了解决一些特殊的类型问题，添加一些通用类型
declare type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

declare type Nullable<T> = T | null;

declare type Optional<T> = T | undefined;

// Electron 相关类型声明
declare namespace Electron {
  interface IpcRenderer {
    on(channel: string, listener: (...args: any[]) => void): this;
    send(channel: string, ...args: any[]): void;
  }

  interface IpcMain {
    on(channel: string, listener: (event: IpcMainEvent, ...args: any[]) => void): this;
  }

  interface IpcMainEvent {
    reply(channel: string, ...args: any[]): void;
  }

  interface WebContents {
    send(channel: string, ...args: any[]): void;
  }
}

declare interface Window {
  electron: {
    ipcRenderer: Electron.IpcRenderer;
  };
} 