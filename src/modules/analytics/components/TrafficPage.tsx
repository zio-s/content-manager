/**
 * TrafficPage 컴포넌트
 *
 * 트래픽 분석 페이지
 * - useViewModel 패턴으로 로직/UI 분리
 * - 기간별 트래픽 차트
 * - 트래픽 소스 분석
 */

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, Clock, MousePointer } from 'lucide-react';
import { Card, FilterPanel } from '@/shared/components/ui';
import { useTrafficViewModel } from '../hooks';

// 차트 색상
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// ============================================
// 재사용 가능한 UI 컴포넌트
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  iconBg: string;
}

function StatCard({ title, value, change, icon: Icon, iconBg }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="flex items-center gap-3 sm:gap-4">
      <div className={`p-2 sm:p-3 rounded-lg ${iconBg}`}>
        <Icon size={20} className="text-white sm:w-6 sm:h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 truncate">{title}</p>
        <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`flex items-center gap-1 text-xs sm:text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span className="hidden sm:inline">{isPositive ? '+' : ''}{change}%</span>
      </div>
    </Card>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export default function TrafficPage() {
  const vm = useTrafficViewModel();

  // 로딩 상태
  if (vm.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // 에러 상태
  if (vm.hasError || !vm.statsCards) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 필터 */}
      <FilterPanel showPeriod showDateRange />

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard {...vm.statsCards.pageViews} icon={MousePointer} iconBg="bg-blue-500" />
        <StatCard {...vm.statsCards.visitors} icon={Users} iconBg="bg-green-500" />
        <StatCard {...vm.statsCards.sessions} icon={TrendingUp} iconBg="bg-purple-500" />
        <StatCard {...vm.statsCards.avgDuration} icon={Clock} iconBg="bg-orange-500" />
      </div>

      {/* 트래픽 추이 차트 */}
      <Card padding="lg">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">트래픽 추이</h3>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={vm.timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(value) => value.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="pageViews" name="페이지뷰" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              <Area type="monotone" dataKey="visitors" name="방문자" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 하단 차트들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 트래픽 소스 */}
        <Card padding="lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">트래픽 소스</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vm.sources}
                  dataKey="visitors"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {vm.sources.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {vm.sources.map((source, index) => (
              <div key={source.source} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-gray-600">{source.source}</span>
                </div>
                <span className="font-medium text-gray-900">{source.visitors.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 디바이스 분포 */}
        <Card padding="lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">디바이스 분포</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vm.devices} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="device" tick={{ fontSize: 11 }} width={60} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="방문자 수" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {vm.devices.map((device) => (
              <div key={device.device} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{device.device}</span>
                <span className="font-medium text-gray-900">{device.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 인기 페이지 */}
      <Card padding="lg">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">인기 페이지</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-gray-700">페이지</th>
                <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-gray-700">페이지뷰</th>
                <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-gray-700">평균 체류</th>
              </tr>
            </thead>
            <tbody>
              {vm.pages.map((page, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-xs sm:text-sm text-gray-900 truncate max-w-[200px]">{page.page}</td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-gray-900 text-right">{page.views.toLocaleString()}</td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-gray-500 text-right">{page.avgTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
