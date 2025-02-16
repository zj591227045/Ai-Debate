import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import 'reflect-metadata';
import { initializeProviders } from './modules/llm/services/initializeProviders';
import { StoreManager } from './modules/state/core/StoreManager';
import { StateLogger } from './modules/state/utils';

const logger = StateLogger.getInstance();

// 禁用自动填充功能
if (typeof window !== 'undefined') {
  // 禁用自动填充
  (window as any).__disableAutofill = true;
  (window as any).__disableAutofillOverlay = true;
  (window as any).__disableBootstrapLegacyAutofill = true;
  
  // 移除已存在的相关脚本
  document.querySelectorAll('script[src*="autofill"]').forEach(script => script.remove());
  
  // 阻止相关事件
  window.addEventListener('load', () => {
    document.querySelectorAll('input, textarea').forEach(element => {
      element.setAttribute('autocomplete', 'off');
      element.setAttribute('data-form-type', 'other');
    });
  });
}

// 初始化应用
async function initializeApp() {
  try {
    // 初始化存储管理器
    const storeManager = StoreManager.getInstance();
    await storeManager.initialize();
    
    // 初始化 LLM 服务提供者
    await initializeProviders([
      {
        id: 'ollama-default',
        name: 'Ollama默认模型',
        provider: 'ollama',
        model: 'llama2',
        parameters: {
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1.0
        },
        auth: {
          baseUrl: 'http://localhost:11434',
          apiKey: ''
        },
        capabilities: {
          streaming: true,
          functionCalling: false
        },
        metadata: {
          description: 'Ollama 本地模型服务',
          contextWindow: 4096,
          tokenizerName: 'llama2',
          pricingInfo: {
            inputPrice: 0,
            outputPrice: 0,
            unit: '1K tokens',
            currency: 'USD'
          }
        },
        isEnabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ]);

    // 渲染应用
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );

    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    logger.error('App', '应用初始化失败', error instanceof Error ? error : new Error('Unknown error'));
    // 即使初始化失败也渲染应用
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );

    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

// 启动应用
initializeApp();
