import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  ArrowUp,
  ArrowDown,
  Clock,
  Bell,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRestaurantOverview } from "../../features/analytics/api";
import { useBranchOrders } from "../../features/orders/api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat("en-IN");

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatNumber = (value: number) => numberFormatter.format(value);

type Stat = {
  label: string;
  value: number | string;
  format: "currency" | "number" | "text";
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
};

const formatStatValue = (stat: Stat) => {
  if (stat.format === "currency" && typeof stat.value === "number") {
    return formatCurrency(stat.value);
  }
  if (stat.format === "number" && typeof stat.value === "number") {
    return formatNumber(stat.value);
  }
  return String(stat.value);
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const overview = useRestaurantOverview(user?.restroId);
  const branchOrders = useBranchOrders(user?.branchIds?.[0]?._id);

  const stats: Stat[] = [
    {
      label: "Revenue",
      value: (overview.data?.revenueMinor ?? 0) / 100,
      format: "currency",
      change: "Live",
      isPositive: true,
      icon: DollarSign,
    },
    {
      label: "Orders",
      value: overview.data?.orders ?? 0,
      format: "number",
      change: "Live",
      isPositive: true,
      icon: ShoppingBag,
    },
    {
      label: "Active Orders",
      value:
        branchOrders.data?.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.OrderStatus)).length ?? 0,
      format: "number",
      change: "Live",
      isPositive: true,
      icon: Users,
    },
    {
      label: "Avg. Order Value",
      value: ((overview.data?.avgOrderValueMinor ?? 0) / 100).toFixed(0),
      format: "text",
      change: "Live",
      isPositive: true,
      icon: Clock,
    },
  ];

  const recentOrders =
    branchOrders.data?.slice(0, 4).map((order) => ({
      id: order._id ?? order.id,
      table: order.tableId ?? "--",
      items: order.itemsSnapshot?.length ?? 0,
      total: (order.totalsSnapshot?.grandTotal ?? 0) / 100,
      status: (order.OrderStatus ?? "pending").toLowerCase(),
      time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : "--",
    })) ?? [];

  return (
    <div className="min-h-screen space-y-8 text-left">
      <header className="ui-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="ui-eyebrow">Restaurant Overview</p>
          <h1 className="font-display text-3xl text-left font-bold text-[#3b2f2f]">
            Dashboard
          </h1>
          <p className="text-[#6b665f]">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <button
          type="button"
          className="ui-icon-button warm-linear relative border-transparent p-3 text-white shadow-[var(--shadow-glow)]"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5 text-white" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
            3
          </span>
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="ui-card rounded-[1.5rem]"
          >
            <div className="flex justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
                <stat.icon className="w-6 h-6" />
              </div>
              <div
                className={`flex items-center gap-1 font-semibold text-sm ${
                  stat.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.isPositive ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="font-serif font-bold text-xl text-[#3b2f2f]">
              {formatStatValue(stat)}
            </p>
            <p className="text-[#6b665f]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="ui-card rounded-[1.5rem]"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif font-semibold text-lg text-[#3b2f2f]">
              Recent Orders
            </h2>
            <button type="button" className="text-[color:var(--accent)] font-semibold">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg bg-[color:var(--surface-muted)] p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#3b2f2f]">{order.id}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase text-white ${
                        order.status === "preparing"
                          ? "bg-blue-400"
                          : order.status === "pending"
                            ? "bg-yellow-400"
                            : "bg-green-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[#6b665f] text-sm text-left mt-1">
                    Table {order.table} - {order.items} items
                  </p>
                </div>
                <div className="text-right text-[#3b2f2f]">
                  <p className="font-semibold">{formatCurrency(order.total)}</p>
                  <p className="text-xs text-[#6b665f]">{order.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="ui-card rounded-[1.5rem]"
        >
          <h2 className="font-serif font-semibold text-lg text-[#3b2f2f] mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button type="button" className="flex flex-col items-start gap-4 rounded-xl bg-[color:var(--surface-muted)] p-6 text-left">
              <ShoppingBag className="text-[#ef6820] w-8 h-8" />
              <div>
                <p className="font-semibold text-[#3b2f2f]">New Order</p>
                <p className="text-[#6b665f] text-sm">Create manual order</p>
              </div>
            </button>
            <button type="button" className="flex flex-col items-start gap-4 rounded-xl bg-[color:var(--surface-muted)] p-6 text-left">
              <TrendingUp className="text-[#22c55e] w-8 h-8" />
              <div>
                <p className="font-semibold text-[#3b2f2f]">Reports</p>
                <p className="text-[#6b665f] text-sm">View analytics</p>
              </div>
            </button>
          </div>

          {/* Popular Today */}
          <div className="mt-6">
            <h3 className="font-semibold text-[#3b2f2f] mb-4">Popular Today</h3>
            <div className="space-y-3">
              {["Butter Chicken", "Margherita Pizza", "Gourmet Burger"].map(
                (item, i) => (
                  <div key={item} className="flex items-center justify-between">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#ef6820] text-white font-semibold">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-[#3b2f2f] ml-4">{item}</span>
                    <span className="text-[#6b665f] text-sm">
                      {15 - i * 3} orders
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
