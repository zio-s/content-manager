/**
 * usePdfPreview Hook
 *
 * PDF 미리보기를 위한 범용 훅
 * - 어떤 PDF Blob이든 미리보기 가능
 * - 모달 상태 관리
 * - 다운로드 기능 포함
 *
 * @example 기본 사용법
 * ```tsx
 * function MyComponent() {
 *   const { isOpen, pdfBlob, openPreview, closePreview, downloadPdf } = usePdfPreview();
 *
 *   const handleGeneratePdf = async () => {
 *     // PDF 생성 (어떤 방식이든)
 *     const blob = await generateMyPdf();
 *     openPreview(blob, 'my-document');
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleGeneratePdf}>PDF 보기</button>
 *       <PDFPreviewModal
 *         isOpen={isOpen}
 *         onClose={closePreview}
 *         pdfBlob={pdfBlob}
 *         filename={filename}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * @example 서버에서 받은 PDF
 * ```tsx
 * const { openPreview } = usePdfPreview();
 *
 * const handleFetchPdf = async () => {
 *   const response = await fetch('/api/invoice/123/pdf');
 *   const blob = await response.blob();
 *   openPreview(blob, 'invoice-123');
 * };
 * ```
 *
 * @example react-pdf/renderer와 함께 사용
 * ```tsx
 * import { pdf } from '@react-pdf/renderer';
 * import { MyPdfTemplate } from './MyPdfTemplate';
 *
 * const { openPreview } = usePdfPreview();
 *
 * const handleGeneratePdf = async () => {
 *   const blob = await pdf(<MyPdfTemplate data={data} />).toBlob();
 *   openPreview(blob, 'report');
 * };
 * ```
 *
 * @example jsPDF와 함께 사용
 * ```tsx
 * import jsPDF from 'jspdf';
 *
 * const { openPreview } = usePdfPreview();
 *
 * const handleGeneratePdf = () => {
 *   const doc = new jsPDF();
 *   doc.text('Hello World', 10, 10);
 *   const blob = doc.output('blob');
 *   openPreview(blob, 'hello-world');
 * };
 * ```
 */

import { useState, useCallback } from 'react';

export interface UsePdfPreviewReturn {
  /** 모달 열림 여부 */
  isOpen: boolean;
  /** 현재 미리보기 중인 PDF Blob */
  pdfBlob: Blob | null;
  /** 현재 파일명 */
  filename: string;
  /** 로딩 상태 */
  isLoading: boolean;
  /** PDF 미리보기 열기 */
  openPreview: (blob: Blob, filename?: string) => void;
  /** 로딩 상태로 모달 열기 (PDF 생성 전) */
  openWithLoading: (filename?: string) => void;
  /** PDF Blob 설정 (로딩 완료) */
  setPdfBlob: (blob: Blob) => void;
  /** 모달 닫기 */
  closePreview: () => void;
  /** PDF 다운로드 */
  downloadPdf: () => void;
}

/**
 * PDF 미리보기 범용 훅
 *
 * @param defaultFilename - 기본 파일명 (기본값: 'document')
 * @returns PDF 미리보기 상태 및 제어 함수
 */
export function usePdfPreview(defaultFilename = 'document'): UsePdfPreviewReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfBlob, setPdfBlobState] = useState<Blob | null>(null);
  const [filename, setFilename] = useState(defaultFilename);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * PDF 미리보기 열기
   * @param blob - PDF Blob 데이터
   * @param name - 파일명 (확장자 제외)
   */
  const openPreview = useCallback((blob: Blob, name?: string) => {
    setPdfBlobState(blob);
    setFilename(name || defaultFilename);
    setIsLoading(false);
    setIsOpen(true);
  }, [defaultFilename]);

  /**
   * 로딩 상태로 모달 열기 (PDF 생성 전)
   * PDF 생성이 오래 걸릴 때 먼저 모달을 열고 로딩 표시
   * @param name - 파일명 (확장자 제외)
   */
  const openWithLoading = useCallback((name?: string) => {
    setPdfBlobState(null);
    setFilename(name || defaultFilename);
    setIsLoading(true);
    setIsOpen(true);
  }, [defaultFilename]);

  /**
   * PDF Blob 설정 (로딩 완료 시)
   * openWithLoading으로 모달을 먼저 열고, PDF 생성 완료 후 호출
   */
  const setPdfBlob = useCallback((blob: Blob) => {
    setPdfBlobState(blob);
    setIsLoading(false);
  }, []);

  /**
   * 모달 닫기 및 상태 초기화
   */
  const closePreview = useCallback(() => {
    setIsOpen(false);
    setPdfBlobState(null);
    setIsLoading(false);
  }, []);

  /**
   * PDF 다운로드
   */
  const downloadPdf = useCallback(() => {
    if (!pdfBlob) return;

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [pdfBlob, filename]);

  return {
    isOpen,
    pdfBlob,
    filename,
    isLoading,
    openPreview,
    openWithLoading,
    setPdfBlob,
    closePreview,
    downloadPdf,
  };
}

export default usePdfPreview;
