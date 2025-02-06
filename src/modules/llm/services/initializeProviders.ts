import { ProviderManager } from './ProviderManager';
import { ProviderType } from '../types/providers';
import { OllamaAdapter } from '../adapters/ollama';
import { DeepseekAdapter } from '../adapters/deepseek';
import { VolcengineAdapter } from '../adapters/volcengine';
import { SiliconFlowAdapter } from '../adapters/siliconflow';

export function initializeProviders() {
  console.log('=== 初始化 LLM 服务提供者 ===');
  
  // 注册 Ollama 提供者
  ProviderManager.getInstance().registerProvider(
    ProviderType.OLLAMA,
    new OllamaAdapter()
  );
  
  // 注册 Deepseek 提供者
  ProviderManager.getInstance().registerProvider(
    ProviderType.DEEPSEEK,
    new DeepseekAdapter()
  );
  
  // 注册 Volcengine 提供者
  ProviderManager.getInstance().registerProvider(
    ProviderType.VOLCENGINE,
    new VolcengineAdapter()
  );

  // 注册 SiliconFlow 提供者
  ProviderManager.getInstance().registerProvider(
    ProviderType.SILICONFLOW,
    new SiliconFlowAdapter()
  );
  
  console.log('已注册的提供者:', Array.from(ProviderManager.getInstance().getProviders().keys()));
} 