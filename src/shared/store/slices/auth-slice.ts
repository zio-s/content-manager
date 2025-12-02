/**
 * Auth Slice - Redux Toolkit
 *
 * 🎓 핵심 개념:
 * 1. Slice: Redux의 상태 조각 (auth 관련 상태만 관리)
 * 2. Thunk: 비동기 액션 (API 호출 등)
 * 3. Reducer: 상태 변경 로직
 *
 * 📊 KOMCA 패턴:
 * - authSlice.ts와 동일한 구조
 * - createAsyncThunk로 비동기 처리
 * - extraReducers로 로딩/성공/실패 상태 관리
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User, LoginCredentials } from '../../auth/types';
import * as authService from '../../auth/auth-service';
import * as userService from '../../auth/user-service';
import type { UpdateProfileParams, ChangePasswordParams } from '../../auth/user-service';

// ============================================
// 상태 타입 정의
// ============================================

/**
 * Auth 상태 구조
 *
 * 🎓 왜 이런 구조인가?
 * - user: 현재 로그인한 사용자 정보
 * - accessToken: API 요청에 사용할 토큰
 * - isAuthenticated: 로그인 여부 (UI 렌더링 제어)
 * - loading: 비동기 작업 진행 중 (로딩 스피너 표시)
 * - error: 에러 메시지 (사용자에게 표시)
 */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * 초기 상태
 *
 * 🎓 앱 시작 시 상태:
 * - 모든 값이 null/false
 * - getSession thunk가 자동으로 세션 복원 시도
 */
const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// ============================================
// 비동기 Thunk 액션
// ============================================

/**
 * 로그인 Thunk
 *
 * 🎓 createAsyncThunk 패턴:
 * 1. pending: 요청 시작 → loading = true
 * 2. fulfilled: 성공 → user/token 저장, loading = false
 * 3. rejected: 실패 → error 저장, loading = false
 *
 * 📊 컴포넌트에서 사용:
 * ```typescript
 * dispatch(loginThunk({ email, password }))
 *   .unwrap() // Promise로 변환
 *   .then(() => navigate('/dashboard'))
 *   .catch((error) => alert(error))
 * ```
 */
export const loginThunk = createAsyncThunk<
  { user: User; accessToken: string }, // 성공 시 반환 타입
  LoginCredentials,                     // 입력 파라미터 타입
  { rejectValue: string }               // 실패 시 반환 타입
>('auth/login', async (credentials, { rejectWithValue }) => {
  const { data, error } = await authService.login(credentials);

  if (error || !data) {
    return rejectWithValue(error?.message || '로그인에 실패했습니다.');
  }

  return {
    user: data.user,
    accessToken: data.tokens.accessToken,
  };
});

/**
 * 세션 복원 Thunk
 *
 * 🎓 언제 호출?
 * - App 초기 로드 시 (useEffect)
 * - 페이지 새로고침 후
 *
 * 📊 목적:
 * - localStorage의 토큰으로 자동 로그인
 * - 사용자가 매번 로그인하지 않도록
 */
export const getSessionThunk = createAsyncThunk<
  { user: User; accessToken: string },
  void,
  { rejectValue: string }
>('auth/getSession', async (_, { rejectWithValue }) => {
  const { data, error } = await authService.getSession();

  if (error || !data) {
    return rejectWithValue(error?.message || '세션을 복원할 수 없습니다.');
  }

  return {
    user: data.user,
    accessToken: data.accessToken,
  };
});

/**
 * 로그아웃 Thunk
 *
 * 🎓 로그아웃 과정:
 * 1. authService.logout() 호출 → localStorage 클리어
 * 2. Redux 상태 초기화 (fulfilled에서 처리)
 * 3. 컴포넌트에서 로그인 페이지로 리다이렉트
 */
export const logoutThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    const { error } = await authService.logout();

    if (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 토큰 수동 갱신 Thunk
 *
 * 🎓 자동 vs 수동:
 * - 자동: Axios 인터셉터가 API 요청 전 자동 갱신
 * - 수동: 사용자가 명시적으로 갱신 (예: "세션 연장" 버튼)
 */
export const refreshTokenThunk = createAsyncThunk<
  { accessToken: string },
  void,
  { rejectValue: string }
>('auth/refreshToken', async (_, { rejectWithValue }) => {
  const { data, error } = await authService.manualRefreshToken();

  if (error || !data) {
    return rejectWithValue(error?.message || '토큰 갱신에 실패했습니다.');
  }

  return { accessToken: data.accessToken };
});

/**
 * 프로필 수정 Thunk
 */
export const updateProfileThunk = createAsyncThunk<
  User,
  { userId: string; params: UpdateProfileParams },
  { rejectValue: string }
>('auth/updateProfile', async ({ userId, params }, { rejectWithValue }) => {
  const { data, error } = await userService.updateProfile(userId, params);

  if (error || !data) {
    return rejectWithValue(error?.message || '프로필 수정에 실패했습니다.');
  }

  return data;
});

/**
 * 비밀번호 변경 Thunk
 */
export const changePasswordThunk = createAsyncThunk<
  void,
  { userId: string; params: ChangePasswordParams },
  { rejectValue: string }
>('auth/changePassword', async ({ userId, params }, { rejectWithValue }) => {
  const { success, error } = await userService.changePassword(userId, params);

  if (!success || error) {
    return rejectWithValue(error?.message || '비밀번호 변경에 실패했습니다.');
  }
});

// ============================================
// Slice 정의
// ============================================

/**
 * Auth Slice
 *
 * 🎓 구성 요소:
 * - name: slice 이름 (액션 타입 접두사로 사용)
 * - initialState: 초기 상태
 * - reducers: 동기 액션 (즉시 상태 변경)
 * - extraReducers: 비동기 액션 처리 (Thunk)
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * 에러 메시지 클리어
     *
     * 🎓 사용처:
     * - 에러 표시 후 사용자가 확인 버튼 클릭
     * - 새로운 작업 시작 전 이전 에러 초기화
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * 토큰 직접 설정
     *
     * 🎓 사용처:
     * - Axios 인터셉터에서 자동 갱신 후 Redux 동기화
     * - 특수한 경우 직접 토큰 주입
     */
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },

    /**
     * 인증 상태 완전 초기화
     *
     * 🎓 사용처:
     * - 에러 복구 시
     * - 강제 로그아웃 시
     */
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ==========================================
    // 로그인 Thunk 처리
    // ==========================================
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '로그인에 실패했습니다.';
        state.isAuthenticated = false;
      });

    // ==========================================
    // 세션 복원 Thunk 처리
    // ==========================================
    builder
      .addCase(getSessionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSessionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getSessionThunk.rejected, (state) => {
        state.loading = false;
        // 세션 복원 실패는 조용히 처리 (에러 메시지 표시 안 함)
        state.error = null;
        state.isAuthenticated = false;
      });

    // ==========================================
    // 로그아웃 Thunk 처리
    // ==========================================
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    });

    // ==========================================
    // 토큰 갱신 Thunk 처리
    // ==========================================
    builder
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
      })
      .addCase(refreshTokenThunk.rejected, (state, action) => {
        state.error = action.payload || '토큰 갱신에 실패했습니다.';
        state.isAuthenticated = false;
      });

    // ==========================================
    // 프로필 수정 Thunk 처리
    // ==========================================
    builder
      .addCase(updateProfileThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '프로필 수정에 실패했습니다.';
      });

    // ==========================================
    // 비밀번호 변경 Thunk 처리
    // ==========================================
    builder
      .addCase(changePasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePasswordThunk.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changePasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '비밀번호 변경에 실패했습니다.';
      });
  },
});

// ============================================
// 액션 & 셀렉터 Export
// ============================================

// 동기 액션
export const { clearError, setAccessToken, clearAuth } = authSlice.actions;

// 셀렉터 (상태 접근 함수)
/**
 * 🎓 셀렉터란?
 * - Redux store에서 특정 값을 꺼내는 함수
 * - 컴포넌트에서 useSelector(selectUser) 형태로 사용
 * - 타입 안정성 확보
 */
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

// 파생 셀렉터 (계산된 값)
/**
 * 사용자 역할 확인
 *
 * 🎓 사용처:
 * - 관리자 전용 메뉴 표시
 * - 권한별 기능 제한
 */
export const selectUserRole = (state: { auth: AuthState }) => state.auth.user?.role;
export const selectIsAdmin = (state: { auth: AuthState }) => state.auth.user?.role === 'admin';

// Reducer export (store 설정에 사용)
export default authSlice.reducer;
