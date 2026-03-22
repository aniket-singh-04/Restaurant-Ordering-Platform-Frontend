import { Minus, Plus, Trash2 } from "lucide-react";
import Header from "../../../components/Header/Header";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import { formatPrice } from "../../../utils/formatPrice";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useToast } from "../../../context/ToastContext";
import { useMemo, useState } from "react";
import { createOrder } from "../../../features/orders/api";
import { useQrContextStore } from "../../../features/qr-context/store";
import { useAuth } from "../../../context/AuthContext";

const TAX_RATE = 0.05;

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const { pushToast } = useToast();
  const qrContext = useQrContextStore((state) => state.context);
  const { user } = useAuth();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"ONLINE_ADVANCE" | "CASH_CONFIRMED_BY_STAFF">(
    "ONLINE_ADVANCE",
  );

  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;
  const canCheckout = useMemo(
    () => Boolean(qrContext?.restaurant.id && qrContext?.branch.id && qrContext?.table.id),
    [qrContext],
  );

  return (
    <>
      <Header />

      <main className="bg-gray-50 min-h-screen px-4 pt-11 pb-36">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="flex items-center gap-2 pt-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center cursor-pointer w-8 h-8 rounded-full bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-lg hover:from-amber-500 hover:to-orange-600 hover:shadow-xl transition-all duration-300 active:scale-95"
            >
              <IoMdArrowRoundBack size={22} />
            </button>
            <h1 className="text-xl font-semibold">Your Cart</h1>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
              Your cart is empty.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-sm flex gap-4"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between">
                    <h3 className="font-semibold">{item.name}</h3>
                    <button onClick={() => removeItem(item.id)}>
                      <Trash2 size={18} className="text-red-500 cursor-pointer" />
                    </button>
                  </div>

                  {item.addOns.length > 0 && (
                    <p className="text-xs text-gray-500">
                      + {item.addOns.map((a) => a.name).join(", ")}
                    </p>
                  )}

                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border flex items-center justify-center"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="font-medium">{item.quantity}</span>

                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <span className="font-semibold">
                      {formatPrice(item.finalUnitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
            <div className="max-w-4xl mx-auto p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-black">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span className="font-semibold text-black">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-base text-gray-900">
                <span>Total</span>
                <span className="font-semibold text-black">
                  {formatPrice(total)}
                </span>
              </div>

              <button
                type="button"
                className={`w-full py-2 rounded-xl font-medium border ${
                  paymentMode === "ONLINE_ADVANCE"
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-gray-200 text-gray-600"
                }`}
                onClick={() => setPaymentMode("ONLINE_ADVANCE")}
              >
                Pay 50% Online
              </button>
              <button
                type="button"
                className={`w-full py-2 rounded-xl font-medium border ${
                  paymentMode === "CASH_CONFIRMED_BY_STAFF"
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-gray-200 text-gray-600"
                }`}
                onClick={() => setPaymentMode("CASH_CONFIRMED_BY_STAFF")}
              >
                Cash via Staff
              </button>

              <button
                className="w-full py-3 rounded-xl text-white font-semibold bg-linear-to-br from-[#f97415] via-[#f99e1f] to-[#fac938]"
                disabled={placingOrder || !canCheckout}
                onClick={async () => {
                  if (!canCheckout || !qrContext) {
                    pushToast({
                      title: "QR context missing",
                      description: "Scan the table QR before placing an order.",
                      variant: "error",
                    });
                    return;
                  }

                  try {
                    setPlacingOrder(true);
                    const order = await createOrder({
                      restaurantId: qrContext.restaurant.id,
                      branchId: qrContext.branch.id,
                      tableId: qrContext.table.id,
                      orderType: "DINE_IN",
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
                    pushToast({
                      title: "Order created",
                      description:
                        paymentMode === "ONLINE_ADVANCE"
                          ? "Complete the advance payment to place it."
                          : "Ask staff to confirm the cash order.",
                      variant: "success",
                    });
                    navigate(`/profile${order?._id ?? order?.id ? `?order=${order._id ?? order.id}` : ""}`);
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
                {placingOrder ? "Creating Order..." : `Create Order${user?.name ? ` as ${user.name}` : ""}`}
              </button>
              {!canCheckout && (
                <p className="text-xs text-red-500">
                  Table context is required for dine-in checkout.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
