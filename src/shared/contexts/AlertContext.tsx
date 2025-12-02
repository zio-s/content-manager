/**
 * AlertContext
 *
 * 전역 Alert/Toast 시스템
 * - 메시지 알림
 * - 확인 다이얼로그
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// Alert 타입
export type AlertType = 'success' | 'error' | 'warning' | 'info';

// Alert 아이템
export interface AlertItem {
  id: string;
  type: AlertType;
  message: string;
  duration?: number;
}

// Confirm 옵션
export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

// Confirm 상태
interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

// Context 타입
interface AlertContextType {
  // Alert
  alerts: AlertItem[];
  showAlert: (type: AlertType, message: string, duration?: number) => void;
  removeAlert: (id: string) => void;
  // 편의 메서드
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  // Confirm
  confirmState: ConfirmState;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  closeConfirm: (result: boolean) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

const DEFAULT_DURATION = 3000;

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
    resolve: null,
  });

  // Alert 표시
  const showAlert = useCallback(
    (type: AlertType, message: string, duration = DEFAULT_DURATION) => {
      const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      setAlerts((prev) => [...prev, { id, type, message, duration }]);

      // 자동 제거
      if (duration > 0) {
        setTimeout(() => {
          setAlerts((prev) => prev.filter((alert) => alert.id !== id));
        }, duration);
      }
    },
    []
  );

  // Alert 제거
  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  // 편의 메서드
  const success = useCallback(
    (message: string, duration?: number) => showAlert('success', message, duration),
    [showAlert]
  );

  const error = useCallback(
    (message: string, duration?: number) => showAlert('error', message, duration),
    [showAlert]
  );

  const warning = useCallback(
    (message: string, duration?: number) => showAlert('warning', message, duration),
    [showAlert]
  );

  const info = useCallback(
    (message: string, duration?: number) => showAlert('info', message, duration),
    [showAlert]
  );

  // Confirm 표시
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        ...options,
        resolve,
      });
    });
  }, []);

  // Confirm 닫기
  const closeConfirm = useCallback((result: boolean) => {
    confirmState.resolve?.(result);
    setConfirmState({
      isOpen: false,
      message: '',
      resolve: null,
    });
  }, [confirmState.resolve]);

  return (
    <AlertContext.Provider
      value={{
        alerts,
        showAlert,
        removeAlert,
        success,
        error,
        warning,
        info,
        confirmState,
        confirm,
        closeConfirm,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlertContext() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlertContext must be used within AlertProvider');
  }
  return context;
}
