import React from 'react';
import styled from '@emotion/styled';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: string | number;
  closeOnOverlayClick?: boolean;
}

const Overlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all ${props => props.theme.transitions.normal};
`;

const ModalContainer = styled.div<{ width: string | number }>`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.radius.lg};
  box-shadow: ${props => props.theme.shadows.xl};
  width: ${props => typeof props.width === 'number' ? `${props.width}px` : props.width};
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
  transform: translateY(0);
  opacity: 1;
  transition: all ${props => props.theme.transitions.normal};

  ${Overlay}:not([data-open="true"]) & {
    transform: translateY(-20px);
    opacity: 0;
  }
`;

const Header = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: ${props => props.theme.spacing.xs};
  cursor: pointer;
  color: ${props => props.theme.colors.text.secondary};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const Content = styled.div`
  padding: ${props => props.theme.spacing.md};
  overflow-y: auto;
  flex: 1;
`;

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 500,
  closeOnOverlayClick = true
}) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <Overlay isOpen={isOpen} onClick={handleOverlayClick} data-open={isOpen}>
      <ModalContainer width={width}>
        {title && (
          <Header>
            <Title>{title}</Title>
            <CloseButton onClick={onClose}>✕</CloseButton>
          </Header>
        )}
        <Content>{children}</Content>
      </ModalContainer>
    </Overlay>,
    modalRoot
  );
};

export default Modal; 