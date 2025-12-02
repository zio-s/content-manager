/**
 * PDF Report Template
 *
 * @react-pdf/renderer를 사용한 리포트 PDF 템플릿
 * - 요약 섹션
 * - 비교 테이블
 * - 카테고리 성과 테이블
 * - 트렌드 데이터
 */

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// 한글 폰트 등록 (Pretendard from CDN - 안정적인 한글 폰트)
Font.register({
  family: 'Pretendard',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Regular.otf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf',
      fontWeight: 'bold',
    },
  ],
});

// PDF 스타일 정의
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Pretendard',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #2563eb',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    border: '1px solid #e5e7eb',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  table: {
    width: '100%',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    padding: 8,
  },
  tableHeaderCell: {
    flex: 1,
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 9,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: 8,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: 8,
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    textAlign: 'center',
    color: '#374151',
  },
  changePositive: {
    color: '#059669',
  },
  changeNegative: {
    color: '#dc2626',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: '#9ca3af',
  },
});

// Props 타입 정의
export interface ComparisonItem {
  metric: string;
  current: number;
  previous: number;
  unit: string;
  change: number;
}

export interface CategoryPerformanceItem {
  category: string;
  views: number;
  likes: number;
  avgTime: string;
  count: number;
}

export interface MonthlyTrendItem {
  date: string;
  pageViews: number;
  visitors: number;
}

export interface ReportSummary {
  period: string;
  totalPageViews: number;
  totalVisitors: number;
  totalSessions: number;
  topCategory?: CategoryPerformanceItem;
  contentsCount: number;
}

export interface ReportTemplateProps {
  comparisonData: ComparisonItem[];
  categoryPerformance: CategoryPerformanceItem[];
  monthlyTrend: MonthlyTrendItem[];
  reportSummary: ReportSummary | null;
  generatedAt?: string;
}

// 기간 레이블 변환
function getPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    '7d': '최근 7일',
    '30d': '최근 30일',
    '90d': '최근 90일',
  };
  return labels[period] || period;
}

// 숫자 포맷팅
function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

/**
 * PDF Report Document Component
 */
export function ReportTemplate({
  comparisonData,
  categoryPerformance,
  monthlyTrend,
  reportSummary,
  generatedAt = new Date().toLocaleDateString('ko-KR'),
}: ReportTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics Report</Text>
          <Text style={styles.subtitle}>
            {reportSummary ? getPeriodLabel(reportSummary.period) : ''} | 생성일: {generatedAt}
          </Text>
        </View>

        {/* 요약 섹션 */}
        {reportSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Page Views</Text>
                <Text style={styles.summaryValue}>{formatNumber(reportSummary.totalPageViews)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Visitors</Text>
                <Text style={styles.summaryValue}>{formatNumber(reportSummary.totalVisitors)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Sessions</Text>
                <Text style={styles.summaryValue}>{formatNumber(reportSummary.totalSessions)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Contents Count</Text>
                <Text style={styles.summaryValue}>{formatNumber(reportSummary.contentsCount)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 비교 테이블 */}
        {comparisonData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Period Comparison</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Metric</Text>
                <Text style={styles.tableHeaderCell}>Current</Text>
                <Text style={styles.tableHeaderCell}>Previous</Text>
                <Text style={styles.tableHeaderCell}>Change</Text>
              </View>
              {comparisonData.map((item, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCell}>{item.metric}</Text>
                  <Text style={styles.tableCell}>
                    {formatNumber(item.current)}{item.unit}
                  </Text>
                  <Text style={styles.tableCell}>
                    {formatNumber(item.previous)}{item.unit}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      item.change >= 0 ? styles.changePositive : styles.changeNegative,
                    ]}
                  >
                    {item.change >= 0 ? '+' : ''}{item.change}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 카테고리 성과 테이블 */}
        {categoryPerformance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Performance</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Category</Text>
                <Text style={styles.tableHeaderCell}>Views</Text>
                <Text style={styles.tableHeaderCell}>Likes</Text>
                <Text style={styles.tableHeaderCell}>Avg. Time</Text>
                <Text style={styles.tableHeaderCell}>Count</Text>
              </View>
              {categoryPerformance.map((item, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCell}>{item.category}</Text>
                  <Text style={styles.tableCell}>{formatNumber(item.views)}</Text>
                  <Text style={styles.tableCell}>{formatNumber(item.likes)}</Text>
                  <Text style={styles.tableCell}>{item.avgTime}</Text>
                  <Text style={styles.tableCell}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 트렌드 테이블 */}
        {monthlyTrend.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Trend (Last 7 Days)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Date</Text>
                <Text style={styles.tableHeaderCell}>Page Views</Text>
                <Text style={styles.tableHeaderCell}>Visitors</Text>
              </View>
              {monthlyTrend.map((item, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCell}>{item.date}</Text>
                  <Text style={styles.tableCell}>{formatNumber(item.pageViews)}</Text>
                  <Text style={styles.tableCell}>{formatNumber(item.visitors)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 푸터 */}
        <Text style={styles.footer}>
          Content Manager - Analytics Report | Generated automatically
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}

export default ReportTemplate;
