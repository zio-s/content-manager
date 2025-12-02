/**
 * useDownload Hook
 *
 * 파일 다운로드 유틸리티 훅
 * - Blob 다운로드
 * - URL 다운로드
 * - JSON 데이터 다운로드
 */

import { useState, useCallback } from 'react';

interface DownloadState {
  loading: boolean;
  error: string | null;
}

interface UseDownloadReturn extends DownloadState {
  downloadBlob: (blob: Blob, filename: string) => void;
  downloadUrl: (url: string, filename?: string) => Promise<void>;
  downloadJson: (data: unknown, filename: string) => void;
  downloadCsv: (data: Record<string, unknown>[], filename: string) => void;
}

export function useDownload(): UseDownloadReturn {
  const [state, setState] = useState<DownloadState>({
    loading: false,
    error: null,
  });

  // Blob 다운로드
  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : '다운로드 실패',
      }));
    }
  }, []);

  // URL 다운로드
  const downloadUrl = useCallback(
    async (url: string, filename?: string) => {
      setState({ loading: true, error: null });

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('파일을 가져올 수 없습니다');

        const blob = await response.blob();
        const name =
          filename ||
          url.split('/').pop() ||
          `download-${Date.now()}`;

        downloadBlob(blob, name);
        setState({ loading: false, error: null });
      } catch (err) {
        setState({
          loading: false,
          error: err instanceof Error ? err.message : '다운로드 실패',
        });
      }
    },
    [downloadBlob]
  );

  // JSON 다운로드
  const downloadJson = useCallback(
    (data: unknown, filename: string) => {
      try {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const name = filename.endsWith('.json') ? filename : `${filename}.json`;
        downloadBlob(blob, name);
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'JSON 변환 실패',
        }));
      }
    },
    [downloadBlob]
  );

  // CSV 다운로드
  const downloadCsv = useCallback(
    (data: Record<string, unknown>[], filename: string) => {
      try {
        if (data.length === 0) {
          throw new Error('데이터가 없습니다');
        }

        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(','),
          ...data.map((row) =>
            headers
              .map((header) => {
                const value = row[header];
                const str = String(value ?? '');
                // 쉼표나 따옴표가 포함된 경우 따옴표로 감싸기
                return str.includes(',') || str.includes('"')
                  ? `"${str.replace(/"/g, '""')}"`
                  : str;
              })
              .join(',')
          ),
        ];

        const csv = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csv], {
          type: 'text/csv;charset=utf-8;',
        });
        const name = filename.endsWith('.csv') ? filename : `${filename}.csv`;
        downloadBlob(blob, name);
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'CSV 변환 실패',
        }));
      }
    },
    [downloadBlob]
  );

  return {
    ...state,
    downloadBlob,
    downloadUrl,
    downloadJson,
    downloadCsv,
  };
}
