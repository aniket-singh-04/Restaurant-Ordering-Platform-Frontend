import { api } from "../../utils/api";

export type RestaurantPaymentConnectionRequirement = {
  field_reference?: string;
  resolution_url?: string;
  reason_code?: string;
  status?: string;
  [key: string]: unknown;
};

export type RestaurantPaymentConnection = {
  provider: "RAZORPAY_ROUTE";
  status: "NOT_CONNECTED" | "PENDING" | "ACTIVE";
  lifecycleStatus?: "ENABLED" | "INACTIVE";
  routeAccountId?: string | null;
  stakeholderId?: string | null;
  productConfigId?: string | null;
  activationStatus?: string | null;
  onboardingLink?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  requirements?: RestaurantPaymentConnectionRequirement[];
  lastSubmittedAt?: string | null;
  lastSyncedAt?: string | null;
  savedOnboardingPayload?: RestaurantPaymentConnectionOnboardingPayload | null;
  lockedFields?: string[];
};

export type PaymentConnectionPreview = {
  mode: "PATCH" | "REINITIATE";
  changedFields: string[];
  immutableFields: string[];
  warnings: string[];
  providerLockWarnings: string[];
  requiresConfirmation: boolean;
  confirmationToken: string;
  confirmationHash: string;
  confirmationExpiresAt: string;
};

export type PaymentConnectionLifecycleAction =
  | "INACTIVATE"
  | "REACTIVATE"
  | "DELETE";

export type SupportedPaymentConnectionBusinessType =
  | "proprietorship"
  | "partnership";

export type RestaurantPaymentConnectionOnboardingPayload = {
  businessType: SupportedPaymentConnectionBusinessType;
  businessCategory: "food";
  businessSubcategory: "restaurant";
  customerFacingBusinessName?: string;
  businessAddress: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  legalInfo: {
    pan?: string;
    gst?: string;
  };
  bankAccount: {
    accountNumber: string;
    ifscCode: string;
    beneficiaryName: string;
  };
  stakeholder: {
    name: string;
    email: string;
    phone: string;
    pan: string;
    percentageOwnership: number;
    address: {
      street1: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  acceptTerms: boolean;
};

export const getRestaurantPaymentConnection = async (restaurantId: string) => {
  const response = await api.get<{ data: RestaurantPaymentConnection }>(
    `/api/v1/restaurants/${restaurantId}/payment-connection`,
  );
  return response.data;
};

export const startRestaurantPaymentConnection = async (
  restaurantId: string,
  payload: RestaurantPaymentConnectionOnboardingPayload & {
    confirmationToken?: string;
    forceReinitiate?: boolean;
    reinitiateReason?: string;
  },
) => {
  const response = await api.post<{ data: RestaurantPaymentConnection }>(
    `/api/v1/restaurants/${restaurantId}/payment-connection/onboard`,
    payload,
  );
  return response.data;
};

export const previewRestaurantPaymentConnection = async (
  restaurantId: string,
  payload: RestaurantPaymentConnectionOnboardingPayload,
) => {
  const response = await api.post<{ data: PaymentConnectionPreview }>(
    `/api/v1/restaurants/${restaurantId}/payment-connection/preview`,
    payload,
  );
  return response.data;
};

export const completeRestaurantPaymentConnection = async (restaurantId: string) => {
  const response = await api.post<{ data: RestaurantPaymentConnection }>(
    `/api/v1/restaurants/${restaurantId}/payment-connection/complete`,
  );
  return response.data;
};

export const manageRestaurantPaymentConnectionLifecycle = async (
  restaurantId: string,
  payload: {
    action: PaymentConnectionLifecycleAction;
    reason?: string;
  },
) => {
  const response = await api.post<{ data: RestaurantPaymentConnection }>(
    `/api/v1/restaurants/${restaurantId}/payment-connection/lifecycle`,
    payload,
  );
  return response.data;
};
