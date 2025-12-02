/**
 * PDF 생성 훅
 *
 * @react-pdf/renderer를 사용하여 PDF Blob 생성
 * - generatePdf: 리포트 데이터로 PDF Blob 생성
 * - downloadPdf: PDF 파일 다운로드
 */

import { useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { ReportTemplate } from '../pdf';
import type { ReportTemplateProps } from '../pdf';

export interface UsePdfOptions {
  filename?: string;
}

export interface UsePdfReturn {
  /** PDF Blob 생성 */
  generatePdf: (data: Omit<ReportTemplateProps, 'generatedAt'>) => Promise<Blob>;
  /** PDF 생성 후 바로 다운로드 */
  downloadPdf: (data: Omit<ReportTemplateProps, 'generatedAt'>) => Promise<void>;
  /** PDF 생성 중 여부 */
  isGenerating: boolean;
  /** 에러 메시지 */
  error: string | null;
}

/**
 * PDF 생성 훅
 * @param options - 옵션 (파일명 등)
 */
export function usePdf(options: UsePdfOptions = {}): UsePdfReturn {
  const { filename = 'report' } = options;
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * PDF Blob 생성
   */
  const generatePdf = useCallback(
    async (data: Omit<ReportTemplateProps, 'generatedAt'>): Promise<Blob> => {
      setIsGenerating(true);
      setError(null);

      try {
        const generatedAt = new Date().toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const doc = (
          <ReportTemplate
            comparisonData={data.comparisonData}
            categoryPerformance={data.categoryPerformance}
            monthlyTrend={data.monthlyTrend}
            reportSummary={data.reportSummary}
            generatedAt={generatedAt}
          />
        );

        const blob = await pdf(doc).toBlob();
        return blob;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'PDF 생성 중 오류가 발생했습니다.';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  /**
   * PDF 생성 후 다운로드
   */
  const downloadPdf = useCallback(
    async (data: Omit<ReportTemplateProps, 'generatedAt'>): Promise<void> => {
      try {
        const blob = await generatePdf(data);

        // Blob URL 생성
        const url = URL.createObjectURL(blob);

        // 다운로드 링크 생성 및 클릭
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(link);
        link.click();

        // 정리
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        // generatePdf에서 이미 에러 처리됨
        console.error('PDF 다운로드 실패:', err);
      }
    },
    [generatePdf, filename]
  );

  return {
    generatePdf,
    downloadPdf,
    isGenerating,
    error,
  };
}

export default usePdf;
