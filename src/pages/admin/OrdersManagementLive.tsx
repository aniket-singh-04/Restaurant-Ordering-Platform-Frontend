import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Clock, RefreshCw, X } from "lucide-react";
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
    if (order.OrderStatus === "AWAITING_CASH_CONFIRMATION") {
      return (
        <button
          type="button"
          onClick={() => void runAction(order.id, () => confirmCashOrder(order.id), "Cash confirmed")}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
        >
          Confirm Cash
        </button>
      );
    }

    const nextState = nextStateMap[order.OrderStatus];
    if (!nextState) return null;

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
        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white"
      >
        {statusActionLabels[order.OrderStatus] ?? "Update"}
      </button>
    );
  };

  return (
    <div className="min-h-screen space-y-6 bg-[#fff9f2] text-left">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#3b2f2f]">Orders</h1>
          <p className="mt-1 text-[#6b665f]">Manage incoming, active, and refunded orders.</p>
        </div>

        <button
          type="button"
          onClick={() => void refreshOrders()}
          className="inline-flex items-center gap-2 rounded-xl border border-[#ef6820] px-4 py-2 text-sm font-medium text-[#ef6820] transition hover:bg-white"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === status
                ? "bg-[#3b2f2f] text-white"
                : "border border-[#e5d5c6] bg-white text-[#3b2f2f]"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-3xl border border-dashed border-[#d9c1a8] bg-white px-6 py-8 text-[#6d5c4d]">
          Loading orders...
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredOrders.map((order) => {
            const nextCountdown = countdownLabel(order.acceptanceDeadlineAt, now);

            return (
              <article
                key={order.id}
                className="rounded-3xl border border-[#eedbc8] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-[#3b2f2f]">{order.id}</h2>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                        {order.OrderStatus}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#6b665f]">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Just now"}
                    </p>
                  </div>

                  <div className="text-sm text-[#3b2f2f]">
                    <p>{order.orderType}</p>
                    <p>{formatMinorAmount(order.totalsSnapshot?.grandTotal)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-[#fff9f2] px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-[#8d7967]">Payment</p>
                    <p className="mt-1 font-medium text-[#3b2f2f]">{order.paymentStatus}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fff9f2] px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-[#8d7967]">Refund</p>
                    <p className="mt-1 font-medium text-[#3b2f2f]">
                      {order.refundStatus ?? order.refundSummary?.status ?? "NOT_REQUIRED"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fff9f2] px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-[#8d7967]">Items</p>
                    <p className="mt-1 font-medium text-[#3b2f2f]">{order.itemsSnapshot?.length ?? 0}</p>
                  </div>
                </div>

                {nextCountdown && order.OrderStatus !== "ACCEPTED" && order.OrderStatus !== "COMPLETED" && (
                  <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <Clock className="mr-2 inline h-4 w-4" />
                    Acceptance deadline: {nextCountdown}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
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
                      className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white"
                    >
                      <X className="mr-2 inline h-4 w-4" />
                      Cancel
                    </button>
                  )}

                  {order.OrderStatus === "COMPLETED" && (
                    <span className="rounded-xl border border-green-200 px-4 py-2 text-sm text-green-700">
                      <Check className="mr-2 inline h-4 w-4" />
                      Completed
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[#d9c1a8] bg-white px-6 py-8 text-[#6d5c4d]">
          No orders found for the current scope.
        </div>
      )}
    </div>
  );
}
