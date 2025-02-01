import React from 'react';
import styled from '@emotion/styled';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const StyledButton = styled.button<ButtonProps>`
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: ${props.theme.colors.primary};
          color: ${props.theme.colors.white};
          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.secondary};
          }
        `;
      case 'danger':
        return `
          background-color: ${props.theme.colors.error};
          color: ${props.theme.colors.white};
          &:hover:not(:disabled) {
            opacity: 0.9;
          }
        `;
      case 'secondary':
      default:
        return `
          background-color: ${props.theme.colors.background.secondary};
          color: ${props.theme.colors.text.primary};
          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.background.accent};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <StyledButton {...props}>
      {props.isLoading ? '加载中...' : children}
    </StyledButton>
  );
};

export default Button;