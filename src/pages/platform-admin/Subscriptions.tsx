import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
  updatePlatformSubscriptionOverride,
  usePlatformAdminSubscriptions,
} from "../../features/platform-admin/subscriptions/api";
import type { AdminSubscriptionRecord } from "../../features/platform-admin/auth/types";
import { formatPrice } from "../../utils/formatPrice";
import { FilterListBox } from "../../components/FilterListBox";
import { subscriptionAccessStatusOptions } from "../../utils/filterOptions";

const cardClass = "rounded-[28px] bg-white shadow-sm";

export default function PlatformAdminSubscriptions() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [search, setSearch] = useState("");
  const [accessStatus, setAccessStatus] = useState("");
  const [planCode, setPlanCode] = useState("");

  const query = useMemo(
    () => ({
      page: 1,
      limit: 20,
      search,
      accessStatus,
      planCode,
    }),
    [search, accessStatus, planCode],
  );

  const subscriptions = usePlatformAdminSubscriptions(query);

  const overrideMutation = useMutation({
    mutationFn: (payload: {
      subscriptionId: string;
      action: "ACTIVATE" | "DEACTIVATE" | "EXTEND";
      reason: string;
      effectiveUntil?: string;
    }) => updatePlatformSubscriptionOverride(payload.subscriptionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform-admin", "subscriptions"] });
    },
  });

  const handleOverride = async (
    subscription: AdminSubscriptionRecord,
    action: "ACTIVATE" | "DEACTIVATE" | "EXTEND",
  ) => {
    const reason = window.prompt(`${action} ${subscription.id}\nReason:`, "");
    if (!reason?.trim()) return;

    const effectiveUntil =
      action === "EXTEND"
        ? window.prompt(
          "Set an ISO date for the grace extension (for example 2026-12-31T23:59:59.000Z):",
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ) ?? undefined
        : undefined;

    try {
      await overrideMutation.mutateAsync({
        subscriptionId: subscription.id,
        action,
        reason: reason.trim(),
        effectiveUntil,
      });
      pushToast({
        title: "Subscription override updated",
        variant: "success",
      });
    } catch (error) {
      pushToast({
        title: "Override update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Filters / Search Card */}
      <section className={cardClass}>
        <p className="text-xs uppercase tracking-[0.35em] text-[#8b7661]">Subscriptions</p>
        <h1 className="mt-3 font-serif text-3xl font-bold">Manual subscription overrides</h1>
        <div className="mt-6 space-y-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search subscription or restaurant IDs..."
            className="w-full rounded-2xl border border-[#e0d2c3] px-4 py-3 text-sm placeholder-[#a89c8f] transition-all hover:border-[#d7c8b7] focus:border-[#9d8c7a] focus:outline-none focus:ring-2 focus:ring-[#8f5f2f] focus:ring-opacity-20"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <FilterListBox
              label="Access Status"
              options={subscriptionAccessStatusOptions}
              value={accessStatus}
              onChange={setAccessStatus}
              placeholder="Filter by access status"
            />
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-[#8b7661]">Plan Code</label>
              <input
                value={planCode}
                onChange={(event) => setPlanCode(event.target.value)}
                placeholder="Filter by plan code..."
                className="w-full rounded-2xl border border-[#e0d2c3] px-4 py-3 text-sm placeholder-[#a89c8f] transition-all hover:border-[#d7c8b7] focus:border-[#9d8c7a] focus:outline-none focus:ring-2 focus:ring-[#8f5f2f] focus:ring-opacity-20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Subscriptions Table Card */}
      <section className={cardClass}>
        {subscriptions.isLoading ? (
          <div className="space-y-4">
            <div className="h-12 animate-pulse rounded-2xl bg-[#f4efe7]" />
            <div className="h-12 animate-pulse rounded-2xl bg-[#f4efe7]" />
            <div className="h-12 animate-pulse rounded-2xl bg-[#f4efe7]" />
          </div>
        ) : subscriptions.isError || !subscriptions.data ? (
          <div className="rounded-2xl bg-[#fef3f0] p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-[#d84040]" />
              <div>
                <h3 className="font-semibold text-[#d84040]">Failed to load subscriptions</h3>
                <p className="mt-1 text-sm text-[#b84040]">
                  {subscriptions.error instanceof Error ? subscriptions.error.message : "Please try again."}
                </p>
              </div>
            </div>
          </div>
        ) : subscriptions.data.items.length ? (
          <div className="overflow-x-auto rounded-2xl border border-[#f0e6dc] shadow-sm">
            <table className="min-w-full text-left text-sm divide-y divide-[#f0e6dc]">
              <thead className="bg-[#faf6f0]">
                <tr>
                  <th className="py-3 px-4 font-semibold text-[#8b7661] text-left">Plan</th>
                  <th className="py-3 px-4 font-semibold text-[#8b7661] text-left">State</th>
                  <th className="py-3 px-4 font-semibold text-[#8b7661] text-left">Override</th>
                  <th className="py-3 px-4 font-semibold text-[#8b7661] text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {subscriptions.data.items.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className="border-t border-[#f4efe7] transition-colors duration-150 hover:bg-[#f9f5ee] align-top"
                  >
                    <td className="py-4 px-4 min-w-37.5">
                      <p className="font-semibold text-[#2a221c]">{subscription.planSnapshot.name}</p>
                      <p className="text-xs text-[#a89c8f] mt-1">{subscription.planSnapshot.code}</p>
                      <p className="text-sm font-medium text-[#8f5f2f] mt-1">
                        {formatPrice(subscription.planSnapshot.amountMinor / 100)}
                      </p>
                    </td>
                    <td className="py-4 px-4 min-w-30">
                      <p className="font-medium text-[#2a221c]">{subscription.status}</p>
                      <p className="text-xs text-[#a89c8f] mt-1">{subscription.accessStatus}</p>
                    </td>
                    <td className="py-4 px-4 min-w-30">
                      <p className="font-medium text-[#2a221c]">{subscription.adminOverride.mode}</p>
                      <p className="text-xs text-[#a89c8f] mt-1">
                        {subscription.adminOverride.effectiveUntil
                          ? new Date(subscription.adminOverride.effectiveUntil).toLocaleDateString()
                          : "No expiry"}
                      </p>
                    </td>
                    <td className="py-4 px-4 min-w-50">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-50 disabled:opacity-50"
                          disabled={overrideMutation.isPending}
                          onClick={() => void handleOverride(subscription, "ACTIVATE")}
                        >
                          Activate
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[#ffc8c8] bg-[#fff5f5] px-4 py-2 text-xs font-semibold text-[#d84040] transition-all hover:bg-[#ffecec] disabled:opacity-50"
                          disabled={overrideMutation.isPending}
                          onClick={() => void handleOverride(subscription, "DEACTIVATE")}
                        >
                          Deactivate
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[#d7c8b7] px-4 py-2 text-xs font-semibold text-[#2a221c] transition-all hover:bg-[#f4efe7] disabled:opacity-50"
                          disabled={overrideMutation.isPending}
                          onClick={() => void handleOverride(subscription, "EXTEND")}
                        >
                          Extend grace
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#f4efe7] p-4 text-center">
            <p className="text-[#a89c8f]">No subscriptions matched the current filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}
