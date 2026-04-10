import { ArrowLeft, FileText } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { goBackOrNavigate } from "../../utils/navigation";
import MenuPageLayout from "../user/menu/components/MenuPageLayout";

export default function TermsAndConditions() {
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
              Terms & Conditions
            </h1>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
      </section>

      <section className="ui-card space-y-6 mt-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-(--text-primary)">Agreement of Use</h2>
            <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
              By accessing Mealtap, you agree to be bound by these Terms and Conditions. Please read them carefully before using the service. If you do not agree with any part of these terms, you may not use our platform.
            </p>
          </div>
        </div>

        <div className="my-6 h-px bg-[var(--border-subtle)]" />

        <div>
          <h3 className="font-display text-xl font-semibold text-(--text-primary)">1. User Accounts</h3>
          <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
            You are responsible for maintaining the security of your account and its OTP/password credentials. You are fully responsible for all activities that occur under your account. You must immediately notify Mealtap of any unauthorized uses of your account.
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold text-(--text-primary)">2. Service Provision</h3>
          <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
            Mealtap provides an interface connecting diners with restaurants. We do not prepare, package, or verify the food quality or dietary contents. The respective restaurant holds full liability for the food products fulfilled via Mealtap.
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold text-(--text-primary)">3. Payments and Orders</h3>
          <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
            All sales are considered final once accepted by the restaurant. Prices are set directly by the restaurants and may include platform or convenience fees clearly stated at checkout. By confirming an order, you agree to pay the listed total.
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold text-(--text-primary)">4. Modifications to Service</h3>
          <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
            Mealtap reserves the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. We shall not be liable to you or any third party for any modification, price change, suspension or discontinuance of the Service.
          </p>
        </div>
      </section>
    </MenuPageLayout>
  );
}
