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
import {
  clearPaymentIdempotencyKey,
  getPaymentIdempotencyKey,
} from "../../../features/payments/idempotency";
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

type OrderType = "DINE_IN" | "TAKEAWAY";
type PaymentMode = "ONLINE_ADVANCE" | "ONLINE_FULL" | "CASH_CONFIRMED_BY_STAFF";

type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  description: string;
  badge?: string;
};

const orderTypeOptions: ChoiceOption<OrderType>[] = [
  {
    value: "DINE_IN",
    label: "Dine-In",
    description: "Keep the order linked to your scanned table for table-side service.",
    badge: "+Rs 20",
  },
  {
    value: "TAKEAWAY",
    label: "Takeaway",
    description: "Use the current branch from this QR session and skip the dine-in service charge.",
    badge: "No extra charge",
  },
];

const paymentModeOptions: ChoiceOption<PaymentMode>[] = [
  {
    value: "ONLINE_ADVANCE",
    label: "Pay 50% Online Now",
    description: "Secure the order immediately and settle the rest later.",
    badge: "Recommended",
  },
  {
    value: "ONLINE_FULL",
    label: "Pay Full Amount Online",
    description: "Pay the complete order total upfront and send it straight into the online payment flow.",
    badge: "Fastest",
  },
  {
    value: "CASH_CONFIRMED_BY_STAFF",
    label: "Cash via Staff Confirmation",
    description: "A staff member confirms the cash payment before the kitchen starts.",
  },
];

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
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("ONLINE_ADVANCE");
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

  const orderTypeBadge = orderType === "DINE_IN" ? "Dine-In" : "Takeaway";
  const paymentModeBadge =
    paymentMode === "ONLINE_ADVANCE"
      ? "50% advance"
      : paymentMode === "ONLINE_FULL"
        ? "Full online"
      : "Cash confirm";

  const checkoutContextTitle = qrContext
    ? `${qrContext.restaurant.name} • ${qrContext.branch.name}`
    : "A scanned table QR is required for checkout";
  const checkoutContextDescription = hasCheckoutContext
    ? orderType === "DINE_IN"
      ? `Table #${qrContext?.table.tableNumber ?? "--"} is connected and ready for dine-in service.`
      : "Takeaway will use the currently scanned branch without attaching a table."
    : "Scan the restaurant's table QR code before placing the order.";
  const checkoutContextHeading =
    qrContext && checkoutContextTitle.includes(qrContext.restaurant.name)
      ? [qrContext.restaurant.name, qrContext.branch.name].join(" - ")
      : checkoutContextTitle;

  const handleCreateOrder = async () => {
    if (placingOrder || checkoutLoading) {
      return;
    }

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

      if (
        (paymentMode === "ONLINE_ADVANCE" || paymentMode === "ONLINE_FULL") &&
        orderId
      ) {
        const paymentPurpose = "ADVANCE";
        const payment = await initiateOrderPayment(orderId, {
          purpose: paymentPurpose,
          idempotencyKey: getPaymentIdempotencyKey(orderId, paymentPurpose),
        });
        const paymentAttemptId = payment.paymentAttempt.id ?? payment.paymentAttempt._id ?? "";

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
            clearPaymentIdempotencyKey(orderId, paymentPurpose);
          }

          pushToast({
            title:
              paymentMode === "ONLINE_FULL"
                ? "Full payment successful"
                : "Payment successful",
            description:
              paymentMode === "ONLINE_FULL"
                ? "Your order is fully paid and waiting for restaurant acceptance."
                : "Your order is placed and waiting for restaurant acceptance.",
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
      } else {
        pushToast({
          title: "Order created",
          description: "Ask staff to confirm the cash order.",
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
  };

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

      <main className="app-shell min-h-screen px-4 pb-12">
        <div className="app-container py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-6">
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Go back to menu"
                onClick={() => goBackOrNavigate(navigate, buildQrMenuPath(qrId), location.key)}
                className="ui-icon-button warm-linear border-transparent text-white shadow-(--shadow-glow)"
              >
                <IoMdArrowRoundBack size={22} />
              </button>
              <div>
                <p className="ui-eyebrow">Checkout</p>
                <h1 className="font-display text-3xl font-semibold text-(--text-primary)">
                  Your Cart
                </h1>
                <p className="mt-1 text-sm text-(--text-secondary)">
                  Review your items and confirm how you want the restaurant to handle this order.
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="ui-empty-state p-8 text-center text-(--text-secondary)">
                Your cart is empty.
              </div>
            ) : (
              <>
                <div className="ui-card ui-card-muted space-y-3 rounded-[1.8rem]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="ui-eyebrow">Order Session</p>
                      <h2 className="mt-2 text-lg font-semibold text-(--text-primary)">
                        {checkoutContextHeading}
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="ui-badge ui-badge--neutral">
                        {items.length} {items.length === 1 ? "item" : "items"}
                      </span>
                      <span className="ui-badge ui-badge--neutral">{orderTypeBadge}</span>
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-(--text-secondary)">
                    {checkoutContextDescription}
                  </p>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="ui-card flex gap-4 rounded-[1.6rem] p-4">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-20 w-20 rounded-xl object-cover"
                      />

                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between gap-3">
                          <h3 className="font-semibold text-(--text-primary)">{item.name}</h3>
                          <button
                            type="button"
                            aria-label={`Remove ${item.name} from cart`}
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 size={18} className="cursor-pointer text-red-500" />
                          </button>
                        </div>

                        {item.addOns.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.addOns.map((addOn) => (
                              <span
                                key={`${item.id}-${addOn.name}`}
                                className="rounded-full bg-(--accent-soft) px-2.5 py-1 text-[11px] font-medium text-(--accent)"
                              >
                                {addOn.name} (+{formatPrice(addOn.price)})
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-(--text-secondary)">
                          Unit total {formatPrice(item.finalUnitPrice)}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              aria-label={`Decrease quantity for ${item.name}`}
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-(--border-subtle) bg-(--surface-muted)"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="font-medium">{item.quantity}</span>

                            <button
                              type="button"
                              aria-label={`Increase quantity for ${item.name}`}
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-(--accent) bg-(--accent) text-white"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <span className="font-semibold text-(--text-primary)">
                            {formatPrice(item.finalUnitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {items.length > 0 && (
            <aside className="mt-5 lg:mt-0 lg:sticky lg:top-24">
              <div className="ui-card space-y-5 rounded-4xl p-5">
                <div>
                  <p className="ui-eyebrow">Checkout Summary</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-(--text-primary)">
                    Ready to place your order?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
                    Choose the service style and payment preference, then confirm the total below.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="ui-badge ui-badge--neutral">{orderTypeBadge}</span>
                    <span className="ui-badge ui-badge--neutral">{paymentModeBadge}</span>
                  </div>
                </div>

                <div className="rounded-3xl border border-(--border-subtle) bg-(--surface-muted) p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-(--text-secondary)">
                      <span>Subtotal</span>
                      <span className="font-semibold text-(--text-primary)">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-(--text-secondary)">
                      <span>Tax</span>
                      <span className="font-semibold text-(--text-primary)">
                        {formatPrice(tax)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-(--text-secondary)">
                      <span>Dine-in charge</span>
                      <span className="font-semibold text-(--text-primary)">
                        {formatPrice(dineInCharge)}
                      </span>
                    </div>

                    <div className="h-px bg-(--border-subtle)" />

                    <div className="flex justify-between text-base text-(--text-primary)">
                      <span>Total</span>
                      <span className="font-semibold text-(--text-primary)">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <ChoiceGroup
                  legend="Order Type"
                  name="order-type"
                  value={orderType}
                  options={orderTypeOptions}
                  onChange={setOrderType}
                />

                <ChoiceGroup
                  legend="Payment Preference"
                  name="payment-mode"
                  value={paymentMode}
                  options={paymentModeOptions}
                  onChange={setPaymentMode}
                />

                <div
                  className={`rounded-[1.4rem] border p-4 ${
                    hasCheckoutContext
                      ? "border-(--border-subtle) bg-(--surface-muted)"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-(--text-primary)">Checkout context</p>
                  <p
                    className={`mt-1 text-sm leading-6 ${
                      hasCheckoutContext ? "text-(--text-secondary)" : "text-red-600"
                    }`}
                  >
                    {checkoutContextDescription}
                  </p>
                </div>

                <button
                  type="button"
                  className="ui-button ui-button-pill w-full justify-center rounded-xl py-3 text-sm font-semibold"
                  disabled={placingOrder || checkoutLoading || !hasCheckoutContext}
                  onClick={() => {
                    void handleCreateOrder();
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
              </div>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}

function ChoiceGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: T;
  options: ChoiceOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="ui-field-label mb-0!">{legend}</legend>

      <div className="space-y-2.5">
        {options.map((option) => {
          const checked = option.value === value;

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-[1.4rem] border p-4 transition ${
                checked
                  ? "border-(--accent) bg-(--accent-soft) shadow-(--shadow-sm)"
                  : "border-(--border-subtle) bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] hover:border-(--border-strong)"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-1 h-4 w-4 shrink-0"
                style={{ accentColor: "var(--accent)" }}
              />

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-(--text-primary)">
                    {option.label}
                  </span>

                  {option.badge ? (
                    <span className={checked ? "ui-badge ui-badge--accent" : "ui-badge ui-badge--neutral"}>
                      {option.badge}
                    </span>
                  ) : null}
                </span>

                <span className="mt-1 block text-sm leading-6 text-(--text-secondary)">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
