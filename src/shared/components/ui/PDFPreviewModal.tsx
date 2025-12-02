/**
 * PDFPreviewModal 컴포넌트
 *
 * PDF 미리보기 모달
 * - react-pdf를 사용한 PDF 렌더링
 * - 페이지 네비게이션 (이전/다음)
 * - 줌 인/아웃
 * - 다운로드 버튼
 */

import { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import Button from './Button';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface PDFPreviewModalProps {
  /** 모달 열림 여부 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** PDF Blob 데이터 */
  pdfBlob: Blob | null;
  /** 다운로드 시 파일명 */
  filename?: string;
  /** PDF 생성 중 여부 */
  isLoading?: boolean;
}

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

export default function PDFPreviewModal({
  isOpen,
  onClose,
  pdfBlob,
  filename = 'report',
  isLoading = false,
}: PDFPreviewModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // PDF Blob을 URL로 변환
  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    return () => {};
  }, [pdfBlob]);

  // 모달 열릴 때 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setPageNumber(1);
      setScale(1.0);
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevPage();
          break;
        case 'ArrowRight':
          goToNextPage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pageNumber, numPages]);

  // 문서 로드 완료
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  }, []);

  // 페이지 이동
  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  }, [numPages]);

  // 줌
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  // 다운로드
  const handleDownload = useCallback(() => {
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

  // 배경 클릭으로 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-preview-title"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 id="pdf-preview-title" className="text-lg font-semibold text-gray-900">
            PDF Preview
          </h3>
          <div className="flex items-center gap-2">
            {/* 다운로드 버튼 */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              disabled={!pdfBlob || isLoading}
            >
              <Download size={16} className="mr-1" />
              Download
            </Button>
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="닫기"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* 툴바 */}
        <div className="flex items-center justify-center gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200">
          {/* 줌 컨트롤 */}
          <div className="flex items-center gap-1">
            <button
              onClick={zoomOut}
              disabled={scale <= MIN_ZOOM || isLoading}
              className={clsx(
                'p-1.5 rounded hover:bg-gray-200 transition-colors',
                scale <= MIN_ZOOM && 'opacity-50 cursor-not-allowed'
              )}
              aria-label="축소"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-sm text-gray-600 w-14 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={scale >= MAX_ZOOM || isLoading}
              className={clsx(
                'p-1.5 rounded hover:bg-gray-200 transition-colors',
                scale >= MAX_ZOOM && 'opacity-50 cursor-not-allowed'
              )}
              aria-label="확대"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300" />

          {/* 페이지 네비게이션 */}
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1 || isLoading}
              className={clsx(
                'p-1.5 rounded hover:bg-gray-200 transition-colors',
                pageNumber <= 1 && 'opacity-50 cursor-not-allowed'
              )}
              aria-label="이전 페이지"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600 min-w-[80px] text-center">
              {numPages > 0 ? `${pageNumber} / ${numPages}` : '- / -'}
            </span>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages || isLoading}
              className={clsx(
                'p-1.5 rounded hover:bg-gray-200 transition-colors',
                pageNumber >= numPages && 'opacity-50 cursor-not-allowed'
              )}
              aria-label="다음 페이지"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* PDF 뷰어 */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="flex justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">PDF 생성 중...</p>
              </div>
            ) : pdfUrl ? (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-600">PDF 로딩 중...</p>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center py-20 text-red-500">
                    <p>PDF를 불러올 수 없습니다.</p>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  className="shadow-lg"
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <p>PDF 데이터가 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 - 키보드 단축키 안내 */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">←</kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">→</kbd> 페이지 이동 |{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">ESC</kbd> 닫기
          </p>
        </div>
      </div>
    </div>
  );
}

PDFPreviewModal.displayName = 'PDFPreviewModal';
