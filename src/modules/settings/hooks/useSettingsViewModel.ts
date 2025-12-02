/**
 * Settings ViewModel Hook
 *
 * 설정 페이지의 데이터 로직과 상태 관리
 * - 프로필 수정
 * - 비밀번호 변경
 * - 앱 설정 관리
 */

import { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import {
  selectUser,
  selectAuthLoading,
  updateProfileThunk,
  changePasswordThunk,
  clearError,
} from '@/shared/store/slices/auth-slice';
import {
  selectSettings,
  setTheme,
  setDefaultPeriod,
  setNotifications,
  setLanguage,
  resetSettings,
} from '@/shared/store/slices/settings-slice';
import { resetUserData } from '@/shared/auth/user-service';

export function useSettingsViewModel() {
  const dispatch = useAppDispatch();

  // Auth state
  const user = useAppSelector(selectUser);
  const authLoading = useAppSelector(selectAuthLoading);

  // Settings state
  const settings = useAppSelector(selectSettings);

  // Local state for forms
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Profile handlers
  const handleProfileChange = useCallback((field: string, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileSuccess(false);
  }, []);

  const handleProfileSubmit = useCallback(async () => {
    if (!user?.id) return;

    try {
      await dispatch(
        updateProfileThunk({
          userId: user.id,
          params: {
            name: profileForm.name,
            email: profileForm.email,
          },
        })
      ).unwrap();
      setProfileSuccess(true);
    } catch {
      setProfileSuccess(false);
    }
  }, [dispatch, user?.id, profileForm]);

  // Password handlers
  const handlePasswordChange = useCallback((field: string, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordError(null);
    setPasswordSuccess(false);
  }, []);

  const handlePasswordSubmit = useCallback(async () => {
    if (!user?.id) return;

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      setPasswordError('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    try {
      await dispatch(
        changePasswordThunk({
          userId: user.id,
          params: {
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          },
        })
      ).unwrap();

      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordError(error as string);
      setPasswordSuccess(false);
    }
  }, [dispatch, user?.id, passwordForm]);

  // Settings handlers
  const handleThemeChange = useCallback(
    (theme: 'light' | 'dark' | 'system') => {
      dispatch(setTheme(theme));
    },
    [dispatch]
  );

  const handlePeriodChange = useCallback(
    (period: '7d' | '30d' | '90d') => {
      dispatch(setDefaultPeriod(period));
    },
    [dispatch]
  );

  const handleNotificationChange = useCallback(
    (type: 'email' | 'push', value: boolean) => {
      dispatch(setNotifications({ [type]: value }));
    },
    [dispatch]
  );

  const handleLanguageChange = useCallback(
    (lang: 'ko' | 'en') => {
      dispatch(setLanguage(lang));
    },
    [dispatch]
  );

  const handleResetSettings = useCallback(() => {
    dispatch(resetSettings());
  }, [dispatch]);

  const handleResetUserData = useCallback(() => {
    resetUserData();
    dispatch(clearError());
  }, [dispatch]);

  return {
    // User data
    user,
    isLoading: authLoading,

    // Profile form
    profileForm,
    profileSuccess,
    handleProfileChange,
    handleProfileSubmit,

    // Password form
    passwordForm,
    passwordError,
    passwordSuccess,
    handlePasswordChange,
    handlePasswordSubmit,

    // App settings
    settings,
    handleThemeChange,
    handlePeriodChange,
    handleNotificationChange,
    handleLanguageChange,
    handleResetSettings,
    handleResetUserData,
  };
}

export type SettingsViewModel = ReturnType<typeof useSettingsViewModel>;
