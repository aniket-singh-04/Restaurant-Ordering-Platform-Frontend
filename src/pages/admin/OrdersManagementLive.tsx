import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, Clock, RefreshCw, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  cancelOrder,
  confirmCashOrder,
  updateOrderStatus,
  useBranchOrders,
  useRestaurantOrders,
  type OrderRecord,
} from "../../features/orders/api";
import {
  listOrderPayments,
  type OrderRefundLogRecord,
  type OrderRefundPolicy,
} from "../../features/payments/api";
import { LoadingOrderCards } from "../../components/LoadingState";
import { formatPrice } from "../../utils/formatPrice";

const formatMinorAmount = (value?: number) => formatPrice((value ?? 0) / 100);

const statusActionLabels: Partial<Record<string, string>> = {
  PLACED: "Accept",
  ACCEPTANCE_EXPIRED: "Accept Anyway",
  ACCEPTED: "Start Preparing",
  PREPARING: "Mark Ready",
  READY: "Mark Served",
};

const nextStateMap: Partial<Record<string, string>> = {
  PLACED: "ACCEPTED",
  ACCEPTANCE_EXPIRED: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

const countdownLabel = (deadline?: string, now = Date.now()) => {
  if (!deadline) return null;
  const remaining = Math.max(new Date(deadline).getTime() - now, 0);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

const formatPaymentModeLabel = (mode?: string | null) => {
  if (mode === "ONLINE_ADVANCE") return "Online advance";
  if (mode === "ONLINE_FULL") return "Online full payment";
  if (mode === "CASH_CONFIRMED_BY_STAFF") return "Cash by staff";
  if (mode === "SETTLE_ON_READY") return "Settle on ready";
  return mode ?? "—";
};

const getPaidAmountLabel = (mode?: string | null) =>
  mode === "ONLINE_FULL" ? "Paid Online" : "Advance Paid";

const getEstimatedRefundPercent = (orderStatus: string) =>
  ["PREPARING", "READY", "COMPLETED"].includes(orderStatus) ? 25 : 100;

type RefundDetailsState = {
  loading?: boolean;
  open?: boolean;
  policy?: OrderRefundPolicy;
  logs?: OrderRefundLogRecord[];
  error?: string;
};

export default function OrdersManagementLive() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const branchId = user?.branchIds?.[0]?._id ?? user?.branchId;
  const isRestaurantScoped = user?.role === "RESTRO_OWNER" && Boolean(user?.restroId);
  const branchOrdersQuery = useBranchOrders(!isRestaurantScoped ? branchId : undefined);
  const restaurantOrdersQuery = useRestaurantOrders(isRestaurantScoped ? user?.restroId : undefined);
  const orders = (isRestaurantScoped ? restaurantOrdersQuery.data : branchOrdersQuery.data) ?? [];
  const loading = isRestaurantScoped ? restaurantOrdersQuery.isLoading : branchOrdersQuery.isLoading;
  const [filter, setFilter] = useState<string>("ALL");
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [refundDetailsByOrder, setRefundDetailsByOrder] = useState<
    Record<string, RefundDetailsState>
  >({});

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredOrders = useMemo(
    () => (filter === "ALL" ? orders : orders.filter((order) => order.OrderStatus === filter)),
    [filter, orders],
  );

  const statusOptions = useMemo(
    () => ["ALL", ...new Set(orders.map((order) => order.OrderStatus))],
    [orders],
  );

  const refreshOrders = async () => {
    await queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const toggleRefundDetails = async (orderId: string) => {
    const current = refundDetailsByOrder[orderId];
    if (current?.open) {
      setRefundDetailsByOrder((state) => ({
        ...state,
        [orderId]: {
          ...state[orderId],
          open: false,
        },
      }));
      return;
    }

    if (current?.policy || current?.error) {
      setRefundDetailsByOrder((state) => ({
        ...state,
        [orderId]: {
          ...state[orderId],
          open: true,
        },
      }));
      return;
    }

    setRefundDetailsByOrder((state) => ({
      ...state,
      [orderId]: {
        ...(state[orderId] ?? {}),
        loading: true,
        open: true,
      },
    }));

    try {
      const details = await listOrderPayments(orderId);
      setRefundDetailsByOrder((state) => ({
        ...state,
        [orderId]: {
          loading: false,
          open: true,
          policy: details.refundPolicy,
          logs: details.refundLogs,
        },
      }));
    } catch (error) {
      setRefundDetailsByOrder((state) => ({
        ...state,
        [orderId]: {
          loading: false,
          open: true,
          error: error instanceof Error ? error.message : "Unable to load refund details.",
        },
      }));
    }
  };

  const runAction = async (orderId: string, action: () => Promise<unknown>, successMessage: string) => {
    setActionOrderId(orderId);
    try {
      await action();
      await refreshOrders();
      pushToast({
        title: successMessage,
        variant: "success",
      });
    } catch (error: any) {
      pushToast({
        title: "Order update failed",
        description: error?.message ?? "Please try again.",
        variant: "error",
      });
    } finally {
      setActionOrderId(null);
    }
  };

  const renderPrimaryAction = (order: OrderRecord) => {
    if (order.paymentSummary?.canConfirmCash) {
      return (
        <button
          type="button"
          onClick={() => void runAction(order.id, () => confirmCashOrder(order.id), "Cash confirmed")}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          Confirm Cash
        </button>
      );
    }

    const nextState = nextStateMap[order.OrderStatus];
    if (!nextState) return null;

    if (
      order.OrderStatus === "READY" &&
      (order.paymentSummary?.remainingDue ?? 0) > 0
    ) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={() =>
          void runAction(
            order.id,
            () => updateOrderStatus(order.id, nextState),
            `Order moved to ${nextState}`,
          )
        }
        className="inline-flex items-center gap-1.5 rounded-md bg-[#ef6820] px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-orange-700 transition disabled:opacity-50"
      >
        {statusActionLabels[order.OrderStatus] ?? "Update"}
      </button>
    );
  };

  return (
    <div className="min-h-screen text-left">
      <header className="ui-card border-b border-[#eedbc8] bg-white shadow-xs sticky top-0 z-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#3b2f2f] truncate">Orders</h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-[#6b665f] truncate">Manage incoming, active, and refunded orders in real-time.</p>
            </div>

            <button
              type="button"
              onClick={() => void refreshOrders()}
              className="w-fit shrink-0 cursor-pointer inline-flex items-center gap-2 rounded-lg border border-[#ef6820] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-[#ef6820] transition hover:bg-orange-50 whitespace-nowrap"
            >
              <RefreshCw className="h-3.5 sm:h-4 w-3.5 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-5 space-y-6">
        {/* Filter Section */}
        <div className="bg-white rounded-lg border border-[#e5d5c6] p-4 sm:p-5">
          <p className="text-xs uppercase font-bold tracking-widest text-[#8d7967] mb-3">Order Status</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition whitespace-nowrap ${filter === status
                  ? "bg-[#ef6820] text-white shadow-md"
                  : "border border-[#e5d5c6] bg-white text-[#3b2f2f] hover:border-[#ef6820]"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <LoadingOrderCards count={3} />
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const nextCountdown = countdownLabel(order.acceptanceDeadlineAt, now);
              const estimatedRefundPercent = getEstimatedRefundPercent(order.OrderStatus);
              const estimatedRefundAmount =
                Math.round((order.totalsSnapshot?.grandTotal ?? 0) * (estimatedRefundPercent / 100));
              const refundDetails = refundDetailsByOrder[order.id];

              return (
                <article
                  key={order.id}
                  className="rounded-lg border border-[#e5d5c6] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-1 sm:px-6 py-4 sm:py-5 border-b border-[#f0e3d5]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-mono text-lg sm:text-xl font-bold text-[#3b2f2f]">#{order.id.slice(-6).toUpperCase()}</h3>
                          <span className={`rounded-md px-3 py-1 text-xs font-bold text-white shrink-0 ${order.OrderStatus === "COMPLETED" ? "bg-emerald-600" :
                            order.OrderStatus === "CANCELLED" ? "bg-red-600" :
                              order.OrderStatus === "READY" ? "bg-blue-600" :
                                order.OrderStatus === "PREPARING" ? "bg-amber-600" :
                                  "bg-slate-700"
                            }`}>
                            {order.OrderStatus}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-[#8d7967] font-medium">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Just now"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#ef6820] mb-1">{order.orderType}</p>
                        <p className="text-2xl font-bold text-[#3b2f2f]">{formatMinorAmount(order.totalsSnapshot?.grandTotal)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-5">
                    {/* Summary Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-md bg-[#fffaf5] px-3 py-3 border border-[#f0e3d5]">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#8d7967]">Payment</p>
                        <p className="mt-2 text-sm font-semibold text-[#3b2f2f]">{order.paymentStatus}</p>
                      </div>
                      <div className="rounded-md bg-[#fffaf5] px-3 py-3 border border-[#f0e3d5]">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#8d7967]">Refund</p>
                        <p className="mt-2 text-sm font-semibold text-[#3b2f2f] truncate">{order.refundStatus ?? order.refundSummary?.status ?? "—"}</p>
                      </div>
                      <div className="rounded-md bg-[#fffaf5] px-3 py-3 border border-[#f0e3d5]">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#8d7967]">Items</p>
                        <p className="mt-2 text-sm font-semibold text-[#3b2f2f]">{order.itemsSnapshot?.length ?? 0}</p>
                      </div>
                      <div className="rounded-md bg-[#fffaf5] px-3 py-3 border border-[#f0e3d5]">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#8d7967]">Mode</p>
                        <p className="mt-2 text-sm font-semibold text-[#3b2f2f] truncate">{formatPaymentModeLabel(order.paymentSummary?.mode)}</p>
                      </div>
                    </div>

                    <div className="rounded-md border border-[#f0e3d5] bg-[#fffaf5] px-4 py-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-[#8d7967]">
                            Refund Eligibility
                          </p>
                          <p className="mt-1.5 text-sm font-semibold text-[#3b2f2f]">
                            Estimated {estimatedRefundPercent}% refund
                          </p>
                          <p className="mt-1 text-xs text-[#6b665f]">
                            Current estimate: {formatMinorAmount(estimatedRefundAmount)} based on {order.OrderStatus}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            void toggleRefundDetails(order.id);
                          }}
                          className="inline-flex items-center gap-2 rounded-md border border-[#d8c0a7] px-3 py-2 text-xs font-semibold text-[#5d4d3f] transition hover:bg-white"
                        >
                          {refundDetails?.open ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          Refund timeline
                        </button>
                      </div>

                      {refundDetails?.open ? (
                        <div className="mt-4 space-y-3 border-t border-[#f0e3d5] pt-4">
                          {refundDetails.loading ? (
                            <p className="text-sm text-[#6b665f]">Loading refund details...</p>
                          ) : refundDetails.error ? (
                            <p className="text-sm text-red-600">{refundDetails.error}</p>
                          ) : (
                            <>
                              <div className="grid gap-3 sm:grid-cols-4">
                                <div className="rounded-md bg-white px-3 py-3 border border-[#f0e3d5]">
                                  <p className="text-xs font-bold uppercase tracking-widest text-[#8d7967]">Policy</p>
                                  <p className="mt-1.5 text-sm font-semibold text-[#3b2f2f]">
                                    {((refundDetails.policy?.refundPercentBps ?? 0) / 100).toFixed(0)}%
                                  </p>
                                </div>
                                <div className="rounded-md bg-white px-3 py-3 border border-[#f0e3d5]">
                                  <p className="text-xs font-bold uppercase tracking-widest text-[#8d7967]">Base Total</p>
                                  <p className="mt-1.5 text-sm font-semibold text-[#3b2f2f]">
                                    {formatMinorAmount(refundDetails.policy?.baseOrderAmount)}
                                  </p>
                                </div>
                                <div className="rounded-md bg-white px-3 py-3 border border-[#f0e3d5]">
                                  <p className="text-xs font-bold uppercase tracking-widest text-[#8d7967]">Refundable</p>
                                  <p className="mt-1.5 text-sm font-semibold text-[#3b2f2f]">
                                    {formatMinorAmount(refundDetails.policy?.capturedRefundableAmount)}
                                  </p>
                                </div>
                                <div className="rounded-md bg-white px-3 py-3 border border-[#f0e3d5]">
                                  <p className="text-xs font-bold uppercase tracking-widest text-[#8d7967]">Requested</p>
                                  <p className="mt-1.5 text-sm font-semibold text-[#3b2f2f]">
                                    {formatMinorAmount(refundDetails.policy?.requestedAmount)}
                                  </p>
                                </div>
                              </div>

                              {(refundDetails.logs ?? []).length ? (
                                <div className="space-y-2">
                                  {(refundDetails.logs ?? []).map((log) => (
                                    <div
                                      key={log.id}
                                      className="rounded-md border border-[#f0e3d5] bg-white px-3 py-3"
                                    >
                                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm font-semibold text-[#3b2f2f]">
                                          {log.actionType.replaceAll("_", " ")}
                                        </p>
                                        <p className="text-xs text-[#8d7967]">
                                          {log.createdAt
                                            ? new Date(log.createdAt).toLocaleString()
                                            : "Pending"}
                                        </p>
                                      </div>
                                      <p className="mt-1 text-sm text-[#6b665f]">{log.message}</p>
                                      <p className="mt-1 text-xs font-medium text-[#8d7967]">
                                        Status: {log.status}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-[#6b665f]">
                                  No refund actions have been logged for this order yet.
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Payment Summary */}
                    <div className="rounded-md bg-[#fffaf5] px-4 py-3 border border-[#f0e3d5]">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-[#8d7967]">{getPaidAmountLabel(order.paymentSummary?.mode)}</p>
                          <p className="mt-1.5 text-sm font-semibold text-[#3b2f2f]">{formatMinorAmount(order.paymentSummary?.advanceReceived)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-[#8d7967]">Remaining</p>
                          <p className="mt-1.5 text-sm font-bold text-[#ef6820]">{formatMinorAmount(order.paymentSummary?.remainingDue)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-widest text-[#8d7967]">Total</p>
                          <p className="mt-1.5 text-sm font-semibold text-[#3b2f2f]">{formatMinorAmount(order.totalsSnapshot?.grandTotal)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Items Section */}
                    {(order.itemsSnapshot ?? []).length > 0 && (
                      <div className="border-t border-[#f0e3d5] pt-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#8d7967] mb-3">Items Ordered</p>
                        <div className="space-y-3">
                          {order.itemsSnapshot?.map((item) => (
                            <div
                              key={`${order.id}-${item.itemId}-${item.nameSnapshot}`}
                              className="rounded-md border border-[#f0e3d5] p-3 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-[#3b2f2f]">{item.nameSnapshot}</p>
                                  <p className="text-xs text-[#6b665f] mt-0.5">{formatMinorAmount(item.priceSnapshot)} each</p>
                                </div>
                                <div className="text-center shrink-0">
                                  <div className="rounded-md bg-white border-2 border-[#ef6820] px-2.5 py-1.5 inline-block">
                                    <span className="text-sm font-bold text-[#ef6820]">×{item.quantity}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-bold text-[#3b2f2f]">{formatMinorAmount(item.lineTotalSnapshot)}</p>
                                  <p className="text-xs text-[#8d7967]">subtotal</p>
                                </div>
                              </div>
                              {(item.addonsSnapshot ?? []).length > 0 && (
                                <div className="mt-2.5 pt-2.5 border-t border-[#e5d5c6]">
                                  <p className="text-xs font-semibold text-[#8d7967] mb-2 uppercase tracking-wide">Add-ons:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {item.addonsSnapshot?.map((addon) => (
                                      <span
                                        key={`${item.itemId}-${addon.code ?? addon.nameSnapshot}`}
                                        className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#7a624f] border border-[#e5d5c6] whitespace-nowrap"
                                        title={`${addon.nameSnapshot} +${formatMinorAmount(addon.priceDeltaSnapshot)}`}
                                      >
                                        <span>{addon.nameSnapshot}</span>
                                        <span className="ml-1.5 text-[#c2a878] font-semibold">+{formatMinorAmount(addon.priceDeltaSnapshot)}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alerts */}
                    {nextCountdown && order.OrderStatus !== "ACCEPTED" && order.OrderStatus !== "COMPLETED" && (
                      <div className="rounded-md border border-blue-300 bg-blue-50 px-4 py-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                        <div className="text-sm text-blue-900">
                          <strong>Deadline:</strong> <span className="ml-1 font-mono">{nextCountdown}</span>
                        </div>
                      </div>
                    )}

                    {order.paymentSummary?.canInitiateFinalOnlinePayment && (
                      <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-semibold text-amber-900">⚠ Balance Pending</p>
                        <p className="mt-1 text-xs text-amber-800">Customer can complete payment online or staff can collect cash.</p>
                      </div>
                    )}

                    {order.OrderStatus === "READY" && (order.paymentSummary?.remainingDue ?? 0) > 0 && (
                      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3">
                        <p className="text-sm font-semibold text-red-900">⚠ Action Required</p>
                        <p className="mt-1 text-xs text-red-800">Collect remaining ₹{(order.paymentSummary?.remainingDue ?? 0) / 100} before completing.</p>
                      </div>
                    )}
                  </div>

                  {/* Footer - Actions */}
                  <div className="bg-[#fffaf5] px-5 sm:px-6 py-4 border-t border-[#f0e3d5] flex flex-wrap gap-2 justify-end">
                    {renderPrimaryAction(order)}

                    {order.canStaffCancel && order.OrderStatus !== "CANCELLED" && order.OrderStatus !== "COMPLETED" && (
                      <button
                        type="button"
                        disabled={actionOrderId === order.id}
                        onClick={() =>
                          void runAction(
                            order.id,
                            () => cancelOrder(order.id, "Cancelled by restaurant staff."),
                            "Order cancelled",
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border-2 border-red-500 px-3 py-2 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Cancel Order
                      </button>
                    )}

                    {order.OrderStatus === "COMPLETED" && (
                      <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-700">
                        <Check className="h-4 w-4" />
                        Completed
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#d9c1a8] bg-white px-8 py-16 text-center">
            <p className="font-semibold text-[#3b2f2f]">No orders found</p>
            <p className="mt-2 text-sm text-[#6b665f]">Adjust your filters or refresh to see pending orders.</p>
          </div>
        )}
      </main>
    </div>
  );
}
