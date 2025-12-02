/**
 * ConfirmDialog 컴포넌트
 *
 * 확인/취소 다이얼로그
 * - Promise 기반 응답
 * - 커스텀 버튼 텍스트
 * - 위험/경고/정보 타입
 */

import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { useAlertContext } from '../../contexts/AlertContext';
import Button from './Button';

const typeConfig = {
  danger: {
    icon: XCircle,
    iconClass: 'text-red-500',
    bgClass: 'bg-red-100',
    confirmVariant: 'danger' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-yellow-500',
    bgClass: 'bg-yellow-100',
    confirmVariant: 'primary' as const,
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-100',
    confirmVariant: 'primary' as const,
  },
};

export default function ConfirmDialog() {
  const { confirmState, closeConfirm } = useAlertContext();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const {
    isOpen,
    title = '확인',
    message,
    confirmText = '확인',
    cancelText = '취소',
    type = 'info',
  } = confirmState;

  const config = typeConfig[type];
  const Icon = config.icon;

  // 열릴 때 취소 버튼에 포커스
  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus();
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeConfirm(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeConfirm]);

  // 배경 클릭으로 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div className="p-6">
          {/* 아이콘 + 제목 */}
          <div className="flex items-start gap-4">
            <div className={clsx('p-3 rounded-full', config.bgClass)}>
              <Icon size={24} className={config.iconClass} />
            </div>
            <div className="flex-1">
              <h3
                id="confirm-title"
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h3>
              <p
                id="confirm-message"
                className="mt-2 text-sm text-gray-600"
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-3 justify-end px-6 py-4 bg-gray-50 rounded-b-xl">
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={() => closeConfirm(false)}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={() => closeConfirm(true)}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

ConfirmDialog.displayName = 'ConfirmDialog';
