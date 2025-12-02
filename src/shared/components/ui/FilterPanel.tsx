/**
 * FilterPanel 컴포넌트
 *
 * 분석 페이지용 공통 필터 패널
 * - 반응형 그리드 레이아웃
 * - 전역 Analytics 스토어 연동
 */

import { Search, RotateCcw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  setFilter,
  resetFilters,
  setPeriod,
  selectFilters,
  selectIsDefaultFilters,
  selectChangedFilterCount,
} from '../../store/slices/analytics-slice';
import Select from './Select';
import DateRangePicker from './DateRangePicker';
import Button from './Button';
import Card from './Card';
import type { SelectOption } from './Select';

// 기간 옵션
const periodOptions: SelectOption[] = [
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
  { value: '90d', label: '최근 90일' },
  { value: 'custom', label: '기간 선택' },
];

// 상태 옵션
const statusOptions: SelectOption[] = [
  { value: 'all', label: '전체 상태' },
  { value: 'published', label: '발행됨' },
  { value: 'draft', label: '초안' },
  { value: 'archived', label: '보관됨' },
];

// 카테고리 옵션
const categoryOptions: SelectOption[] = [
  { value: 'all', label: '전체 카테고리' },
  { value: 'tech', label: '기술' },
  { value: 'design', label: '디자인' },
  { value: 'business', label: '비즈니스' },
  { value: 'backend', label: '백엔드' },
];

interface FilterPanelProps {
  /** 검색 필터 표시 여부 */
  showSearch?: boolean;
  /** 상태 필터 표시 여부 */
  showStatus?: boolean;
  /** 카테고리 필터 표시 여부 */
  showCategory?: boolean;
  /** 기간 필터 표시 여부 */
  showPeriod?: boolean;
  /** 날짜 범위 필터 표시 여부 (기간이 custom일 때만) */
  showDateRange?: boolean;
  /** 검색어 변경 핸들러 (로컬 검색용) */
  onSearchChange?: (keyword: string) => void;
  /** 검색어 값 (로컬 검색용) */
  searchValue?: string;
  /** 추가 버튼 렌더 */
  extraButtons?: React.ReactNode;
  /** 컴팩트 모드 (버튼 영역 숨김) */
  compact?: boolean;
}

export default function FilterPanel({
  showSearch = false,
  showStatus = false,
  showCategory = false,
  showPeriod = true,
  showDateRange = true,
  onSearchChange,
  searchValue = '',
  extraButtons,
  compact = false,
}: FilterPanelProps) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);
  const isDefault = useAppSelector(selectIsDefaultFilters);
  const changedCount = useAppSelector(selectChangedFilterCount);

  // 필터 핸들러
  const handlePeriodChange = (e: { target: { value: string } }) => {
    dispatch(setPeriod(e.target.value as 'custom' | '7d' | '30d' | '90d'));
  };

  const handleStatusChange = (e: { target: { value: string } }) => {
    dispatch(setFilter({ status: e.target.value }));
  };

  const handleCategoryChange = (e: { target: { value: string } }) => {
    dispatch(setFilter({ category: e.target.value }));
  };

  const handleStartDateChange = (date: string) => {
    dispatch(setFilter({ startDate: date }));
  };

  const handleEndDateChange = (date: string) => {
    dispatch(setFilter({ endDate: date }));
  };

  const handleReset = () => {
    dispatch(resetFilters());
    // 로컬 검색어도 초기화
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  // 활성화된 필터 수 계산 (로컬 검색어 포함)
  const hasLocalSearch = showSearch && searchValue.trim() !== '';
  const activeFilters = [
    showPeriod && filters.period !== '30d',
    showStatus && filters.status !== 'all',
    showCategory && filters.category !== 'all',
    showDateRange && (filters.startDate || filters.endDate),
  ].filter(Boolean).length;

  return (
    <Card>
      {/* 필터 그리드 - 반응형 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {/* 검색 */}
        {showSearch && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="검색어 입력..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* 기간 */}
        {showPeriod && (
          <Select
            label="기간"
            options={periodOptions}
            value={filters.period}
            onChange={handlePeriodChange}
          />
        )}

        {/* 상태 */}
        {showStatus && (
          <Select
            label="상태"
            options={statusOptions}
            value={filters.status}
            onChange={handleStatusChange}
          />
        )}

        {/* 카테고리 */}
        {showCategory && (
          <Select
            label="카테고리"
            options={categoryOptions}
            value={filters.category}
            onChange={handleCategoryChange}
          />
        )}

        {/* 날짜 범위 (기간이 custom일 때만) */}
        {showDateRange && filters.period === 'custom' && (
          <div className="sm:col-span-2">
            <DateRangePicker
              label="날짜 범위"
              startDate={filters.startDate}
              endDate={filters.endDate}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
            />
          </div>
        )}
      </div>

      {/* 버튼 영역 */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            disabled={isDefault && activeFilters === 0 && !hasLocalSearch}
          >
            <RotateCcw size={16} className="mr-1.5" />
            초기화
            {(changedCount > 0 || hasLocalSearch) && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {changedCount + (hasLocalSearch ? 1 : 0)}
              </span>
            )}
          </Button>
          {extraButtons}
        </div>
      )}
    </Card>
  );
}
