/**
 * useAlert Hook
 *
 * Alert/Toast 시스템 접근 훅
 * - 메시지 알림
 * - 확인 다이얼로그
 */

import { useAlertContext } from '../contexts/AlertContext';

export function useAlert() {
  const {
    success,
    error,
    warning,
    info,
    showAlert,
    confirm,
  } = useAlertContext();

  return {
    // 편의 메서드
    success,
    error,
    warning,
    info,
    // 일반 메서드
    show: showAlert,
    // 확인 다이얼로그
    confirm,
  };
}
