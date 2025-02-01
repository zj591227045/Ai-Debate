import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import theme from './theme';
import darkTheme from './darkTheme';
import type { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme,
  isDark: false,
  toggleTheme: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // 从localStorage读取主题设置
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    // 当主题改变时，更新 body 的背景色和文字颜色
    document.body.style.backgroundColor = isDark ? darkTheme.colors.background.default : theme.colors.background.default;
    document.body.style.color = isDark ? darkTheme.colors.text.primary : theme.colors.text.primary;
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newTheme = !prev;
      // 保存主题设置到localStorage
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  }, []);

  const currentTheme = isDark ? darkTheme : theme;

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, isDark, toggleTheme }}>
      <EmotionThemeProvider theme={currentTheme}>
        {children}
      </EmotionThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 