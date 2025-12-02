/**
 * Header 컴포넌트
 *
 * 🎓 CMS 대시보드의 상단 헤더
 * - 페이지 제목 표시
 * - 검색 바
 * - 알림 및 사용자 메뉴
 */

import { Bell, Search, User } from 'lucide-react';
import { useAppSelector } from '../../shared/hooks';
import { selectUser } from '../../shared/store/slices/auth-slice';

interface HeaderProps {
  title?: string;
}

export default function Header({ title = '대시보드' }: HeaderProps) {
  const user = useAppSelector(selectUser);

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      {/* 페이지 제목 */}
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>

      {/* 우측 영역 */}
      <div className="flex items-center gap-4">
        {/* 검색 */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="검색..."
            className="pl-10 pr-4 py-2 w-64 bg-gray-100 border border-transparent rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
          />
        </div>

        {/* 알림 */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* 사용자 프로필 */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <User size={16} className="text-white" />
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            <p className="text-xs text-gray-500">
              {user?.role === 'admin' ? '관리자' : '사용자'}
            </p>
          </div>
        </div>
      </div>
      </header>
  );
}
