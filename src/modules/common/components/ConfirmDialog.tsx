import React from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  isConfirming = false,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
    >
      <div className="mt-2">
        <p className="text-sm text-gray-500">
          {message}
        </p>
      </div>

      <div className="mt-4 flex justify-end space-x-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isConfirming}
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          onClick={onConfirm}
          loading={isConfirming}
          disabled={isConfirming}
        >
          {confirmText}
        </Button>
      </div>
    </Dialog>
  );
}; 