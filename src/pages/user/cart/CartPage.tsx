import { Minus, Plus, Trash2 } from "lucide-react";
import Header from "../../../components/Header/Header";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import { formatPrice } from "../../../utils/formatPrice";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useToast } from "../../../context/ToastContext";
import { useMemo, useState } from "react";
import { createOrder } from "../../../features/orders/api";
import {
  confirmOrderPayment,
  failOrderPayment,
  initiateOrderPayment,
} from "../../../features/payments/api";
import { isAdminPanelRole } from "../../../features/auth/access";
import { useAuth } from "../../../context/AuthContext";
import { useActiveQrContext } from "../../../features/qr-context/useActiveQrContext";
import { useRazorpayCheckout } from "../../../hooks/useRazorpayCheckout";
import {
  buildQrMenuPath,
  useResolvedQrId,
} from "../../../features/qr-context/navigation";
import FullPageLoader from "../../../components/FullPageLoader";
import { goBackOrNavigate } from "../../../utils/navigation";

const TAX_RATE = 0.05;

export default function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const { pushToast } = useToast();
  const qrId = useResolvedQrId();
  const qrContextQuery = useActiveQrContext(qrId);
  const qrContext = qrContextQuery.data;
  const { user } = useAuth();
  const shouldBlockCustomerMenu = Boolean(!qrId && user && isAdminPanelRole(user.role));
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  const [paymentMode, setPaymentMode] = useState<
    "ONLINE_ADVANCE" | "CASH_CONFIRMED_BY_STAFF" | "SETTLE_ON_READY"
  >("ONLINE_ADVANCE");
  const { openCheckout, loading: checkoutLoading } = useRazorpayCheckout();

  const tax = Math.round(subtotal * TAX_RATE);
  const dineInCharge = orderType === "DINE_IN" ? 20 : 0;
  const total = subtotal + tax + dineInCharge;
  const hasCheckoutContext = useMemo(
    () =>
      Boolean(
        qrContext?.restaurant.id &&
        qrContext?.branch.id &&
        (orderType === "TAKEAWAY" || qrContext?.table.id),
      ),
    [orderType, qrContext],
  );

  if (shouldBlockCustomerMenu) {
    return <Navigate to="/admin" replace />;
  }

  if (qrId && qrContextQuery.isLoading) {
    return <FullPageLoader label="Loading cart..." />;
  }

  if (qrId && qrContextQuery.isError) {
    return (
      <>
        <Header />
        <main className="app-shell px-4 pt-11">
          <div className="app-container rounded-3xl border border-red-200 bg-red-50 p-6 text-left text-red-800">
            <h1 className="font-display text-2xl font-semibold">This QR code is not available.</h1>
            <p className="mt-2 text-sm text-red-700">
              {qrContextQuery.error instanceof Error
                ? qrContextQuery.error.message
                : "Please ask the restaurant team for a fresh table QR code."}
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="app-shell min-h-screen px-4 pb-40">
        <div className="app-container space-y-5 pt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back to menu"
              onClick={() => goBackOrNavigate(navigate, buildQrMenuPath(qrId), location.key)}
              className="ui-icon-button warm-linear border-transparent text-white shadow-[var(--shadow-glow)]"
            >
              <IoMdArrowRoundBack size={22} />
            </button>
            <div>
              <p className="ui-eyebrow">Checkout</p>
              <h1 className="font-display text-3xl font-semibold text-[color:var(--text-primary)]">Your Cart</h1>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="ui-empty-state p-8 text-center text-[color:var(--text-secondary)]">
              Your cart is empty.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="ui-card flex gap-4 rounded-[1.6rem] p-4"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between">
                    <h3 className="font-semibold text-[color:var(--text-primary)]">{item.name}</h3>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={18} className="text-red-500 cursor-pointer" />
                    </button>
                  </div>

                  {item.addOns.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.addOns.map((addOn) => (
                        <span
                          key={`${item.id}-${addOn.name}`}
                          className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--accent)]"
                        >
                          {addOn.name} (+{formatPrice(addOn.price)})
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-[color:var(--text-secondary)]">
                    Unit total {formatPrice(item.finalUnitPrice)}
                  </p>

                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={`Decrease quantity for ${item.name}`}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)]"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="font-medium">{item.quantity}</span>

                      <button
                        type="button"
                        aria-label={`Increase quantity for ${item.name}`}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <span className="font-semibold text-[color:var(--text-primary)]">
                      {formatPrice(item.finalUnitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4">
            <div className="app-container ui-sticky-bar space-y-3 p-4">
              <div className="flex justify-between text-sm text-[color:var(--text-secondary)]">
                <span>Subtotal</span>
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-[color:var(--text-secondary)]">
                <span>Tax</span>
                <span className="font-semibold text-[color:var(--text-primary)]">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-sm text-[color:var(--text-secondary)]">
                <span>Dine-in charge</span>
                <span className="font-semibold text-[color:var(--text-primary)]">{formatPrice(dineInCharge)}</span>
              </div>
              <div className="flex justify-between text-base text-[color:var(--text-primary)]">
                <span>Total</span>
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {formatPrice(total)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  className={`w-full py-2 rounded-xl font-medium border ${
                    orderType === "DINE_IN"
                      ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                      : "border-[color:var(--border-subtle)] text-[color:var(--text-secondary)]"
                  }`}
                  onClick={() => setOrderType("DINE_IN")}
                >
                  Dine-In
                </button>
                <button
                  type="button"
                  className={`w-full py-2 rounded-xl font-medium border ${
                    orderType === "TAKEAWAY"
                      ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                      : "border-[color:var(--border-subtle)] text-[color:var(--text-secondary)]"
                  }`}
                  onClick={() => setOrderType("TAKEAWAY")}
                >
                  Takeaway
                </button>
              </div>

              <p className="text-xs text-[color:var(--text-secondary)]">
                {orderType === "DINE_IN"
                  ? "Dine-in orders include an extra Rs 20 service charge."
                  : "Takeaway uses the current QR context to identify the branch only."}
              </p>

              <div className="grid gap-2 pt-1">
                <button
                  type="button"
                  className={`w-full py-2 rounded-xl font-medium border ${
                    paymentMode === "ONLINE_ADVANCE"
                      ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                      : "border-[color:var(--border-subtle)] text-[color:var(--text-secondary)]"
                  }`}
                  onClick={() => setPaymentMode("ONLINE_ADVANCE")}
                >
                  Pay 50% Online Now
                </button>
                <button
                  type="button"
                  className={`w-full py-2 rounded-xl font-medium border ${
                    paymentMode === "SETTLE_ON_READY"
                      ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                      : "border-[color:var(--border-subtle)] text-[color:var(--text-secondary)]"
                  }`}
                  onClick={() => setPaymentMode("SETTLE_ON_READY")}
                >
                  Pay When Order Is Ready
                </button>
                <button
                  type="button"
                  className={`w-full py-2 rounded-xl font-medium border ${
                    paymentMode === "CASH_CONFIRMED_BY_STAFF"
                      ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                      : "border-[color:var(--border-subtle)] text-[color:var(--text-secondary)]"
                  }`}
                  onClick={() => setPaymentMode("CASH_CONFIRMED_BY_STAFF")}
                >
                  Cash via Staff Confirmation
                </button>
              </div>

              <p className="text-xs text-[color:var(--text-secondary)]">
                {paymentMode === "ONLINE_ADVANCE"
                  ? "Pay the required advance now and settle the rest later."
                  : paymentMode === "SETTLE_ON_READY"
                    ? "Place the order now, then pay online or by cash once the restaurant marks it ready."
                    : "A staff member will collect and confirm the cash payment before the kitchen starts."}
              </p>

              <button
                type="button"
                className="ui-button ui-button-pill w-full justify-center rounded-xl py-3 text-sm font-semibold"
                disabled={placingOrder || checkoutLoading || !hasCheckoutContext}
                onClick={async () => {
                  if (!hasCheckoutContext || !qrContext) {
                    pushToast({
                      title: "QR context missing",
                      description: "Scan the table QR before placing an order.",
                      variant: "error",
                    });
                    return;
                  }

                  if (!user) {
                    navigate("/login", {
                      state: {
                        from: `${location.pathname}${location.search}`,
                      },
                    });
                    return;
                  }

                  try {
                    setPlacingOrder(true);
                    const order = await createOrder({
                      restaurantId: qrContext.restaurant.id,
                      branchId: qrContext.branch.id,
                      ...(orderType === "DINE_IN" ? { tableId: qrContext.table.id } : {}),
                      orderType,
                      paymentMode,
                      items: items.map((item) => ({
                        menuId: item.menuItemId,
                        quantity: item.quantity,
                        addOns: item.addOns.map((addOn) => ({
                          name: addOn.name,
                          price: addOn.price,
                        })),
                      })),
                    });

                    clearCart();
                    const orderId = order.id ?? order._id ?? "";

                    if (paymentMode === "ONLINE_ADVANCE" && orderId) {
                      const payment = await initiateOrderPayment(orderId, {
                        idempotencyKey: `order-payment-${orderId}-${Date.now()}`,
                      });
                      const paymentAttemptId =
                        payment.paymentAttempt.id ?? payment.paymentAttempt._id ?? "";

                      try {
                        const result = await openCheckout({
                          key: payment.checkout.keyId,
                          amount: payment.checkout.amount,
                          currency: payment.checkout.currency,
                          order_id: payment.checkout.orderId,
                          name: payment.checkout.name,
                          description: payment.checkout.description,
                          notes: payment.checkout.notes,
                          prefill: {
                            name: user?.name,
                            email: user?.email,
                            contact: user?.phone,
                          },
                          theme: {
                            color: "#f97415",
                          },
                        });

                        if (paymentAttemptId) {
                          await confirmOrderPayment(paymentAttemptId, {
                            razorpay_order_id: result.razorpay_order_id,
                            razorpay_payment_id: result.razorpay_payment_id,
                            razorpay_signature: result.razorpay_signature,
                            amount: payment.paymentAttempt.amount,
                          });
                        }

                        pushToast({
                          title: "Payment successful",
                          description: "Your order is placed and waiting for restaurant acceptance.",
                          variant: "success",
                        });
                      } catch (error: any) {
                        if (paymentAttemptId) {
                          await failOrderPayment(paymentAttemptId, {
                            message: error?.message ?? "Payment was not completed.",
                            retryable: true,
                            failureSource: "CUSTOMER",
                          }).catch(() => undefined);
                        }

                        pushToast({
                          title: "Payment pending",
                          description:
                            error?.message ??
                            "The order draft was created, but payment is still pending. You can retry from your order history.",
                          variant: "warning",
                        });
                      }
                    } else if (paymentMode === "CASH_CONFIRMED_BY_STAFF") {
                      pushToast({
                        title: "Order created",
                        description: "Ask staff to confirm the cash order.",
                        variant: "success",
                      });
                    } else {
                      pushToast({
                        title: "Order created",
                        description:
                          "We will notify you when the order is ready so you can settle the remaining amount.",
                        variant: "success",
                      });
                    }

                    navigate(`/orders${orderId ? `?order=${orderId}` : ""}`);
                  } catch (error: any) {
                    pushToast({
                      title: "Could not create order",
                      description: error?.message ?? "Please try again.",
                      variant: "error",
                    });
                  } finally {
                    setPlacingOrder(false);
                  }
                }}
              >
                {placingOrder
                  ? "Creating Order..."
                  : checkoutLoading
                    ? "Opening Payment..."
                  : !user
                    ? "Login to Place Order"
                    : `Create Order${user.name ? ` as ${user.name}` : ""}`}
              </button>
              {!hasCheckoutContext && (
                <p className="text-xs text-red-500">
                  QR table context is required for checkout.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
