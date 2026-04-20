// import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import {
  TrendingUp, DollarSign, ShoppingBag,
  Clock, ArrowUp, ArrowDown,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { LoadingListRows, LoadingMetricCards, SkeletonBlock } from '../../components/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { useBranchTrends, useRestaurantOverview } from '../../features/analytics/api';
import { useBranchOrders } from '../../features/orders/api';
import { buildRankedOrderItems } from './orderInsights';

// --------------------
// Local Button component
// --------------------
// const buttonBase =
//   'ui-button-pill flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200';
// const buttonVariants = {
//   default: 'ui-button-secondary',
//   secondary: 'ui-button-secondary',
//   destructive: 'ui-button-danger',
//   warm: 'ui-button',
//   outline: 'ui-button-ghost',
// } as const;

// type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
//   variant?: keyof typeof buttonVariants;
// };

// function Button({
//   children,
//   variant = 'default',
//   className = '',
//   type = 'button',
//   ...props
// }: ButtonProps) {
//   return (
//     <button
//       type={type}
//       className={`${buttonBase} ${buttonVariants[variant] || ''} ${className}`}
//       {...props}
//     >
//       {children}
//     </button>
//   );
// }

// --------------------
// Formatting helpers
// --------------------
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat('en-IN');

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatNumber = (value: number) => numberFormatter.format(value);

// --------------------
// Demo data
// --------------------
const categoryData = [
  { name: 'Main Course', value: 35, color: 'var(--chart-1)' },
  { name: 'Pizza', value: 25, color: 'var(--chart-2)' },
  { name: 'Burgers', value: 20, color: 'var(--chart-3)' },
  { name: 'Desserts', value: 12, color: 'var(--chart-4)' },
  { name: 'Beverages', value: 8, color: 'var(--chart-5)' },
];

type Stat = {
  label: string;
  value: number | string;
  format: 'currency' | 'number' | 'text';
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
};

const formatStatValue = (stat: Stat) => {
  if (stat.format === 'currency' && typeof stat.value === 'number') {
    return formatCurrency(stat.value);
  }
  if (stat.format === 'number' && typeof stat.value === 'number') {
    return formatNumber(stat.value);
  }
  return String(stat.value);
};

// --------------------
// Analytics Component
// --------------------
export default function Analytics() {
  const { user } = useAuth();
  const overview = useRestaurantOverview(user?.restroId);
  const branchTrends = useBranchTrends(user?.branchIds?.[0]?._id);
  const branchOrders = useBranchOrders(user?.branchIds?.[0]?._id);
  const isStatsLoading = overview.isLoading;

  const revenueData =
    branchTrends.data?.map((entry) => ({
      name: `${entry._id.day}/${entry._id.month}`,
      revenue: entry.revenueMinor / 100,
      orders: entry.orders,
    })) ?? [];

  const stats: Stat[] = [
    {
      label: 'Total Revenue',
      value: (overview.data?.revenueMinor ?? 0) / 100,
      format: 'currency',
      change: 'Live',
      isPositive: true,
      icon: DollarSign,
    },
    {
      label: 'Total Orders',
      value: overview.data?.orders ?? 0,
      format: 'number',
      change: 'Live',
      isPositive: true,
      icon: ShoppingBag,
    },
    {
      label: 'Avg Order Value',
      value: (overview.data?.avgOrderValueMinor ?? 0) / 100,
      format: 'currency',
      change: 'Live',
      isPositive: true,
      icon: TrendingUp,
    },
    { label: 'Tracked Days', value: revenueData.length, format: 'number', change: 'Live', isPositive: true, icon: Clock },
  ];

  const topItems = useMemo(
    () =>
      buildRankedOrderItems(branchOrders.data ?? [], {
        itemLimit: 5,
        fallbackOrderLimit: 3,
      }),
    [branchOrders.data],
  );

  const topItemsHint =
    branchOrders.isLoading
      ? "Loading today's order activity."
      : topItems.mode === 'today'
        ? "Based on today's order activity."
        : topItems.mode === 'recent'
          ? `No orders today, so the latest ${topItems.sourceOrderCount} orders are shown.`
          : 'No order activity yet.';

  return (
    <div className="space-y-6 text-left">
      <div className="ui-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="ui-eyebrow">Performance</p>
          <h1 className="font-display text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600">Track your restaurant's performance</p>
        </div>
        {/* <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            This Week
          </Button>
          <Button variant="warm">
            Download Report
          </Button>
        </div> */}
      </div>

      {/* Stats Grid */}
      {isStatsLoading ? (
        <LoadingMetricCards count={4} className="gap-4" cardClassName="rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="ui-card rounded-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--accent-soft)">
                  <stat.icon className="w-6 h-6 text-(--accent)" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {stat.change}
                </div>
              </div>
              <p className="font-display text-2xl font-bold">{formatStatValue(stat)}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="ui-card rounded-2xl"
        >
          <h2 className="font-display text-xl font-semibold mb-6">Revenue Trend</h2>
          <div className="h-72">
            {branchTrends.isLoading ? (
              <SkeletonBlock className="h-full w-full rounded-3xl" />
            ) : revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-strong)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '18px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={3} dot={{ fill: 'var(--chart-1)' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="ui-empty-state flex h-full items-center justify-center px-4 text-sm text-gray-500">
                Revenue trends will appear after live branch activity starts.
              </div>
            )}
          </div>
        </motion.div>

        {/* Orders by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="ui-card rounded-2xl"
        >
          <h2 className="font-display text-xl font-semibold mb-6">Sales by Category</h2>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-strong)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '18px',
                    color: 'var(--text-primary)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm">{cat.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Daily Orders & Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="ui-card rounded-2xl"
        >
          <h2 className="font-display text-xl font-semibold mb-6">Daily Orders</h2>
          <div className="h-72">
            {branchTrends.isLoading ? (
              <SkeletonBlock className="h-full w-full rounded-3xl" />
            ) : revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-strong)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '18px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Bar dataKey="orders" fill="var(--chart-3)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="ui-empty-state flex h-full items-center justify-center px-4 text-sm text-gray-500">
                Daily order charts will appear once orders are recorded.
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Selling Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="ui-card rounded-2xl"
        >
          <div className="mb-6">
            <h2 className="font-display text-xl font-semibold">Top Selling Items</h2>
            <p className="mt-1 text-sm text-gray-500">{topItemsHint}</p>
          </div>
          <div className="space-y-4">
            {branchOrders.isLoading ? (
              <LoadingListRows rows={4} rowClassName="bg-(--surface-muted)" />
            ) : topItems.items.length > 0 ? (
              topItems.items.map((item, index) => (
                <div key={item.name} className="flex items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--accent-soft) text-sm font-bold text-(--accent)">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.orders} orders</p>
                  </div>
                  <p className="shrink-0 font-bold text-orange-500">
                    {formatCurrency(item.revenueMinor / 100)}
                  </p>
                </div>
              ))
            ) : (
              <div className="ui-empty-state rounded-xl px-4 py-6 text-sm text-gray-500">
                No top-selling items yet.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
