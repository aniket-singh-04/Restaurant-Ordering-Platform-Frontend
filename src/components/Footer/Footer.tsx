export default function Footer() {
  return (
    <footer className="border-t border-[color:var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--surface)_76%,transparent)] backdrop-blur-xl">
      <div className="app-container px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid grid-cols-2 gap-8 text-left sm:grid-cols-3 lg:grid-cols-4">
          <div className="max-w-xs">
            <p className="ui-eyebrow">Orderly</p>
            <h3 className="mt-3 font-display text-2xl font-bold text-[color:var(--text-primary)]">
              Fresh interface, same reliable ordering flow.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--text-secondary)]">
              Quality food delivery built for speed, safety, and trust.
            </p>
          </div>

          <div>
            <h4 className="ui-field-label">
              Company
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {["About", "Careers", "Blog", "Contact"].map((item) => (
                <li key={item}>
                  <a
                    className="font-medium text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--accent)]"
                    href="#"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="ui-field-label">
              Support
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {["Help Center", "Order Tracking", "Refund Policy", "FAQs"].map(
                (item) => (
                  <li key={item}>
                    <a
                      className="font-medium text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--accent)]"
                      href="#"
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <h4 className="ui-field-label">
              Legal
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {["Privacy Policy", "Terms of Service", "Cookies", "Compliance"].map(
                (item) => (
                  <li key={item}>
                    <a
                      className="font-medium text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--accent)]"
                      href="#"
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        <div className="my-8 h-px bg-[color:var(--border-subtle)]" />

        <div className="flex flex-col items-center justify-between gap-3 text-center text-xs text-[color:var(--text-secondary)] sm:flex-row sm:text-left sm:text-sm">
          <span>(c) {new Date().getFullYear()} FoodApp Technologies Pvt. Ltd.</span>

          <div className="flex gap-5">
            {["Security", "Accessibility", "Sitemap"].map((item) => (
              <a
                key={item}
                className="font-medium transition-colors hover:text-[color:var(--accent)]"
                href="#"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
