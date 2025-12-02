/**
 * Redux Store 설정
 *
 * 🎓 핵심 개념:
 * - Store: 애플리케이션의 전역 상태 저장소
 * - Reducer: 상태를 변경하는 함수들의 조합
 * - Middleware: Redux의 기능을 확장 (비동기 처리 등)
 *
 * 📊 KOMCA 패턴:
 * - configureStore 사용 (Redux Toolkit 권장)
 * - 타입 안전성을 위한 RootState, AppDispatch export
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth-slice';
import analyticsReducer from './slices/analytics-slice';
import settingsReducer from './slices/settings-slice';

/**
 * Redux Store 생성
 *
 * 🎓 configureStore의 장점:
 * - Redux DevTools 자동 활성화
 * - redux-thunk 미들웨어 자동 포함
 * - 불변성 검사 자동 활성화 (개발 모드)
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    analytics: analyticsReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 🎓 직렬화 체크 무시할 액션 타입
        // (파일, Date 객체 등 직렬화 불가능한 값 사용 시)
        ignoredActions: [],
        ignoredPaths: [],
      },
    }),
});

// ============================================
// 타입 정의 (TypeScript 지원)
// ============================================

/**
 * RootState 타입
 *
 * 🎓 사용처:
 * - useSelector의 타입 추론
 * - 셀렉터 함수의 파라미터 타입
 *
 * 예시:
 * ```typescript
 * const user = useSelector((state: RootState) => state.auth.user)
 * ```
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * AppDispatch 타입
 *
 * 🎓 사용처:
 * - useDispatch의 타입 추론
 * - Thunk 액션 dispatch 시 타입 안정성
 *
 * 예시:
 * ```typescript
 * const dispatch = useDispatch<AppDispatch>()
 * dispatch(loginThunk({ email, password }))
 * ```
 */
export type AppDispatch = typeof store.dispatch;
