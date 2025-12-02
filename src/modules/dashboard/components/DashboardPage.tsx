/**
 * DashboardPage 컴포넌트
 *
 * Analytics 대시보드 메인 페이지
 * - useViewModel 패턴으로 로직/UI 분리
 * - 필터에 따른 동적 데이터 표시
 */

import {
  Eye,
  Users,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  Monitor,
  Smartphone,
  Tablet,
  ThumbsUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Card, FilterPanel } from '@/shared/components/ui';
import { useDashboardViewModel } from '../hooks';

// 색상 상수
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// ============================================
// 재사용 가능한 UI 컴포넌트
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
}

function StatCard({ title, value, change, icon: Icon, iconBgColor, iconColor }: StatCardProps) {
  return (
    <Card className="flex items-center gap-3 sm:gap-4">
      <div className={`p-2 sm:p-3 rounded-xl ${iconBgColor}`}>
        <Icon size={20} className={`${iconColor} sm:w-6 sm:h-6`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 truncate">{title}</p>
        <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs sm:text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{change >= 0 ? '+' : ''}{change}%</span>
            <span className="text-gray-400 hidden sm:inline">vs 지난달</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function RealtimeBadge({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 rounded-full">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <span className="text-xs sm:text-sm font-medium text-green-700">{count}명 접속 중</span>
    </div>
  );
}

function getDeviceIcon(device: string) {
  switch (device) {
    case '데스크톱': return Monitor;
    case '모바일': return Smartphone;
    case '태블릿': return Tablet;
    default: return Monitor;
  }
}

// ============================================
// 메인 컴포넌트
// ============================================

export default function DashboardPage() {
  const vm = useDashboardViewModel();

  // 로딩 상태
  if (vm.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">사이트 트래픽 및 콘텐츠 성과 현황</p>
        </div>
        <RealtimeBadge count={vm.realtimeUsers} />
      </div>

      {/* 필터 */}
      <FilterPanel showPeriod showDateRange compact />

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard {...vm.statsCards.pageViews} icon={Eye} iconBgColor="bg-blue-100" iconColor="text-blue-600" />
        <StatCard {...vm.statsCards.visitors} icon={Users} iconBgColor="bg-green-100" iconColor="text-green-600" />
        <StatCard {...vm.statsCards.sessions} icon={Activity} iconBgColor="bg-purple-100" iconColor="text-purple-600" />
        <StatCard {...vm.statsCards.avgDuration} icon={Clock} iconBgColor="bg-orange-100" iconColor="text-orange-600" />
      </div>

      {/* 차트 영역 - 상단 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* 트래픽 트렌드 */}
        <Card padding="lg" className="lg:col-span-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">트래픽 트렌드</h3>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vm.dailyTrend}>
                <defs>
                  <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={40} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="pageViews" name="페이지뷰" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPageViews)" />
                <Area type="monotone" dataKey="visitors" name="방문자" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 트래픽 소스 */}
        <Card padding="lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">트래픽 소스</h3>
          <div className="h-40 sm:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={vm.trafficSources} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                  {vm.trafficSources.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {vm.trafficSources.map((source, index) => (
              <div key={source.name} className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span className="text-gray-600 truncate">{source.name}</span>
                </div>
                <span className="font-medium text-gray-900">{source.percentage}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 차트 영역 - 하단 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 카테고리별 성과 */}
        <Card padding="lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">카테고리별 성과</h3>
          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vm.categoryPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="category" width={50} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Bar dataKey="views" name="조회수" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 디바이스 분포 */}
        <Card padding="lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">디바이스 분포</h3>
          <div className="space-y-3 sm:space-y-4">
            {vm.deviceStats.map((device) => {
              const Icon = getDeviceIcon(device.device);
              return (
                <div key={device.device} className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-gray-500 sm:w-[18px] sm:h-[18px]" />
                      <span className="text-xs sm:text-sm text-gray-700">{device.device}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-900">{device.count.toLocaleString()}</span>
                      <span className="text-xs sm:text-sm text-gray-500">({device.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                    <div className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all" style={{ width: `${device.percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 주간 비교 */}
          {vm.weekComparison && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-500 mb-1">이번 주 vs 지난 주</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">{vm.weekComparison.thisWeek.toLocaleString()}</span>
                  <span className="text-xs sm:text-sm text-gray-500 ml-2">방문</span>
                </div>
                <div className={`flex items-center gap-1 text-sm ${vm.weekComparison.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {vm.weekComparison.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span className="font-medium">{vm.weekComparison.change >= 0 ? '+' : ''}{vm.weekComparison.change}%</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 인기 콘텐츠 */}
      <Card padding="lg">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">인기 콘텐츠 TOP 5</h3>
        <div className="space-y-2 sm:space-y-3">
          {vm.topContents.map((content, index) => (
            <div key={content.id} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-bold rounded-lg text-xs sm:text-sm shrink-0 ${
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-gray-200 text-gray-700' :
                index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-gray-800 truncate">{content.title}</p>
                <span className="text-xs text-gray-500">{content.category}</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm shrink-0">
                <span className="flex items-center gap-1 text-gray-600">
                  <Eye size={14} />
                  <span className="hidden sm:inline">{content.views.toLocaleString()}</span>
                  <span className="sm:hidden">{(content.views / 1000).toFixed(1)}k</span>
                </span>
                <span className="flex items-center gap-1 text-gray-600">
                  <ThumbsUp size={14} />
                  {content.likes}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
