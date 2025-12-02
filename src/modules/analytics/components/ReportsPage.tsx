/**
 * ReportsPage 컴포넌트
 *
 * 리포트 페이지
 * - useViewModel 패턴으로 로직/UI 분리
 * - 종합 리포트 생성
 * - PDF/CSV 내보내기
 */

import { useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Card, Button, FilterPanel, PDFPreviewModal } from '@/shared/components/ui';
import { useAlert, useDownload, usePdf, usePdfPreview } from '@/shared/hooks';
import { useReportsViewModel } from '../hooks';

// ============================================
// 재사용 가능한 UI 컴포넌트
// ============================================

function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center gap-1 text-green-600 text-xs sm:text-sm">
        <TrendingUp size={14} />
        <span className="hidden sm:inline">+{change}%</span>
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-1 text-red-600 text-xs sm:text-sm">
        <TrendingDown size={14} />
        <span className="hidden sm:inline">{change}%</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm">
      <Minus size={14} />
      <span className="hidden sm:inline">0%</span>
    </span>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export default function ReportsPage() {
  const vm = useReportsViewModel();
  const alert = useAlert();
  const { downloadCsv } = useDownload();
  const { generatePdf } = usePdf({ filename: 'analytics_report' });

  // PDF 미리보기 (범용 훅 사용)
  const pdfPreview = usePdfPreview('analytics_report');

  const handleExportCsv = () => {
    downloadCsv(vm.csvData, `report_${vm.filters.period}`);
    alert.success('CSV 파일이 다운로드되었습니다.');
  };

  const handleExportPdf = useCallback(async () => {
    try {
      // 로딩 상태로 모달 먼저 열기
      pdfPreview.openWithLoading(`analytics_report_${vm.filters.period}`);

      // PDF 생성
      const blob = await generatePdf({
        comparisonData: vm.comparisonData,
        categoryPerformance: vm.categoryPerformance,
        monthlyTrend: vm.monthlyTrend,
        reportSummary: vm.reportSummary,
      });

      // PDF 로딩 완료
      pdfPreview.setPdfBlob(blob);
    } catch {
      alert.error('PDF 생성 중 오류가 발생했습니다.');
      pdfPreview.closePreview();
    }
  }, [generatePdf, vm.comparisonData, vm.categoryPerformance, vm.monthlyTrend, vm.reportSummary, vm.filters.period, alert, pdfPreview]);

  // 로딩 상태
  if (vm.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 필터 패널 */}
      <FilterPanel
        showPeriod
        showDateRange
        showCategory
        extraButtons={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCsv}>
              <Download size={16} className="mr-1.5" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
            <Button size="sm" onClick={handleExportPdf} loading={pdfPreview.isLoading}>
              <FileText size={16} className="mr-1.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        }
      />

      {/* 기간 비교 */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">기간 비교 분석</h3>
          <span className="text-xs sm:text-sm text-gray-500">이전 기간 대비</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {vm.comparisonData.map((item) => (
            <div key={item.metric} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">{item.metric}</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {item.current.toLocaleString()}{item.unit}
              </p>
              <ChangeIndicator change={item.change} />
            </div>
          ))}
        </div>
      </Card>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 트래픽 트렌드 */}
        <Card padding="lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">트래픽 트렌드</h3>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%" debounce={1}>
              <LineChart data={vm.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={40} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="pageViews" name="페이지뷰" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="visitors" name="방문자" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 카테고리별 성과 */}
        <Card padding="lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">카테고리별 성과</h3>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%" debounce={1}>
              <BarChart data={vm.categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="views" name="조회수" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="likes" name="좋아요" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 상세 테이블 */}
      <Card padding="lg">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">카테고리별 상세 성과</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-gray-700">카테고리</th>
                <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-gray-700">콘텐츠</th>
                <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-gray-700">조회수</th>
                <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-gray-700">좋아요</th>
                <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-gray-700">참여율</th>
              </tr>
            </thead>
            <tbody>
              {vm.categoryPerformance.map((item) => {
                const engagementRate = item.views > 0 ? ((item.likes / item.views) * 100).toFixed(2) : '0.00';
                return (
                  <tr key={item.category} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-xs sm:text-sm font-medium text-gray-900">{item.category}</td>
                    <td className="py-3 px-4 text-xs sm:text-sm text-gray-900 text-right">{item.count}개</td>
                    <td className="py-3 px-4 text-xs sm:text-sm text-gray-900 text-right">{item.views.toLocaleString()}</td>
                    <td className="py-3 px-4 text-xs sm:text-sm text-gray-900 text-right">{item.likes.toLocaleString()}</td>
                    <td className="py-3 px-4 text-xs sm:text-sm text-gray-900 text-right">{engagementRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 리포트 요약 */}
      {vm.reportSummary && (
        <Card padding="lg" className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg shrink-0">
              <FileText size={20} className="text-blue-600 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">리포트 요약</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li>
                  • 선택 기간({vm.reportSummary.period}) 총 페이지뷰는{' '}
                  <strong>{vm.reportSummary.totalPageViews.toLocaleString()}회</strong>입니다.
                </li>
                <li>
                  • 총 방문자 수는 <strong>{vm.reportSummary.totalVisitors.toLocaleString()}명</strong>이며,
                  세션 수는 <strong>{vm.reportSummary.totalSessions.toLocaleString()}회</strong>입니다.
                </li>
                {vm.reportSummary.topCategory && (
                  <li>
                    • 가장 인기있는 카테고리는 <strong>{vm.reportSummary.topCategory.category}</strong>이며,{' '}
                    <strong>{vm.reportSummary.topCategory.views.toLocaleString()}</strong>회 조회되었습니다.
                  </li>
                )}
                <li>
                  • 현재 필터링된 콘텐츠는 총 <strong>{vm.reportSummary.contentsCount}개</strong>입니다.
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* PDF 미리보기 모달 */}
      <PDFPreviewModal
        isOpen={pdfPreview.isOpen}
        onClose={pdfPreview.closePreview}
        pdfBlob={pdfPreview.pdfBlob}
        filename={pdfPreview.filename}
        isLoading={pdfPreview.isLoading}
      />
    </div>
  );
}
