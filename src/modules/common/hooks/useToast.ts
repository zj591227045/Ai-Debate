import { useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom';
}

export const useToast = () => {
  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    options: ToastOptions = {}
  ) => {
    const {
      duration = 3000,
      position = 'top',
    } = options;

    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.className = `
      fixed ${position}-4 left-1/2 transform -translate-x-1/2
      px-4 py-2 rounded-md shadow-lg
      transition-all duration-300 ease-in-out
      ${getTypeClasses(type)}
    `;
    toast.textContent = message;

    // 添加到文档
    document.body.appendChild(toast);

    // 动画效果
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = `translate(-50%, ${position === 'top' ? '0' : '0'})`;
    });

    // 自动移除
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = `translate(-50%, ${position === 'top' ? '-1rem' : '1rem'})`;
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, duration);
  }, []);

  return { showToast };
};

const getTypeClasses = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return 'bg-green-500 text-white';
    case 'error':
      return 'bg-red-500 text-white';
    case 'warning':
      return 'bg-yellow-500 text-white';
    default:
      return 'bg-blue-500 text-white';
  }
}; 