import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/api";

export type SubscriptionPlanRecord = {
  _id?: string;
  id: string;
  code: string;
  planGroup: string;
  name: string;
  description?: string;
  billingCycle: "MONTHLY" | "YEARLY";
  amountMinor: number;
  currency: string;
  features: string[];
  sortOrder: number;
};

export type RestaurantSubscriptionRecord = {
  _id?: string;
  id: string;
  restaurantId: string;
  ownerUserId: string;
  planId: string;
  kind?: "TRIAL" | "PAID";
  subscriptionId?: string;
  razorpayPaymentId?: string;
  status: string;
  paymentStatus: string;
  accessStatus?: "PENDING" | "ACTIVE" | "GRACE" | "BLOCKED";
  startDate?: string;
  expiryDate?: string;
  trialStartsAt?: string;
  trialEndsAt?: string;
  graceStartsAt?: string;
  graceEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  activatedAt?: string;
  cancelledAt?: string;
  lastReminderSentAt?: string;
  lastReminderType?: string;
  createdAt?: string;
  scheduledChange?: {
    planId?: string | null;
    providerPlanId?: string | null;
    planSnapshot: {
      code: string;
      planGroup: string;
      name: string;
      billingCycle: "MONTHLY" | "YEARLY";
      amountMinor: number;
      currency: string;
      description?: string;
    };
    scheduleChangeAt: "now" | "cycle_end";
    effectiveAt?: string | null;
    requestedAt?: string | null;
    status?: string;
  } | null;
  planSnapshot: {
    code: string;
    planGroup: string;
    name: string;
    billingCycle: "MONTHLY" | "YEARLY";
    amountMinor: number;
    currency: string;
    description?: string;
  };
};

export type InitiateSubscriptionResponse = {
  action: "CHECKOUT_REQUIRED" | "UPDATED_IN_PLACE" | "UNCHANGED";
  message?: string;
  subscription: RestaurantSubscriptionRecord;
  checkout?: {
    keyId?: string;
    subscriptionId: string;
    name?: string;
    description?: string;
  };
};

export const useSubscriptionPlans = () =>
  useQuery({
    queryKey: ["subscriptions", "plans"],
    queryFn: async () => {
      const response = await api.get<{ data: SubscriptionPlanRecord[] }>("/api/v1/subscriptions/plans");
      return response.data;
    },
  });

export const useCurrentSubscription = () =>
  useQuery({
    queryKey: ["subscriptions", "current"],
    queryFn: async () => {
      const response = await api.get<{ data: RestaurantSubscriptionRecord | null }>("/api/v1/subscriptions/current");
      return response.data;
    },
  });

export const useSubscriptionHistory = () =>
  useQuery({
    queryKey: ["subscriptions", "history"],
    queryFn: async () => {
      const response = await api.get<{ data: RestaurantSubscriptionRecord[] }>("/api/v1/subscriptions/history");
      return response.data;
    },
  });

export const initiateSubscription = async (planId: string) => {
  const response = await api.post<{
    data: InitiateSubscriptionResponse;
  }>("/api/v1/subscriptions/initiate", { planId });

  return response.data;
};

export const startTrialSubscription = async () => {
  const response = await api.post<{ data: RestaurantSubscriptionRecord }>(
    "/api/v1/subscriptions/trial/start",
  );
  return response.data;
};

export const verifySubscription = async (payload: {
  recordId: string;
  razorpay_subscription_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  const response = await api.post<{ data: RestaurantSubscriptionRecord }>(
    "/api/v1/subscriptions/verify",
    payload,
  );
  return response.data;
};
