/**
 * Pagination 컴포넌트
 *
 * 페이지네이션 UI 컴포넌트
 */

import { useMemo } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Select from './Select';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export default function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (page > 3) {
        pages.push('...');
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageClick = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      onPageChange(newPage);
    }
  };

  const handlePageSizeChange = (e: { target: { value: string } }) => {
    const newSize = Number(e.target.value);
    onPageSizeChange?.(newSize);
    onPageChange(1); // 페이지 사이즈 변경 시 첫 페이지로
  };

  // Select 옵션 변환
  const pageSizeSelectOptions = useMemo(
    () => pageSizeOptions.map((size) => ({ value: String(size), label: `${size}개` })),
    [pageSizeOptions]
  );

  if (totalCount === 0) return null;

  return (
    <div
      className={clsx(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-4',
        className
      )}
    >
      {/* 표시 정보 */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          {totalCount.toLocaleString()}개 중 {startItem}-{endItem} 표시
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">페이지당</span>
            <Select
              options={pageSizeSelectOptions}
              value={String(pageSize)}
              onChange={handlePageSizeChange}
              size="sm"
              className="w-24"
            />
          </div>
        )}
      </div>

      {/* 페이지 버튼 */}
      <div className="flex items-center gap-1">
        {/* 처음으로 */}
        <button
          onClick={() => handlePageClick(1)}
          disabled={page === 1}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="처음으로"
        >
          <ChevronsLeft size={18} className="text-gray-600" />
        </button>

        {/* 이전 */}
        <button
          onClick={() => handlePageClick(page - 1)}
          disabled={page === 1}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="이전"
        >
          <ChevronLeft size={18} className="text-gray-600" />
        </button>

        {/* 페이지 번호 */}
        {getPageNumbers().map((pageNum, index) =>
          pageNum === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => handlePageClick(pageNum as number)}
              className={clsx(
                'min-w-[36px] h-9 px-3 rounded text-sm font-medium transition-colors',
                page === pageNum
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {pageNum}
            </button>
          )
        )}

        {/* 다음 */}
        <button
          onClick={() => handlePageClick(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="다음"
        >
          <ChevronRight size={18} className="text-gray-600" />
        </button>

        {/* 마지막으로 */}
        <button
          onClick={() => handlePageClick(totalPages)}
          disabled={page === totalPages}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="마지막으로"
        >
          <ChevronsRight size={18} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
}
