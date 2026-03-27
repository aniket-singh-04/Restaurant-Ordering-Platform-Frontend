import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useRazorpayCheckout } from "../../hooks/useRazorpayCheckout";
import {
  completeRestaurantPaymentConnection,
  getRestaurantPaymentConnection,
  type RestaurantPaymentConnectionOnboardingPayload,
  startRestaurantPaymentConnection,
} from "../../features/restaurants/api";
import {
  initiateSubscription,
  startTrialSubscription,
  useCurrentSubscription,
  useSubscriptionHistory,
  useSubscriptionPlans,
  verifySubscription,
} from "../../features/subscriptions/api";
import { formatPrice } from "../../utils/formatPrice";

const formatMinorAmount = (value?: number) => formatPrice((value ?? 0) / 100);

const createPaymentConnectionForm = (
  user: { name?: string; email?: string; phone?: string } | null | undefined,
): RestaurantPaymentConnectionOnboardingPayload => ({
  businessType: "partnership",
  businessCategory: "food",
  businessSubcategory: "restaurant",
  customerFacingBusinessName: "",
  businessAddress: {
    street1: "",
    street2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
  },
  legalInfo: {
    pan: "",
    gst: "",
  },
  bankAccount: {
    accountNumber: "",
    ifscCode: "",
    beneficiaryName: user?.name ?? "",
  },
  stakeholder: {
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    pan: "",
    percentageOwnership: 100,
    address: {
      street1: "",
      street2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "IN",
    },
  },
  acceptTerms: true,
});

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
  const [trialStarting, setTrialStarting] = useState(false);
  const [paymentConnectLoading, setPaymentConnectLoading] = useState<null | "start" | "complete">(null);
  const [paymentConnectionForm, setPaymentConnectionForm] =
    useState<RestaurantPaymentConnectionOnboardingPayload>(() =>
      createPaymentConnectionForm(user),
    );

  useEffect(() => {
    setPaymentConnectionForm(createPaymentConnectionForm(user));
  }, [user?.name, user?.email, user?.phone]);

  const paymentConnectionQuery = useQuery({
    queryKey: ["restaurants", "paymentConnection", user?.restroId],
    enabled: Boolean(user?.restroId),
    queryFn: async () => getRestaurantPaymentConnection(user?.restroId ?? ""),
  });

  const plans = useMemo(
    () => (plansQuery.data ?? []).filter((plan) => plan.billingCycle === billingCycle),
    [billingCycle, plansQuery.data],
  );

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "plans"] }),
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "current"] }),
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "history"] }),
      queryClient.invalidateQueries({ queryKey: ["restaurants", "paymentConnection"] }),
    ]);
  };

  const handleStartTrial = async () => {
    setTrialStarting(true);
    try {
      await startTrialSubscription();
      await refreshAll();
      pushToast({
        title: "Free trial activated",
        description: "Your restaurant now has 7-day trial access.",
        variant: "success",
      });
    } catch (error: any) {
      pushToast({
        title: "Trial could not be started",
        description: error?.message ?? "Please try again.",
        variant: "error",
      });
    } finally {
      setTrialStarting(false);
    }
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

  const handlePaymentConnection = async (mode: "start" | "complete") => {
    if (!user?.restroId) {
      pushToast({
        title: "Restaurant context missing",
        description: "Create or open a restaurant account first.",
        variant: "warning",
      });
      return;
    }

    setPaymentConnectLoading(mode);
    try {
      const response =
        mode === "start"
          ? await startRestaurantPaymentConnection(user.restroId, paymentConnectionForm)
          : await completeRestaurantPaymentConnection(user.restroId);

      await refreshAll();
      pushToast({
        title: mode === "start" ? "Onboarding prepared" : "Payouts enabled",
        description:
          mode === "start"
            ? response.onboardingLink || "Open the connection card to continue onboarding."
            : "Online food-order payments can now route to the restaurant payout account.",
        variant: "success",
      });
    } catch (error: any) {
      pushToast({
        title: "Payment connection update failed",
        description: error?.message ?? "Please try again.",
        variant: "error",
      });
    } finally {
      setPaymentConnectLoading(null);
    }
  };

  const updateForm = (
    updater: (current: RestaurantPaymentConnectionOnboardingPayload) => RestaurantPaymentConnectionOnboardingPayload,
  ) => {
    setPaymentConnectionForm((current) => updater(current));
  };

  return (
    <div className="min-h-screen bg-[#fff9f2] text-left">
      <header className="border-b border-[#eedbc8] bg-white shadow-xs sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-2 sm:px-3 py-2 sm:py-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-serif text-4xl font-bold text-[#3b2f2f]">Subscriptions</h1>
              <p className="mt-2 text-sm text-[#6b665f]">
                Choose a recurring plan, view the current subscription, and review billing history.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void refreshAll()}
              className="w-fit cursor-pointer inline-flex items-center gap-2 rounded-xl border border-[#ef6820] px-4 py-2.5 text-sm font-medium text-[#ef6820] transition hover:bg-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        <section className="rounded-2xl border border-[#eedbc8] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#3b2f2f]">Access Status</h2>
              <p className="mt-2 text-sm text-[#6b665f]">
                Start a free trial, buy a plan, and connect the restaurant payout account.
              </p>
            </div>

            <button
              type="button"
              disabled={trialStarting}
              onClick={() => void handleStartTrial()}
              className="h-fit w-fit cursor-pointer rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {trialStarting ? "Starting trial..." : "Start 7-Day Trial"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-linear-to-br from-[#fffaf5] to-[#fff5ed] px-6 py-5 border border-[#f0e3d5]">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Subscription Kind</p>
              <p className="mt-3 text-lg font-bold text-[#3b2f2f]">
                {currentQuery.data?.kind ?? "—"}
              </p>
            </div>
            <div className="rounded-xl bg-linear-to-br from-[#fffaf5] to-[#fff5ed] px-6 py-5 border border-[#f0e3d5]">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Access Status</p>
              <p className="mt-3 text-lg font-bold text-[#3b2f2f]">
                {currentQuery.data?.accessStatus ?? "BLOCKED"}
              </p>
            </div>
            <div className="rounded-xl bg-linear-to-br from-[#fffaf5] to-[#fff5ed] px-6 py-5 border border-[#f0e3d5]">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Grace Period Ends</p>
              <p className="mt-3 text-lg font-bold text-[#3b2f2f]">
                {currentQuery.data?.graceEndsAt
                  ? new Date(currentQuery.data.graceEndsAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#eedbc8] bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#3b2f2f]">Pricing Plans</h2>
            <p className="mt-2 text-sm text-[#6b665f]">Select your preferred billing cycle and subscribe</p>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <button
              type="button"
              onClick={() => setBillingCycle("MONTHLY")}
              className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold transition ${billingCycle === "MONTHLY"
                ? "bg-[#3b2f2f] text-white"
                : "border border-[#e5d5c6] bg-white text-[#3b2f2f] hover:bg-[#fff9f2]"
                }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("YEARLY")}
              className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold transition ${billingCycle === "YEARLY"
                ? "bg-[#3b2f2f] text-white"
                : "border border-[#e5d5c6] bg-white text-[#3b2f2f] hover:bg-[#fff9f2]"
                }`}
            >
              Yearly
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className="rounded-2xl border border-[#f0e3d5] bg-linear-to-br from-[#fffaf5] to-[#fff5ed] p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#3b2f2f]">{plan.name}</h3>
                    <p className="mt-2 text-sm text-[#6b665f]">{plan.description}</p>
                  </div>
                  <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 whitespace-nowrap">
                    {plan.billingCycle}
                  </span>
                </div>

                <div className="mb-6 py-4 border-y border-y-[#f0e3d5]">
                  <p className="text-xs text-[#8d7967] uppercase font-semibold">Price</p>
                  <p className="mt-2 text-3xl font-bold text-[#3b2f2f]">
                    {formatMinorAmount(plan.amountMinor)}
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="rounded-lg bg-white px-4 py-2.5 text-sm text-[#5f5146] border border-[#f0e3d5]">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={loading || actionPlanId === plan.id}
                  onClick={() => void handlePurchase(plan.id)}
                  className="w-full cursor-pointer rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionPlanId === plan.id ? "Processing..." : "Subscribe Now"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#eedbc8] bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#3b2f2f]">Current Subscription</h2>
              {currentQuery.data ? (
                <div className="mt-6 rounded-xl border border-[#f0e3d5] bg-[#fffaf5] p-6">
                  <div className="mb-6 pb-6 border-b border-[#f0e3d5]">
                    <p className="text-xs uppercase font-semibold tracking-widest text-[#8d7967]">Active Plan</p>
                    <h3 className="mt-3 text-2xl font-bold text-[#3b2f2f]">
                      {currentQuery.data?.planSnapshot ? (
                        <>
                          {currentQuery.data.planSnapshot.name}
                          <span className="text-base font-normal text-[#6b665f] ml-2">
                            ({currentQuery.data.planSnapshot.billingCycle})
                          </span>
                        </>
                      ) : (
                        "No active plan"
                      )}
                    </h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-white p-4 border border-[#f0e3d5]">
                      <p className="text-xs uppercase font-semibold tracking-widest text-[#8d7967]">Status</p>
                      <p className="mt-2 font-semibold text-[#3b2f2f]">{currentQuery.data.status}</p>
                    </div>
                    <div className="rounded-lg bg-white p-4 border border-[#f0e3d5]">
                      <p className="text-xs uppercase font-semibold tracking-widest text-[#8d7967]">Access</p>
                      <p className="mt-2 font-semibold text-[#3b2f2f]">
                        {currentQuery.data.accessStatus ?? "PENDING"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-4 border border-[#f0e3d5]">
                      <p className="text-xs uppercase font-semibold tracking-widest text-[#8d7967]">Payment Status</p>
                      <p className="mt-2 font-semibold text-[#3b2f2f]">{currentQuery.data.paymentStatus}</p>
                    </div>
                    <div className="rounded-lg bg-white p-4 border border-[#f0e3d5]">
                      <p className="text-xs uppercase font-semibold tracking-widest text-[#8d7967]">Started</p>
                      <p className="mt-2 font-semibold text-[#3b2f2f]">
                        {currentQuery.data.startDate
                          ? new Date(currentQuery.data.startDate).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-4 border border-[#f0e3d5]">
                      <p className="text-xs uppercase font-semibold tracking-widest text-[#8d7967]">Expires</p>
                      <p className="mt-2 font-semibold text-[#3b2f2f]">
                        {currentQuery.data.expiryDate
                          ? new Date(currentQuery.data.expiryDate).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-4 border border-[#f0e3d5]">
                      <p className="text-xs uppercase font-semibold tracking-widest text-[#8d7967]">Trial Ends</p>
                      <p className="mt-2 font-semibold text-[#3b2f2f]">
                        {currentQuery.data.trialEndsAt
                          ? new Date(currentQuery.data.trialEndsAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-4 border border-[#f0e3d5]">
                      <p className="text-xs uppercase font-semibold tracking-widest text-[#8d7967]">Grace Ends</p>
                      <p className="mt-2 font-semibold text-[#3b2f2f]">
                        {currentQuery.data.graceEndsAt
                          ? new Date(currentQuery.data.graceEndsAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border-2 border-dashed border-[#d9c1a8] bg-[#fffaf5] px-6 py-12 text-center text-[#6d5c4d]">
                  <p className="font-medium">No subscription is active yet.</p>
                  <p className="mt-2 text-sm">Start a free trial or purchase a plan above.</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#eedbc8] bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#3b2f2f]">Payment Connection</h2>
              <div className="mt-6 rounded-xl border border-[#f0e3d5] bg-[#fffaf5] p-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-white p-4 border border-[#f0e3d5]">
                    <p className="text-xs uppercase font-semibold tracking-widest text-[#8d7967]">Status</p>
                    <p className="mt-2 font-semibold text-[#3b2f2f]">
                      {paymentConnectionQuery.data?.status ?? "NOT_CONNECTED"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-4 border border-[#f0e3d5]">
                    <p className="text-xs uppercase font-semibold tracking-widest text-[#8d7967]">Activation</p>
                    <p className="mt-2 font-semibold text-[#3b2f2f]">
                      {paymentConnectionQuery.data?.activationStatus ?? "Not submitted"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 border border-[#f0e3d5]">
                  <p className="text-xs uppercase font-semibold tracking-widest text-[#8d7967]">Route Account</p>
                  <p className="mt-2 break-all font-mono text-sm text-[#3b2f2f]">
                    {paymentConnectionQuery.data?.routeAccountId ?? "Not created"}
                  </p>
                </div>

                {(paymentConnectionQuery.data?.requirements ?? []).length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
                    <p className="text-sm font-semibold text-amber-900">Documentation needed:</p>
                    <ul className="mt-3 space-y-2 text-sm text-amber-800">
                      {paymentConnectionQuery.data?.requirements?.map((requirement) => (
                        <li key={requirement} className="flex items-start gap-2">
                          <span className="text-amber-600 mt-1">•</span>
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t border-[#f0e3d5]">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      disabled={paymentConnectLoading !== null || !user?.restroId}
                      onClick={() => void handlePaymentConnection("start")}
                      className="flex-1 cursor-pointer rounded-xl border-2 border-[#ef6820] px-4 py-2.5 text-sm font-semibold text-[#ef6820] transition hover:bg-orange-50 disabled:opacity-60"
                    >
                      {paymentConnectLoading === "start"
                        ? "Submitting..."
                        : "Submit Onboarding"}
                    </button>
                    <button
                      type="button"
                      disabled={paymentConnectLoading !== null || !user?.restroId}
                      onClick={() => void handlePaymentConnection("complete")}
                      className="flex-1 cursor-pointer rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {paymentConnectLoading === "complete"
                        ? "Syncing..."
                        : "Sync Status"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eedbc8] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#3b2f2f]">Subscription History</h2>
            <div className="mt-6 space-y-3">
              {(historyQuery.data ?? []).length > 0 ? (
                historyQuery.data?.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="rounded-xl border border-[#f0e3d5] bg-[#fffaf5] px-6 py-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[#3b2f2f]">
                          {subscription.planSnapshot.name}
                          <span className="text-sm font-normal text-[#6b665f] ml-2">
                            ({subscription.planSnapshot.billingCycle})
                          </span>
                        </p>
                        <p className="mt-2 text-sm text-[#6b665f]">
                          {subscription.createdAt
                            ? new Date(subscription.createdAt).toLocaleString()
                            : "Created recently"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          {subscription.status}
                        </span>
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                          {subscription.kind ?? "PAID"} / {subscription.accessStatus ?? "PENDING"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border-2 border-dashed border-[#d9c1a8] bg-[#fffaf5] px-6 py-12 text-center text-[#6d5c4d]">
                  <p className="font-medium">No subscription history.</p>
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-[#eedbc8] bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#3b2f2f]">Razorpay Onboarding Details</h2>
          <p className="mt-2 text-sm text-[#6b665f]">Complete all required information for payment processing</p>

          <div className="mt-8 rounded-xl border border-[#f0e3d5] bg-[#fffaf5] p-6 space-y-8">
            {/* Business Information */}
            <div>
              <h3 className="text-lg font-bold text-[#3b2f2f] mb-4">Business Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Business Type</label>
                  <input
                    value={paymentConnectionForm.businessType}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        businessType: event.target.value,
                      }))
                    }
                    placeholder="e.g., partnership"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Business Name</label>
                  <input
                    value={paymentConnectionForm.customerFacingBusinessName ?? ""}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        customerFacingBusinessName: event.target.value,
                      }))
                    }
                    placeholder="Customer-facing name"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Category</label>
                  <input
                    value={paymentConnectionForm.businessCategory}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        businessCategory: event.target.value,
                      }))
                    }
                    placeholder="e.g., food"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Subcategory</label>
                  <input
                    value={paymentConnectionForm.businessSubcategory}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        businessSubcategory: event.target.value,
                      }))
                    }
                    placeholder="e.g., restaurant"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
            </div>

            {/* Business Address */}
            <div className="border-t border-[#f0e3d5] pt-8">
              <h3 className="text-lg font-bold text-[#3b2f2f] mb-4">Business Address</h3>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Street Address</label>
                <input
                  value={paymentConnectionForm.businessAddress.street1}
                  onChange={(event) =>
                    updateForm((current) => ({
                      ...current,
                      businessAddress: {
                        ...current.businessAddress,
                        street1: event.target.value,
                      },
                    }))
                  }
                  placeholder="Registered business address"
                  className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">City</label>
                  <input
                    value={paymentConnectionForm.businessAddress.city}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        businessAddress: {
                          ...current.businessAddress,
                          city: event.target.value,
                        },
                      }))
                    }
                    placeholder="City"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">State</label>
                  <input
                    value={paymentConnectionForm.businessAddress.state}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        businessAddress: {
                          ...current.businessAddress,
                          state: event.target.value,
                        },
                      }))
                    }
                    placeholder="State"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Postal Code</label>
                  <input
                    value={paymentConnectionForm.businessAddress.postalCode}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        businessAddress: {
                          ...current.businessAddress,
                          postalCode: event.target.value,
                        },
                      }))
                    }
                    placeholder="PIN code"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
            </div>

            {/* Legal Information */}
            <div className="border-t border-[#f0e3d5] pt-8">
              <h3 className="text-lg font-bold text-[#3b2f2f] mb-4">Legal Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Business PAN</label>
                  <input
                    value={paymentConnectionForm.legalInfo.pan}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        legalInfo: {
                          ...current.legalInfo,
                          pan: event.target.value,
                        },
                      }))
                    }
                    placeholder="PAN number"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">GST Number (Optional)</label>
                  <input
                    value={paymentConnectionForm.legalInfo.gst ?? ""}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        legalInfo: {
                          ...current.legalInfo,
                          gst: event.target.value,
                        },
                      }))
                    }
                    placeholder="GST number"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
            </div>

            {/* Bank Account */}
            <div className="border-t border-[#f0e3d5] pt-8">
              <h3 className="text-lg font-bold text-[#3b2f2f] mb-4">Settlement Bank Account</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Account Number</label>
                  <input
                    value={paymentConnectionForm.bankAccount.accountNumber}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        bankAccount: {
                          ...current.bankAccount,
                          accountNumber: event.target.value,
                        },
                      }))
                    }
                    placeholder="Account number"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">IFSC Code</label>
                  <input
                    value={paymentConnectionForm.bankAccount.ifscCode}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        bankAccount: {
                          ...current.bankAccount,
                          ifscCode: event.target.value,
                        },
                      }))
                    }
                    placeholder="IFSC"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Beneficiary Name</label>
                  <input
                    value={paymentConnectionForm.bankAccount.beneficiaryName}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        bankAccount: {
                          ...current.bankAccount,
                          beneficiaryName: event.target.value,
                        },
                      }))
                    }
                    placeholder="Account holder name"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div className="border-t border-[#f0e3d5] pt-8">
              <h3 className="text-lg font-bold text-[#3b2f2f] mb-4">Business Owner / Stakeholder</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Full Name</label>
                  <input
                    value={paymentConnectionForm.stakeholder.name}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        stakeholder: {
                          ...current.stakeholder,
                          name: event.target.value,
                        },
                      }))
                    }
                    placeholder="Owner name"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Email</label>
                  <input
                    value={paymentConnectionForm.stakeholder.email}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        stakeholder: {
                          ...current.stakeholder,
                          email: event.target.value,
                        },
                      }))
                    }
                    placeholder="Email address"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Phone Number</label>
                  <input
                    value={paymentConnectionForm.stakeholder.phone}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        stakeholder: {
                          ...current.stakeholder,
                          phone: event.target.value,
                        },
                      }))
                    }
                    placeholder="Phone number"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">PAN Number</label>
                  <input
                    value={paymentConnectionForm.stakeholder.pan}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        stakeholder: {
                          ...current.stakeholder,
                          pan: event.target.value,
                        },
                      }))
                    }
                    placeholder="PAN"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Ownership %</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={paymentConnectionForm.stakeholder.percentageOwnership}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        stakeholder: {
                          ...current.stakeholder,
                          percentageOwnership: Number(event.target.value || 0),
                        },
                      }))
                    }
                    placeholder="0-100"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
            </div>

            {/* Owner Address */}
            <div className="border-t border-[#f0e3d5] pt-8">
              <h3 className="text-lg font-bold text-[#3b2f2f] mb-4">Owner Residential Address</h3>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Street Address</label>
                <input
                  value={paymentConnectionForm.stakeholder.address.street1}
                  onChange={(event) =>
                    updateForm((current) => ({
                      ...current,
                      stakeholder: {
                        ...current.stakeholder,
                        address: {
                          ...current.stakeholder.address,
                          street1: event.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Residential address"
                  className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">City</label>
                  <input
                    value={paymentConnectionForm.stakeholder.address.city}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        stakeholder: {
                          ...current.stakeholder,
                          address: {
                            ...current.stakeholder.address,
                            city: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="City"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">State</label>
                  <input
                    value={paymentConnectionForm.stakeholder.address.state}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        stakeholder: {
                          ...current.stakeholder,
                          address: {
                            ...current.stakeholder.address,
                            state: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="State"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Postal Code</label>
                  <input
                    value={paymentConnectionForm.stakeholder.address.postalCode}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        stakeholder: {
                          ...current.stakeholder,
                          address: {
                            ...current.stakeholder.address,
                            postalCode: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="PIN code"
                    className="mt-2 w-full rounded-lg border border-[#e5d5c6] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-[#f0e3d5] pt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={paymentConnectLoading !== null || !user?.restroId}
                onClick={() => void handlePaymentConnection("start")}
                className="flex-1 cursor-pointer rounded-lg border-2 border-[#ef6820] px-6 py-3 text-sm font-semibold text-[#ef6820] transition hover:bg-orange-50 disabled:opacity-60"
              >
                {paymentConnectLoading === "start"
                  ? "Submitting..."
                  : "Submit Onboarding Form"}
              </button>
              <button
                type="button"
                disabled={paymentConnectLoading !== null || !user?.restroId}
                onClick={() => void handlePaymentConnection("complete")}
                className="flex-1 cursor-pointer rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {paymentConnectLoading === "complete"
                  ? "Syncing Status..."
                  : "Sync Razorpay Status"}
              </button>
            </div>

            <p className="border-t border-[#f0e3d5] pt-6 text-sm text-[#6b665f]">
              Subscription charges go to the platform account. Food-order payments use the Route account and are enabled once Razorpay activates this account.
            </p>
          </div>
        </section>
      </main>

    </div>
  );
}
