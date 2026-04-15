import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useRazorpayCheckout } from "../../hooks/useRazorpayCheckout";
import {
  completeRestaurantPaymentConnection,
  getRestaurantPaymentConnection,
  manageRestaurantPaymentConnectionLifecycle,
  type PaymentConnectionLifecycleAction,
  previewRestaurantPaymentConnection,
  type PaymentConnectionPreview,
  type RestaurantPaymentConnectionRequirement,
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
import {
  getApiErrorMessage,
  getApiFieldErrors,
  getApiFormErrors,
  getApiRequestId,
} from "../../utils/apiErrorHelpers";
import { ApiError } from "../../utils/api";
import { formatPrice } from "../../utils/formatPrice";
import {
  buildPaymentConnectionPayload,
  hydratePaymentConnectionForm,
  PAYMENT_CONNECTION_BUSINESS_TYPE_OPTIONS,
  sanitizePaymentConnectionForm,
  validatePaymentConnectionForm,
} from "../../features/restaurants/paymentConnectionForm";

const formatMinorAmount = (value?: number) => formatPrice((value ?? 0) / 100);

const PAYMENT_CONNECTION_REQUIREMENT_FIELD_MAP: Record<
  string,
  { formField: string; label: string }
> = {
  "profile.addresses.registered.street": {
    formField: "businessAddress.street1",
    label: "Business address",
  },
  "profile.addresses.registered.street1": {
    formField: "businessAddress.street1",
    label: "Business address",
  },
  "profile.addresses.registered.street2": {
    formField: "businessAddress.street2",
    label: "Business address line 2",
  },
  "profile.addresses.registered.city": {
    formField: "businessAddress.city",
    label: "Business city",
  },
  "profile.addresses.registered.state": {
    formField: "businessAddress.state",
    label: "Business state",
  },
  "profile.addresses.registered.postal_code": {
    formField: "businessAddress.postalCode",
    label: "Business postal code",
  },
  "profile.addresses.registered.country": {
    formField: "businessAddress.country",
    label: "Business country",
  },
  "legal_info.pan": {
    formField: "legalInfo.pan",
    label: "Business PAN",
  },
  "legal_info.gst": {
    formField: "legalInfo.gst",
    label: "GST number",
  },
  "kyc.pan": {
    formField: "stakeholder.pan",
    label: "Stakeholder PAN",
  },
  name: {
    formField: "stakeholder.name",
    label: "Stakeholder name",
  },
  "phone.primary": {
    formField: "stakeholder.phone",
    label: "Stakeholder phone",
  },
  "addresses.residential.street": {
    formField: "stakeholder.address.street",
    label: "Stakeholder street address",
  },
  "addresses.residential.city": {
    formField: "stakeholder.address.city",
    label: "Stakeholder city",
  },
  "addresses.residential.state": {
    formField: "stakeholder.address.state",
    label: "Stakeholder state",
  },
  "addresses.residential.postal_code": {
    formField: "stakeholder.address.postalCode",
    label: "Stakeholder postal code",
  },
  "addresses.residential.country": {
    formField: "stakeholder.address.country",
    label: "Stakeholder country",
  },
  "settlements.account_number": {
    formField: "bankAccount.accountNumber",
    label: "Settlement account number",
  },
  "settlements.ifsc": {
    formField: "bankAccount.ifscCode",
    label: "Settlement IFSC code",
  },
  "settlements.ifsc_code": {
    formField: "bankAccount.ifscCode",
    label: "Settlement IFSC code",
  },
  "settlements.beneficiary_name": {
    formField: "bankAccount.beneficiaryName",
    label: "Settlement beneficiary name",
  },
};

const getPaymentConnectionRequirementFieldConfig = (
  fieldReference?: string,
) => (fieldReference ? PAYMENT_CONNECTION_REQUIREMENT_FIELD_MAP[fieldReference] ?? null : null);

const formatRequirementCode = (value?: string) =>
  value
    ? value
        .split("_")
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ")
    : "Unspecified";

const isRequirementResolvableInForm = (
  requirement: RestaurantPaymentConnectionRequirement,
) => {
  const fieldConfig = getPaymentConnectionRequirementFieldConfig(
    requirement.field_reference,
  );

  if (!fieldConfig) {
    return false;
  }

  return (requirement.reason_code ?? "").toLowerCase() !== "document_missing";
};

const getPaymentConnectionSyncToastConfig = (paymentConnection: {
  status?: string | null;
  lifecycleStatus?: string | null;
  activationStatus?: string | null;
  requirements?: RestaurantPaymentConnectionRequirement[];
}) => {
  const activationStatus = paymentConnection.activationStatus?.toLowerCase() ?? "";
  const isActivated =
    paymentConnection.status === "ACTIVE" || activationStatus === "activated";
  const isLifecycleInactive = paymentConnection.lifecycleStatus === "INACTIVE";

  if (isLifecycleInactive) {
    return {
      title: "Route connection is inactive",
      description:
        "Razorpay status synced, but this restaurant has locally paused the Route connection. Reactivate it before taking online payouts.",
      variant: "warning" as const,
    };
  }

  if (isActivated) {
    return {
      title: "Payouts enabled",
      description:
        "Online food-order payments can now route to the restaurant payout account.",
      variant: "success" as const,
    };
  }

  if (activationStatus === "needs_clarification") {
    return {
      title: "Razorpay needs clarification",
      description:
        (paymentConnection.requirements ?? []).length > 0
          ? "Status synced. Review the documentation items above before payouts can be enabled."
          : "Status synced. Razorpay still needs clarification before payouts can be enabled.",
      variant: "warning" as const,
    };
  }

  return {
    title: "Route status synced",
    description:
      "Razorpay has not activated this account yet. Online food-order payouts remain unavailable until activation completes.",
    variant: "warning" as const,
  };
};

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
  const [paymentConnectLoading, setPaymentConnectLoading] = useState<
    null | "preview" | "start" | "complete"
  >(null);
  const [paymentConnectionLifecycleLoading, setPaymentConnectionLifecycleLoading] =
    useState<PaymentConnectionLifecycleAction | null>(null);
  const [paymentConnectionErrors, setPaymentConnectionErrors] = useState<Record<string, string>>({});
  const [paymentConnectionFormMessages, setPaymentConnectionFormMessages] = useState<string[]>([]);
  const [paymentConnectionRequestId, setPaymentConnectionRequestId] = useState<string | null>(null);
  const [paymentConnectionPreviewState, setPaymentConnectionPreviewState] =
    useState<PaymentConnectionPreview | null>(null);
  const [reinitiateReason, setReinitiateReason] = useState("");
  const lastHydratedPaymentConnectionKeyRef = useRef<string | null>(null);
  const [paymentConnectionForm, setPaymentConnectionForm] =
    useState<RestaurantPaymentConnectionOnboardingPayload>(() =>
      hydratePaymentConnectionForm(user),
    );
  const canManageBilling = user?.role === "ADMIN" || user?.role === "RESTRO_OWNER";

  useEffect(() => {
    lastHydratedPaymentConnectionKeyRef.current = null;
    setPaymentConnectionForm(hydratePaymentConnectionForm(user));
    setPaymentConnectionErrors({});
    setPaymentConnectionFormMessages([]);
    setPaymentConnectionRequestId(null);
    setPaymentConnectionPreviewState(null);
    setReinitiateReason("");
  }, [user?.restroId, user?.name, user?.email, user?.phone]);

  const paymentConnectionQuery = useQuery({
    queryKey: ["restaurants", "paymentConnection", user?.restroId],
    enabled: Boolean(user?.restroId),
    queryFn: async () => getRestaurantPaymentConnection(user?.restroId ?? ""),
  });

  useEffect(() => {
    const savedOnboardingPayload = paymentConnectionQuery.data?.savedOnboardingPayload;
    if (!savedOnboardingPayload) {
      return;
    }

    const hydrationKey = [
      paymentConnectionQuery.data?.routeAccountId ?? "no-account",
      paymentConnectionQuery.data?.lastSubmittedAt ?? "no-submission",
    ].join(":");

    if (lastHydratedPaymentConnectionKeyRef.current === hydrationKey) {
      return;
    }

    lastHydratedPaymentConnectionKeyRef.current = hydrationKey;
    setPaymentConnectionForm(
      hydratePaymentConnectionForm(user, savedOnboardingPayload),
    );
    setPaymentConnectionErrors({});
    setPaymentConnectionFormMessages([]);
    setPaymentConnectionRequestId(null);
    setPaymentConnectionPreviewState(null);
    setReinitiateReason("");
  }, [
    paymentConnectionQuery.data?.routeAccountId,
    paymentConnectionQuery.data?.lastSubmittedAt,
    paymentConnectionQuery.data?.savedOnboardingPayload,
    user,
  ]);

  const plans = useMemo(
    () => (plansQuery.data ?? []).filter((plan) => plan.billingCycle === billingCycle),
    [billingCycle, plansQuery.data],
  );
  const isProprietorship = paymentConnectionForm.businessType === "proprietorship";
  const businessPanLabel = isProprietorship ? "Proprietor PAN (Optional)" : "Business PAN";
  const businessPanHelperText = isProprietorship
    ? "Leave this blank to reuse the proprietor PAN from the stakeholder section."
    : "Enter the partnership firm's PAN used for business KYC.";

  const paymentConnectionSummaryMessages = useMemo(
    () =>
      Array.from(
        new Set([
          ...paymentConnectionFormMessages,
          ...Object.values(paymentConnectionErrors),
        ]),
      ),
    [paymentConnectionErrors, paymentConnectionFormMessages],
  );

  const paymentConnectionRequirementFieldHints = useMemo(
    () =>
      new Set(
        (paymentConnectionQuery.data?.requirements ?? [])
          .filter((requirement) => isRequirementResolvableInForm(requirement))
          .flatMap((requirement) => {
            const fieldConfig = getPaymentConnectionRequirementFieldConfig(
              requirement.field_reference,
            );
            return fieldConfig ? [fieldConfig.formField] : [];
          }),
      ),
    [paymentConnectionQuery.data?.requirements],
  );

  const getPaymentConnectionFieldError = (field: string) => paymentConnectionErrors[field];

  const getPaymentConnectionInputClass = (field: string) => {
    const hasError = Boolean(getPaymentConnectionFieldError(field));
    const hasClarificationHint = paymentConnectionRequirementFieldHints.has(field);

    return `mt-2 w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
      hasError
        ? "border-red-300 focus:ring-red-200"
        : hasClarificationHint
          ? "border-amber-300 bg-amber-50 focus:ring-amber-200"
          : "border-[#e5d5c6] focus:ring-orange-400"
    }`;
  };

  const getPaymentConnectionReadonlyClass = (field?: string) =>
    `mt-2 w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none ${
      field && getPaymentConnectionFieldError(field)
        ? "border-red-300 bg-red-50 text-red-900"
        : "border-[#f0e3d5] bg-[#fffaf5] text-[#5f5146]"
    }`;

  const paymentConnectionLockedFields = useMemo(
    () => new Set(paymentConnectionQuery.data?.lockedFields ?? []),
    [paymentConnectionQuery.data?.lockedFields],
  );

  const isPaymentConnectionFieldLocked = (field: string) =>
    paymentConnectionLockedFields.has(field);

  const isPaymentConnectionBusy =
    paymentConnectLoading !== null || paymentConnectionLifecycleLoading !== null;
  const paymentConnectionLifecycleStatus =
    paymentConnectionQuery.data?.lifecycleStatus ?? "ENABLED";
  const hasLinkedRouteAccount = Boolean(paymentConnectionQuery.data?.routeAccountId);
  const isPaymentConnectionInactive =
    paymentConnectionLifecycleStatus === "INACTIVE";

  const renderPaymentConnectionFieldError = (field: string) => {
    const message = getPaymentConnectionFieldError(field);
    return message ? <p className="mt-2 text-sm text-red-600">{message}</p> : null;
  };

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "plans"] }),
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "current"] }),
      queryClient.invalidateQueries({ queryKey: ["subscriptions", "history"] }),
      queryClient.invalidateQueries({ queryKey: ["restaurants", "paymentConnection"] }),
    ]);
  };

  const handleStartTrial = async () => {
    if (!canManageBilling) {
      pushToast({
        title: "Access restricted",
        description: "Only restaurant owners and admins can manage billing.",
        variant: "warning",
      });
      return;
    }

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
        description: getApiErrorMessage(error, "Please try again."),
        variant: "error",
      });
    } finally {
      setTrialStarting(false);
    }
  };

  const handlePurchase = async (planId: string) => {
    if (!canManageBilling) {
      pushToast({
        title: "Access restricted",
        description: "Only restaurant owners and admins can manage billing.",
        variant: "warning",
      });
      return;
    }

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
          getApiErrorMessage(
            error,
            "The purchase did not finish. You can retry again from the pricing page.",
          ) ??
          "The purchase did not finish. You can retry again from the pricing page.",
        variant: "warning",
      });
    } finally {
      setActionPlanId(null);
    }
  };

  const extractPreviewFromError = (error: unknown): PaymentConnectionPreview | null => {
    if (!(error instanceof ApiError) || !error.details || typeof error.details !== "object") {
      return null;
    }

    const preview = (error.details as { details?: Partial<PaymentConnectionPreview> }).details;
    if (
      !preview ||
      typeof preview !== "object" ||
      typeof preview.mode !== "string" ||
      typeof preview.confirmationToken !== "string"
    ) {
      return null;
    }

    return {
      mode: preview.mode === "REINITIATE" ? "REINITIATE" : "PATCH",
      changedFields: Array.isArray(preview.changedFields) ? preview.changedFields : [],
      immutableFields: Array.isArray(preview.immutableFields) ? preview.immutableFields : [],
      warnings: Array.isArray(preview.warnings) ? preview.warnings : [],
      providerLockWarnings: Array.isArray(preview.providerLockWarnings)
        ? preview.providerLockWarnings
        : [],
      requiresConfirmation: Boolean(preview.requiresConfirmation),
      confirmationToken: preview.confirmationToken,
      confirmationHash: typeof preview.confirmationHash === "string" ? preview.confirmationHash : "",
      confirmationExpiresAt:
        typeof preview.confirmationExpiresAt === "string"
          ? preview.confirmationExpiresAt
          : new Date().toISOString(),
    };
  };

  const applyPaymentConnectionErrorState = (error: unknown) => {
    const fieldErrors = getApiFieldErrors(error);
    const formErrors = getApiFormErrors(error);
    const requestId = getApiRequestId(error);
    const preview = extractPreviewFromError(error);

    setPaymentConnectionErrors(fieldErrors);
    setPaymentConnectionFormMessages(formErrors);
    setPaymentConnectionRequestId(requestId ?? null);

    if (preview) {
      setPaymentConnectionPreviewState(preview);
    }

    return {
      fieldErrors,
      formErrors,
    };
  };

  const handlePaymentConnection = async (mode: "preview" | "complete") => {
    if (!canManageBilling) {
      pushToast({
        title: "Access restricted",
        description: "Only restaurant owners and admins can manage payment onboarding.",
        variant: "warning",
      });
      return;
    }

    if (!user?.restroId) {
      pushToast({
        title: "Restaurant context missing",
        description: "Create or open a restaurant account first.",
        variant: "warning",
      });
      return;
    }

    let sanitizedPaymentConnectionForm = paymentConnectionForm;

    if (mode === "preview") {
      const validationResult = validatePaymentConnectionForm(paymentConnectionForm);
      sanitizedPaymentConnectionForm = validationResult.sanitizedForm;
      setPaymentConnectionForm(validationResult.sanitizedForm);

      if (Object.keys(validationResult.errors).length) {
        setPaymentConnectionErrors(validationResult.errors);
        setPaymentConnectionFormMessages([]);
        setPaymentConnectionRequestId(null);
        pushToast({
          title: "Complete required onboarding details",
          description:
            Object.values(validationResult.errors)[0] ?? "Please review the onboarding form.",
          variant: "warning",
        });
        return;
      }
    }

    setPaymentConnectionErrors({});
    setPaymentConnectionFormMessages([]);
    setPaymentConnectionRequestId(null);
    if (mode === "preview") {
      setPaymentConnectionPreviewState(null);
    }
    setPaymentConnectLoading(mode);
    try {
      if (mode === "preview") {
        const response = await previewRestaurantPaymentConnection(
          user.restroId,
          buildPaymentConnectionPayload(sanitizedPaymentConnectionForm),
        );
        setPaymentConnectionPreviewState(response);
        pushToast({
          title: "Review onboarding changes",
          description:
            response.mode === "REINITIATE"
              ? "Some requested fields require re-initiating onboarding. Review the confirmation section before submitting."
              : "Preview generated. Review the changes and confirm submission when ready.",
          variant: "success",
        });
      } else {
        const response = await completeRestaurantPaymentConnection(user.restroId);
        await refreshAll();
        const toastConfig = getPaymentConnectionSyncToastConfig(response);
        pushToast({
          title: toastConfig.title,
          description: toastConfig.description,
          variant: toastConfig.variant,
        });
      }
    } catch (error) {
      const { fieldErrors, formErrors } = applyPaymentConnectionErrorState(error);

      pushToast({
        title: "Payment connection update failed",
        description:
          formErrors[0] ??
          Object.values(fieldErrors)[0] ??
          getApiErrorMessage(error, "Please try again."),
        variant: "error",
      });
    } finally {
      setPaymentConnectLoading(null);
    }
  };

  const handlePaymentConnectionLifecycleAction = async (
    action: PaymentConnectionLifecycleAction,
  ) => {
    if (!canManageBilling) {
      pushToast({
        title: "Access restricted",
        description: "Only restaurant owners and admins can manage payment onboarding.",
        variant: "warning",
      });
      return;
    }

    if (!user?.restroId) {
      pushToast({
        title: "Restaurant context missing",
        description: "Create or open a restaurant account first.",
        variant: "warning",
      });
      return;
    }

    const confirmationMessageMap: Record<PaymentConnectionLifecycleAction, string> = {
      INACTIVATE:
        "This will locally pause Route payouts for this restaurant until you reactivate it. Continue?",
      REACTIVATE:
        "This will reactivate the current Route connection for this restaurant. Continue?",
      DELETE:
        "This will permanently remove the current Route link from this restaurant in the platform. You can onboard again later, but Razorpay may still reuse the same linked account. Continue?",
    };

    if (!window.confirm(confirmationMessageMap[action])) {
      return;
    }

    setPaymentConnectionErrors({});
    setPaymentConnectionFormMessages([]);
    setPaymentConnectionRequestId(null);
    setPaymentConnectionPreviewState(null);
    setPaymentConnectionLifecycleLoading(action);

    try {
      const response = await manageRestaurantPaymentConnectionLifecycle(user.restroId, {
        action,
      });

      await refreshAll();

      const toastConfigMap: Record<
        PaymentConnectionLifecycleAction,
        { title: string; description: string; variant: "success" | "warning" }
      > = {
        INACTIVATE: {
          title: "Route connection paused",
          description:
            "This restaurant will not send online food-order payouts through Route until you reactivate it.",
          variant: "warning",
        },
        REACTIVATE: {
          title: "Route connection reactivated",
          description:
            response.status === "ACTIVE"
              ? "Online food-order payouts can use this Route connection again."
              : "The Route connection is active locally again. Sync or finish activation if Razorpay still shows it as pending.",
          variant: "success",
        },
        DELETE: {
          title: "Route link removed",
          description:
            "The local Route connection has been deleted. You can review the form and onboard again when needed.",
          variant: "warning",
        },
      };

      const toastConfig = toastConfigMap[action];
      pushToast({
        title: toastConfig.title,
        description: toastConfig.description,
        variant: toastConfig.variant,
      });
    } catch (error) {
      const { fieldErrors, formErrors } = applyPaymentConnectionErrorState(error);

      pushToast({
        title: "Payment connection action failed",
        description:
          formErrors[0] ??
          Object.values(fieldErrors)[0] ??
          getApiErrorMessage(error, "Please try again."),
        variant: "error",
      });
    } finally {
      setPaymentConnectionLifecycleLoading(null);
    }
  };

  const confirmPaymentConnectionPreview = async () => {
    if (!canManageBilling || !user?.restroId || !paymentConnectionPreviewState) {
      return;
    }

    const payload = buildPaymentConnectionPayload(paymentConnectionForm);
    setPaymentConnectionErrors({});
    setPaymentConnectionFormMessages([]);
    setPaymentConnectionRequestId(null);
    setPaymentConnectLoading("start");

    try {
      const response = await startRestaurantPaymentConnection(user.restroId, {
        ...payload,
        confirmationToken: paymentConnectionPreviewState.confirmationToken,
        forceReinitiate: paymentConnectionPreviewState.mode === "REINITIATE",
        reinitiateReason:
          paymentConnectionPreviewState.mode === "REINITIATE"
            ? reinitiateReason.trim() || undefined
            : undefined,
      });

      setPaymentConnectionPreviewState(null);
      setReinitiateReason("");
      await refreshAll();
      pushToast({
        title: "Onboarding submitted",
        description:
          response.onboardingLink || "The payment connection draft has been updated successfully.",
        variant: "success",
      });
    } catch (error) {
      const { fieldErrors, formErrors } = applyPaymentConnectionErrorState(error);

      pushToast({
        title: "Payment connection update failed",
        description:
          formErrors[0] ??
          Object.values(fieldErrors)[0] ??
          getApiErrorMessage(error, "Please try again."),
        variant: "error",
      });
    } finally {
      setPaymentConnectLoading(null);
    }
  };

  const updateForm = (
    updater: (current: RestaurantPaymentConnectionOnboardingPayload) => RestaurantPaymentConnectionOnboardingPayload,
  ) => {
    setPaymentConnectionErrors({});
    setPaymentConnectionFormMessages([]);
    setPaymentConnectionRequestId(null);
    setPaymentConnectionPreviewState(null);
    setPaymentConnectionForm((current) => updater(current));
  };

  const commitSanitizedPaymentConnectionForm = () => {
    setPaymentConnectionPreviewState(null);
    setPaymentConnectionForm((current) => sanitizePaymentConnectionForm(current));
  };

  return (
    <div className="min-h-screen text-left">
      <header className="ui-card border-b border-[#eedbc8] bg-white shadow-xs sticky top-0 z-10">
        <div className="mx-auto max-w-7xl ">
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
              className="w-fit cursor-pointer inline-flex items-center gap-2 rounded-lg border border-[#ef6820] px-4 py-2.5 text-sm font-medium text-[#ef6820] transition hover:bg-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-8 space-y-8">

        <section className="rounded-2xl border border-[#eedbc8] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#3b2f2f]">Access Status</h2>
              <p className="mt-2 text-sm text-[#6b665f]">
                Start a free trial, buy a plan, and connect the restaurant payout account.
              </p>
            </div>

            <button
              type="button"
              disabled={trialStarting || !canManageBilling}
              onClick={() => void handleStartTrial()}
              className="h-fit w-fit cursor-pointer rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {trialStarting ? "Starting trial..." : "Start 7-Day Trial"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl  px-6 py-5 border border-[#f0e3d5]">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Subscription Kind</p>
              <p className="mt-3 text-lg font-bold text-[#3b2f2f]">
                {currentQuery.data?.kind ?? "—"}
              </p>
            </div>
            <div className="rounded-xl  px-6 py-5 border border-[#f0e3d5]">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Access Status</p>
              <p className="mt-3 text-lg font-bold text-[#3b2f2f]">
                {currentQuery.data?.accessStatus ?? "BLOCKED"}
              </p>
            </div>
            <div className="rounded-xl  px-6 py-5 border border-[#f0e3d5]">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Grace Period Ends</p>
              <p className="mt-3 text-lg font-bold text-[#3b2f2f]">
                {currentQuery.data?.graceEndsAt
                  ? new Date(currentQuery.data.graceEndsAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#eedbc8] bg-white p-4 shadow-sm">
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
                className="rounded-2xl border border-[#f0e3d5] p-4 shadow-sm hover:shadow-md transition-shadow"
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
                    <li key={feature} className="rounded-lg bg-white px-4 py-2.5 text-sm text-[#6b665f] border border-[#f0e3d5]">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={loading || actionPlanId === plan.id || !canManageBilling}
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
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="min-w-0 rounded-2xl border border-[#eedbc8] bg-white p-4 shadow-sm">
              <h2 className="text-2xl font-bold text-[#3b2f2f]">Current Subscription</h2>
              {currentQuery.data ? (
                <div className="mt-6 rounded-xl border border-[#f0e3d5] bg-[#fffaf5] p-4">
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

            <div className="rounded-2xl border border-[#eedbc8] bg-white p-4 shadow-sm">
              <h2 className="text-2xl font-bold text-[#3b2f2f]">Payment Connection</h2>
              <div className="mt-6 rounded-xl border border-[#f0e3d5] bg-[#fffaf5] p-4 space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
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
                  <div className="rounded-lg bg-white p-4 border border-[#f0e3d5]">
                    <p className="text-xs uppercase font-semibold tracking-widest text-[#8d7967]">Local Mode</p>
                    <p className="mt-2 font-semibold text-[#3b2f2f]">
                      {paymentConnectionLifecycleStatus}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 border border-[#f0e3d5]">
                  <p className="text-xs uppercase font-semibold tracking-widest text-[#8d7967]">Route Account</p>
                  <p className="mt-2 break-all font-mono text-sm text-[#3b2f2f]">
                    {paymentConnectionQuery.data?.routeAccountId ?? "Not created"}
                  </p>
                </div>

                {isPaymentConnectionInactive ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                    This Route connection is currently inactive in the platform. Razorpay may still
                    show it as active, but online order payouts stay paused until you reactivate it.
                  </div>
                ) : null}

                {(paymentConnectionQuery.data?.requirements ?? []).length > 0 && (
                  <div className="min-w-0 w-full overflow-hidden rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-amber-900">
                        Razorpay clarification requirements
                      </p>
                      <p className="text-xs text-amber-800">
                        Review each requirement below, update any mapped onboarding fields, then
                        submit again and sync Razorpay status.
                      </p>
                    </div>

                    <ul className="mt-3 scrollbar-thin space-y-2 text-sm text-amber-800 wrap-break-word max-h-40 overflow-y-auto">
                      {paymentConnectionQuery.data?.requirements?.map((requirement, index) => {
                        const fieldConfig = getPaymentConnectionRequirementFieldConfig(
                          requirement.field_reference,
                        );
                        const reasonCode = (requirement.reason_code ?? "").toLowerCase();
                        const isResolvableInForm = isRequirementResolvableInForm(requirement);
                        const requirementKey =
                          requirement.field_reference ??
                          requirement.resolution_url ??
                          requirement.reason_code ??
                          `requirement-${index}`;

                        return (
                          <li key={requirementKey} className="flex min-w-0 items-start gap-2">
                            <span className="mt-1 text-amber-600">*</span>
                            <div className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white/80 p-3">
                              <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                                {formatRequirementCode(requirement.status)}
                              </span>
                              <span className="rounded-full border border-amber-300 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                                {formatRequirementCode(requirement.reason_code)}
                              </span>
                            </div>

                            <div className="mt-3 space-y-2">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                  Provider field reference
                                </p>
                                <p className="mt-1 break-all font-mono text-xs text-amber-950">
                                  {requirement.field_reference ?? "Not provided"}
                                </p>
                              </div>

                              {fieldConfig ? (
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                    Mapped onboarding field
                                  </p>
                                  <p className="mt-1 text-sm text-amber-900">
                                    {fieldConfig.label}
                                  </p>
                                </div>
                              ) : null}

                              {isResolvableInForm ? (
                                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                  Update{" "}
                                  <span className="font-semibold">
                                    {fieldConfig?.label ?? "the related onboarding field"}
                                  </span>{" "}
                                  in the form below, submit again, then click Sync Status.
                                </p>
                              ) : reasonCode === "document_missing" ? (
                                <>
                                  {/* TODO: documentation.md references resolution_url for missing fields/documents, but it does not define the document-upload contract for this UI. */}
                                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                    This requirement needs provider-side document follow-up. Review
                                    the provider reference below, update any supporting documents
                                    outside this form, then sync Razorpay status again.
                                  </p>
                                </>
                              ) : fieldConfig ? (
                                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                  Review the mapped field carefully before resubmitting. Razorpay
                                  has not marked this requirement as directly resolvable inside the
                                  current form.
                                </p>
                              ) : (
                                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                  This requirement is not mapped to a field in the current
                                  onboarding form. Review the provider reference and sync again
                                  after the clarification is handled.
                                </p>
                              )}

                              {requirement.resolution_url ? (
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                    Provider reference
                                  </p>
                                  <p className="mt-1 break-all rounded-md border border-amber-200 bg-amber-50 px-3 py-2 font-mono text-xs text-amber-950">
                                    {requirement.resolution_url}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t border-[#f0e3d5]">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <button
                      type="button"
                      disabled={isPaymentConnectionBusy || !user?.restroId}
                      onClick={() => void handlePaymentConnection("preview")}
                      className="flex-1 cursor-pointer rounded-xl border-2 border-[#ef6820] px-4 py-2.5 text-sm font-semibold text-[#ef6820] transition hover:bg-orange-50 disabled:opacity-60"
                    >
                      {paymentConnectLoading === "preview"
                        ? "Reviewing..."
                        : paymentConnectionPreviewState
                          ? "Preview Ready"
                          : "Review Onboarding"}
                    </button>
                    <button
                      type="button"
                      disabled={isPaymentConnectionBusy || !user?.restroId}
                      onClick={() => void handlePaymentConnection("complete")}
                      className="flex-1 cursor-pointer rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {paymentConnectLoading === "complete"
                        ? "Syncing..."
                        : "Sync Status"}
                    </button>
                    {hasLinkedRouteAccount ? (
                      <button
                        type="button"
                        disabled={isPaymentConnectionBusy || !user?.restroId}
                        onClick={() =>
                          void handlePaymentConnectionLifecycleAction(
                            isPaymentConnectionInactive ? "REACTIVATE" : "INACTIVATE",
                          )
                        }
                        className={`flex-1 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                          isPaymentConnectionInactive
                            ? "bg-emerald-700 text-white hover:bg-emerald-800"
                            : "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                        }`}
                      >
                        {paymentConnectionLifecycleLoading === "REACTIVATE"
                          ? "Reactivating..."
                          : paymentConnectionLifecycleLoading === "INACTIVATE"
                            ? "Pausing..."
                            : isPaymentConnectionInactive
                              ? "Reactivate Route"
                              : "Make Inactive"}
                      </button>
                    ) : null}
                    {hasLinkedRouteAccount ? (
                      <button
                        type="button"
                        disabled={isPaymentConnectionBusy || !user?.restroId}
                        onClick={() => void handlePaymentConnectionLifecycleAction("DELETE")}
                        className="flex-1 cursor-pointer rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-60"
                      >
                        {paymentConnectionLifecycleLoading === "DELETE"
                          ? "Deleting..."
                          : "Delete Route Link"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eedbc8] bg-white p-4 shadow-sm">
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
        <section className="rounded-2xl border border-[#eedbc8] bg-white p-4 shadow-sm">
          <h2 className="text-2xl font-bold text-[#3b2f2f]">Razorpay Onboarding Details</h2>
          <p className="mt-2 text-sm text-[#6b665f]">Complete all required information for payment processing</p>

          <div className="mt-8 rounded-xl border border-[#f0e3d5] bg-[#fffaf5] p-4 space-y-8">
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900">
              Review the restaurant profile in Account Management before submitting onboarding.
              Razorpay account creation also uses the restaurant support email, support phone, and legal name saved there.
            </div>

            {paymentConnectionSummaryMessages.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4">
                <p className="text-sm font-semibold text-red-900">
                  Please review the onboarding details below.
                </p>
                <ul className="mt-3 space-y-2 text-sm text-red-800">
                  {paymentConnectionSummaryMessages.map((message) => (
                    <li key={message} className="flex items-start gap-2">
                      <span className="mt-1 text-red-500">•</span>
                      <span>{message}</span>
                    </li>
                  ))}
                </ul>
                {paymentConnectionRequestId ? (
                  <p className="mt-3 text-xs font-medium text-red-700">
                    Reference ID: {paymentConnectionRequestId}
                  </p>
                ) : null}
              </div>
            )}

            {paymentConnectionPreviewState ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Confirmation required: {paymentConnectionPreviewState.mode}
                    </p>
                    <p className="mt-1 text-sm text-emerald-800">
                      Review the detected changes below before submitting the Razorpay Route update.
                    </p>
                  </div>
                  <p className="text-xs font-medium text-emerald-700">
                    Expires {new Date(paymentConnectionPreviewState.confirmationExpiresAt).toLocaleString()}
                  </p>
                </div>

                {paymentConnectionPreviewState.changedFields.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
                      Changed Fields
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {paymentConnectionPreviewState.changedFields.map((field) => (
                        <span
                          key={field}
                          className="rounded-full border-2 px-3 py-1 text-xs font-medium text-emerald-800"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {paymentConnectionPreviewState.immutableFields.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-900">
                      Re-initiation Triggers
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {paymentConnectionPreviewState.immutableFields.map((field) => (
                        <span
                          key={field}
                          className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {[...paymentConnectionPreviewState.warnings, ...paymentConnectionPreviewState.providerLockWarnings].length ? (
                  <div className="mt-4 space-y-2 text-sm text-emerald-900">
                    {[...paymentConnectionPreviewState.warnings, ...paymentConnectionPreviewState.providerLockWarnings].map((message) => (
                      <p key={message}>• {message}</p>
                    ))}
                  </div>
                ) : null}

                {paymentConnectionPreviewState.mode === "REINITIATE" ? (
                  <div className="mt-4">
                    <label className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
                      Re-initiation Reason
                    </label>
                    <textarea
                      value={reinitiateReason}
                      onChange={(event) => setReinitiateReason(event.target.value)}
                      placeholder="Optional note for why this payout onboarding is being re-initiated."
                      rows={3}
                      className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-[#3b2f2f] outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {paymentConnectionQuery.data?.savedOnboardingPayload ? (
              <div className="rounded-lg border border-[#e5d5c6] bg-white px-5 py-4 text-sm text-[#6b665f]">
                Saved Route onboarding details have been loaded into this form.
                {isPaymentConnectionFieldLocked("businessType")
                  ? " Business type is locked after the first linked-account setup. Editable fields below can still be updated and resubmitted."
                  : " You can review and update the editable fields below before submitting again."}
              </div>
            ) : null}

            {/* Business Information */}
            <div>
              <h3 className="text-lg font-bold text-[#3b2f2f] mb-4">Business Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Business Type</label>
                  <Listbox
                    value={paymentConnectionForm.businessType}
                    disabled={isPaymentConnectionFieldLocked("businessType")}
                    onChange={(value: RestaurantPaymentConnectionOnboardingPayload["businessType"]) =>
                      updateForm((current) => {
                        const currentStakeholder = current.stakeholder || {};

                        return {
                          ...current,
                          businessType: value,
                          stakeholder: {
                            ...currentStakeholder,
                            percentageOwnership:
                              value === "proprietorship"
                                ? 100
                                : currentStakeholder.percentageOwnership ?? 0,
                          },
                        };
                      })
                    }
                  >
                    <div className="relative">
                      {/* Button */}
                      <ListboxButton
                        className={`flex items-center justify-between ${isPaymentConnectionFieldLocked("businessType")
                          ? getPaymentConnectionReadonlyClass("businessType")
                          : getPaymentConnectionInputClass("businessType")
                          }`}
                      >
                        <span>
                          {
                            PAYMENT_CONNECTION_BUSINESS_TYPE_OPTIONS.find(
                              (opt) => opt.value === paymentConnectionForm.businessType
                            )?.label || "Select business type"
                          }
                        </span>
                        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                      </ListboxButton>

                      {/* Options */}
                      <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-[#e5d5c6] bg-white shadow-lg focus:outline-none">
                        {PAYMENT_CONNECTION_BUSINESS_TYPE_OPTIONS.map((option) => (
                          <ListboxOption
                            key={option.value}
                            value={option.value}
                            className={({ active }) =>
                              `cursor-pointer select-none px-4 py-2 flex items-center justify-between ${active ? "bg-orange-100 text-orange-700" : "text-gray-700"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span>{option.label}</span>
                                {selected && (
                                  <CheckIcon className="h-4 w-4 text-orange-500" />
                                )}
                              </>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </div>
                  </Listbox>
                  <p className="mt-2 text-xs text-[#6b665f]">
                    {isPaymentConnectionFieldLocked("businessType")
                      ? "Locked after the first Route linked-account setup. Changing it requires a fresh onboarding path."
                      : PAYMENT_CONNECTION_BUSINESS_TYPE_OPTIONS.find(
                        (option) => option.value === paymentConnectionForm.businessType,
                      )?.description}
                  </p>
                  {renderPaymentConnectionFieldError("businessType")}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Business Name</label>
                  <input
                    value={paymentConnectionForm.customerFacingBusinessName ?? ""}
                    onBlur={commitSanitizedPaymentConnectionForm}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        customerFacingBusinessName: event.target.value,
                      }))
                    }
                    placeholder="Customer-facing name"
                    className={getPaymentConnectionInputClass("customerFacingBusinessName")}
                  />
                  {renderPaymentConnectionFieldError("customerFacingBusinessName")}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Category</label>
                  <input
                    value={paymentConnectionForm.businessCategory}
                    readOnly
                    className="mt-2 w-full rounded-lg border border-[#f0e3d5] bg-[#fffaf5] px-4 py-2.5 text-sm text-[#6b665f] focus:outline-none cursor-not-allowed"
                  />
                  <p className="mt-2 text-xs text-[#6b665f]">
                    Locked to the restaurant platform&apos;s supported category.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Subcategory</label>
                  <input
                    value={paymentConnectionForm.businessSubcategory}
                    readOnly
                    className="mt-2 w-full rounded-lg border border-[#f0e3d5] bg-[#fffaf5] px-4 py-2.5 text-sm text-[#6b665f] focus:outline-none cursor-not-allowed"
                  />
                  <p className="mt-2 text-xs text-[#6b665f]">
                    Locked to the restaurant platform&apos;s supported subcategory.
                  </p>
                </div>
              </div>
            </div>

            {/* Business Address */}
            <div className="border-t border-[#f0e3d5] pt-8">
              <h3 className="text-lg font-bold text-[#3b2f2f] mb-4">Business Address</h3>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Street Address 1</label>
                <input
                  value={paymentConnectionForm.businessAddress.street1}
                  onBlur={commitSanitizedPaymentConnectionForm}
                  onChange={(event) =>
                    updateForm((current) => ({
                      ...current,
                      businessAddress: {
                        ...current.businessAddress,
                        street1: event.target.value,
                      },
                    }))
                  }
                  placeholder="Registered business address 1"
                  className={getPaymentConnectionInputClass("businessAddress.street1")}
                />
                {renderPaymentConnectionFieldError("businessAddress.street1")}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Street Address 2</label>
                <input
                  value={paymentConnectionForm.businessAddress.street2 ?? ""}
                  onBlur={commitSanitizedPaymentConnectionForm}
                  onChange={(event) =>
                    updateForm((current) => ({
                      ...current,
                      businessAddress: {
                        ...current.businessAddress,
                        street2: event.target.value,
                      },
                    }))
                  }
                  placeholder="Registered business address 2"
                  className={getPaymentConnectionInputClass("businessAddress.street2")}
                />
                {renderPaymentConnectionFieldError("businessAddress.street2")}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">City</label>
                  <input
                    value={paymentConnectionForm.businessAddress.city}
                    onBlur={commitSanitizedPaymentConnectionForm}
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
                    className={getPaymentConnectionInputClass("businessAddress.city")}
                  />
                  {renderPaymentConnectionFieldError("businessAddress.city")}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">State</label>
                  <input
                    value={paymentConnectionForm.businessAddress.state}
                    onBlur={commitSanitizedPaymentConnectionForm}
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
                    className={getPaymentConnectionInputClass("businessAddress.state")}
                  />
                  {renderPaymentConnectionFieldError("businessAddress.state")}
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
                          postalCode: event.target.value.replace(/\D/g, "").slice(0, 6),
                        },
                      }))
                    }
                    placeholder="PIN code"
                    inputMode="numeric"
                    className={getPaymentConnectionInputClass("businessAddress.postalCode")}
                  />
                  {renderPaymentConnectionFieldError("businessAddress.postalCode")}
                </div>
              </div>
            </div>

            {/* Legal Information */}
            <div className="border-t border-[#f0e3d5] pt-8">
              <h3 className="text-lg font-bold text-[#3b2f2f] mb-4">Legal Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">{businessPanLabel}</label>
                  <input
                    value={paymentConnectionForm.legalInfo.pan ?? ""}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        legalInfo: {
                          ...current.legalInfo,
                          pan: event.target.value.replace(/\s+/g, "").toUpperCase(),
                        },
                      }))
                    }
                    placeholder="PAN number"
                    autoCapitalize="characters"
                    className={getPaymentConnectionInputClass("legalInfo.pan")}
                  />
                  {renderPaymentConnectionFieldError("legalInfo.pan") ?? (
                    <p className="mt-2 text-xs text-[#6b665f]">{businessPanHelperText}</p>
                  )}
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
                          gst: event.target.value.replace(/\s+/g, "").toUpperCase(),
                        },
                      }))
                    }
                    placeholder="GST number"
                    autoCapitalize="characters"
                    className={getPaymentConnectionInputClass("legalInfo.gst")}
                  />
                  {renderPaymentConnectionFieldError("legalInfo.gst") ?? (
                    <p className="mt-2 text-xs text-[#6b665f]">
                      Leave GST empty if the business does not have a GSTIN.
                    </p>
                  )}
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
                          accountNumber: event.target.value.replace(/\D/g, "").slice(0, 18),
                        },
                      }))
                    }
                    placeholder="Account number"
                    inputMode="numeric"
                    className={getPaymentConnectionInputClass("bankAccount.accountNumber")}
                  />
                  {renderPaymentConnectionFieldError("bankAccount.accountNumber")}
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
                          ifscCode: event.target.value.replace(/\s+/g, "").toUpperCase(),
                        },
                      }))
                    }
                    placeholder="IFSC"
                    autoCapitalize="characters"
                    className={getPaymentConnectionInputClass("bankAccount.ifscCode")}
                  />
                  {renderPaymentConnectionFieldError("bankAccount.ifscCode")}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Beneficiary Name</label>
                  <input
                    value={paymentConnectionForm.bankAccount.beneficiaryName}
                    onBlur={commitSanitizedPaymentConnectionForm}
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
                    className={getPaymentConnectionInputClass("bankAccount.beneficiaryName")}
                  />
                  {renderPaymentConnectionFieldError("bankAccount.beneficiaryName")}
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div className="border-t border-[#f0e3d5] pt-8">
              <h3 className="text-lg font-bold text-[#3b2f2f] mb-4">
                {isProprietorship ? "Proprietor Details" : "Partner / Stakeholder"}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Full Name</label>
                  <input
                    value={paymentConnectionForm.stakeholder.name}
                    onBlur={commitSanitizedPaymentConnectionForm}
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
                    className={getPaymentConnectionInputClass("stakeholder.name")}
                  />
                  {renderPaymentConnectionFieldError("stakeholder.name")}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Email</label>
                  <input
                    value={paymentConnectionForm.stakeholder.email}
                    onBlur={commitSanitizedPaymentConnectionForm}
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
                    className={getPaymentConnectionInputClass("stakeholder.email")}
                  />
                  {renderPaymentConnectionFieldError("stakeholder.email")}
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
                          phone: event.target.value.replace(/\D/g, "").slice(0, 11),
                        },
                      }))
                    }
                    placeholder="Phone number"
                    inputMode="numeric"
                    className={getPaymentConnectionInputClass("stakeholder.phone")}
                  />
                  {renderPaymentConnectionFieldError("stakeholder.phone")}
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
                          pan: event.target.value.replace(/\s+/g, "").toUpperCase(),
                        },
                      }))
                    }
                    placeholder="PAN"
                    autoCapitalize="characters"
                    className={getPaymentConnectionInputClass("stakeholder.pan")}
                  />
                  {renderPaymentConnectionFieldError("stakeholder.pan")}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Ownership %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={paymentConnectionForm.stakeholder.percentageOwnership}
                    disabled={isProprietorship}
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
                    className={getPaymentConnectionInputClass("stakeholder.percentageOwnership")}
                  />
                  {renderPaymentConnectionFieldError("stakeholder.percentageOwnership") ?? (
                    <p className="mt-2 text-xs text-[#6b665f]">
                      {isProprietorship
                        ? "Fixed at 100% for proprietorship onboarding."
                        : "Optional unless Razorpay requests it. When provided, use 0 to 100 with up to 2 decimal places."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Owner Address */}
            <div className="border-t border-[#f0e3d5] pt-8">
              <h3 className="text-lg font-bold text-[#3b2f2f] mb-4">Owner Residential Address</h3>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Street Address</label>
                <input
                  value={paymentConnectionForm.stakeholder.address.street}
                  onBlur={commitSanitizedPaymentConnectionForm}
                  onChange={(event) =>
                    updateForm((current) => ({
                      ...current,
                      stakeholder: {
                        ...current.stakeholder,
                        address: {
                          ...current.stakeholder.address,
                          street: event.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Residential address"
                  className={getPaymentConnectionInputClass("stakeholder.address.street")}
                />
                {renderPaymentConnectionFieldError("stakeholder.address.street")}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">City</label>
                  <input
                    value={paymentConnectionForm.stakeholder.address.city}
                    onBlur={commitSanitizedPaymentConnectionForm}
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
                    className={getPaymentConnectionInputClass("stakeholder.address.city")}
                  />
                  {renderPaymentConnectionFieldError("stakeholder.address.city")}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">State</label>
                  <input
                    value={paymentConnectionForm.stakeholder.address.state}
                    onBlur={commitSanitizedPaymentConnectionForm}
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
                    className={getPaymentConnectionInputClass("stakeholder.address.state")}
                  />
                  {renderPaymentConnectionFieldError("stakeholder.address.state")}
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
                            postalCode: event.target.value.replace(/\D/g, "").slice(0, 6),
                          },
                        },
                      }))
                    }
                    placeholder="PIN code"
                    inputMode="numeric"
                    className={getPaymentConnectionInputClass("stakeholder.address.postalCode")}
                  />
                  {renderPaymentConnectionFieldError("stakeholder.address.postalCode")}
                </div>
              </div>
            </div>

            <div className="border-t border-[#f0e3d5] pt-8">
              <label className="flex items-start gap-3 text-sm text-[#3b2f2f]">
                <input
                  type="checkbox"
                  checked={paymentConnectionForm.acceptTerms}
                  onChange={(event) =>
                    updateForm((current) => ({
                      ...current,
                      acceptTerms: event.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-[#d7c1aa] accent-orange-500"
                />
                <span>
                  I confirm that these business, bank, and stakeholder details are accurate and
                  I accept the Razorpay Route onboarding terms for this restaurant.
                </span>
              </label>
              <p className="mt-2 text-xs text-[#6b665f]">
                This confirmation is required before we submit the onboarding request.
              </p>
              {renderPaymentConnectionFieldError("acceptTerms")}
            </div>

            {/* Action Buttons */}
            <div className="border-t border-[#f0e3d5] pt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={isPaymentConnectionBusy || !user?.restroId || !canManageBilling}
                onClick={() => void handlePaymentConnection("preview")}
                className="flex-1 cursor-pointer rounded-lg border-2 border-[#ef6820] px-6 py-3 text-sm font-semibold text-[#ef6820] transition hover:bg-orange-50 disabled:opacity-60"
              >
                {paymentConnectLoading === "preview"
                  ? "Reviewing..."
                  : paymentConnectionPreviewState
                    ? "Refresh Preview"
                    : "Review Onboarding Form"}
              </button>
              {paymentConnectionPreviewState ? (
                <button
                  type="button"
                  disabled={isPaymentConnectionBusy || !user?.restroId || !canManageBilling}
                  onClick={() => void confirmPaymentConnectionPreview()}
                  className="flex-1 cursor-pointer rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {paymentConnectLoading === "start"
                    ? paymentConnectionPreviewState.mode === "REINITIATE"
                      ? "Re-initiating..."
                      : "Submitting..."
                    : paymentConnectionPreviewState.mode === "REINITIATE"
                      ? "Confirm Re-initiation"
                      : "Confirm Submission"}
                </button>
              ) : null}
              <button
                type="button"
                disabled={isPaymentConnectionBusy || !user?.restroId || !canManageBilling}
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
