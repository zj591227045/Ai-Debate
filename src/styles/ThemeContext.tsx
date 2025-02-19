import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { Theme } from '../types/theme';
import theme from './theme';

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

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(theme);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  useEffect(() => {
    // 当主题改变时，更新 body 的背景色和文字颜色
    document.body.style.backgroundColor = isDark 
      ? currentTheme.colors.background.default 
      : currentTheme.colors.background.default;
    document.body.style.color = isDark 
      ? currentTheme.colors.text.primary 
      : currentTheme.colors.text.primary;
  }, [isDark, currentTheme]);

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, isDark, toggleTheme }}>
      <EmotionThemeProvider theme={currentTheme}>
        {children}
      </EmotionThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 