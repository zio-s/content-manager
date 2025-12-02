/**
 * Traffic ViewModel Hook
 *
 * 트래픽 분석 페이지의 데이터 로직과 상태 관리
 * - 중앙 스토어의 selectDashboardOverview 재사용으로 일관된 데이터
 */

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import {
  fetchTrafficData,
  selectFilteredTrafficData,
  selectTrafficSummary,
  selectDashboardOverview,
  selectFilters,
  selectLoading,
} from '@/shared/store/slices/analytics-slice';

export function useTrafficViewModel() {
  const dispatch = useAppDispatch();
  const trafficData = useAppSelector(selectFilteredTrafficData);
  const summary = useAppSelector(selectTrafficSummary);
  const overview = useAppSelector(selectDashboardOverview); // 중앙 관리 데이터 재사용
  const filters = useAppSelector(selectFilters);
  const loading = useAppSelector(selectLoading);

  // 데이터 로드
  useEffect(() => {
    dispatch(fetchTrafficData());
  }, [dispatch]);

  // 통계 카드 데이터 (중앙 관리 데이터 활용)
  const statsCards = useMemo(() => {
    if (!summary || !overview) return null;

    return {
      pageViews: {
        title: '총 페이지뷰',
        value: summary.totalPageViews.toLocaleString(),
        change: overview.growthRate.pageViews, // 중앙 관리 변화율 사용
      },
      visitors: {
        title: '방문자 수',
        value: summary.totalVisitors.toLocaleString(),
        change: overview.growthRate.visitors,
      },
      sessions: {
        title: '세션 수',
        value: summary.totalSessions.toLocaleString(),
        change: overview.growthRate.sessions,
      },
      avgDuration: {
        title: '평균 체류',
        value: summary.avgSessionDuration,
        change: overview.growthRate.avgDuration,
      },
    };
  }, [summary, overview]);

  // 기간에 따른 timeSeries 데이터
  const timeSeries = useMemo(() => {
    if (!trafficData?.timeSeries) return [];

    // 기간에 따라 표시할 일수 결정
    let daysToShow: number;
    switch (filters.period) {
      case '7d':
        daysToShow = 7;
        break;
      case '30d':
      case '90d':
      default:
        daysToShow = trafficData.timeSeries.length; // 전체
    }

    return trafficData.timeSeries.slice(-daysToShow);
  }, [trafficData, filters.period]);

  // 상태
  const isLoading = loading && !trafficData;
  const hasError = !loading && (!trafficData || !summary);

  return {
    // 상태
    isLoading,
    hasError,

    // 통계 데이터
    statsCards,

    // 차트 데이터 (기간 반영)
    timeSeries,
    sources: trafficData?.sources ?? [],
    devices: trafficData?.devices ?? [],
    pages: trafficData?.pages ?? [],

    // 필터 정보
    filters,
  };
}

export type TrafficViewModel = ReturnType<typeof useTrafficViewModel>;
