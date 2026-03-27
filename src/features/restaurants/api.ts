import { api } from "../../utils/api";

export type RestaurantPaymentConnection = {
  provider: "RAZORPAY_ROUTE";
  status: "NOT_CONNECTED" | "PENDING" | "ACTIVE";
  routeAccountId?: string | null;
  stakeholderId?: string | null;
  productConfigId?: string | null;
  activationStatus?: string | null;
  onboardingLink?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  requirements?: string[];
  lastSubmittedAt?: string | null;
  lastSyncedAt?: string | null;
};

export type RestaurantPaymentConnectionOnboardingPayload = {
  businessType: string;
  businessCategory: string;
  businessSubcategory: string;
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
    pan: string;
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
      street2?: string;
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
  payload: RestaurantPaymentConnectionOnboardingPayload,
) => {
  const response = await api.post<{ data: RestaurantPaymentConnection }>(
    `/api/v1/restaurants/${restaurantId}/payment-connection/onboard`,
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
