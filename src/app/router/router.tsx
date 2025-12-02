/**
 * Router 설정
 *
 * React Router v7 기반 라우팅
 * - MainLayout: 인증된 사용자를 위한 레이아웃
 * - ProtectedRoute: 인증 필요 페이지 보호
 * - 지연 로딩으로 코드 스플리팅
 * - 라우트 레벨 에러 처리
 */

import { createBrowserRouter, Navigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

import ProtectedRoute from './ProtectedRoute';
import MainLayout from "@/app/layout/MainLayout.tsx";

// 라우트 에러 컴포넌트
// eslint-disable-next-line react-refresh/only-export-components
function RouteErrorBoundary() {
  const error = useRouteError();

  let title = '문제가 발생했습니다';
  let message = '페이지를 불러오는 중 오류가 발생했습니다.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = '페이지를 찾을 수 없습니다';
      message = '요청하신 페이지가 존재하지 않습니다.';
    } else if (error.status === 403) {
      title = '접근 권한이 없습니다';
      message = '이 페이지에 접근할 권한이 없습니다.';
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 mb-6">{message}</p>

        {import.meta.env.DEV && error instanceof Error && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left overflow-auto max-h-32">
            <p className="text-sm font-mono text-red-600 break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}

// 지연 로딩: 페이지를 필요할 때만 로드
const LoginPage = lazy(() => import('../../modules/auth/components/LoginPage'));
const DashboardPage = lazy(() => import('../../modules/dashboard/components/DashboardPage'));
const TrafficPage = lazy(() => import('../../modules/analytics/components/TrafficPage'));
const ContentsPage = lazy(() => import('../../modules/analytics/components/ContentsPage'));
const ReportsPage = lazy(() => import('../../modules/analytics/components/ReportsPage'));
const SettingsPage = lazy(() => import('../../modules/settings/components/SettingsPage'));

// 로딩 컴포넌트
// eslint-disable-next-line react-refresh/only-export-components
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Suspense 래퍼
const withSuspense = (Component: React.LazyExoticComponent<() => React.ReactElement>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  // 로그인 페이지 (인증 불필요)
  {
    path: '/login',
    element: withSuspense(LoginPage),
    errorElement: <RouteErrorBoundary />,
  },

  // 메인 레이아웃 (인증 필요)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      // 대시보드
      {
        index: true,
        element: withSuspense(DashboardPage),
      },

      // 트래픽 분석
      {
        path: 'traffic',
        element: withSuspense(TrafficPage),
        errorElement: <RouteErrorBoundary />,
      },

      // 콘텐츠 현황
      {
        path: 'contents',
        element: withSuspense(ContentsPage),
        errorElement: <RouteErrorBoundary />,
      },

      // 리포트
      {
        path: 'reports',
        element: withSuspense(ReportsPage),
        errorElement: <RouteErrorBoundary />,
      },

      // 설정 페이지
      {
        path: 'settings',
        element: withSuspense(SettingsPage),
        errorElement: <RouteErrorBoundary />,
      },
    ],
  },

  // 404 - 존재하지 않는 경로
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
