/**
 * Jest测试环境配置
 */

// 设置全局fetch mock
global.fetch = jest.fn();

// 在每个测试之前重置所有mock
beforeEach(() => {
  jest.clearAllMocks();
});

// 添加自定义匹配器
expect.extend({
  toBeValidResponse(received) {
    const isValid = received &&
      typeof received.content === 'string' &&
      typeof received.usage === 'object' &&
      typeof received.created === 'number';

    return {
      message: () =>
        `expected ${received} to be a valid model response`,
      pass: isValid
    };
  }
}); 