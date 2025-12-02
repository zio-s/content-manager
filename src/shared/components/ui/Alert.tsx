/**
 * Alert 컴포넌트
 *
 * 알림 메시지를 표시하는 컴포넌트
 */

import { clsx } from 'clsx';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { AlertType } from '../../contexts/AlertContext';

interface AlertProps {
  type: AlertType;
  message: string;
  title?: string;
  onClose?: () => void;
  className?: string;
}

const alertConfig = {
  success: {
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-800',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon: Info,
    iconColor: 'text-blue-500',
  },
};

export default function Alert({ type, message, title, onClose, className }: AlertProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 border rounded-lg',
        config.bg,
        className
      )}
      role="alert"
    >
      <Icon size={20} className={clsx('flex-shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1">
        {title && (
          <h4 className={clsx('font-medium mb-1', config.text)}>{title}</h4>
        )}
        <p className={clsx('text-sm', config.text)}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={clsx(
            'flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors',
            config.text
          )}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
