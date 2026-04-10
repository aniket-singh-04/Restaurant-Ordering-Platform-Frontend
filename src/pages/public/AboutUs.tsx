import { ArrowLeft, Info, Goal, Store } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { goBackOrNavigate } from "../../utils/navigation";
import MenuPageLayout from "../user/menu/components/MenuPageLayout";

export default function AboutUs() {
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
            <p className="ui-eyebrow text-white/72!">Overview</p>
            <h1 className="font-display text-3xl font-bold text-white sm:text-5xl">
              About Mealtap
            </h1>
          </div>
        </div>

        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      </section>

      <section className="ui-card space-y-6 mt-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-(--text-primary)">Who We Are</h2>
            <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
              Mealtap is a next-generation restaurant ordering platform designed to bridge the gap between diners and restaurants. We empower local restaurants with state-of-the-art tools for table-linked QR ordering, menu management, and real-time operations, while giving customers a seamless, fast, and secure dining experience.
            </p>
          </div>
        </div>

        <div className="my-6 h-px bg-[var(--border-subtle)]" />

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-(--text-primary)">Built for Restaurants</h2>
            <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
              We understand the challenges of running a fast-paced food business. Mealtap provides restaurant owners with robust branch management capabilities, integrated Razorpay payment routing, staff access controls, and rich analytics to ensure their business thrives without technical friction.
            </p>
          </div>
        </div>

        <div className="my-6 h-px bg-[var(--border-subtle)]" />

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
            <Goal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-(--text-primary)">Our Mission</h2>
            <p className="mt-2 text-sm leading-7 text-(--text-secondary)">
              To democratize advanced ordering technology for restaurants of all sizes, ensuring that every dining experience is exceptional—from the moment a customer scans the menu to the final contactless payment.
            </p>
          </div>
        </div>
      </section>
    </MenuPageLayout>
  );
}
