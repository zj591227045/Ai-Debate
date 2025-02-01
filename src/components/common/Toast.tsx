import React from 'react';
import styled from '@emotion/styled';
import { createPortal } from 'react-dom';

type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  type?: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
}

const ToastContainer = styled.div<{ type: ToastType }>`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  border-radius: ${props => props.theme.radius.md};
  background-color: ${props => {
    const colors = {
      info: props.theme.colors.primary,
      success: props.theme.colors.success,
      warning: props.theme.colors.warning,
      error: props.theme.colors.error
    };
    return colors[props.type];
  }};
  color: ${props => props.theme.colors.white};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  box-shadow: ${props => props.theme.shadows.md};
  z-index: 1100;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
`;

const ToastIcon = styled.span`
  margin-right: ${props => props.theme.spacing.sm};
`;

const getIcon = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return '✓';
    case 'warning':
      return '⚠';
    case 'error':
      return '✕';
    default:
      return 'ℹ';
  }
};

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  message,
  duration = 3000,
  onClose
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const toastRoot = document.getElementById('toast-root');
  if (!toastRoot) return null;

  return createPortal(
    <ToastContainer type={type}>
      <ToastIcon>{getIcon(type)}</ToastIcon>
      {message}
    </ToastContainer>,
    toastRoot
  );
};

export default Toast;