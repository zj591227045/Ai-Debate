import { keyframes } from '@emotion/react'

export interface Colors {
  backgroundGradient: string;
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  link: string;
  white: string;
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  border: {
    primary: string;
    secondary: string;
  };
  background: {
    default: string;
    primary: string;
    secondary: string;
    accent: string;
    hover: string;
    container: string;
    overlay: string;
  };
  effects: {
    glow: string;
    shadow: string;
  };
}

export interface Shadows {
  primary: string;
  inner: string;
  text: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface Animations {
  glow: ReturnType<typeof keyframes>;
  float: ReturnType<typeof keyframes>;
}

export interface Mixins {
  glassmorphism: string;
  textGlow: string;
}

export interface Typography {
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
}

export interface Spacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface Radius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  pill: string;
}

export interface Breakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
  wide: string;
}

export interface Transitions {
  fast: string;
  normal: string;
  slow: string;
}

export interface Theme {
  colors: Colors;
  shadows: Shadows;
  animations: Animations;
  mixins: Mixins;
  typography: Typography;
  spacing: Spacing;
  radius: Radius;
  breakpoints: Breakpoints;
  transitions: Transitions;
} 