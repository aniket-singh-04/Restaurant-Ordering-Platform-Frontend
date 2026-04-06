import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Clock3, CreditCard, Receipt, ScrollText } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../components/Header/Header";
import { LoadingOrderCards } from "../../../components/LoadingState";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  cancelOrder,
  type OrderRecord,
  useMyOrders,
} from "../../../features/orders/api";
import { useLiveOrderSync } from "../../../features/orders/useLiveOrderSync";
import {
  confirmOrderPayment,
  failOrderPayment,
  initiateOrderPayment,
} from "../../../features/payments/api";
import { useRazorpayCheckout } from "../../../hooks/useRazorpayCheckout";
import { formatPrice } from "../../../utils/formatPrice";
import { goBackOrNavigate } from "../../../utils/navigation";
import { getApiErrorMessage } from "../../../utils/apiErrorHelpers";

const formatMinorAmount = (value?: number) => formatPrice((value ?? 0) / 100);

const isPastOrder = (order: OrderRecord) =>
  order.OrderStatus === "COMPLETED" || order.OrderStatus === "CANCELLED";

const sortByRecent = (orders: OrderRecord[]) =>
  [...orders].sort((left, right) => {
    const leftDate = new Date(left.createdAt ?? 0).getTime();
    const rightDate = new Date(right.createdAt ?? 0).getTime();
    return rightDate - leftDate;
  });

const formatPaymentModeLabel = (mode?: string | null) => {
  if (mode === "ONLINE_ADVANCE") return "Online advance";
  if (mode === "ONLINE_FULL") return "Online full payment";
  if (mode === "CASH_CONFIRMED_BY_STAFF") return "Cash by staff";
  if (mode === "SETTLE_ON_READY") return "Settle on ready";
  return mode ?? "N/A";
};

const getPaidAmountLabel = (mode?: string | null) =>
  mode === "ONLINE_FULL" ? "Paid online" : "Advance paid";

const getAdvanceActionLabel = (mode?: string | null) =>
  mode === "ONLINE_FULL" ? "Pay Full Amount Online" : "Pay Advance Online";

const renderSettlementCopy = (order: OrderRecord) => {
  if (order.paymentSummary?.canInitiateAdvancePayment) {
    return order.paymentSummary?.mode === "ONLINE_FULL"
      ? "Pay the full order total online to move this order into the kitchen queue."
      : "Pay the required advance online to move this order into the kitchen queue.";
  }

  if (order.paymentSummary?.canInitiateFinalOnlinePayment) {
    return "Your order is ready. Settle the remaining amount now or pay cash at the counter.";
  }

  if (order.paymentSummary?.canConfirmCash) {
    return "Cash settlement is available. The restaurant team will confirm it once collected.";
  }

  return null;
};

const OrderCard = ({
  order,
  highlighted,
  actionLabel,
  actionLoading,
  onPay,
  onCancel,
}: {
  order: OrderRecord;
  highlighted: boolean;
  actionLabel?: string | null;
  actionLoading?: boolean;
  onPay: (order: OrderRecord, purpose: "ADVANCE" | "FINAL_SETTLEMENT") => Promise<void>;
  onCancel: (order: OrderRecord) => Promise<void>;
}) => {
  const settlementCopy = renderSettlementCopy(order);

  return (
    <article
      className={`rounded-[2rem] border p-5 shadow-sm transition ${
        highlighted
          ? "border-orange-300 bg-[color:var(--accent-soft)]"
          : "border-[#eedbc8] bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-[#3b2f2f]">{order.id}</h2>
            <span className="ui-badge ui-badge--neutral bg-slate-900 px-3 py-1 text-white">
              {order.OrderStatus}
            </span>
            <span className="ui-badge ui-badge--accent">
              {order.orderType}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#6b665f]">
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString()
              : "Created recently"}
          </p>
        </div>

        <div className="grid gap-2 text-sm text-[#3b2f2f]">
          <p>
            Payment <span className="font-semibold">{order.paymentStatus}</span>
          </p>
          <p>
            Refund{" "}
            <span className="font-semibold">
              {order.refundStatus ?? order.refundSummary?.status ?? "NOT_REQUIRED"}
            </span>
          </p>
          <p>
            Total{" "}
            <span className="font-semibold">
              {formatMinorAmount(order.totalsSnapshot?.grandTotal)}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-[color:var(--surface-muted)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[#8d7967]">
            {getPaidAmountLabel(order.paymentSummary?.mode)}
          </p>
          <p className="mt-1 font-semibold text-[#3b2f2f]">
            {formatMinorAmount(order.paymentSummary?.advanceReceived)}
          </p>
        </div>
        <div className="rounded-2xl bg-[color:var(--surface-muted)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[#8d7967]">Remaining</p>
          <p className="mt-1 font-semibold text-[#3b2f2f]">
            {formatMinorAmount(order.paymentSummary?.remainingDue)}
          </p>
        </div>
        <div className="rounded-2xl bg-[color:var(--surface-muted)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[#8d7967]">Mode</p>
          <p className="mt-1 font-semibold text-[#3b2f2f]">
            {formatPaymentModeLabel(order.paymentSummary?.mode)}
          </p>
        </div>
        <div className="rounded-2xl bg-[color:var(--surface-muted)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[#8d7967]">Settlement</p>
          <p className="mt-1 font-semibold text-[#3b2f2f]">
            {order.paymentSummary?.settlementStatus ?? "N/A"}
          </p>
        </div>
      </div>

      {order.acceptanceDeadlineAt &&
        !["ACCEPTED", "PREPARING", "READY", "COMPLETED", "CANCELLED"].includes(order.OrderStatus) && (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <Clock3 className="mr-2 inline h-4 w-4" />
            Restaurant acceptance deadline:{" "}
            {new Date(order.acceptanceDeadlineAt).toLocaleTimeString()}
          </div>
        )}

      {settlementCopy && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {settlementCopy}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {(order.itemsSnapshot ?? []).map((item) => (
          <div
            key={`${order.id}-${item.itemId}-${item.nameSnapshot}`}
            className="rounded-2xl border border-[#f2e5d7] bg-[#fffaf5] px-4 py-4"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-[#3b2f2f]">
                  {item.nameSnapshot} x {item.quantity}
                </p>
                <p className="mt-1 text-sm text-[#6b665f]">
                  Base price {formatMinorAmount(item.priceSnapshot)} each
                </p>
              </div>
              <p className="font-semibold text-[#3b2f2f]">
                {formatMinorAmount(item.lineTotalSnapshot)}
              </p>
            </div>

            {(item.addonsSnapshot ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.addonsSnapshot?.map((addon) => (
                  <span
                    key={`${item.itemId}-${addon.code ?? addon.nameSnapshot}`}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#7a624f]"
                  >
                    {addon.nameSnapshot} (+{formatMinorAmount(addon.priceDeltaSnapshot)})
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {order.paymentSummary?.canInitiateAdvancePayment && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => void onPay(order, "ADVANCE")}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CreditCard className="h-4 w-4" />
            {actionLoading
              ? "Opening payment..."
              : getAdvanceActionLabel(order.paymentSummary?.mode)}
          </button>
        )}

        {order.paymentSummary?.canInitiateFinalOnlinePayment && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => void onPay(order, "FINAL_SETTLEMENT")}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Receipt className="h-4 w-4" />
            {actionLoading ? "Opening payment..." : "Pay Remaining Online"}
          </button>
        )}

        {order.paymentSummary?.canConfirmCash && (
          <span className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
            Cash at counter is available for this order.
          </span>
        )}

        {order.canCustomerCancel && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => void onCancel(order)}
            className="cursor-pointer rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionLoading && actionLabel === "cancel" ? "Cancelling..." : "Cancel Order"}
          </button>
        )}
      </div>
    </article>
  );
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { pushToast } = useToast();
  const { openCheckout, loading: checkoutLoading } = useRazorpayCheckout();
  const ordersQuery = useMyOrders();
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [actionKind, setActionKind] = useState<string | null>(null);

  useLiveOrderSync();

  const highlightedOrderId = useMemo(
    () => new URLSearchParams(location.search).get("order"),
    [location.search],
  );

  const activeOrders = useMemo(
    () => sortByRecent((ordersQuery.data ?? []).filter((order) => !isPastOrder(order))),
    [ordersQuery.data],
  );

  const pastOrders = useMemo(
    () => sortByRecent((ordersQuery.data ?? []).filter(isPastOrder)),
    [ordersQuery.data],
  );

  const refreshOrders = async () => {
    await queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const handleOrderPayment = async (
    order: OrderRecord,
    purpose: "ADVANCE" | "FINAL_SETTLEMENT",
  ) => {
    if (!user) {
      navigate("/login", {
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }

    setActionOrderId(order.id);
    setActionKind(purpose);

    let paymentAttemptId = "";
    let attemptAmount = 0;

    try {
      const payment = await initiateOrderPayment(order.id, {
        purpose,
        idempotencyKey: `${purpose.toLowerCase()}-${order.id}-${Date.now()}`,
      });

      paymentAttemptId =
        payment.paymentAttempt.id ?? payment.paymentAttempt._id ?? "";
      attemptAmount = payment.paymentAttempt.amount;

      const result = await openCheckout({
        key: payment.checkout.keyId,
        amount: payment.checkout.amount,
        currency: payment.checkout.currency,
        order_id: payment.checkout.orderId,
        name: payment.checkout.name,
        description: payment.checkout.description,
        notes: payment.checkout.notes,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: { color: "#f97415" },
      });

      if (paymentAttemptId) {
        await confirmOrderPayment(paymentAttemptId, {
          razorpay_order_id: result.razorpay_order_id,
          razorpay_payment_id: result.razorpay_payment_id,
          razorpay_signature: result.razorpay_signature,
          amount: attemptAmount,
        });
      }

      await refreshOrders();
      pushToast({
        title:
          purpose === "ADVANCE"
            ? order.paymentSummary?.mode === "ONLINE_FULL"
              ? "Full payment completed"
              : "Advance payment completed"
            : "Final settlement completed",
        variant: "success",
      });
    } catch (error) {
      if (paymentAttemptId) {
        await failOrderPayment(paymentAttemptId, {
          message: getApiErrorMessage(error),
          retryable: true,
          failureSource: "CUSTOMER",
        }).catch(() => undefined);
      }

      pushToast({
        title: "Payment could not be completed",
        description: getApiErrorMessage(error),
        variant: "warning",
      });
    } finally {
      setActionOrderId(null);
      setActionKind(null);
    }
  };

  const handleCancelOrder = async (order: OrderRecord) => {
    setActionOrderId(order.id);
    setActionKind("cancel");

    try {
      await cancelOrder(order.id, "Cancelled by customer.");
      await refreshOrders();
      pushToast({
        title: "Order cancelled",
        description:
          "If an online payment was already captured, the refund flow will continue automatically.",
        variant: "success",
      });
    } catch (error) {
      pushToast({
        title: "Unable to cancel order",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    } finally {
      setActionOrderId(null);
      setActionKind(null);
    }
  };

  return (
    <>
      <Header />

      <main className="app-shell min-h-screen px-4 py-6">
        <div className="app-container space-y-8">
          <section className="ui-card rounded-[2rem]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => goBackOrNavigate(navigate, "/", location.key)}
                    className="ui-icon-button warm-linear h-11 min-w-11 border-transparent text-white shadow-[var(--shadow-glow)]"
                    aria-label="Go back"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </button>
                  <div>
                    <h1 className="text-3xl font-semibold text-[#3b2f2f]">Your Orders</h1>
                    <p className="mt-1 text-sm text-[#6b665f]">
                      Track live kitchen progress, settlement status, and older orders in one place.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="ui-button-secondary ui-button-pill px-4 text-sm font-medium"
                >
                  Open Profile
                </button>
                <button
                  type="button"
                  onClick={() => void refreshOrders()}
                  className="ui-button ui-button-pill px-4 text-sm font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-[#ef6820]" />
              <h2 className="text-2xl font-semibold text-[#3b2f2f]">Active Orders</h2>
            </div>

            {ordersQuery.isLoading ? (
              <LoadingOrderCards count={2} />
            ) : activeOrders.length > 0 ? (
              <div className="grid gap-5">
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    highlighted={
                      highlightedOrderId === order.id || highlightedOrderId === order._id
                    }
                    actionLabel={actionKind}
                    actionLoading={
                      (checkoutLoading || Boolean(actionKind)) && actionOrderId === order.id
                    }
                    onPay={handleOrderPayment}
                    onCancel={handleCancelOrder}
                  />
                ))}
              </div>
            ) : (
              <div className="ui-empty-state rounded-[2rem] px-6 py-8 text-[#6d5c4d]">
                You do not have any active orders right now.
              </div>
            )}
          </section>

          <section className="space-y-4 pb-8">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#3b2f2f]" />
              <h2 className="text-2xl font-semibold text-[#3b2f2f]">Past Orders</h2>
            </div>

            {ordersQuery.isLoading ? (
              <LoadingOrderCards count={2} />
            ) : pastOrders.length > 0 ? (
              <div className="grid gap-5">
                {pastOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    highlighted={false}
                    onPay={handleOrderPayment}
                    onCancel={handleCancelOrder}
                  />
                ))}
              </div>
            ) : (
              <div className="ui-empty-state rounded-[2rem] px-6 py-8 text-[#6d5c4d]">
                Completed and cancelled orders will appear here.
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
