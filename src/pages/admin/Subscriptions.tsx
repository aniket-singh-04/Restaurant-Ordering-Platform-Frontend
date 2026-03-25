import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useRazorpayCheckout } from "../../hooks/useRazorpayCheckout";
import {
  initiateSubscription,
  useCurrentSubscription,
  useSubscriptionHistory,
  useSubscriptionPlans,
  verifySubscription,
} from "../../features/subscriptions/api";
import { formatPrice } from "../../utils/formatPrice";

const formatMinorAmount = (value?: number) => formatPrice((value ?? 0) / 100);

export default function Subscriptions() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const { openCheckout, loading } = useRazorpayCheckout();
  const plansQuery = useSubscriptionPlans();
  const currentQuery = useCurrentSubscription();
  const historyQuery = useSubscriptionHistory();
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [actionPlanId, setActionPlanId] = useState<string | null>(null);

  const plans = useMemo(
    () => (plansQuery.data ?? []).filter((plan) => plan.billingCycle === billingCycle),
    [billingCycle, plansQuery.data],
  );

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "plans"] }),
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "current"] }),
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "history"] }),
    ]);
  };

  const handlePurchase = async (planId: string) => {
    setActionPlanId(planId);
    try {
      const result = await initiateSubscription(planId);
      const checkoutResult = await openCheckout({
        key: result.checkout.keyId,
        subscription_id: result.checkout.subscriptionId,
        name: result.checkout.name,
        description: result.checkout.description,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: {
          color: "#f97415",
        },
      });

      await verifySubscription({
        recordId: result.subscription.id,
        razorpay_subscription_id:
          checkoutResult.razorpay_subscription_id ?? result.checkout.subscriptionId,
        razorpay_payment_id: checkoutResult.razorpay_payment_id,
        razorpay_signature: checkoutResult.razorpay_signature,
      });

      await refreshAll();
      pushToast({
        title: "Subscription activated",
        description: "Your restaurant plan is now active.",
        variant: "success",
      });
    } catch (error: any) {
      pushToast({
        title: "Subscription checkout incomplete",
        description:
          error?.message ??
          "The purchase did not finish. You can retry again from the pricing page.",
        variant: "warning",
      });
    } finally {
      setActionPlanId(null);
    }
  };

  return (
    <div className="min-h-screen space-y-8 bg-[#fff9f2] text-left">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#3b2f2f]">Subscriptions</h1>
          <p className="mt-1 text-[#6b665f]">
            Choose a recurring plan, view the current subscription, and review billing history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refreshAll()}
          className="inline-flex items-center gap-2 rounded-xl border border-[#ef6820] px-4 py-2 text-sm font-medium text-[#ef6820] transition hover:bg-white"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </header>

      <section className="rounded-3xl border border-[#eedbc8] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              billingCycle === "MONTHLY"
                ? "bg-[#3b2f2f] text-white"
                : "border border-[#e5d5c6] bg-[#fff9f2] text-[#3b2f2f]"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("YEARLY")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              billingCycle === "YEARLY"
                ? "bg-[#3b2f2f] text-white"
                : "border border-[#e5d5c6] bg-[#fff9f2] text-[#3b2f2f]"
            }`}
          >
            Yearly
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-3xl border border-[#f0e3d5] bg-[#fffaf5] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-[#3b2f2f]">{plan.name}</h2>
                  <p className="mt-2 text-sm text-[#6b665f]">{plan.description}</p>
                </div>
                <div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                  {plan.billingCycle}
                </div>
              </div>

              <p className="mt-6 text-3xl font-bold text-[#3b2f2f]">
                {formatMinorAmount(plan.amountMinor)}
              </p>

              <ul className="mt-4 space-y-2 text-sm text-[#5f5146]">
                {plan.features.map((feature) => (
                  <li key={feature} className="rounded-xl bg-white px-4 py-2">
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={loading || actionPlanId === plan.id}
                onClick={() => void handlePurchase(plan.id)}
                className="mt-6 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionPlanId === plan.id ? "Processing..." : "Buy Plan"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-3xl border border-[#eedbc8] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#3b2f2f]">Active Plan</h2>
          {currentQuery.data ? (
            <div className="mt-4 rounded-3xl border border-[#f0e3d5] bg-[#fffaf5] p-5">
              <p className="text-sm text-[#6b665f]">Current plan</p>
              <h3 className="mt-1 text-xl font-semibold text-[#3b2f2f]">
                {currentQuery.data.planSnapshot.name} ({currentQuery.data.planSnapshot.billingCycle})
              </h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[#8d7967]">Status</p>
                  <p className="mt-1 font-medium text-[#3b2f2f]">{currentQuery.data.status}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[#8d7967]">Payment</p>
                  <p className="mt-1 font-medium text-[#3b2f2f]">{currentQuery.data.paymentStatus}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[#8d7967]">Start date</p>
                  <p className="mt-1 font-medium text-[#3b2f2f]">
                    {currentQuery.data.startDate
                      ? new Date(currentQuery.data.startDate).toLocaleDateString()
                      : "Pending"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[#8d7967]">Expiry date</p>
                  <p className="mt-1 font-medium text-[#3b2f2f]">
                    {currentQuery.data.expiryDate
                      ? new Date(currentQuery.data.expiryDate).toLocaleDateString()
                      : "Pending"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-[#d9c1a8] bg-[#fffaf5] px-6 py-8 text-[#6d5c4d]">
              No subscription is active yet.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[#eedbc8] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#3b2f2f]">Subscription History</h2>
          <div className="mt-4 space-y-3">
            {(historyQuery.data ?? []).length > 0 ? (
              historyQuery.data?.map((subscription) => (
                <div
                  key={subscription.id}
                  className="rounded-2xl border border-[#f0e3d5] bg-[#fffaf5] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#3b2f2f]">
                        {subscription.planSnapshot.name} ({subscription.planSnapshot.billingCycle})
                      </p>
                      <p className="mt-1 text-sm text-[#6b665f]">
                        {subscription.createdAt
                          ? new Date(subscription.createdAt).toLocaleString()
                          : "Created recently"}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                      {subscription.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-[#d9c1a8] bg-[#fffaf5] px-6 py-8 text-[#6d5c4d]">
                No subscription history yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
