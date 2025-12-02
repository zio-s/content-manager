/**
 * LoginPage 컴포넌트
 *
 * 로그인 페이지
 * - 이메일/비밀번호 입력
 * - 로그인 성공 시 대시보드로 이동
 * - 동적 테스트 계정 표시 (비밀번호 변경 시 반영)
 */

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import {
  loginThunk,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  clearError,
} from '../../../shared/store/slices/auth-slice';
import { Button, Input, Card } from '../../../shared/components/ui';
import { getLoginExamples } from '../../../shared/auth/user-service';

interface LoginExample {
  label: string;
  email: string;
  password: string;
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginExamples, setLoginExamples] = useState<LoginExample[]>([]);

  // 동적 로그인 예시 로드 (비밀번호 변경 반영)
  useEffect(() => {
    getLoginExamples().then(setLoginExamples);
  }, []);

  // 이미 로그인된 경우 대시보드로 이동
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // 에러 초기화
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(loginThunk({ email, password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Manager</h1>
          <p className="text-gray-600 mt-2">CMS 대시보드에 로그인하세요</p>
        </div>

        {/* 로그인 폼 */}
        <Card padding="lg" shadow="md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 이메일 입력 */}
            <Input
              type="email"
              label="이메일"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            {/* 비밀번호 입력 */}
            <Input
              type="password"
              label="비밀번호"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isLoading}
              disabled={!email || !password}
            >
              로그인
            </Button>
          </form>

          {/* 테스트 계정 안내 (동적 로드) */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-3">테스트 계정</p>
            <div className="space-y-2 text-sm">
              {loginExamples.map((example, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-700">{example.label}</p>
                  <p className="text-gray-500">
                    {example.email} / {example.password}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 푸터 */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Mock 인증 시스템 - 포트폴리오 프로젝트
        </p>
      </div>
    </div>
  );
}
