/**
 * Settings Slice
 *
 * 앱 설정 중앙 관리
 * - 테마 (라이트/다크)
 * - 대시보드 기본 기간
 * - 알림 설정
 * - localStorage 자동 동기화
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// ============================================
// 타입 정의
// ============================================

type Theme = 'light' | 'dark' | 'system';
type DefaultPeriod = '7d' | '30d' | '90d';

interface AppSettings {
  theme: Theme;
  defaultPeriod: DefaultPeriod;
  notifications: {
    email: boolean;
    push: boolean;
  };
  language: 'ko' | 'en';
}

interface SettingsState {
  app: AppSettings;
  initialized: boolean;
}

// ============================================
// Storage 키 및 초기값
// ============================================

const SETTINGS_STORAGE_KEY = 'app_settings';

const defaultSettings: AppSettings = {
  theme: 'light',
  defaultPeriod: '30d',
  notifications: {
    email: true,
    push: false,
  },
  language: 'ko',
};

// localStorage에서 설정 로드
function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return defaultSettings;
}

// localStorage에 설정 저장
function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

const initialState: SettingsState = {
  app: loadSettings(),
  initialized: true,
};

// ============================================
// Slice 정의
// ============================================

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // 테마 변경
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.app.theme = action.payload;
      saveSettings(state.app);

      // 실제 테마 적용
      applyTheme(action.payload);
    },

    // 기본 기간 변경
    setDefaultPeriod: (state, action: PayloadAction<DefaultPeriod>) => {
      state.app.defaultPeriod = action.payload;
      saveSettings(state.app);
    },

    // 알림 설정 변경
    setNotifications: (state, action: PayloadAction<Partial<AppSettings['notifications']>>) => {
      state.app.notifications = { ...state.app.notifications, ...action.payload };
      saveSettings(state.app);
    },

    // 언어 변경
    setLanguage: (state, action: PayloadAction<'ko' | 'en'>) => {
      state.app.language = action.payload;
      saveSettings(state.app);
    },

    // 전체 설정 리셋
    resetSettings: (state) => {
      state.app = defaultSettings;
      saveSettings(state.app);
      applyTheme(defaultSettings.theme);
    },
  },
});

// ============================================
// 테마 적용 헬퍼
// ============================================

function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

// 앱 초기화 시 테마 적용
if (typeof window !== 'undefined') {
  applyTheme(loadSettings().theme);
}

// ============================================
// Actions & Selectors
// ============================================

export const {
  setTheme,
  setDefaultPeriod,
  setNotifications,
  setLanguage,
  resetSettings,
} = settingsSlice.actions;

// Selectors
export const selectSettings = (state: RootState) => state.settings.app;
export const selectTheme = (state: RootState) => state.settings.app.theme;
export const selectDefaultPeriod = (state: RootState) => state.settings.app.defaultPeriod;
export const selectNotifications = (state: RootState) => state.settings.app.notifications;
export const selectLanguage = (state: RootState) => state.settings.app.language;

export default settingsSlice.reducer;
