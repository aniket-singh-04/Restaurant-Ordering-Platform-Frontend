export default function Footer() {
  return (
    <footer
      className="
        bg-linear-to-br from-[#F3E8DC] via-[#E9DCCF] to-[#FBE8C6]
        border-t border-[#D6C4B4]
      "
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid gap-10 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 text-left">
          <div className="mx-auto sm:mx-0 max-w-xs">
            <h3 className="text-lg font-semibold text-[#5A4638]">
              FoodApp
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#7A6B5B]">
              Quality food delivery built for speed, safety, and trust.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[#5A4638]">
              Company
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {["About", "Careers", "Blog", "Contact"].map((item) => (
                <li key={item}>
                  <a
                    className="text-[#7A6B5B] hover:text-[#B45309] font-medium transition-colors"
                    href="#"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[#5A4638]">
              Support
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {["Help Center", "Order Tracking", "Refund Policy", "FAQs"].map(
                (item) => (
                  <li key={item}>
                    <a
                      className="text-[#7A6B5B] hover:text-[#B45309] font-medium transition-colors"
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
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[#5A4638]">
              Legal
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {["Privacy Policy", "Terms of Service", "Cookies", "Compliance"].map(
                (item) => (
                  <li key={item}>
                    <a
                      className="text-[#7A6B5B] hover:text-[#B45309] font-medium transition-colors"
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

        <div className="my-8 h-px bg-[#D6C4B4]" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-[#7A6B5B] text-center sm:text-left">
          <span>(c) {new Date().getFullYear()} FoodApp Technologies Pvt. Ltd.</span>

          <div className="flex gap-5">
            {["Security", "Accessibility", "Sitemap"].map((item) => (
              <a
                key={item}
                className="hover:text-[#B45309] font-medium transition-colors"
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

