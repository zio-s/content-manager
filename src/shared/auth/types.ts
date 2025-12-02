/**
 * 인증 관련 타입 정의
 *
 * 🎓 학습 포인트:
 * - Access Token: 짧은 수명 (15분), API 요청에 사용
 * - Refresh Token: 긴 수명 (7일), Access Token 갱신에 사용
 * - 이중 토큰 전략으로 보안과 편의성을 동시에 확보
 */

// ============================================
// 사용자 관련 타입
// ============================================

/**
 * 사용자 역할
 * admin: 관리자 (모든 권한)
 * user: 일반 사용자 (읽기 전용)
 */
export type UserRole = 'admin' | 'user';

/**
 * 사용자 정보
 * 로그인 후 애플리케이션 전체에서 사용되는 사용자 데이터
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

// ============================================
// 토큰 관련 타입
// ============================================

/**
 * 토큰 페이로드 (토큰 안에 저장되는 정보)
 *
 * 🎓 실제 JWT 구조:
 * - Header: 알고리즘 정보
 * - Payload: 사용자 정보 (우리가 구현하는 부분)
 * - Signature: 서명 (Mock에서는 생략)
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  issuedAt: number;    // 발급 시간 (timestamp)
  expiresAt: number;   // 만료 시간 (timestamp)
}

/**
 * 토큰 쌍
 * 로그인 성공 시 함께 발급됨
 */
export interface TokenPair {
  accessToken: string;   // API 요청용 (15분)
  refreshToken: string;  // 갱신용 (7일)
}

/**
 * 토큰 만료 시간 설정 (밀리초)
 */
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 15 * 60 * 1000,        // 15분
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7일
} as const;

// ============================================
// 인증 요청/응답 타입
// ============================================

/**
 * 로그인 요청 데이터
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * 로그인 응답 데이터
 */
export interface LoginResponse {
  user: User;
  tokens: TokenPair;
}

/**
 * 인증 에러 타입
 */
export interface AuthError {
  code:
    | 'INVALID_CREDENTIALS'
    | 'TOKEN_EXPIRED'
    | 'TOKEN_INVALID'
    | 'SESSION_NOT_FOUND'
    | 'USER_NOT_FOUND'
    | 'UPDATE_FAILED'
    | 'INVALID_PASSWORD'
    | 'WEAK_PASSWORD'
    | 'SAME_PASSWORD';
  message: string;
}

// ============================================
// localStorage 키
// ============================================

/**
 * localStorage에 저장할 키 이름들
 *
 * 🎓 왜 분리해서 저장하나?
 * - 보안: refreshToken은 XSS 공격에 더 취약하므로 분리
 * - 관리: 각 토큰의 생명주기가 다르므로 독립적으로 관리
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_INFO: 'userInfo',
} as const;
