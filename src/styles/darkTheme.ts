import type { Theme } from '../types';

export const darkTheme: Theme = {
  colors: {
    primary: '#4B6BFF',
    primaryDark: '#3A54CC',
    secondary: '#8BA4FF',
    accent: '#FF6B87',
    success: '#6EDB39',
    warning: '#FFC53D',
    error: '#FF7875',
    link: '#40A9FF',
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
      tertiary: '#737373'
    },
    border: '#404040',
    divider: '#2D2D2D',
    background: {
      default: '#1F1F1F',
      primary: '#2D2D2D',
      secondary: '#363636',
      accent: '#2D1F1F'
    },
    white: '#2D2D2D'
  },
  
  // 继承其他主题配置
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  
  radius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '16px',
    pill: '9999px'
  },
  
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.4)'
  },
  
  typography: {
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
  },
  
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px'
  },
  
  transitions: {
    fast: '0.2s',
    normal: '0.3s',
    slow: '0.5s'
  }
};

export default darkTheme; 