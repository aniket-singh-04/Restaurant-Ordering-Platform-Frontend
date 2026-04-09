import {
  ArrowRight,
  CreditCard,
  QrCode,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isAdminPanelRole } from "../../features/auth/access";
import {
  buildQrCartPath,
  buildQrHomePath,
  buildQrMenuPath,
  useResolvedQrId,
} from "../../features/qr-context/navigation";

const platformSignals = [
  "OTP auth",
  "QR table sessions",
  "Live order sync",
  "Razorpay payments",
  "Branch menus",
  "Analytics",
];

export default function Footer() {
  const qrId = useResolvedQrId();
  const { user } = useAuth();
  const canManageOperations = isAdminPanelRole(user?.role);
  const isCustomerUser = user?.role === "CUSTOMER";

  const customerLinks = [
    { label: "Experience Home", to: buildQrHomePath(qrId) },
    { label: "Browse Menu", to: buildQrMenuPath(qrId) },
    { label: "Open Cart", to: buildQrCartPath(qrId) },
  ];

  const accountLinks = user
    ? [
        { label: "My Orders", to: "/orders" },
        { label: "Profile", to: "/profile" },
        { label: "Continue Ordering", to: buildQrMenuPath(qrId) },
      ]
    : [
        { label: "Login", to: "/login" },
        { label: "Create Account", to: "/register" },
        { label: "Forgot Password", to: "/forgot-password" },
      ];

  const operationsLinks = [
    { label: "Dashboard", to: "/admin" },
    { label: "Menu Management", to: "/admin/menu" },
    { label: "Orders", to: "/admin/orders" },
    { label: "Tables", to: "/admin/tables" },
    { label: "Subscriptions", to: "/admin/subscriptions" },
    { label: "Analytics", to: "/admin/analytics" },
  ];

  const experienceTitle = canManageOperations
    ? "Customer ordering, table QR sessions, secure access, and restaurant operations in one connected system."
    : isCustomerUser
      ? "Browse the menu, manage your cart, and track orders with a footer that fits a real customer journey."
      : "QR menu access, secure sign-in, and ordering flow come together in one clean customer experience.";

  const experienceDescription = canManageOperations
    ? "Your frontend flow is backed by real APIs for auth, menu, orders, payments, subscriptions, tables, analytics, and branch-aware restaurant management. The footer now reflects the product you actually built."
    : isCustomerUser
      ? "Signed-in customers should see customer-first navigation, not restaurant admin language. This version keeps the focus on menu browsing, profile access, orders, and table-linked ordering."
      : "Guests can move from discovery into registration, login, QR ordering, and checkout without seeing restaurant management links that do not belong to them.";

  const supportLabel = canManageOperations
    ? "Operations"
    : isCustomerUser
      ? "Customer Account"
      : "Access";

  const supportTitle = canManageOperations
    ? "Restaurant tools are available"
    : isCustomerUser
      ? "Your customer tools are ready"
      : "Secure sign-in stays in the loop";

  const supportDescription = canManageOperations
    ? "Owners and staff can jump from the customer menu into menus, orders, tables, subscriptions, and analytics."
    : isCustomerUser
      ? "Customers can move between menu, cart, profile, and order history without seeing restaurant-side operations links."
      : "Password plus OTP verification and account recovery stay aligned with the backend auth flow.";

  const brandDescription = canManageOperations
    ? "Built around dine-in QR access, secure customer auth, live order handling, and branch-level restaurant operations."
    : isCustomerUser
      ? "Built around quick menu browsing, secure checkout, QR-linked sessions, and easy access to your profile and order history."
      : "Built for QR discovery, secure sign-in, and a smooth path from menu browsing to cart and checkout.";

  const footerKeywords = canManageOperations
    ? ["Auth", "Menu", "Orders", "Payments", "Tables", "Subscriptions"]
    : isCustomerUser
      ? ["Menu", "Cart", "Orders", "Profile", "QR Session", "Payments"]
      : ["Login", "Register", "Menu", "Cart", "QR Session", "Checkout"];

  return (
    <footer className="border-t border(--border-subtle) bg-[color-mix(in_srgb,var(--surface)_76%,transparent)] backdrop-blur-xl">
      <div className="app-container px-3 py-8 sm:px-6 sm:py-12">
        <section className="overflow-hidden rounded-4xl border border-(--border-subtle)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface)_94%,transparent),color-mix(in_srgb,var(--surface-muted)_88%,transparent))] p-4 shadow-(--shadow-md) sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_24%,transparent)] bg-(--accent-soft) px-3 py-1.5 text-sm font-semibold text-(--accent)">
                <Sparkles className="h-4 w-4" />
                Mealtap Platform
              </div>

              <h3 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-tight text-(--text-primary) sm:text-4xl">
                {experienceTitle}
              </h3>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-(--text-secondary) sm:text-base">
                {experienceDescription}
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {platformSignals.map((signal) => (
                  <span
                    key={signal}
                    className="inline-flex items-center rounded-full border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-(--text-secondary)"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-(--border-subtle) bg-(--surface) p-4 shadow-(--shadow-sm)">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl warm-linear text-white shadow-(--shadow-glow)">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)">
                      Session Mode
                    </p>
                    <p className="mt-1 text-base font-semibold text-(--text-primary)">
                      {qrId ? "Table-linked ordering active" : "Standard app navigation"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
                      {qrId
                        ? "Menu, cart, and ordering stay scoped to the scanned table session."
                        : "Users can move across menu, cart, profile, and order history normally."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-(--border-subtle) bg-(--surface) p-4 shadow-(--shadow-sm)">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                    {canManageOperations ? (
                      <CreditCard className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)">
                      {supportLabel}
                    </p>
                    <p className="mt-1 text-base font-semibold text-(--text-primary)">
                      {supportTitle}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
                      {supportDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`mt-6 grid gap-6 text-left sm:mt-8 ${
            canManageOperations ? "lg:grid-cols-4" : "md:grid-cols-3"
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl warm-linear text-white shadow-(--shadow-glow)">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <p className="ui-eyebrow">Mealtap</p>
                <p className="text-sm font-semibold text-(--text-primary)">
                  Restaurant Ordering Platform
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-7 text-(--text-secondary)">
              {brandDescription}
            </p>

            <Link
              to={buildQrMenuPath(qrId)}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-(--accent) transition hover:text-(--accent-hover)"
            >
              Continue into the menu
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/contact-us"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-(--text-secondary) transition hover:text-(--accent)"
            >
              Contact us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <h4 className="ui-field-label">Customer Flow</h4>
            <div className="mt-4 space-y-2.5 text-sm">
              {customerLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="block font-medium text-(--text-secondary) transition hover:text-(--accent)"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="ui-field-label">{user ? "My Space" : "Access"}</h4>
            <div className="mt-4 space-y-2.5 text-sm">
              {accountLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="block font-medium text-(--text-secondary) transition hover:text-(--accent)"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {canManageOperations ? (
            <div>
              <h4 className="ui-field-label">Operations</h4>
              <div className="mt-4 space-y-2.5 text-sm">
                {operationsLinks.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="block font-medium text-(--text-secondary) transition hover:text-(--accent)"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <div className="my-6 h-px bg-(--border-subtle) sm:my-8" />

        <div className="flex flex-col gap-2.5 text-center text-xs text-(--text-secondary) sm:flex-row sm:items-center sm:justify-between sm:text-left sm:text-sm">
          <span>© {new Date().getFullYear()} Mealtap. Frontend and backend flows are aligned.</span>

          <div className="flex flex-wrap justify-center gap-3 sm:justify-end sm:gap-5">
            {footerKeywords.map((item) => (
              <span key={item} className="font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
