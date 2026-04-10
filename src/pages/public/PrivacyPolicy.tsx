import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { goBackOrNavigate } from "../../utils/navigation";
import MenuPageLayout from "../user/menu/components/MenuPageLayout";

export default function PrivacyPolicy() {
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
              Privacy Policy
            </h1>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
      </section>

      <section className="ui-card space-y-6 mt-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-(--text-primary)">Overview</h2>
            <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
              At Mealtap, your privacy is our priority. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform. By accessing or using our services, you agree to the collection and use of information in accordance with this policy.
            </p>
          </div>
        </div>

        <div className="my-6 h-px bg-[var(--border-subtle)]" />

        <div>
          <h3 className="font-display text-xl font-semibold text-(--text-primary)">1. Information We Collect</h3>
          <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
            - **Personal Identification:** Name, email address, phone number when you register.<br/>
            - **Order Information:** Items ordered, order history, and restaurant interactions.<br/>
            - **Payment Data:** Handled entirely via Razorpay; we do not store full credit card details on our servers.<br/>
            - **Usage Data:** Device information, timestamps, and interaction analytics to improve service reliability.
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold text-(--text-primary)">2. How We Use Information</h3>
          <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
            - To provide standard ordering, table management, and checkout operations.<br/>
            - To manage restaurant-user relationships, order updates, and customer support.<br/>
            - To secure accounts using OTP flows and device verifications.<br/>
            - To process payments and refunds appropriately through our payment gateway.
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold text-(--text-primary)">3. Data Sharing and Protection</h3>
          <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
            We only share your data with the specific restaurants you order from in order to fulfill your order. Your connection is secured using industry-standard encryption, and critical operations route through safe, vetted third parties (like Razorpay for payments). We never sell your personal information to third-party marketers.
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl font-semibold text-(--text-primary)">4. User Rights</h3>
          <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
            You have the right to access, modify, or request deletion of your personal data at any time. For data deletion requests or privacy inquiries, please use our Contact Us form.
          </p>
        </div>
      </section>
    </MenuPageLayout>
  );
}
