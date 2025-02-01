import React from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../styles/ThemeContext';

type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'filled';
  size?: InputSize;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}

interface StyledInputProps extends Omit<InputProps, 'size'> {
  $size?: InputSize;
}

const InputWrapper = styled.div<{ fullWidth?: boolean }>`
  display: inline-flex;
  flex-direction: column;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
`;

const getInputPadding = (size: InputSize = 'md', theme: any) => {
  const paddings = {
    sm: `${theme.spacing.xs} ${theme.spacing.sm}`,
    md: `${theme.spacing.sm} ${theme.spacing.md}`,
    lg: `${theme.spacing.md} ${theme.spacing.lg}`
  };
  return paddings[size];
};

const getInputFontSize = (size: InputSize = 'md', theme: any) => {
  const sizes = {
    sm: theme.typography.fontSize.sm,
    md: theme.typography.fontSize.md,
    lg: theme.typography.fontSize.lg
  };
  return sizes[size];
};

const StyledInput = styled.input<StyledInputProps>`
  border-radius: ${props => props.theme.radius.md};
  font-family: ${props => props.theme.typography.fontFamily};
  transition: all ${props => props.theme.transitions.fast};
  width: 100%;
  padding: ${props => getInputPadding(props.$size, props.theme)};
  font-size: ${props => getInputFontSize(props.$size, props.theme)};
  border: 1px solid ${props => props.error ? props.theme.colors.error : props.theme.colors.border};
  background-color: ${props => props.variant === 'filled' ? props.theme.colors.background.secondary : props.theme.colors.white};
  color: ${props => props.theme.colors.text.primary};

  &:focus {
    outline: none;
    border-color: ${props => props.error ? props.theme.colors.error : props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.error ? props.theme.colors.error + '40' : props.theme.colors.primary + '40'};
  }

  &:disabled {
    background-color: ${props => props.theme.colors.background.secondary};
    cursor: not-allowed;
    opacity: 0.7;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.tertiary};
  }
`;

const HelperText = styled.span<{ error?: boolean }>`
  margin-top: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.error ? props.theme.colors.error : props.theme.colors.text.tertiary};
`;

export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { variant = 'default', size = 'md', error = false, helperText, fullWidth, ...rest } = props;

  return (
    <InputWrapper fullWidth={fullWidth}>
      <StyledInput
        ref={ref}
        variant={variant}
        $size={size}
        error={error}
        {...rest}
      />
      {helperText && (
        <HelperText error={error}>{helperText}</HelperText>
      )}
    </InputWrapper>
  );
});

Input.displayName = 'Input';

export default Input; 