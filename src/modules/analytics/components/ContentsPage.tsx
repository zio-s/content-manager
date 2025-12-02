/**
 * ContentsPage 컴포넌트
 *
 * 콘텐츠 현황 페이지
 * - useViewModel 패턴으로 로직/UI 분리
 * - 콘텐츠 목록 테이블
 * - 필터링, 정렬, 페이지네이션
 */

import { Eye, ThumbsUp, Download } from 'lucide-react';
import {
  Card,
  Table,
  Pagination,
  StatusBadge,
  FilterPanel,
  Button,
} from '@/shared/components/ui';
import type { TableColumn, ContentItem } from '@/shared/types';
import { useAlert, useDownload } from '@/shared/hooks';
import { useContentsViewModel } from '../hooks';

// ============================================
// 테이블 컬럼 정의
// ============================================

const columns: TableColumn<ContentItem>[] = [
  {
    key: 'title',
    label: '제목',
    sortable: true,
    render: (value) => (
      <span className="font-medium text-gray-900 line-clamp-1">{value as string}</span>
    ),
  },
  {
    key: 'category',
    label: '카테고리',
    sortable: true,
    width: '100px',
  },
  {
    key: 'status',
    label: '상태',
    sortable: true,
    width: '100px',
    render: (value) => <StatusBadge status={value as string} />,
  },
  {
    key: 'views',
    label: '조회',
    sortable: true,
    width: '80px',
    render: (value) => (
      <span className="flex items-center gap-1 text-gray-600">
        <Eye size={14} className="hidden sm:inline" />
        {(value as number).toLocaleString()}
      </span>
    ),
  },
  {
    key: 'likes',
    label: '좋아요',
    sortable: true,
    width: '80px',
    render: (value) => (
      <span className="flex items-center gap-1 text-gray-600">
        <ThumbsUp size={14} className="hidden sm:inline" />
        {(value as number).toLocaleString()}
      </span>
    ),
  },
  {
    key: 'author',
    label: '작성자',
    sortable: true,
    width: '100px',
  },
  {
    key: 'createdAt',
    label: '생성일',
    sortable: true,
    width: '100px',
    render: (value) => new Date(value as string).toLocaleDateString('ko-KR'),
  },
];

// ============================================
// 메인 컴포넌트
// ============================================

export default function ContentsPage() {
  const vm = useContentsViewModel();
  const alert = useAlert();
  const { downloadCsv } = useDownload();

  const handleDownloadCsv = () => {
    downloadCsv(vm.csvData, `contents_${new Date().toISOString().slice(0, 10)}`);
    alert.success('CSV 파일이 다운로드되었습니다.');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 필터 패널 */}
      <FilterPanel
        showSearch
        showPeriod
        showStatus
        showCategory
        showDateRange
        searchValue={vm.keyword}
        onSearchChange={vm.setKeyword}
        extraButtons={
          <Button onClick={handleDownloadCsv} size="sm">
            <Download size={16} className="mr-1.5" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
        }
      />

      {/* 결과 요약 */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-600">
          총 <span className="font-semibold text-gray-900">{vm.totalCount}</span>개
        </p>
      </div>

      {/* 테이블 */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            data={vm.paginatedContents}
            sortParams={vm.sortParams}
            onSort={vm.onSort}
            loading={vm.loading}
            emptyMessage="조건에 맞는 콘텐츠가 없습니다."
          />
        </div>
        <div className="border-t border-gray-200">
          <Pagination
            page={vm.page}
            pageSize={vm.pageSize}
            totalCount={vm.totalCount}
            onPageChange={vm.onPageChange}
            onPageSizeChange={vm.onPageSizeChange}
            pageSizeOptions={vm.pageSizeOptions}
            className="px-4"
          />
        </div>
      </Card>
    </div>
  );
}
