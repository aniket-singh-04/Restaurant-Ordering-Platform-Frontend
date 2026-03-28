import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
  exceptionCancelPlatformOrder,
  getPlatformAdminOrder,
  usePlatformAdminOrders,
} from "../../features/platform-admin/orders/api";
import type { AdminOrderRecord } from "../../features/platform-admin/auth/types";
import { formatPrice } from "../../utils/formatPrice";
import { FilterListBox } from "../../components/FilterListBox";
import {
  orderStatusOptions,
  paymentStatusOptions,
  orderTypeOptions,
  orderSourceOptions,
  paymentCollectionModeOptions,
} from "../../utils/filterOptions";


export default function PlatformAdminOrders() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [orderType, setOrderType] = useState("");
  const [orderSource, setOrderSource] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();

  const cardClass = "rounded-[28px] bg-white p-6 shadow-md border border-[#f0e6dc]";
  const query = useMemo(
    () => ({
      page: 1,
      limit: 20,
      search,
      status,
      paymentStatus,
      orderType,
      orderSource,
      paymentMode,
    }),
    [search, status, paymentStatus, orderType, orderSource, paymentMode],
  );

  const orders = usePlatformAdminOrders(query);
  const orderDetail = useQuery({
    queryKey: ["platform-admin", "order-detail", selectedOrderId],
    enabled: Boolean(selectedOrderId),
    queryFn: async () => getPlatformAdminOrder(selectedOrderId as string),
  });

  useEffect(() => {
    if (!selectedOrderId && orders.data?.items[0]?.id) {
      setSelectedOrderId(orders.data.items[0].id);
    }
  }, [orders.data, selectedOrderId]);

  const cancelMutation = useMutation({
    mutationFn: (payload: {
      orderId: string;
      reasonCategory: "DISPUTE" | "SYSTEM_FAILURE";
      reason: string;
      refundCapturedPayments: boolean;
    }) => exceptionCancelPlatformOrder(payload.orderId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform-admin", "orders"] });
      void queryClient.invalidateQueries({ queryKey: ["platform-admin", "order-detail"] });
    },
  });

  const handleExceptionCancel = async (order: AdminOrderRecord) => {
    const reasonCategoryInput = window.prompt(
      `Cancel ${order.id}\nReason category (DISPUTE or SYSTEM_FAILURE):`,
      "DISPUTE",
    );
    if (!reasonCategoryInput) return;

    const normalizedReasonCategory = reasonCategoryInput.trim().toUpperCase();
    if (normalizedReasonCategory !== "DISPUTE" && normalizedReasonCategory !== "SYSTEM_FAILURE") {
      pushToast({
        title: "Invalid reason category",
        description: "Use DISPUTE or SYSTEM_FAILURE.",
        variant: "warning",
      });
      return;
    }

    const reason = window.prompt(`Describe why ${order.id} is being exception-cancelled:`, "");
    if (!reason?.trim()) return;

    try {
      await cancelMutation.mutateAsync({
        orderId: order.id,
        reasonCategory: normalizedReasonCategory,
        reason: reason.trim(),
        refundCapturedPayments: true,
      });
      pushToast({
        title: "Order cancelled",
        variant: "success",
      });
    } catch (error) {
      pushToast({
        title: "Exception cancel failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <div className="grid gap-3 xl:grid-cols-[1.5fr_0.5fr] overflow-x-hidden">
      {/* LEFT SECTION */}
      <section className="space-y-6 min-w-0">
        {/* FILTERS CARD */}
        <div className={cardClass}>
          <p className="text-xs uppercase tracking-[0.35em] text-[#8b7661]">Orders</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#3a2b20]">
            Exception-only Order Control
          </h1>

          <div className="mt-6 space-y-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order or actor IDs..."
              className="w-full rounded-2xl border border-[#e0d2c3] px-4 py-3 text-sm placeholder-[#a89c8f] shadow-sm transition-all hover:border-[#d7c8b7] focus:border-[#9d8c7a] focus:outline-none focus:ring-2 focus:ring-[#8f5f2f] focus:ring-opacity-20"
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FilterListBox label="Order Status" options={orderStatusOptions} value={status} onChange={setStatus} placeholder="Filter by status" />
              <FilterListBox label="Payment Status" options={paymentStatusOptions} value={paymentStatus} onChange={setPaymentStatus} placeholder="Filter by payment" />
              <FilterListBox label="Order Type" options={orderTypeOptions} value={orderType} onChange={setOrderType} placeholder="Filter by type" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FilterListBox label="Order Source" options={orderSourceOptions} value={orderSource} onChange={setOrderSource} placeholder="Filter by source" />
              <FilterListBox label="Payment Mode" options={paymentCollectionModeOptions} value={paymentMode} onChange={setPaymentMode} placeholder="Filter by mode" />
            </div>
          </div>
        </div>

        {/* ORDERS TABLE CARD */}
        <div className={cardClass}>
          {orders.isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-12 rounded-2xl bg-[#f4efe7]" />
              <div className="h-12 rounded-2xl bg-[#f4efe7]" />
              <div className="h-12 rounded-2xl bg-[#f4efe7]" />
            </div>
          ) : orders.isError || !orders.data ? (
            <div className="rounded-2xl bg-[#fff0f0] p-4 flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-[#d84040]" />
              <div>
                <h3 className="font-semibold text-[#d84040]">Failed to load orders</h3>
                <p className="text-sm text-[#b84040]">
                  {orders.error instanceof Error ? orders.error.message : "Please try again."}
                </p>
              </div>
            </div>
          ) : orders.data.items.length ? (
            <div className="overflow-x-auto rounded-2xl border border-[#f0e6dc]">
              <table className="min-w-full text-left text-sm divide-y divide-[#f0e6dc]">
                <thead className="bg-[#faf6f0]">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-[#8b7661]">Order</th>
                    <th className="px-4 py-3 font-semibold text-[#8b7661]">Status</th>
                    <th className="px-4 py-3 font-semibold text-[#8b7661]">Payment</th>
                    <th className="px-4 py-3 font-semibold text-[#8b7661]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data.items.map((order) => (
                    <tr
                      key={order.id}
                      className={`cursor-pointer transition-colors ${selectedOrderId === order.id ? "bg-[#fdf8f2]" : "hover:bg-[#fef8f3]"
                        }`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#3a2b20]">{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-[#a89c8f]">{order.restaurantId ?? "No restaurant id"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#f4efe7] px-3 py-1 text-xs font-medium text-[#8b7661]">
                          {order.OrderStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#3a2b20]">{order.paymentStatus}</p>
                        <p className="text-xs text-[#a89c8f]">{order.refundStatus ?? "NOT_REQUIRED"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); void handleExceptionCancel(order); }}
                          disabled={cancelMutation.isPending}
                          className="rounded-full border border-[#ffc8c8] bg-[#fff5f5] px-3 py-2 text-xs font-semibold text-[#d84040] transition hover:bg-[#ffecec] disabled:opacity-50"
                        >
                          Exception Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#f4efe7] p-6 text-center text-[#a89c8f]">
              No orders matched the current filters.
            </div>
          )}
        </div>
      </section>

      {/* RIGHT SECTION */}
      <aside className={cardClass}>
        <h2 className="font-serif text-2xl font-semibold text-[#3a2b20]">Selected Order</h2>
        {orderDetail.isLoading ? (
          <div className="mt-4 space-y-4 animate-pulse">
            <div className="h-12 rounded-2xl bg-[#f4efe7]" />
            <div className="h-12 rounded-2xl bg-[#f4efe7]" />
            <div className="h-12 rounded-2xl bg-[#f4efe7]" />
          </div>
        ) : orderDetail.isError || !orderDetail.data ? (
          <div className="mt-4 rounded-2xl bg-[#f4efe7] p-4 text-center text-[#a89c8f]">
            Select an order to inspect its payment and refund history.
          </div>
        ) : (
          <div className="mt-6 space-y-5 text-sm">
            {/** Order Details */}
            <div className="border-b border-[#efe6da] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7661]">Order ID</p>
              <p className="mt-2 font-mono text-[#3a2b20]">{orderDetail.data.order.id}</p>
            </div>

            <div className="border-b border-[#efe6da] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7661]">Status</p>
              <span className="mt-2 inline-block rounded-full bg-[#f4efe7] px-3 py-1 text-[#8f5f2f] font-medium">
                {orderDetail.data.order.OrderStatus}
              </span>
            </div>

            <div className="border-b border-[#efe6da] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7661]">Grand Total</p>
              <p className="mt-2 font-serif text-2xl font-bold text-[#3a2b20]">
                {formatPrice((orderDetail.data.order.totalsSnapshot?.grandTotal ?? 0) / 100)}
              </p>
            </div>

            <div className="border-b border-[#efe6da] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7661]">Cancellation Reason</p>
              <p className="mt-2 text-[#a89c8f]">{orderDetail.data.order.cancellationReason || "No cancellation recorded"}</p>
            </div>

            <div className="border-b border-[#efe6da] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7661]">Payment Attempts</p>
              <p className="mt-2 font-semibold text-[#3a2b20]">{orderDetail.data.paymentAttempts.length}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7661]">Refunds</p>
              <p className="mt-2 font-semibold text-[#3a2b20]">{orderDetail.data.refunds.length}</p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
