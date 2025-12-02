/**
 * Contents ViewModel Hook
 *
 * 콘텐츠 현황 페이지의 데이터 로직과 상태 관리
 * - Redux 스토어 연결
 * - 로컬 검색, 페이지네이션, 정렬
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import {
  fetchContentsData,
  selectFilteredContentsData,
  selectLoading,
} from '@/shared/store/slices/analytics-slice';
import type { SortParams, ContentItem } from '@/shared/types';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function useContentsViewModel() {
  const dispatch = useAppDispatch();
  const filteredContents = useAppSelector(selectFilteredContentsData);
  const loading = useAppSelector(selectLoading);

  // 로컬 상태
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortParams, setSortParams] = useState<SortParams>({
    column: 'createdAt',
    order: 'desc',
  });

  // 데이터 로드
  useEffect(() => {
    dispatch(fetchContentsData());
  }, [dispatch]);

  // 키워드 필터링
  const searchedContents = useMemo(() => {
    if (!keyword) return filteredContents;
    const searchLower = keyword.toLowerCase();
    return filteredContents.filter((item) =>
      item.title.toLowerCase().includes(searchLower)
    );
  }, [filteredContents, keyword]);

  // 정렬된 데이터
  const sortedContents = useMemo(() => {
    const sorted = [...searchedContents];
    sorted.sort((a, b) => {
      const aValue = a[sortParams.column as keyof ContentItem];
      const bValue = b[sortParams.column as keyof ContentItem];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortParams.order === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortParams.order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
    return sorted;
  }, [searchedContents, sortParams]);

  // 페이지네이션된 데이터
  const paginatedContents = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return sortedContents.slice(startIndex, startIndex + pageSize);
  }, [sortedContents, page, pageSize]);

  // 핸들러
  const handleSort = useCallback((column: string) => {
    setSortParams((prev) => ({
      column,
      order: prev.column === column && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  // CSV 다운로드용 데이터
  const csvData = useMemo(() => {
    return sortedContents.map((item) => ({
      제목: item.title,
      카테고리: item.category,
      상태: item.status,
      조회수: item.views,
      좋아요: item.likes,
      작성자: item.author,
      생성일: item.createdAt,
    }));
  }, [sortedContents]);

  return {
    // 상태
    loading,
    keyword,
    setKeyword,

    // 데이터
    paginatedContents,
    totalCount: searchedContents.length,
    csvData,

    // 페이지네이션
    page,
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,

    // 정렬
    sortParams,
    onSort: handleSort,
  };
}

export type ContentsViewModel = ReturnType<typeof useContentsViewModel>;
