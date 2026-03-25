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
  subscriptionId?: string;
  razorpayPaymentId?: string;
  status: string;
  paymentStatus: string;
  startDate?: string;
  expiryDate?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  activatedAt?: string;
  cancelledAt?: string;
  createdAt?: string;
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
    data: {
      subscription: RestaurantSubscriptionRecord;
      checkout: {
        keyId?: string;
        subscriptionId: string;
        name?: string;
        description?: string;
      };
    };
  }>("/api/v1/subscriptions/initiate", { planId });

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
