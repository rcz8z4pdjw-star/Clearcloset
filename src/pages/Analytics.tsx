import { useMemo } from 'react';
import { useApp } from '../store/context';
import { calculateAnalytics, getResaleRecommendations, generateShareableStats } from '../utils/analytics';
import { ShareCard } from '../components/ShareCard';
import { ResaleCard } from '../components/ResaleCard';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Shirt, AlertTriangle } from 'lucide-react';

const COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
];

export function Analytics() {
  const { state } = useApp();

  const analytics = useMemo(
    () => calculateAnalytics(state.items, state.wearLogs),
    [state.items, state.wearLogs]
  );

  const resaleRecommendations = useMemo(
    () => getResaleRecommendations(state.items),
    [state.items]
  );

  const shareStats = useMemo(
    () => generateShareableStats(analytics),
    [analytics]
  );

  // Category data for pie chart
  const categoryData = Object.entries(analytics.categoryBreakdown)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: count,
    }));

  // Most worn items for bar chart
  const wearData = analytics.mostWorn.slice(0, 5).map((item) => ({
    name: item.name.length > 15 ? item.name.slice(0, 15) + '...' : item.name,
    wears: item.wearCount,
  }));

  // Cost per wear data
  const cpwData = analytics.costPerWear.slice(0, 5).map(({ item, cpw }) => ({
    name: item.name.length > 15 ? item.name.slice(0, 15) + '...' : item.name,
    cpw: Math.round(cpw * 100) / 100,
  }));

  if (state.items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Add items to see your analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shareable Stats Card */}
      <ShareCard
        headline={shareStats.headline}
        stats={shareStats.stats}
        insight={shareStats.insight}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-primary-500 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Worn This Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.wornLast30Days}
          </p>
          <p className="text-xs text-gray-500">
            {Math.round((analytics.wornLast30Days / analytics.totalItems) * 100)}% of wardrobe
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Unused Items</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.neverWorn}</p>
          <p className="text-xs text-gray-500">
            {Math.round((analytics.neverWorn / analytics.totalItems) * 100)}% never worn
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Category Breakdown</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {categoryData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-600">
                {entry.name} ({entry.value})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Most Worn Items */}
      {wearData.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Most Worn Items</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wearData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="wears" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cost Per Wear */}
      {cpwData.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2">Cost Per Wear</h3>
          <p className="text-xs text-gray-500 mb-4">
            Lower is better - shows how much each wear costs you
          </p>
          <div className="space-y-3">
            {cpwData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 truncate flex-1">
                  {item.name}
                </span>
                <span
                  className={`text-sm font-medium ${
                    item.cpw < 5
                      ? 'text-green-600'
                      : item.cpw < 20
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  ${item.cpw}/wear
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items to Sell */}
      {resaleRecommendations.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">
            Recommended to Sell ({resaleRecommendations.length})
          </h3>
          <div className="space-y-4">
            {resaleRecommendations.slice(0, 5).map((rec) => {
              const item = state.items.find((i) => i.id === rec.itemId);
              if (!item) return null;
              return <ResaleCard key={rec.itemId} item={item} recommendation={rec} />;
            })}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Insights</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          {analytics.utilizationRate < 50 && (
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              You're only wearing {Math.round(analytics.utilizationRate)}% of your wardrobe
              regularly. Consider donating items you haven't worn in 6+ months.
            </li>
          )}
          {analytics.neverWorn > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              {analytics.neverWorn} items have never been worn. These could earn you $
              {Math.round(analytics.potentialResaleValue)} if sold.
            </li>
          )}
          {cpwData.length > 0 && cpwData[0].cpw > 50 && (
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              Some items have a very high cost-per-wear. Consider wearing them more or
              selling them.
            </li>
          )}
          {analytics.utilizationRate >= 70 && (
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              Great job! You're utilizing {Math.round(analytics.utilizationRate)}% of your
              wardrobe. You have a well-curated closet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
