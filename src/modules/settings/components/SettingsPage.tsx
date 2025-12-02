/**
 * SettingsPage 컴포넌트
 *
 * 설정 페이지
 * - 프로필 정보 수정
 * - 비밀번호 변경
 * - 앱 설정 (테마, 기본 기간, 알림)
 * - 데이터 초기화
 */

import { User, Lock, Palette, Bell, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { Card, Button, Input } from '@/shared/components/ui';
import { useSettingsViewModel } from '../hooks';

// ============================================
// 섹션 컴포넌트들
// ============================================

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function SectionHeader({ icon: Icon, title, description }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Icon size={20} className="text-blue-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
      <Check size={16} className="text-green-600" />
      <span className="text-sm text-green-700">{message}</span>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
      <AlertCircle size={16} className="text-red-600" />
      <span className="text-sm text-red-700">{message}</span>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export default function SettingsPage() {
  const vm = useSettingsViewModel();

  if (!vm.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-sm text-gray-500 mt-1">계정 및 앱 설정을 관리하세요</p>
      </div>

      {/* 프로필 설정 */}
      <Card padding="lg">
        <SectionHeader
          icon={User}
          title="프로필 정보"
          description="기본 프로필 정보를 수정합니다"
        />

        <div className="space-y-4">
          <Input
            label="이름"
            value={vm.profileForm.name}
            onChange={(e) => vm.handleProfileChange('name', e.target.value)}
            placeholder="이름을 입력하세요"
          />
          <Input
            label="이메일"
            type="email"
            value={vm.profileForm.email}
            onChange={(e) => vm.handleProfileChange('email', e.target.value)}
            placeholder="이메일을 입력하세요"
          />

          {vm.profileSuccess && <SuccessMessage message="프로필이 수정되었습니다." />}

          <div className="flex justify-end">
            <Button onClick={vm.handleProfileSubmit} loading={vm.isLoading}>
              프로필 저장
            </Button>
          </div>
        </div>
      </Card>

      {/* 비밀번호 변경 */}
      <Card padding="lg">
        <SectionHeader
          icon={Lock}
          title="비밀번호 변경"
          description="비밀번호를 변경하면 로그인 페이지의 예시 정보도 업데이트됩니다"
        />

        <div className="space-y-4">
          <Input
            label="현재 비밀번호"
            type="password"
            value={vm.passwordForm.currentPassword}
            onChange={(e) => vm.handlePasswordChange('currentPassword', e.target.value)}
            placeholder="현재 비밀번호"
          />
          <Input
            label="새 비밀번호"
            type="password"
            value={vm.passwordForm.newPassword}
            onChange={(e) => vm.handlePasswordChange('newPassword', e.target.value)}
            placeholder="새 비밀번호 (4자 이상)"
          />
          <Input
            label="새 비밀번호 확인"
            type="password"
            value={vm.passwordForm.confirmPassword}
            onChange={(e) => vm.handlePasswordChange('confirmPassword', e.target.value)}
            placeholder="새 비밀번호 확인"
          />

          {vm.passwordError && <ErrorMessage message={vm.passwordError} />}
          {vm.passwordSuccess && (
            <SuccessMessage message="비밀번호가 변경되었습니다. 로그인 페이지에서 새 비밀번호로 로그인하세요." />
          )}

          <div className="flex justify-end">
            <Button
              onClick={vm.handlePasswordSubmit}
              loading={vm.isLoading}
              disabled={
                !vm.passwordForm.currentPassword ||
                !vm.passwordForm.newPassword ||
                !vm.passwordForm.confirmPassword
              }
            >
              비밀번호 변경
            </Button>
          </div>
        </div>
      </Card>

      {/* 앱 설정 */}
      <Card padding="lg">
        <SectionHeader
          icon={Palette}
          title="앱 설정"
          description="테마 및 기본 설정을 관리합니다"
        />

        <div className="space-y-6">
          {/* 테마 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">테마</label>
            <div className="flex gap-2">
              {[
                { value: 'light', label: '라이트' },
                { value: 'dark', label: '다크' },
                { value: 'system', label: '시스템' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => vm.handleThemeChange(option.value as 'light' | 'dark' | 'system')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    vm.settings.theme === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 기본 기간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              대시보드 기본 기간
            </label>
            <div className="flex gap-2">
              {[
                { value: '7d', label: '7일' },
                { value: '30d', label: '30일' },
                { value: '90d', label: '90일' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => vm.handlePeriodChange(option.value as '7d' | '30d' | '90d')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    vm.settings.defaultPeriod === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 언어 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">언어</label>
            <div className="flex gap-2">
              {[
                { value: 'ko', label: '한국어' },
                { value: 'en', label: 'English' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => vm.handleLanguageChange(option.value as 'ko' | 'en')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    vm.settings.language === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 알림 설정 */}
      <Card padding="lg">
        <SectionHeader icon={Bell} title="알림 설정" description="알림 수신 설정을 관리합니다" />

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">이메일 알림</p>
              <p className="text-sm text-gray-500">중요한 업데이트를 이메일로 받습니다</p>
            </div>
            <input
              type="checkbox"
              checked={vm.settings.notifications.email}
              onChange={(e) => vm.handleNotificationChange('email', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">푸시 알림</p>
              <p className="text-sm text-gray-500">브라우저 푸시 알림을 받습니다</p>
            </div>
            <input
              type="checkbox"
              checked={vm.settings.notifications.push}
              onChange={(e) => vm.handleNotificationChange('push', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </Card>

      {/* 데이터 초기화 */}
      <Card padding="lg" className="border-red-200">
        <SectionHeader
          icon={RotateCcw}
          title="데이터 초기화"
          description="설정 및 사용자 데이터를 초기값으로 되돌립니다"
        />

        <div className="space-y-3">
          <Button variant="secondary" onClick={vm.handleResetSettings} className="w-full sm:w-auto">
            앱 설정 초기화
          </Button>
          <Button variant="secondary" onClick={vm.handleResetUserData} className="w-full sm:w-auto ml-0 sm:ml-2">
            사용자 데이터 초기화
          </Button>
          <p className="text-xs text-gray-500">
            * 사용자 데이터 초기화 시 변경된 비밀번호가 원래대로 복구됩니다
          </p>
        </div>
      </Card>
    </div>
  );
}
