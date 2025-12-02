/**
 * Toast 컴포넌트
 *
 * 알림 메시지 표시
 * - 성공/에러/경고/정보 타입
 * - 자동 사라짐
 * - 수동 닫기
 */

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useAlertContext, type AlertType } from '../../contexts/AlertContext';

const icons: Record<AlertType, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<AlertType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconStyles: Record<AlertType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

export default function Toast() {
  const { alerts, removeAlert } = useAlertContext();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {alerts.map((alert) => (
        <ToastItem
          key={alert.id}
          id={alert.id}
          type={alert.type}
          message={alert.message}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  id: string;
  type: AlertType;
  message: string;
  onClose: () => void;
}

function ToastItem({ type, message, onClose }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const Icon = icons[type];

  // 등장 애니메이션
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // 닫기 애니메이션
  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 border rounded-lg shadow-lg transition-all duration-200',
        styles[type],
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      )}
    >
      <Icon size={20} className={clsx('flex-shrink-0 mt-0.5', iconStyles[type])} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

Toast.displayName = 'Toast';
