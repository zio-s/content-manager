/**
 * Axios Instance + Interceptors
 *
 * 🎓 핵심 개념:
 * 1. 인터셉터: HTTP 요청/응답을 가로채서 처리
 * 2. 요청 인터셉터: 모든 API 요청에 자동으로 토큰 주입
 * 3. 응답 인터셉터: 401 에러 시 자동으로 토큰 갱신
 *
 * 📊 KOMCA 패턴:
 * - axios-factory.ts의 AxiosClientFactory 패턴
 * - 요청/응답 인터셉터 동시 사용
 * - Redux store 직접 접근
 */

import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '../store/store';
import { setAccessToken, clearAuth } from '../store/slices/auth-slice';
import { getStoredTokens, isTokenValid, refreshAccessToken, saveTokens } from '../auth/token-manager';

/**
 * Axios 인스턴스 생성
 *
 * 🎓 기본 설정:
 * - baseURL: API 기본 URL (우리는 Mock이므로 '')
 * - timeout: 요청 제한 시간 (10분)
 * - headers: 기본 헤더
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: '', // Mock 환경에서는 상대 경로 사용
  timeout: 600000, // 10분
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// 요청 인터셉터 (Request Interceptor)
// ============================================

/**
 * 요청 인터셉터
 *
 * 🎓 동작 순서:
 * 1. API 요청 발생 (예: axios.get('/api/posts'))
 * 2. 인터셉터가 요청을 가로챔
 * 3. Redux store에서 accessToken 가져옴
 * 4. Authorization 헤더에 토큰 추가
 * 5. 실제 요청 전송
 *
 * 📊 KOMCA 패턴:
 * ```typescript
 * config.headers['Authorization'] = `Bearer ${token}`
 * config.headers['uuid'] = uuid()
 * ```
 */
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Redux store에서 현재 accessToken 가져오기
    const state = store.getState();
    let token = state.auth.accessToken;

    // 2. 토큰이 없으면 localStorage에서 시도
    if (!token) {
      const tokens = getStoredTokens();
      token = tokens?.accessToken || null;
    }

    // 3. 토큰이 있으면 Authorization 헤더에 추가
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 4. 요청 ID 추가 (디버깅용, KOMCA 패턴)
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// 응답 인터셉터 (Response Interceptor)
// ============================================

/**
 * 응답 인터셉터
 *
 * 🎓 자동 토큰 갱신 플로우:
 * 1. API 요청 → 401 Unauthorized 에러
 * 2. 응답 인터셉터가 401 에러 감지
 * 3. Refresh Token으로 새 Access Token 발급
 * 4. 원래 요청을 새 토큰으로 재시도
 * 5. 재시도 성공 → 사용자는 에러를 느끼지 못함
 *
 * 📊 KOMCA 패턴 완벽 재현:
 * - 401 에러 시 자동 갱신
 * - 갱신 실패 시 로그아웃
 * - 재시도 무한 루프 방지 (_isRetry 플래그)
 */
axiosInstance.interceptors.response.use(
  // 성공 응답 처리
  (response) => {
    return response;
  },

  // 에러 응답 처리
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _isRetry?: boolean };

    // ==========================================
    // 401 Unauthorized 처리
    // ==========================================
    if (error.response?.status === 401 && originalRequest && !originalRequest._isRetry) {
      console.log('401 Unauthorized detected, attempting token refresh...');

      // 재시도 플래그 설정 (무한 루프 방지)
      originalRequest._isRetry = true;

      try {
        // 1. Refresh Token으로 새 Access Token 발급
        const tokens = getStoredTokens();
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        // 2. Refresh Token 유효성 확인
        if (!isTokenValid(tokens.refreshToken)) {
          throw new Error('Refresh token expired');
        }

        // 3. 새 Access Token 생성
        const newAccessToken = refreshAccessToken(tokens.refreshToken);
        if (!newAccessToken) {
          throw new Error('Failed to generate new access token');
        }

        // 4. 새 토큰 저장 (localStorage + Redux)
        saveTokens({
          accessToken: newAccessToken,
          refreshToken: tokens.refreshToken,
        });
        store.dispatch(setAccessToken(newAccessToken));

        // 5. 원래 요청에 새 토큰 적용
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // 6. 원래 요청 재시도
        console.log('Token refreshed successfully, retrying original request...');
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // 갱신 실패 → 완전 로그아웃
        console.error('Token refresh failed:', refreshError);

        // Redux 상태 초기화
        store.dispatch(clearAuth());

        // 로그인 페이지로 리다이렉트 (선택사항)
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    }

    // ==========================================
    // 기타 에러 처리
    // ==========================================

    // 네트워크 에러
    if (error.message === 'Network Error') {
      console.error('Network error detected. Please check your internet connection.');
    }

    // 타임아웃 에러
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    }

    return Promise.reject(error);
  }
);

// ============================================
// Export
// ============================================

/**
 * 기본 Axios 인스턴스
 *
 * 🎓 사용법:
 * ```typescript
 * import { apiClient } from '@/shared/api/axios-instance'
 *
 * // GET 요청
 * const response = await apiClient.get('/mock-data/posts.json')
 *
 * // POST 요청 (실제 API에서 사용)
 * const response = await apiClient.post('/api/posts', { title, content })
 * ```
 */
export const apiClient = axiosInstance;

/**
 * 특정 서비스용 클라이언트 생성 (KOMCA 패턴)
 *
 * 🎓 KOMCA는 서비스별로 클라이언트 분리:
 * - memberAxiosClient
 * - collectdistAxiosClient
 * - centerAxiosClient
 *
 * 우리는 하나만 사용하지만, 확장 가능하도록 구조 유지
 */
export function createApiClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 600000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export default apiClient;
