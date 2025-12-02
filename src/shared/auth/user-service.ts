/**
 * User Service
 *
 * 사용자 프로필 및 계정 관리
 * - 프로필 정보 수정
 * - 비밀번호 변경
 * - 사용자 데이터 localStorage 동기화
 *
 * 핵심: 비밀번호 변경 시 로그인 예시 정보도 함께 업데이트
 */

import type { User, AuthError } from './types';
import { STORAGE_KEYS } from './types';

// ============================================
// Storage Keys
// ============================================

const CUSTOM_USERS_KEY = 'custom_users';

// ============================================
// 타입 정의
// ============================================

export interface UserCredential {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
}

export interface UpdateProfileParams {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

// ============================================
// 사용자 데이터 관리
// ============================================

/**
 * 커스텀 사용자 데이터 로드
 * - localStorage에 저장된 수정된 사용자 정보
 * - 비밀번호 변경 등이 반영됨
 */
export function getCustomUsers(): UserCredential[] {
  try {
    const stored = localStorage.getItem(CUSTOM_USERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load custom users:', e);
  }
  return [];
}

/**
 * 커스텀 사용자 데이터 저장
 */
function saveCustomUsers(users: UserCredential[]): void {
  try {
    localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save custom users:', e);
  }
}

/**
 * 전체 사용자 목록 가져오기 (mock + custom 병합)
 * - 기본 mock 데이터와 수정된 데이터 병합
 * - custom에 있으면 custom 데이터 우선
 */
export async function getAllUsers(): Promise<UserCredential[]> {
  try {
    // 1. mock 데이터 로드
    const response = await fetch('/mock-data/auth.json');
    if (!response.ok) throw new Error('Failed to load auth data');

    const authData = await response.json();
    const mockUsers = authData.users as UserCredential[];

    // 2. custom 데이터 로드
    const customUsers = getCustomUsers();

    // 3. 병합 (custom 우선)
    const merged = mockUsers.map((mockUser) => {
      const customUser = customUsers.find((u) => u.id === mockUser.id);
      return customUser || mockUser;
    });

    return merged;
  } catch (e) {
    console.error('Failed to get all users:', e);
    return [];
  }
}

/**
 * 특정 사용자 정보 가져오기
 */
export async function getUserById(userId: string): Promise<UserCredential | null> {
  const users = await getAllUsers();
  return users.find((u) => u.id === userId) || null;
}

// ============================================
// 프로필 수정
// ============================================

/**
 * 프로필 정보 수정
 */
export async function updateProfile(
  userId: string,
  params: UpdateProfileParams
): Promise<{ data: User | null; error: AuthError | null }> {
  try {
    // 1. 현재 사용자 정보 가져오기
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      return {
        data: null,
        error: { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' },
      };
    }

    // 2. 수정된 정보 생성
    const updatedUser: UserCredential = {
      ...currentUser,
      name: params.name ?? currentUser.name,
      email: params.email ?? currentUser.email,
      avatar: params.avatar ?? currentUser.avatar,
    };

    // 3. custom users에 저장
    const customUsers = getCustomUsers();
    const existingIndex = customUsers.findIndex((u) => u.id === userId);
    if (existingIndex >= 0) {
      customUsers[existingIndex] = updatedUser;
    } else {
      customUsers.push(updatedUser);
    }
    saveCustomUsers(customUsers);

    // 4. 현재 로그인된 사용자 정보도 업데이트
    const userInfo: User = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
    };
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));

    return { data: userInfo, error: null };
  } catch (e) {
    console.error('Failed to update profile:', e);
    return {
      data: null,
      error: { code: 'UPDATE_FAILED', message: '프로필 수정에 실패했습니다.' },
    };
  }
}

// ============================================
// 비밀번호 변경
// ============================================

/**
 * 비밀번호 변경
 *
 * 핵심: 변경 후 로그인 페이지의 예시 정보도 업데이트됨
 */
export async function changePassword(
  userId: string,
  params: ChangePasswordParams
): Promise<{ success: boolean; error: AuthError | null }> {
  try {
    // 1. 현재 사용자 정보 가져오기
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' },
      };
    }

    // 2. 현재 비밀번호 확인
    if (currentUser.password !== params.currentPassword) {
      return {
        success: false,
        error: { code: 'INVALID_PASSWORD', message: '현재 비밀번호가 올바르지 않습니다.' },
      };
    }

    // 3. 새 비밀번호 유효성 검사
    if (params.newPassword.length < 4) {
      return {
        success: false,
        error: { code: 'WEAK_PASSWORD', message: '비밀번호는 4자 이상이어야 합니다.' },
      };
    }

    if (params.currentPassword === params.newPassword) {
      return {
        success: false,
        error: { code: 'SAME_PASSWORD', message: '새 비밀번호가 현재 비밀번호와 같습니다.' },
      };
    }

    // 4. 비밀번호 업데이트
    const updatedUser: UserCredential = {
      ...currentUser,
      password: params.newPassword,
    };

    // 5. custom users에 저장
    const customUsers = getCustomUsers();
    const existingIndex = customUsers.findIndex((u) => u.id === userId);
    if (existingIndex >= 0) {
      customUsers[existingIndex] = updatedUser;
    } else {
      customUsers.push(updatedUser);
    }
    saveCustomUsers(customUsers);

    console.log('Password changed successfully for user:', userId);

    return { success: true, error: null };
  } catch (e) {
    console.error('Failed to change password:', e);
    return {
      success: false,
      error: { code: 'UPDATE_FAILED', message: '비밀번호 변경에 실패했습니다.' },
    };
  }
}

// ============================================
// 로그인 예시 정보 조회
// ============================================

/**
 * 로그인 페이지 예시 정보 가져오기
 * - 비밀번호 변경이 반영된 최신 정보
 */
export async function getLoginExamples(): Promise<
  Array<{ label: string; email: string; password: string }>
> {
  const users = await getAllUsers();

  return users.map((user) => ({
    label: user.role === 'admin' ? '관리자' : '일반 사용자',
    email: user.email,
    password: user.password,
  }));
}

// ============================================
// 데이터 초기화
// ============================================

/**
 * 커스텀 사용자 데이터 초기화
 * - mock 데이터로 리셋
 */
export function resetUserData(): void {
  localStorage.removeItem(CUSTOM_USERS_KEY);
  console.log('User data reset to default');
}
