import { keyframes } from '@emotion/react';
import type { Colors, Shadows, Animations, Mixins, Typography, Spacing, Radius, Breakpoints, Transitions, Theme } from '../types/theme';

// 颜色系统
export const colors: Colors = {
  backgroundGradient: 'linear-gradient(90deg, rgba(2,0,36,0.95) 0%, rgba(9,9,121,0.95) 35%, rgba(0,57,89,0.95) 100%)',
  primary: '#2B4ACF',
  primaryDark: '#1F3599',
  secondary: '#6B8CFF',
  accent: '#FF4B6B',
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#FF4D4F',
  link: '#1890FF',
  white: '#FFFFFF',
  text: {
    primary: '#E8F0FF',
    secondary: 'rgba(232,240,255,0.9)',
    tertiary: 'rgba(232,240,255,0.7)'
  },
  border: {
    primary: 'rgba(167,187,255,0.2)',
    secondary: 'rgba(167,187,255,0.3)'
  },
  background: {
    default: '#0A1929',
    primary: '#1A2B3B',
    secondary: '#0D1B2A',
    accent: '#1E3A8A',
    hover: '#2A4A8A',
    container: 'rgba(255, 255, 255, 0.05)',
    overlay: 'rgba(167,187,255,0.1)'
  },
  effects: {
    glow: 'rgba(167,187,255,0.3)',
    shadow: 'rgba(31, 38, 135, 0.37)'
  }
};

// 阴影效果
export const shadows: Shadows = {
  primary: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  inner: 'inset 0 0 30px rgba(167,187,255,0.1)',
  text: `
    0 0 10px rgba(167,187,255,0.5),
    0 0 20px rgba(167,187,255,0.3),
    0 0 30px rgba(167,187,255,0.2)
  `,
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
};

// 动画定义
export const animations: Animations = {
  glow: keyframes`
    0% {
      box-shadow: 0 0 5px rgba(167,187,255,0.3), 0 0 10px rgba(167,187,255,0.2), 0 0 15px rgba(167,187,255,0.1);
    }
    50% {
      box-shadow: 0 0 10px rgba(167,187,255,0.4), 0 0 20px rgba(167,187,255,0.3), 0 0 30px rgba(167,187,255,0.2);
    }
    100% {
      box-shadow: 0 0 5px rgba(167,187,255,0.3), 0 0 10px rgba(167,187,255,0.2), 0 0 15px rgba(167,187,255,0.1);
    }
  `,
  float: keyframes`
    0% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
    100% { transform: translateY(0px); }
  `
};

// 混合效果
export const mixins: Mixins = {
  glassmorphism: `
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(167,187,255,0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  `,
  textGlow: `
    text-shadow: 
      0 0 10px rgba(167,187,255,0.5),
      0 0 20px rgba(167,187,255,0.3),
      0 0 30px rgba(167,187,255,0.2);
  `
};

// 排版
export const typography: Typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px'
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    bold: 600
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8
  }
};

// 间距
export const spacing: Spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px'
};

// 圆角
export const radius: Radius = {
  sm: '2px',
  md: '4px',
  lg: '8px',
  xl: '16px',
  pill: '9999px'
};

// 断点
export const breakpoints: Breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px'
};

// 过渡
export const transitions: Transitions = {
  fast: '0.2s',
  normal: '0.3s',
  slow: '0.5s'
};

// 主题对象
export const theme: Theme = {
  colors,
  shadows,
  animations,
  mixins,
  typography,
  spacing,
  radius,
  breakpoints,
  transitions
};

export default theme; 