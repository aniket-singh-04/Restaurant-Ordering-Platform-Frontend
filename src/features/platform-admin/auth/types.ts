export type PlatformAdminRole = "SUPER_ADMIN";

export type PlatformAdminUser = {
  id: string;
  email: string;
  role: PlatformAdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
};

export type AdminActionType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "ACCESS_DENIED"
  | "LOGOUT"
  | "TOKEN_REFRESH"
  | "USER_BLOCK"
  | "USER_UNBLOCK"
  | "USER_SOFT_DELETE"
  | "RESTAURANT_APPROVE"
  | "RESTAURANT_REJECT"
  | "RESTAURANT_SUSPEND"
  | "RESTAURANT_UNSUSPEND"
  | "ORDER_EXCEPTION_CANCEL"
  | "PAYMENT_MANUAL_REFUND"
  | "SUBSCRIPTION_OVERRIDE";

export type AdminActionStatus = "SUCCESS" | "FAILED" | "BLOCKED";

export type AdminListQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type PaginatedAdminResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminAuditLog = {
  id: string;
  adminId: string | null;
  actionType: AdminActionType;
  targetType: string;
  targetId: string | null;
  status: AdminActionStatus;
  timestamp: string;
  metadata: Record<string, unknown>;
};

export type AdminDashboardMetrics = {
  totalUsers: number;
  totalRestaurants: number;
  totalOrders: number;
  totalRevenueMinor: number;
  activeSubscriptions: number;
};

export type AdminDashboardPayload = {
  metrics: AdminDashboardMetrics;
  recentActions: AdminAuditLog[];
};

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isActive: boolean;
  restroId: string | null;
  branchIds: string[];
  deletedAt: string | null;
  blockedAt: string | null;
  blockReason: string;
  deletionReason: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminRestaurantRecord = {
  id: string;
  name: string;
  legalName: string;
  supportEmail: string;
  supportPhone: string;
  isActive: boolean;
  isVerified: boolean;
  ownerUserIds: string[];
  paymentConnection: {
    status?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
  };
  platformReview: {
    status: "PENDING" | "APPROVED" | "REJECTED";
    reason: string;
    reviewedByAdminId: string | null;
    reviewedAt: string | null;
  };
  platformSuspension: {
    status: "ACTIVE" | "SUSPENDED";
    reason: string;
    updatedByAdminId: string | null;
    updatedAt: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type AdminRestaurantMetrics = {
  restaurant: AdminRestaurantRecord;
  totalOrders: number;
  totalRevenueMinor: number;
  currentSubscription: {
    id: string;
    status: string;
    accessStatus: string;
    planCode: string;
    expiryDate: string | null;
  } | null;
};

export type AdminOrderRecord = {
  id: string;
  restaurantId?: string;
  branchId?: string;
  tableId?: string;
  userId?: string;
  OrderStatus: string;
  paymentStatus: string;
  refundStatus?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  cancellationReason?: string;
  totalsSnapshot?: {
    grandTotal: number;
  };
};

export type AdminPaymentRefundRecord = {
  id: string;
  paymentAttemptId: string;
  orderId: string;
  status: string;
  amount: number;
  reason: string;
  providerRefundId: string;
  createdAt?: string;
  processedAt?: string | null;
};

export type AdminPaymentRecord = {
  id: string;
  orderId: string;
  branchId: string;
  customerId: string;
  restaurantId: string | null;
  provider: string;
  purpose: string;
  status: string;
  amount: number;
  currency: string;
  providerRefId: string;
  providerOrderId: string;
  providerPaymentId: string;
  refunds: AdminPaymentRefundRecord[];
  createdAt?: string;
  capturedAt?: string | null;
};

export type AdminSubscriptionRecord = {
  id: string;
  restaurantId: string;
  ownerUserId: string;
  planId: string;
  kind: string;
  status: string;
  paymentStatus: string;
  accessStatus: string;
  subscriptionId: string;
  planSnapshot: {
    code: string;
    name: string;
    billingCycle: string;
    amountMinor: number;
    currency: string;
    description?: string;
  };
  expiryDate: string | null;
  currentPeriodEnd: string | null;
  adminOverride: {
    mode: "NONE" | "FORCED_ACTIVE" | "FORCED_BLOCKED";
    effectiveUntil: string | null;
    reason: string;
    updatedByAdminId: string | null;
    updatedAt: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
};
