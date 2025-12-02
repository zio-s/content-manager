/**
 * App 컴포넌트
 *
 * 🎓 애플리케이션의 루트 컴포넌트
 * - ErrorBoundary로 글로벌 에러 처리
 * - Redux Provider로 전역 상태 제공
 * - AlertProvider로 전역 알림 제공
 * - RouterProvider로 라우팅 제공
 * - 앱 시작 시 세션 복원
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../shared/store/store';
import { getSessionThunk } from '../shared/store/slices/auth-slice';
import { router } from './router';
import ErrorBoundary from '../shared/components/ErrorBoundary';
import { AlertProvider } from '../shared/contexts/AlertContext';
import { Toast, ConfirmDialog } from '../shared/components/ui';

// 앱 내부 컴포넌트 (Redux 사용 가능)
function AppContent() {
  useEffect(() => {
    // 🎓 앱 시작 시 localStorage에서 세션 복원 시도
    store.dispatch(getSessionThunk());
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toast />
      <ConfirmDialog />
    </>
  );
}

// 루트 컴포넌트
export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AlertProvider>
          <AppContent />
        </AlertProvider>
      </Provider>
    </ErrorBoundary>
  );
}
