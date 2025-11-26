import { ReactNode } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bg: 'bg-red-900/30',
      border: 'border-red-700',
      button: 'bg-red-600 hover:bg-red-700',
      icon: '⚠️',
    },
    warning: {
      bg: 'bg-yellow-900/30',
      border: 'border-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      icon: '⚠️',
    },
    info: {
      bg: 'bg-cyan-900/30',
      border: 'border-cyan-700',
      button: 'bg-cyan-600 hover:bg-cyan-700',
      icon: 'ℹ️',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg shadow-2xl max-w-md w-full mx-4 border border-slate-700">
        <div className={`p-6 border-b ${styles.border} ${styles.bg}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{styles.icon}</span>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="text-slate-300 mb-6">{message}</div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 ${styles.button} text-white rounded-lg font-semibold transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
