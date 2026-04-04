import { Activity, AlertCircle, BadgeIndianRupee, Building2, ReceiptText, Users } from "lucide-react";
import { usePlatformAdminDashboard } from "../../features/platform-admin/dashboard/api";
import { formatNumber, formatPrice } from "../../utils/formatPrice";

const cardClass = "ui-card rounded-[28px] p-6";

export default function PlatformAdminDashboard() {
  const dashboard = usePlatformAdminDashboard();

  if (dashboard.isLoading) {
    return (
      <div className="space-y-6">
        <div className={cardClass}>
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-2xl bg-[#f4efe7]" />
            <div className="h-24 animate-pulse rounded-2xl bg-[#f4efe7]" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`${cardClass} h-32 animate-pulse bg-[#f4efe7]`} />
          ))}
        </div>
      </div>
    );
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <div className={`${cardClass} rounded-2xl bg-[#fef3f0]`}>
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-[#d84040]" />
          <div>
            <h2 className="font-semibold text-[#d84040]">Dashboard could not be loaded</h2>
            <p className="mt-1 text-sm text-[#b84040]">
              {dashboard.error instanceof Error ? dashboard.error.message : "Please try again later."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      label: "Total users",
      value: formatNumber(dashboard.data.metrics.totalUsers),
      icon: Users,
    },
    {
      label: "Total restaurants",
      value: formatNumber(dashboard.data.metrics.totalRestaurants),
      icon: Building2,
    },
    {
      label: "Total orders",
      value: formatNumber(dashboard.data.metrics.totalOrders),
      icon: ReceiptText,
    },
    {
      label: "Net revenue",
      value: formatPrice(dashboard.data.metrics.totalRevenueMinor / 100),
      icon: BadgeIndianRupee,
    },
    {
      label: "Active subscriptions",
      value: formatNumber(dashboard.data.metrics.activeSubscriptions),
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className={`${cardClass} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-linear-to-r from-[color:var(--accent-soft)] to-transparent opacity-70" />

        <div className="relative z-10">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">
            Platform Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            System-wide visibility
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Monitor platform activity, revenue trends, and recent administrative actions in real-time.
          </p>
        </div>
      </header>

      {/* Metrics */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((metric) => (
          <article
            key={metric.label}
            className={`${cardClass} group hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                {metric.label}
              </p>

              <div className="rounded-lg bg-[color:var(--accent-soft)] p-2 text-[color:var(--accent)] transition group-hover:scale-110">
                <metric.icon className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-5 text-3xl font-bold text-gray-900 tracking-tight">
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      {/* Table */}
      <section className={cardClass}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Admin Actions
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Latest high-privilege activity across the platform
            </p>
          </div>
        </div>

        <div className="ui-table-shell mt-6">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold text-gray-500">Action</th>
                <th className="px-4 py-3 font-semibold text-gray-500">Target</th>
                <th className="px-4 py-3 font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-500">Timestamp</th>
              </tr>
            </thead>

            <tbody>
              {dashboard.data.recentActions.length ? (
                dashboard.data.recentActions.map((action, index) => (
                  <tr
                    key={action.id}
                    className={`border-t hover:bg-gray-50 transition ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                  >
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {action.actionType}
                    </td>

                    <td className="px-4 py-4 text-gray-500">
                      <div>
                        <p className="font-medium text-gray-900">
                          {action.targetType}
                        </p>
                        {action.targetId && (
                          <p className="text-xs mt-1 text-gray-400">
                            {action.targetId.slice(0, 12)}...
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-600">
                        {action.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs text-gray-400">
                      {new Date(action.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-400">
                    No admin actions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
