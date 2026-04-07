import { api } from "../../utils/api";

export type PaymentAttemptRecord = {
  _id?: string;
  id?: string;
  amount: number;
  currency: string;
  status: string;
  providerOrderId?: string;
  providerRefId?: string;
  providerPaymentId?: string;
  refunds?: Array<{
    _id?: string;
    id?: string;
    amount: number;
    status: string;
    providerRefundId?: string;
    createdAt?: string;
  }>;
};

export type OrderRefundPolicy = {
  refundPercentBps: number;
  baseOrderAmount: number;
  capturedRefundableAmount: number;
  requestedAmount: number;
  eligible: boolean;
};

export type OrderRefundLogRecord = {
  id: string;
  refundId: string;
  orderId: string;
  actionType: string;
  status: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export type PaymentCheckoutPayload = {
  keyId?: string;
  amount: number;
  currency: string;
  orderId: string;
  name?: string;
  description?: string;
  notes?: Record<string, unknown>;
};

export const initiateOrderPayment = async (
  orderId: string,
  input: {
    purpose?: "ADVANCE" | "FINAL_SETTLEMENT";
    idempotencyKey: string;
  },
) => {
  const response = await api.post<{
    data: {
      paymentAttempt: PaymentAttemptRecord;
      checkout: PaymentCheckoutPayload;
    };
  }>(`/api/v1/payments/orders/${orderId}`, input, {
    headers: {
      "Idempotency-Key": input.idempotencyKey,
    },
  });

  return response.data;
};

export const confirmOrderPayment = async (
  paymentId: string,
  input: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    amount?: number;
  },
) => {
  const response = await api.patch<{ data: PaymentAttemptRecord }>(
    `/api/v1/payments/${paymentId}/confirm`,
    input,
  );
  return response.data;
};

export const failOrderPayment = async (
  paymentId: string,
  input: {
    code?: string;
    message?: string;
    retryable?: boolean;
    failureSource?: string;
  },
) => {
  await api.patch(`/api/v1/payments/${paymentId}/fail`, input);
};

export const listOrderPayments = async (orderId: string) => {
  const response = await api.get<{
    data: PaymentAttemptRecord[];
    refundPolicy?: OrderRefundPolicy;
    refundLogs?: OrderRefundLogRecord[];
  }>(`/api/v1/payments/orders/${orderId}`);
  return {
    payments: response.data,
    refundPolicy: response.refundPolicy,
    refundLogs: response.refundLogs ?? [],
  };
};
