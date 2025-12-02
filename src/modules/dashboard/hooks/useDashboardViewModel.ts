/**
 * Dashboard ViewModel Hook
 *
 * 대시보드 페이지의 데이터 로직과 상태 관리를 담당
 * - Redux 스토어 연결
 * - 데이터 fetch 및 가공
 * - UI에 필요한 데이터만 반환
 */

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import {
  fetchAllAnalyticsData,
  selectDashboardOverview,
  selectDailyTrend,
  selectTrafficSources,
  selectDeviceStats,
  selectTopContents,
  selectCategoryPerformance,
  selectWeekComparison,
  selectLoading,
} from '@/shared/store/slices/analytics-slice';

// 체류시간 포맷
function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}분 ${sec}초`;
}

export function useDashboardViewModel() {
  const dispatch = useAppDispatch();

  // 중앙 스토어에서 데이터 가져오기
  const overview = useAppSelector(selectDashboardOverview);
  const dailyTrend = useAppSelector(selectDailyTrend);
  const trafficSources = useAppSelector(selectTrafficSources);
  const deviceStats = useAppSelector(selectDeviceStats);
  const topContents = useAppSelector(selectTopContents);
  const categoryPerformance = useAppSelector(selectCategoryPerformance);
  const weekComparison = useAppSelector(selectWeekComparison);
  const loading = useAppSelector(selectLoading);

  // 데이터 로드
  useEffect(() => {
    dispatch(fetchAllAnalyticsData());
  }, [dispatch]);

  // 주요 지표 카드 데이터 (포맷팅 포함)
  const statsCards = useMemo(() => {
    if (!overview) return null;

    return {
      pageViews: {
        title: '총 페이지뷰',
        value: overview.pageViews.toLocaleString(),
        change: overview.growthRate.pageViews,
      },
      visitors: {
        title: '방문자',
        value: overview.visitors.toLocaleString(),
        change: overview.growthRate.visitors,
      },
      sessions: {
        title: '세션',
        value: overview.sessions.toLocaleString(),
        change: overview.growthRate.sessions,
      },
      avgDuration: {
        title: '평균 체류시간',
        value: formatDuration(overview.avgDuration),
        change: overview.growthRate.avgDuration,
      },
    };
  }, [overview]);

  // 실시간 사용자 수 (랜덤 시뮬레이션)
  const realtimeUsers = useMemo(() => Math.floor(Math.random() * 50) + 100, []);

  // 상태
  const isLoading = loading && !overview;
  const hasError = !loading && !overview;

  return {
    // 상태
    isLoading,
    hasError,

    // 주요 지표
    statsCards,

    // 차트 데이터
    dailyTrend,
    trafficSources,
    deviceStats,
    categoryPerformance,
    topContents,
    weekComparison,

    // UI 데이터
    realtimeUsers,
  };
}

export type DashboardViewModel = ReturnType<typeof useDashboardViewModel>;
