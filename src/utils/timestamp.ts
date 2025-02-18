/**
 * 创建ISO格式的时间戳字符串
 */
export const createTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * 格式化时间戳为显示格式
 * @param timestamp ISO格式的时间戳字符串
 */
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '年').replace(/\//g, '月').replace(/ /, '日 ');
};

/**
 * 将数字时间戳转换为ISO字符串格式
 * @param timestamp 数字时间戳
 */
export const convertNumberToTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toISOString();
};

// 为了保持向后兼容，添加别名
export const convertToISOString = convertNumberToTimestamp; 