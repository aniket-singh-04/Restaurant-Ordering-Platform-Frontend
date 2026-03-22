import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, ShoppingBag,
  Clock, Calendar, ArrowUp, ArrowDown,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useBranchTrends, useRestaurantOverview } from '../../features/analytics/api';

// --------------------
// Local Button component
// --------------------
const buttonBase =
  'px-4 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center justify-center';
const buttonVariants = {
  default: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  secondary: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  warm: 'bg-orange-400 text-white hover:bg-orange-500',
  outline: 'bg-transparent border border-gray-400 text-gray-800 hover:bg-gray-100',
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
};

function Button({
  children,
  variant = 'default',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonBase} ${buttonVariants[variant] || ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

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
  { name: 'Main Course', value: 35, color: 'hsl(25, 95%, 53%)' },
  { name: 'Pizza', value: 25, color: 'hsl(35, 95%, 55%)' },
  { name: 'Burgers', value: 20, color: 'hsl(45, 95%, 60%)' },
  { name: 'Desserts', value: 12, color: 'hsl(142, 70%, 45%)' },
  { name: 'Beverages', value: 8, color: 'hsl(200, 80%, 50%)' },
];

const topItems = [
  { name: 'Butter Chicken', orders: 156, revenue: 59280 },
  { name: 'Margherita Pizza', orders: 142, revenue: 53960 },
  { name: 'Gourmet Burger', orders: 128, revenue: 40960 },
  { name: 'Tiramisu', orders: 98, revenue: 27440 },
  { name: 'Paneer Tikka', orders: 87, revenue: 24360 },
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

  return (
    <div className="text-left space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600">Track your restaurant's performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            This Week
          </Button>
          <Button variant="warm">
            Download Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-md"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-orange-500" />
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-md"
        >
          <h2 className="font-display text-xl font-semibold mb-6">Revenue Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Orders by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-md"
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
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
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
          className="bg-white rounded-2xl p-6 shadow-md"
        >
          <h2 className="font-display text-xl font-semibold mb-6">Daily Orders</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="orders" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Selling Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl p-6 shadow-md"
        >
          <h2 className="font-display text-xl font-semibold mb-6">Top Selling Items</h2>
          <div className="space-y-4">
            {topItems.map((item, index) => (
              <div key={item.name} className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.orders} orders</p>
                </div>
                <p className="font-bold text-orange-500">{formatCurrency(item.revenue)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
