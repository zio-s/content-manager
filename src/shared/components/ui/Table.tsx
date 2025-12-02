/**
 * Table 컴포넌트
 *
 * 정렬, 페이지네이션을 지원하는 데이터 테이블
 */

import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { TableColumn, SortParams } from '../../types';

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  sortParams?: SortParams;
  onSort?: (column: string) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export default function Table<T extends { id: string | number }>({
  columns,
  data,
  sortParams,
  onSort,
  onRowClick,
  loading,
  emptyMessage = '데이터가 없습니다.',
  className,
}: TableProps<T>) {
  const handleSort = (column: string, sortable?: boolean) => {
    if (sortable && onSort) {
      onSort(column);
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortParams || sortParams.column !== columnKey) {
      return <ChevronsUpDown size={14} className="text-gray-400" />;
    }
    return sortParams.order === 'asc' ? (
      <ChevronUp size={14} className="text-blue-600" />
    ) : (
      <ChevronDown size={14} className="text-blue-600" />
    );
  };

  const getCellValue = (row: T, column: TableColumn<T>) => {
    const keys = String(column.key).split('.');
    let value: unknown = row;
    for (const key of keys) {
      value = (value as Record<string, unknown>)?.[key];
    }

    if (column.render) {
      return column.render(value, row);
    }

    return value as React.ReactNode;
  };

  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={clsx(
                  'px-4 py-3 text-left text-sm font-medium text-gray-700',
                  column.sortable && 'cursor-pointer hover:bg-gray-100 select-none',
                  column.width
                )}
                style={{ width: column.width }}
                onClick={() => handleSort(String(column.key), column.sortable)}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && getSortIcon(String(column.key))}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                  <span className="text-gray-500">로딩 중...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                className={clsx(
                  'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={`${row.id}-${String(column.key)}`}
                    className="px-4 py-3 text-sm text-gray-900"
                  >
                    {getCellValue(row, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
