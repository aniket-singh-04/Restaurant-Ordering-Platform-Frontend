import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BadgeIndianRupee,
  Building2,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";
import { usePlatformAdminAuth } from "../../features/platform-admin/auth/context";
import { useState } from "react";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

const navItems: NavItem[] = [
  { to: "/platform", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/platform/users", label: "Users", icon: Users },
  { to: "/platform/restaurants", label: "Restaurants", icon: Building2 },
  { to: "/platform/orders", label: "Orders", icon: ClipboardList },
  { to: "/platform/payments", label: "Payments", icon: BadgeIndianRupee },
  { to: "/platform/reports", label: "Reports", icon: FileSpreadsheet },
  { to: "/platform/subscriptions", label: "Subscriptions", icon: Shield },
];

export default function PlatformAdminLayout() {
  const navigate = useNavigate();
  const { admin, logout } = usePlatformAdminAuth();
  const [isOpen, setIsOpen] = useState(false);

return (
  <div className="panel-shell min-h-screen md:flex md:items-start">

    {/* Mobile Header */}
    <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-[color:var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--surface)_85%,transparent)] px-3 py-2.5 shadow-[var(--shadow-sm)] backdrop-blur-xl md:hidden">
      <h1 className="font-display text-lg font-semibold tracking-tight">Owner Console</h1>

      <div className="flex items-center gap-2">
        <ThemeToggle compact />
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="ui-icon-button h-10 min-w-10 rounded-lg p-0"
        >
          <Menu className="h-5 w-5 text-[color:var(--text-primary)]" />
        </button>
      </div>
    </div>

    {/* Overlay */}
    {isOpen && (
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
        onClick={() => setIsOpen(false)}
      />
    )}

    {/* Sidebar */}
    <aside
      className={`fixed top-0 left-0 z-50 h-screen w-60 shrink-0 transform transition-transform duration-300
      md:sticky md:top-0 md:self-start
      ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
    >
      <div className="panel-sidebar flex h-full flex-col border-r">

        {/* Header */}
        <div className="border-b border-[color:var(--border-subtle)] px-5 py-3 md:px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[color:var(--text-muted)]">
            Platform
          </p>

          <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-[color:var(--text-primary)]">
            Owner Console
          </h1>

          <p className="mt-2 truncate text-sm text-[color:var(--text-secondary)]">
            {admin?.email}
          </p>

          <div className="mt-4 flex items-center gap-2">
            <ThemeToggle compact className="hidden md:inline-flex" />
            {isOpen && <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="ui-icon-button h-10 min-w-10 rounded-lg p-0 md:hidden"
            >
              <X className="h-5 w-5 text-[color:var(--text-primary)]" />
            </button>}
          </div>
        </div>

        {/* Nav (Scrollable if needed) */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3 md:px-3 md:py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `panel-nav-link flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "panel-nav-link--active"
                    : ""
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout (Sticky bottom) */}
        <div className="border-t border-[color:var(--border-subtle)] p-3 md:p-4">
          <button
            type="button"
            className="ui-button ui-button-pill flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold"
            onClick={() => {
              void logout().then(() =>
                navigate("/platform/login", { replace: true })
              );
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </aside>

    {/* Main */}
    <main className="mt-14 min-w-0 flex-1 p-1.5 md:mt-0 md:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="panel-content p-1.5 md:p-3">
          <Outlet />
        </div>
      </div>
    </main>
  </div>
);
}
