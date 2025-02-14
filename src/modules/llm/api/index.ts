import type { 
  GenerateStreamOptions, 
  GenerateStreamResponse,
  ChatOptions,
  ChatResponse,
  ServiceStatus
} from './types';

/**
 * 生成流式输出
 */
export async function generateStream(options: GenerateStreamOptions): Promise<GenerateStreamResponse> {
  const response = await fetch('/api/llm/generate/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const { content, metadata } = await response.json();
  return {
    content: new ReadableStream({
      start(controller) {
        const reader = content.getReader();
        return pump();
        function pump(): Promise<void> {
          return reader.read().then(({ done, value }: { done: boolean; value: Uint8Array }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            return pump();
          });
        }
      }
    }),
    metadata,
    status: 'streaming'
  };
}

/**
 * 生成聊天回复
 */
export async function chat(options: ChatOptions): Promise<ChatResponse> {
  const response = await fetch('/api/llm/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

/**
 * 获取服务状态
 */
export async function getServiceStatus(): Promise<ServiceStatus> {
  const response = await fetch('/api/llm/status');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}
