export interface Player {
  id: string;
  name: string;
  avatar: string;
  role: 'for' | 'against' | 'neutral';
  score: number;
  isActive: boolean;
}

export interface DebateContent {
  id: string;
  player: Player;
  content: string;
  timestamp: Date;
  isInnerThought?: boolean;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isSystem?: boolean;
}

export interface Theme {
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    link: string;
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    border: string;
    divider: string;
    background: {
      default: string;
      primary: string;
      secondary: string;
      accent: string;
      hover: string;
    };
    white: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    pill: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
    wide: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
} 