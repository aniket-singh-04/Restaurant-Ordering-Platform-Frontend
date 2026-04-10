import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { goBackOrNavigate } from "../../utils/navigation";
import MenuPageLayout from "../user/menu/components/MenuPageLayout";

export default function RefundPolicy() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <MenuPageLayout>
      <section className="ui-hero mt-1.5 p-3 sm:mt-2 sm:p-5">
        <div className="relative flex gap-4 z-10 max-w-3xl text-left">
          <div className="flex items-start">
            <button
              type="button"
              onClick={() => goBackOrNavigate(navigate, "/", location.key)}
              className="ui-button-secondary ui-button-pill rounded-full px-4 py-2.5 text-sm font-semibold text-white/92 backdrop-blur"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
          <div>
            <p className="ui-eyebrow text-white/72!">Legal</p>
            <h1 className="font-display text-3xl font-bold text-white sm:text-5xl">
              Refund Policy
            </h1>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
      </section>

      <section className="ui-card space-y-6 mt-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
            <RefreshCcw className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-(--text-primary)">Cancellations & Refunds</h2>
            <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
              We aim to ensure a seamless dining and ordering experience. Refunds are processed securely through Razorpay directly to the original payment method based on the following rules.
            </p>
          </div>
        </div>

        <div className="my-6 h-px bg-[var(--border-subtle)]" />

        <div>
          <h3 className="font-display text-xl font-semibold text-(--text-primary)">1. Restaurant Cancellations</h3>
          <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
            If a restaurant cannot fulfill your order and cancels it prior to preparation, a full refund will be automatically triggered. The amount usually reflects in your original payment method within 5-7 business days, depending on your bank's processing times.
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold text-(--text-primary)">2. User Cancellations</h3>
          <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
            Once an order is accepted by the restaurant and preparation has begun, cancellations by the user are generally not eligible for a full refund. You will receive 75% of the total order value as a refund, while 25% and applicable taxes will be deducted. However, if you cancel before the restaurant preparing the order, a full refund will be processed immediately.          </p>
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold text-(--text-primary)">3. Order Disputes & Defects</h3>
          <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
            If you receive an incorrect order, missing items, or food of unacceptable quality, please contact the restaurant manager immediately or use our Contact Us page. If a claim is validated by the restaurant, a partial or full refund may be issued at their discretion.
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold text-(--text-primary)">4. Failed Payments & Debits</h3>
          <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
            If your account is debited but the payment status fails or the order does not securely confirm on our platform, the payment gateway (Razorpay) will automatically reverse the transaction. This auto-refund typically resolves within 48 to 72 hours.
          </p>
        </div>
      </section>
    </MenuPageLayout>
  );
}
