/**
 * 공통 타입 정의
 *
 * 프로젝트 전역에서 사용하는 타입들을 정의합니다.
 */

// ============================================
// 페이지네이션
// ============================================
export interface PaginationParams {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ============================================
// 정렬
// ============================================
export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  column: string;
  order: SortOrder;
}

// ============================================
// 검색/필터
// ============================================
export interface SearchParams {
  keyword: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
}

// ============================================
// 테이블 컬럼
// ============================================
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

// ============================================
// API 응답
// ============================================
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationParams;
}

// ============================================
// 차트 데이터
// ============================================
export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface TimeSeriesData {
  date: string;
  [key: string]: string | number;
}

// ============================================
// 통계 카드
// ============================================
export interface StatCardData {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: string;
}

// ============================================
// 콘텐츠 아이템 (읽기 전용)
// ============================================
export interface ContentItem {
  id: string;
  title: string;
  category: string;
  status: 'published' | 'draft' | 'archived';
  views: number;
  likes: number;
  author: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 트래픽 데이터
// ============================================
export interface TrafficData {
  date: string;
  pageViews: number;
  visitors: number;
  bounceRate: number;
  avgDuration: number;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

export interface DeviceStats {
  device: string;
  count: number;
  percentage: number;
}

// ============================================
// 알림
// ============================================
export interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  visible: boolean;
}
