/**
 * Mock Auth Service
 *
 * 🎓 핵심 개념:
 * 1. 로그인: JSON 파일에서 사용자 검증 → 토큰 발급
 * 2. 세션 복원: localStorage의 토큰으로 사용자 정보 복원
 * 3. 로그아웃: 토큰 삭제 및 상태 초기화
 *
 * 📊 KOMCA와의 비교:
 * - KOMCA: Supabase Auth API 호출
 * - 우리: JSON 파일 로드 + localStorage
 * - 구조는 동일, 데이터 소스만 다름
 */

import type { User, LoginCredentials, LoginResponse, AuthError } from './types';
import {
  createTokenPair,
  saveTokens,
  getStoredTokens,
  clearTokens,
  isTokenValid,
  refreshAccessToken,
} from './token-manager';
import { STORAGE_KEYS } from './types';

// ============================================
// 사용자 인증
// ============================================

/**
 * 로그인
 *
 * 🎓 로그인 플로우:
 * 1. auth.json에서 사용자 검색
 * 2. 이메일/비밀번호 검증
 * 3. 토큰 쌍 생성 (access + refresh)
 * 4. localStorage에 저장
 * 5. 사용자 정보 반환
 *
 * 📊 KOMCA 패턴:
 * - authService.signIn() 메서드와 동일한 구조
 * - async/await 패턴 사용
 * - 에러 처리 포함
 *
 * @param credentials - 이메일/비밀번호
 * @returns 사용자 정보 + 토큰 또는 에러
 */
export async function login(
  credentials: LoginCredentials
): Promise<{ data: LoginResponse | null; error: AuthError | null }> {
  try {
    // 1. auth.json 로드
    const response = await fetch('/mock-data/auth.json');
    if (!response.ok) {
      throw new Error('Failed to load auth data');
    }

    const authData = await response.json();
    const users = authData.users as Array<{
      id: string;
      email: string;
      password: string;
      name: string;
      role: 'admin' | 'user';
      avatar?: string;
    }>;

    // 2. 사용자 검증
    const user = users.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      return {
        data: null,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        },
      };
    }

    // 3. 토큰 생성
    const tokens = createTokenPair({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    });

    // 4. 토큰 저장
    saveTokens(tokens);

    // 5. 사용자 정보도 저장 (세션 복원용)
    const userInfo: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));

    return {
      data: {
        user: userInfo,
        tokens,
      },
      error: null,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      data: null,
      error: {
        code: 'TOKEN_INVALID',
        message: '로그인 처리 중 오류가 발생했습니다.',
      },
    };
  }
}

// ============================================
// 세션 관리
// ============================================

/**
 * 세션 복원
 *
 * 🎓 세션 복원 플로우:
 * 1. localStorage에서 토큰 확인
 * 2. Access Token 유효성 검증
 * 3. 만료되었으면 Refresh Token으로 자동 갱신
 * 4. 사용자 정보 복원
 *
 * 📊 언제 호출되나?
 * - 앱 초기 로드 시 (App.tsx)
 * - 페이지 새로고침 시
 * - 브라우저 재시작 후
 *
 * 🎯 목표:
 * - 사용자가 매번 로그인하지 않도록
 * - 토큰이 유효하면 자동으로 로그인 상태 유지
 *
 * @returns 사용자 정보 또는 에러
 */
export async function getSession(): Promise<{
  data: { user: User; accessToken: string } | null;
  error: AuthError | null;
}> {
  try {
    // 1. 저장된 토큰 가져오기
    const tokens = getStoredTokens();
    if (!tokens) {
      return {
        data: null,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: '저장된 세션이 없습니다.',
        },
      };
    }

    let { accessToken, refreshToken } = tokens;

    // 2. Access Token 유효성 확인
    if (!isTokenValid(accessToken)) {
      console.log('Access token expired, attempting refresh...');

      // 3. Refresh Token으로 갱신 시도
      const newAccessToken = refreshAccessToken(refreshToken);

      if (!newAccessToken) {
        // Refresh Token도 만료됨 → 재로그인 필요
        clearTokens();
        return {
          data: null,
          error: {
            code: 'TOKEN_EXPIRED',
            message: '세션이 만료되었습니다. 다시 로그인해주세요.',
          },
        };
      }

      // 4. 새 Access Token 저장
      accessToken = newAccessToken;
      saveTokens({ accessToken, refreshToken });
      console.log('Access token refreshed successfully');
    }

    // 5. 사용자 정보 복원
    const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!userInfoStr) {
      return {
        data: null,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: '사용자 정보를 찾을 수 없습니다.',
        },
      };
    }

    const user = JSON.parse(userInfoStr) as User;

    return {
      data: { user, accessToken },
      error: null,
    };
  } catch (error) {
    console.error('Session restoration error:', error);
    clearTokens(); // 에러 시 토큰 정리
    return {
      data: null,
      error: {
        code: 'TOKEN_INVALID',
        message: '세션 복원 중 오류가 발생했습니다.',
      },
    };
  }
}

/**
 * 로그아웃
 *
 * 🎓 로그아웃 플로우:
 * 1. localStorage의 모든 토큰 삭제
 * 2. 토큰 메타데이터 삭제
 * 3. Redux 상태는 auth-slice에서 초기화
 *
 * 📊 완전한 로그아웃 체크리스트:
 * - ✅ Access Token 삭제
 * - ✅ Refresh Token 삭제
 * - ✅ 사용자 정보 삭제
 * - ✅ 토큰 메타데이터 삭제
 * - ✅ Redux 상태 초기화 (slice에서)
 *
 * @returns 성공 또는 에러
 */
export async function logout(): Promise<{ error: AuthError | null }> {
  try {
    // 모든 토큰 및 사용자 정보 삭제
    clearTokens();

    console.log('Logout successful');
    return { error: null };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      error: {
        code: 'TOKEN_INVALID',
        message: '로그아웃 처리 중 오류가 발생했습니다.',
      },
    };
  }
}

// ============================================
// 토큰 관리
// ============================================

/**
 * 현재 Access Token 가져오기
 *
 * 🎓 사용처:
 * - Axios 인터셉터에서 API 요청 시 사용
 * - Redux store에 저장된 토큰과 동기화
 *
 * @returns Access Token 또는 null
 */
export function getAccessToken(): string | null {
  const tokens = getStoredTokens();
  return tokens?.accessToken || null;
}

/**
 * Access Token 수동 갱신
 *
 * 🎓 자동 갱신 vs 수동 갱신:
 * - 자동: API 요청 시 인터셉터가 자동으로 처리
 * - 수동: 특정 시점에 명시적으로 갱신 (예: 사용자 액션 전)
 *
 * @returns 새 토큰 또는 null
 */
export async function manualRefreshToken(): Promise<{
  data: { accessToken: string } | null;
  error: AuthError | null;
}> {
  try {
    const tokens = getStoredTokens();
    if (!tokens) {
      return {
        data: null,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: '저장된 토큰이 없습니다.',
        },
      };
    }

    const newAccessToken = refreshAccessToken(tokens.refreshToken);

    if (!newAccessToken) {
      clearTokens();
      return {
        data: null,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Refresh token이 만료되었습니다.',
        },
      };
    }

    // 새 토큰 저장
    saveTokens({
      accessToken: newAccessToken,
      refreshToken: tokens.refreshToken,
    });

    return {
      data: { accessToken: newAccessToken },
      error: null,
    };
  } catch (error) {
    console.error('Manual refresh error:', error);
    return {
      data: null,
      error: {
        code: 'TOKEN_INVALID',
        message: '토큰 갱신 중 오류가 발생했습니다.',
      },
    };
  }
}

// ============================================
// 유틸리티
// ============================================

/**
 * 현재 인증 상태 확인
 *
 * 🎓 사용처:
 * - Protected Route에서 접근 권한 확인
 * - UI 조건부 렌더링 (로그인 버튼 표시 여부 등)
 *
 * @returns 인증 여부
 */
export function isAuthenticated(): boolean {
  const tokens = getStoredTokens();
  if (!tokens) return false;

  // Access Token이 유효하거나, Refresh Token으로 갱신 가능하면 인증됨
  return isTokenValid(tokens.accessToken) || isTokenValid(tokens.refreshToken);
}

/**
 * 현재 사용자 정보 가져오기
 *
 * @returns 사용자 정보 또는 null
 */
export function getCurrentUser(): User | null {
  try {
    const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!userInfoStr) return null;

    return JSON.parse(userInfoStr) as User;
  } catch {
    return null;
  }
}
