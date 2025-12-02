/**
 * ProtectedRoute 컴포넌트
 *
 * 🎓 인증이 필요한 페이지 보호
 * - 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
 * - 세션 로딩 중에는 로딩 화면 표시
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../shared/hooks';
import {
  selectIsAuthenticated,
  selectAuthLoading,
} from '../../shared/store/slices/auth-slice';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const location = useLocation();

  // 세션 확인 중일 때 로딩 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    // 현재 위치를 state로 전달해서 로그인 후 돌아올 수 있게 함
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
