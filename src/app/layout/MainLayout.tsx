/**
 * MainLayout 컴포넌트
 *
 * 🎓 CMS 대시보드의 전체 레이아웃 구조
 * - Sidebar (좌측 네비게이션)
 * - Header (상단 헤더)
 * - Main Content (중앙 콘텐츠)
 */

import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

// 경로별 페이지 제목 매핑
const pageTitles: Record<string, string> = {
  '/': '대시보드',
  '/posts': '게시글 관리',
  '/projects': '프로젝트 관리',
  '/settings': '설정',
};

export default function MainLayout() {
  const location = useLocation();

  // 현재 경로에 맞는 제목 가져오기
  const getTitle = () => {
    // 정확한 경로 매칭
    if (pageTitles[location.pathname]) {
      return pageTitles[location.pathname];
    }
    // 하위 경로 매칭 (예: /posts/new -> '게시글 관리')
    const basePath = '/' + location.pathname.split('/')[1];
    return pageTitles[basePath] || '페이지';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <Sidebar />

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <Header title={getTitle()} />

        {/* 콘텐츠 영역 */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
