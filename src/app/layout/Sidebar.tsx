/**
 * Sidebar 컴포넌트
 *
 * 데이터 대시보드의 좌측 네비게이션
 * - 메뉴 항목들을 렌더링
 * - 현재 경로에 따라 활성 상태 표시
 * - 로그아웃 기능 포함
 */

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  FileBarChart,
  LogOut,
  Settings,
  BarChart3,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../shared/hooks';
import { logoutThunk, selectUser } from '../../shared/store/slices/auth-slice';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: '대시보드', end: true },
  { to: '/traffic', icon: TrendingUp, label: '트래픽 분석' },
  { to: '/contents', icon: FileBarChart, label: '콘텐츠 현황' },
  { to: '/reports', icon: BarChart3, label: '리포트' },
];

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      {/* 로고 영역 */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Data Dashboard</p>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 p-4">
        <p className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          분석
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* 하단 영역 (설정, 로그아웃) */}
      <div className="p-4 border-t border-gray-800">
        {/* 사용자 정보 */}
        {user && (
          <div className="mb-4 px-4 py-3 bg-gray-800 rounded-lg">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-600 rounded">
              {user.role === 'admin' ? '관리자' : '사용자'}
            </span>
          </div>
        )}

        <ul className="space-y-1">
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Settings size={20} />
              <span>설정</span>
            </NavLink>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
            >
              <LogOut size={20} />
              <span>로그아웃</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
