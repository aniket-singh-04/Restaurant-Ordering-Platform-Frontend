// Filter option generators from enums
// These are used across the platform admin pages

export const orderStatusOptions = [
  { value: "", label: "All statuses" },
  { value: "CREATED", label: "Created" },
  { value: "HALF_PAID", label: "Half Paid" },
  { value: "PENDING_VALIDATION", label: "Pending Validation" },
  { value: "AWAITING_ADVANCE_PAYMENT", label: "Awaiting Advance Payment" },
  { value: "AWAITING_CASH_CONFIRMATION", label: "Awaiting Cash Confirmation" },
  { value: "PLACED", label: "Placed" },
  { value: "ACCEPTANCE_EXPIRED", label: "Acceptance Expired" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY", label: "Ready" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const paymentStatusOptions = [
  { value: "", label: "All payment statuses" },
  { value: "NO_PAID", label: "Not Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "PARTIALLY_SETTLED", label: "Partially Settled" },
  { value: "FULLY_SETTLED", label: "Fully Settled" },
  { value: "REFUND_PENDING", label: "Refund Pending" },
  { value: "REFUNDED", label: "Refunded" },
];

export const refundStatusOptions = [
  { value: "", label: "All refund statuses" },
  { value: "NOT_REQUIRED", label: "Not Required" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "FAILED", label: "Failed" },
];

export const orderTypeOptions = [
  { value: "", label: "All order types" },
  { value: "DINE_IN", label: "Dine In" },
  { value: "TAKEAWAY", label: "Takeaway" },
];

export const orderSourceOptions = [
  { value: "", label: "All sources" },
  { value: "QR_DINE_IN", label: "QR Dine In" },
  { value: "STAFF_CREATED", label: "Staff Created" },
];

export const paymentCollectionModeOptions = [
  { value: "", label: "All collection modes" },
  { value: "ONLINE_ADVANCE", label: "Online Advance" },
  { value: "ONLINE_FULL", label: "Online Full Payment" },
  { value: "CASH_CONFIRMED_BY_STAFF", label: "Cash by Staff" },
];

export const userRoleOptions = [
  { value: "", label: "All roles" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "RESTRO_OWNER", label: "Restaurant Owner" },
  { value: "BRANCH_OWNER", label: "Branch Owner" },
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "Legacy Admin" },
];

export const userStatusOptions = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INVITED", label: "Invited" },
  { value: "DISABLED", label: "Disabled" },
];

export const recordStatusOptions = [
  { value: "", label: "All records" },
  { value: "false", label: "Active records" },
  { value: "true", label: "Deleted records" },
];

export const reviewStatusOptions = [
  { value: "", label: "All review states" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export const suspensionStatusOptions = [
  { value: "", label: "All suspension states" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
];

export const providerOptions = [
  { value: "", label: "All providers" },
  { value: "STRIPE", label: "Stripe" },
  { value: "RAZORPAY", label: "Razorpay" },
  { value: "PAYPAL", label: "PayPal" },
];

export const subscriptionAccessStatusOptions = [
  { value: "", label: "All access statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "TRIAL", label: "Trial" },
];
