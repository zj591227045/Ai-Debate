import type { Theme } from '../types';

export const theme: Theme = {
  colors: {
    primary: '#2B4ACF',
    primaryDark: '#1F3599',
    secondary: '#6B8CFF',
    accent: '#FF4B6B',
    success: '#52C41A',
    warning: '#FAAD14',
    error: '#FF4D4F',
    link: '#1890FF',
    text: {
      primary: '#1F1F1F',
      secondary: '#4E4E4E',
      tertiary: '#8C8C8C'
    },
    border: '#E8E8E8',
    divider: '#F0F0F0',
    background: {
      default: '#F5F5F5',
      primary: '#FFFFFF',
      secondary: '#FAFAFA',
      accent: '#FFF1F0'
    },
    white: '#FFFFFF'
  },
  
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
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
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

export default theme; 