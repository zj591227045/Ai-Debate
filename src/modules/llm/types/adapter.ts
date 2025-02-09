import type { ChatRequest, ChatResponse } from '../api/types';

export abstract class BaseProviderAdapter<TRequest = any, TResponse = any> {
  abstract adaptRequest(request: ChatRequest): TRequest;
  abstract adaptResponse(response: TResponse): ChatResponse;
  abstract adaptStream(stream: AsyncGenerator<TResponse>): AsyncGenerator<ChatResponse>;
} 