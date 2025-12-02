/**
 * Token Manager
 *
 * 🎓 핵심 개념:
 * 1. 토큰 생성: UUID + 메타데이터를 localStorage에 저장
 * 2. 토큰 검증: 만료 시간을 체크하여 유효성 확인
 * 3. 토큰 갱신: refresh token으로 새 access token 발급
 *
 * 🔐 보안 개념 (실제 프로덕션):
 * - Access Token: 짧은 수명으로 탈취 위험 최소화
 * - Refresh Token: 긴 수명으로 사용자 편의성 확보
 * - 이중 토큰 전략으로 보안과 UX 균형
 */

import { v4 as uuidv4 } from 'uuid';
import type { User, TokenPair } from './types';
import { STORAGE_KEYS } from './types';

// 토큰 만료 시간 (밀리초)
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15분
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7일

/**
 * 토큰 메타데이터 저장소
 *
 * 🎓 왜 별도로 저장하나?
 * - UUID 토큰 자체에는 정보가 없음
 * - 토큰과 연결된 메타데이터(사용자 정보, 만료시간)를 별도 관리
 *
 * 실제 JWT는 토큰 자체에 정보가 인코딩되어 있지만,
 * UUID 방식은 토큰이 단순 식별자이므로 메타데이터를 따로 저장
 */
interface TokenMetadata {
  userId: string;
  email: string;
  role: User['role'];
  issuedAt: number;
  expiresAt: number;
}

// ============================================
// 토큰 생성
// ============================================

/**
 * Access Token 생성
 *
 * 🎓 과정:
 * 1. UUID로 랜덤한 고유 토큰 생성
 * 2. 토큰과 연결된 메타데이터를 localStorage에 저장
 * 3. 토큰 문자열 반환
 *
 * @param user - 사용자 정보
 * @returns Access Token (UUID 문자열)
 */
function generateAccessToken(user: User): string {
  const token = uuidv4(); // 예: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  const now = Date.now();

  const metadata: TokenMetadata = {
    userId: user.id,
    email: user.email,
    role: user.role,
    issuedAt: now,
    expiresAt: now + ACCESS_TOKEN_EXPIRY,
  };

  // 메타데이터 저장 (토큰을 키로 사용)
  localStorage.setItem(`token_meta_${token}`, JSON.stringify(metadata));

  return token;
}

/**
 * Refresh Token 생성
 *
 * 🎓 Access Token과의 차이:
 * - 수명이 훨씬 길다 (7일 vs 15분)
 * - API 요청에 사용하지 않고, Access Token 갱신에만 사용
 * - 보안상 더 민감하게 관리해야 함
 */
function generateRefreshToken(user: User): string {
  const token = uuidv4();
  const now = Date.now();

  const metadata: TokenMetadata = {
    userId: user.id,
    email: user.email,
    role: user.role,
    issuedAt: now,
    expiresAt: now + REFRESH_TOKEN_EXPIRY,
  };

  localStorage.setItem(`token_meta_${token}`, JSON.stringify(metadata));

  return token;
}

/**
 * 토큰 쌍 생성 (로그인 시 호출)
 *
 * 🎓 왜 두 개를 함께 발급하나?
 * - Access Token만 사용: 15분마다 재로그인 필요 (UX 나쁨)
 * - Refresh Token만 사용: 탈취 시 7일간 악용 가능 (보안 나쁨)
 * - 두 개 함께 사용: 보안과 UX 모두 만족
 */
export function createTokenPair(user: User): TokenPair {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
}

// ============================================
// 토큰 검증
// ============================================

/**
 * 토큰 메타데이터 가져오기
 *
 * @param token - 토큰 문자열
 * @returns 메타데이터 또는 null
 */
function getTokenMetadata(token: string): TokenMetadata | null {
  try {
    const metadata = localStorage.getItem(`token_meta_${token}`);
    if (!metadata) return null;

    return JSON.parse(metadata) as TokenMetadata;
  } catch {
    return null;
  }
}

/**
 * 토큰 유효성 검증
 *
 * 🎓 검증 과정:
 * 1. 토큰의 메타데이터가 존재하는지 확인
 * 2. 만료 시간이 지나지 않았는지 확인
 *
 * @param token - 검증할 토큰
 * @returns 유효 여부
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  const metadata = getTokenMetadata(token);
  if (!metadata) return false;

  // 현재 시간이 만료 시간보다 이전이면 유효
  return Date.now() < metadata.expiresAt;
}

/**
 * 토큰에서 사용자 정보 추출
 *
 * 🎓 실제 JWT에서는:
 * - 토큰을 디코딩하면 바로 사용자 정보 추출 가능
 * - 우리는 localStorage에서 메타데이터를 가져옴
 */
export function getUserFromToken(token: string): User | null {
  const metadata = getTokenMetadata(token);
  if (!metadata) return null;

  return {
    id: metadata.userId,
    email: metadata.email,
    name: '', // 나중에 추가 정보는 API에서 가져옴
    role: metadata.role,
  };
}

// ============================================
// 토큰 갱신
// ============================================

/**
 * Access Token 갱신
 *
 * 🎓 자동 갱신 플로우:
 * 1. API 요청 전 Access Token 만료 확인
 * 2. 만료되었으면 Refresh Token으로 새 Access Token 발급
 * 3. 새 토큰으로 원래 요청 재시도
 *
 * @param refreshToken - Refresh Token
 * @returns 새 Access Token 또는 null
 */
export function refreshAccessToken(refreshToken: string): string | null {
  // 1. Refresh Token 유효성 확인
  if (!isTokenValid(refreshToken)) {
    console.error('Refresh token expired or invalid');
    return null;
  }

  // 2. Refresh Token에서 사용자 정보 추출
  const metadata = getTokenMetadata(refreshToken);
  if (!metadata) return null;

  // 3. 새 Access Token 생성
  const user: User = {
    id: metadata.userId,
    email: metadata.email,
    name: '',
    role: metadata.role,
  };

  return generateAccessToken(user);
}

// ============================================
// 토큰 저장/삭제
// ============================================

/**
 * 토큰을 localStorage에 저장
 *
 * 🎓 실제 프로덕션에서는:
 * - Access Token: Memory 또는 httpOnly Cookie
 * - Refresh Token: httpOnly Cookie (XSS 공격 방지)
 * - localStorage: XSS 공격에 취약하므로 주의 필요
 */
export function saveTokens(tokens: TokenPair): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
}

/**
 * localStorage에서 토큰 가져오기
 */
export function getStoredTokens(): TokenPair | null {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}

/**
 * 토큰 삭제 (로그아웃)
 *
 * 🎓 완전한 로그아웃:
 * 1. localStorage에서 토큰 삭제
 * 2. 토큰 메타데이터도 함께 삭제
 * 3. Redux 상태 초기화 (auth-slice에서 처리)
 */
export function clearTokens(): void {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  // 토큰 자체 삭제
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_INFO);

  // 메타데이터도 삭제
  if (accessToken) {
    localStorage.removeItem(`token_meta_${accessToken}`);
  }
  if (refreshToken) {
    localStorage.removeItem(`token_meta_${refreshToken}`);
  }
}

// ============================================
// 유틸리티
// ============================================

/**
 * 토큰 만료까지 남은 시간 (밀리초)
 */
export function getTokenTimeRemaining(token: string): number {
  const metadata = getTokenMetadata(token);
  if (!metadata) return 0;

  const remaining = metadata.expiresAt - Date.now();
  return Math.max(0, remaining);
}

/**
 * 토큰 정보 출력 (디버깅용)
 */
export function debugToken(token: string): void {
  const metadata = getTokenMetadata(token);
  if (!metadata) {
    console.log('Token not found or invalid');
    return;
  }

  const remainingMs = getTokenTimeRemaining(token);
  const remainingMin = Math.floor(remainingMs / 60000);

  console.log('Token Info:', {
    userId: metadata.userId,
    email: metadata.email,
    role: metadata.role,
    issuedAt: new Date(metadata.issuedAt).toLocaleString(),
    expiresAt: new Date(metadata.expiresAt).toLocaleString(),
    remainingMinutes: remainingMin,
    isValid: isTokenValid(token),
  });
}
