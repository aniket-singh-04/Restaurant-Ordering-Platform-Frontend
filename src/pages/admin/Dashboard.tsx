import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
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
import {
  buildRankedOrderItems,
  formatCompactOrderStatus,
  shortenEntityId,
  sortOrdersByNewest,
} from "./orderInsights";
import { LoadingListRows, LoadingMetricCards } from "../../components/LoadingState";
import { useNavigate } from "react-router-dom";

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

const getOrderStatusBadgeClass = (status: string) => {
  switch (status.trim().toUpperCase()) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "READY":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    case "PREPARING":
    case "ACCEPTED":
      return "bg-sky-100 text-sky-700";
    case "PLACED":
    case "CREATED":
    case "HALF_PAID":
      return "bg-orange-100 text-orange-700";
    case "PENDING_VALIDATION":
    case "AWAITING_ADVANCE_PAYMENT":
    case "AWAITING_CASH_CONFIRMATION":
      return "bg-amber-100 text-amber-700";
    case "ACCEPTANCE_EXPIRED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const overview = useRestaurantOverview(user?.restroId);
  const branchOrders = useBranchOrders(user?.branchIds?.[0]?._id);
  const isStatsLoading = overview.isLoading || branchOrders.isLoading;
  const navigate = useNavigate();

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

  const recentOrders = useMemo(
    () =>
      sortOrdersByNewest(branchOrders.data ?? []).slice(0, 4).map((order) => ({
        id: order._id ?? order.id,
        shortId: shortenEntityId(order._id ?? order.id),
        table: order.tableId ? shortenEntityId(order.tableId, 4, 4) : "--",
        items: order.itemsSnapshot?.reduce(
          (total, item) => total + item.quantity,
          0,
        ) ?? 0,
        total: (order.totalsSnapshot?.grandTotal ?? 0) / 100,
        status: order.OrderStatus ?? "PENDING_VALIDATION",
        statusLabel: formatCompactOrderStatus(order.OrderStatus),
        time: order.createdAt
          ? new Date(order.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--",
      })),
    [branchOrders.data],
  );

  const popularItems = useMemo(
    () =>
      buildRankedOrderItems(branchOrders.data ?? [], {
        itemLimit: 3,
        fallbackOrderLimit: 3,
      }),
    [branchOrders.data],
  );

  const popularItemsHint =
    branchOrders.isLoading
      ? "Loading today's item rankings."
      : popularItems.mode === "today"
        ? "Based on today's orders."
        : popularItems.mode === "recent"
          ? `No orders today, so the latest ${popularItems.sourceOrderCount} orders are shown.`
          : "No order activity yet.";

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
          className="ui-icon-button w-fit warm-linear relative border-transparent p-3 text-white shadow-[var(--shadow-glow)]"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
            3
          </span>
        </button>
      </header>

      {/* Stats Grid */}
      {isStatsLoading ? (
        <LoadingMetricCards count={4} className="gap-6" cardClassName="rounded-[1.5rem]" />
      ) : (
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
      )}

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
            <button type="button" className="text-[color:var(--accent)] font-semibold" onClick={() => navigate("/admin/orders")}>
              View All
            </button>
          </div>
          <div className="space-y-4">
            {branchOrders.isLoading ? (
              <LoadingListRows rows={4} rowClassName="bg-[color:var(--surface-muted)]" />
            ) : recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-xl bg-[color:var(--surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        title={order.id}
                        className="max-w-[12rem] truncate font-semibold text-[#3b2f2f] sm:max-w-[16rem]"
                      >
                        #{order.shortId}
                      </p>
                      <span
                        title={order.status}
                        className={`inline-flex max-w-full shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getOrderStatusBadgeClass(
                          order.status,
                        )}`}
                      >
                        {order.statusLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-left text-sm text-[#6b665f]">
                      Table {order.table} • {order.items} items
                    </p>
                  </div>
                  <div className="shrink-0 text-left text-[#3b2f2f] sm:text-right">
                    <p className="font-semibold">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-[#6b665f]">{order.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="ui-empty-state rounded-xl px-4 py-6 text-sm text-[#6b665f]">
                No recent orders yet.
              </div>
            )}
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
            <div className="mb-4">
              <h3 className="font-semibold text-[#3b2f2f]">Popular Items</h3>
              <p className="mt-1 text-sm text-[#6b665f]">{popularItemsHint}</p>
            </div>
            <div className="space-y-3">
              {branchOrders.isLoading ? (
                <LoadingListRows rows={3} rowClassName="bg-[color:var(--surface-muted)]" />
              ) : popularItems.items.length > 0 ? (
                popularItems.items.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ef6820] text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[#3b2f2f]">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-sm text-[#6b665f]">
                      {item.orders} orders
                    </span>
                  </div>
                ))
              ) : (
                <div className="ui-empty-state rounded-xl px-4 py-6 text-sm text-[#6b665f]">
                  No popular items yet.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
