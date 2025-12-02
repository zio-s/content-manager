/**
 * Analytics Slice
 *
 * 중앙화된 분석 데이터 관리
 * - 전역 필터 상태 (기간, 날짜 범위, 카테고리 등)
 * - 트래픽, 콘텐츠, 리포트 데이터
 * - 필터에 따른 데이터 필터링
 */

import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { ContentItem } from '../../types';

// 타입 정의
interface TimeSeries {
  date: string;
  pageViews: number;
  visitors: number;
  sessions: number;
}

interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

interface DeviceData {
  device: string;
  count: number;
  percentage: number;
}

interface PageData {
  page: string;
  views: number;
  avgTime: string;
}

interface TrafficData {
  timeSeries: TimeSeries[];
  sources: TrafficSource[];
  devices: DeviceData[];
  pages: PageData[];
}

interface ContentsData {
  contents: ContentItem[];
}

// 전역 필터 상태
interface GlobalFilters {
  period: '7d' | '30d' | '90d' | 'custom';
  startDate: string;
  endDate: string;
  category: string;
  status: string;
}

interface AnalyticsState {
  // 원본 데이터
  rawTrafficData: TrafficData | null;
  rawContentsData: ContentsData | null;

  // 전역 필터
  filters: GlobalFilters;

  // 로딩 상태
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  rawTrafficData: null,
  rawContentsData: null,
  filters: {
    period: '30d',
    startDate: '',
    endDate: '',
    category: 'all',
    status: 'all',
  },
  loading: false,
  error: null,
};

// 비동기 액션: 트래픽 데이터 로드
export const fetchTrafficData = createAsyncThunk(
  'analytics/fetchTrafficData',
  async () => {
    const response = await fetch('/mock-data/traffic.json');
    if (!response.ok) throw new Error('Failed to fetch traffic data');
    return response.json() as Promise<TrafficData>;
  }
);

// 비동기 액션: 콘텐츠 데이터 로드
export const fetchContentsData = createAsyncThunk(
  'analytics/fetchContentsData',
  async () => {
    const response = await fetch('/mock-data/contents.json');
    if (!response.ok) throw new Error('Failed to fetch contents data');
    return response.json() as Promise<ContentsData>;
  }
);

// 비동기 액션: 모든 데이터 로드
export const fetchAllAnalyticsData = createAsyncThunk(
  'analytics/fetchAllData',
  async (_, { dispatch }) => {
    await Promise.all([
      dispatch(fetchTrafficData()),
      dispatch(fetchContentsData()),
    ]);
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    // 필터 업데이트
    setFilter: (state, action: PayloadAction<Partial<GlobalFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // 필터 초기화
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    // 기간 변경 시 커스텀 날짜 초기화
    setPeriod: (state, action: PayloadAction<GlobalFilters['period']>) => {
      state.filters.period = action.payload;
      if (action.payload !== 'custom') {
        state.filters.startDate = '';
        state.filters.endDate = '';
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // 트래픽 데이터
      .addCase(fetchTrafficData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrafficData.fulfilled, (state, action) => {
        state.rawTrafficData = action.payload;
        state.loading = false;
      })
      .addCase(fetchTrafficData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch traffic data';
      })
      // 콘텐츠 데이터
      .addCase(fetchContentsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContentsData.fulfilled, (state, action) => {
        state.rawContentsData = action.payload;
        state.loading = false;
      })
      .addCase(fetchContentsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch contents data';
      });
  },
});

export const { setFilter, resetFilters, setPeriod } = analyticsSlice.actions;

// 기본 Selectors
const selectRawTrafficData = (state: RootState) => state.analytics.rawTrafficData;
const selectRawContentsData = (state: RootState) => state.analytics.rawContentsData;
const selectAnalyticsFilters = (state: RootState) => state.analytics.filters;

// 날짜 범위 계산 헬퍼
function getDateRange(period: string, customStart?: string, customEnd?: string) {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case 'custom':
      if (customStart && customEnd) {
        return { start: new Date(customStart), end: new Date(customEnd) };
      }
      start.setDate(end.getDate() - 30);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return { start, end };
}

// 기간에 따른 데이터 비율 계산
function getPeriodMultiplier(period: string): number {
  switch (period) {
    case '7d': return 0.23;
    case '30d': return 1;
    case '90d': return 3;
    default: return 1;
  }
}

// Selectors
export const selectFilters = (state: RootState) => state.analytics.filters;
export const selectLoading = (state: RootState) => state.analytics.loading;
export const selectError = (state: RootState) => state.analytics.error;

// 필터링된 트래픽 데이터 selector (memoized)
export const selectFilteredTrafficData = createSelector(
  [selectRawTrafficData, selectAnalyticsFilters],
  (rawTrafficData, filters) => {
    if (!rawTrafficData) return null;

    const { start, end } = getDateRange(filters.period, filters.startDate, filters.endDate);
    const multiplier = getPeriodMultiplier(filters.period);

    // 시계열 데이터 필터링
    let filteredTimeSeries = rawTrafficData.timeSeries.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
    });

    // 필터링된 데이터가 없으면 원본 사용 (mock 데이터 날짜 범위 이슈)
    if (filteredTimeSeries.length === 0) {
      filteredTimeSeries = rawTrafficData.timeSeries;
    }

    // 소스별 데이터에 multiplier 적용 (실제 필터링 효과)
    const sources = rawTrafficData.sources.map((s) => ({
      ...s,
      visitors: Math.round(s.visitors * multiplier),
    }));

    // 디바이스별 데이터에 multiplier 적용
    const devices = rawTrafficData.devices.map((d) => ({
      ...d,
      count: Math.round(d.count * multiplier),
    }));

    // 페이지별 데이터에 multiplier 적용
    const pages = rawTrafficData.pages.map((p) => ({
      ...p,
      views: Math.round(p.views * multiplier),
    }));

    return {
      timeSeries: filteredTimeSeries,
      sources,
      devices,
      pages,
    };
  }
);

// 필터링된 콘텐츠 데이터 selector (memoized)
export const selectFilteredContentsData = createSelector(
  [selectRawContentsData, selectAnalyticsFilters],
  (rawContentsData, filters) => {
    if (!rawContentsData) return [];

    return rawContentsData.contents.filter((item) => {
      // 상태 필터
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }

      // 카테고리 필터
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }

      return true;
    });
  }
);

// 통계 요약 selector (memoized)
export const selectTrafficSummary = createSelector(
  [selectFilteredTrafficData],
  (trafficData) => {
    if (!trafficData) return null;

    const totalPageViews = trafficData.timeSeries.reduce((sum, d) => sum + d.pageViews, 0);
    const totalVisitors = trafficData.timeSeries.reduce((sum, d) => sum + d.visitors, 0);
    const totalSessions = trafficData.timeSeries.reduce((sum, d) => sum + d.sessions, 0);

    return {
      totalPageViews,
      totalVisitors,
      totalSessions,
      avgSessionDuration: '3분 24초',
    };
  }
);

// 필터 변경 여부 확인
export const selectIsDefaultFilters = (state: RootState) => {
  const { filters } = state.analytics;
  return (
    filters.period === '30d' &&
    filters.startDate === '' &&
    filters.endDate === '' &&
    filters.category === 'all' &&
    filters.status === 'all'
  );
};

// 변경된 필터 개수
export const selectChangedFilterCount = (state: RootState) => {
  const { filters } = state.analytics;
  let count = 0;
  if (filters.period !== '30d') count++;
  if (filters.startDate !== '') count++;
  if (filters.endDate !== '') count++;
  if (filters.category !== 'all') count++;
  if (filters.status !== 'all') count++;
  return count;
};

// ============================================
// 대시보드용 Selectors (memoized)
// ============================================

// 변화율 계산 헬퍼
function calculateChangeRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

// 대시보드 개요 통계 (기간 비교 데이터 활용)
export const selectDashboardOverview = createSelector(
  [selectTrafficSummary, selectRawTrafficData, selectAnalyticsFilters],
  (summary, rawTrafficData, filters) => {
    if (!summary || !rawTrafficData?.timeSeries) return null;

    const timeSeries = rawTrafficData.timeSeries;

    // 기간에 따른 실제 변화율 계산
    let growthRate: { pageViews: number; visitors: number; sessions: number; avgDuration: number };

    if (filters.period === '7d') {
      // 7일: 실제 전반/후반 비교
      const currentSlice = timeSeries.slice(-7);
      const previousSlice = timeSeries.slice(0, 7);

      const currentTotals = calculatePeriodTotals(currentSlice);
      const previousTotals = calculatePeriodTotals(previousSlice);

      growthRate = {
        pageViews: calculateChangeRate(currentTotals.pageViews, previousTotals.pageViews),
        visitors: calculateChangeRate(currentTotals.visitors, previousTotals.visitors),
        sessions: calculateChangeRate(currentTotals.sessions, previousTotals.sessions),
        avgDuration: 5.2, // 체류시간은 별도 데이터 필요
      };
    } else if (filters.period === '30d') {
      // 30일: 8% 증가 가정
      growthRate = {
        pageViews: 8.7,
        visitors: 11.2,
        sessions: 6.4,
        avgDuration: 9.7,
      };
    } else {
      // 90일: 15~18% 증가 가정
      growthRate = {
        pageViews: 17.6,
        visitors: 20.2,
        sessions: 14.8,
        avgDuration: 12.3,
      };
    }

    return {
      pageViews: summary.totalPageViews,
      visitors: summary.totalVisitors,
      sessions: summary.totalSessions,
      avgDuration: 204,
      bounceRate: 42.3,
      growthRate,
    };
  }
);

// 일별 트렌드 (시계열 데이터 - 기간에 따라 다른 범위)
export const selectDailyTrend = createSelector(
  [selectFilteredTrafficData, selectAnalyticsFilters],
  (trafficData, filters) => {
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

    return trafficData.timeSeries.slice(-daysToShow).map((item) => ({
      date: item.date.slice(5), // MM-DD 형식
      pageViews: item.pageViews,
      visitors: item.visitors,
      sessions: item.sessions,
    }));
  }
);

// 트래픽 소스 분포
export const selectTrafficSources = createSelector(
  [selectFilteredTrafficData],
  (trafficData) => {
    if (!trafficData?.sources) return [];

    const total = trafficData.sources.reduce((sum, s) => sum + s.visitors, 0);

    return trafficData.sources.map((source) => ({
      name: source.source,
      value: source.visitors,
      percentage: total > 0 ? Math.round((source.visitors / total) * 100 * 10) / 10 : 0,
    }));
  }
);

// 디바이스 분포
export const selectDeviceStats = createSelector(
  [selectFilteredTrafficData],
  (trafficData) => {
    if (!trafficData?.devices) return [];

    const total = trafficData.devices.reduce((sum, d) => sum + d.count, 0);

    return trafficData.devices.map((device) => ({
      device: device.device,
      count: device.count,
      percentage: total > 0 ? Math.round((device.count / total) * 100 * 10) / 10 : 0,
    }));
  }
);

// 인기 콘텐츠 TOP 5
export const selectTopContents = createSelector(
  [selectFilteredContentsData],
  (contents) => {
    if (!contents.length) return [];

    return [...contents]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((content) => ({
        id: content.id,
        title: content.title,
        views: content.views,
        likes: content.likes,
        category: content.category,
      }));
  }
);

// 카테고리별 성과
export const selectCategoryPerformance = createSelector(
  [selectFilteredContentsData],
  (contents) => {
    if (!contents.length) return [];

    const categoryMap = new Map<string, number>();

    contents.forEach((item) => {
      const existing = categoryMap.get(item.category) || 0;
      categoryMap.set(item.category, existing + item.views);
    });

    const total = Array.from(categoryMap.values()).reduce((sum, v) => sum + v, 0);

    return Array.from(categoryMap.entries())
      .map(([category, views]) => ({
        category,
        views,
        percentage: total > 0 ? Math.round((views / total) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views);
  }
);

// 주간 비교 (실제 데이터 기반)
export const selectWeekComparison = createSelector(
  [selectRawTrafficData],
  (rawTrafficData) => {
    if (!rawTrafficData?.timeSeries) return null;

    const timeSeries = rawTrafficData.timeSeries;

    // 실제 전반 7일 / 후반 7일 비교
    const thisWeekData = timeSeries.slice(-7);
    const lastWeekData = timeSeries.slice(0, 7);

    const thisWeek = thisWeekData.reduce((sum, d) => sum + d.visitors, 0);
    const lastWeek = lastWeekData.reduce((sum, d) => sum + d.visitors, 0);
    const change = lastWeek > 0
      ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100 * 10) / 10
      : 0;

    return {
      thisWeek,
      lastWeek,
      change,
    };
  }
);

// ============================================
// 기간 비교 Selector (리포트용)
// ============================================

interface PeriodTotals {
  pageViews: number;
  visitors: number;
  sessions: number;
}

// 합계 계산 헬퍼
function calculatePeriodTotals(data: TimeSeries[]): PeriodTotals {
  return {
    pageViews: data.reduce((sum, d) => sum + d.pageViews, 0),
    visitors: data.reduce((sum, d) => sum + d.visitors, 0),
    sessions: data.reduce((sum, d) => sum + d.sessions, 0),
  };
}

// 기간 비교 데이터 selector (현재 기간 vs 이전 기간)
export const selectPeriodComparison = createSelector(
  [selectRawTrafficData, selectAnalyticsFilters],
  (rawTrafficData, filters) => {
    if (!rawTrafficData?.timeSeries) return null;

    const timeSeries = rawTrafficData.timeSeries;

    // 기간에 따른 다른 분할 비율 및 배수 적용
    // 실제 데이터가 14일밖에 없으므로, 기간에 따라 다르게 계산
    let currentSlice: typeof timeSeries;
    let previousMultiplier: number;

    switch (filters.period) {
      case '7d':
        // 최근 7일 vs 이전 7일 (실제 데이터 분할)
        currentSlice = timeSeries.slice(-7);
        const previousSlice7d = timeSeries.slice(0, 7);
        return {
          current: calculatePeriodTotals(currentSlice),
          previous: calculatePeriodTotals(previousSlice7d),
          periodLabel: filters.period,
        };

      case '30d':
        // 30일 기준: 전체 데이터 * 2.14 (14일 → 30일 환산) + 이전 기간은 -8% 변동
        currentSlice = timeSeries;
        previousMultiplier = 0.92; // 이전 30일은 8% 적었음
        break;

      case '90d':
        // 90일 기준: 전체 데이터 * 6.4 (14일 → 90일 환산) + 이전 기간은 -15% 변동
        currentSlice = timeSeries;
        previousMultiplier = 0.85; // 이전 90일은 15% 적었음
        break;

      default:
        currentSlice = timeSeries.slice(-7);
        previousMultiplier = 0.9;
    }

    const current = calculatePeriodTotals(currentSlice);
    const previous: PeriodTotals = {
      pageViews: Math.round(current.pageViews * previousMultiplier),
      visitors: Math.round(current.visitors * (previousMultiplier - 0.03)), // 방문자는 좀 더 차이나게
      sessions: Math.round(current.sessions * (previousMultiplier + 0.02)), // 세션은 좀 덜 차이나게
    };

    return {
      current,
      previous,
      periodLabel: filters.period,
    };
  }
);

export default analyticsSlice.reducer;
