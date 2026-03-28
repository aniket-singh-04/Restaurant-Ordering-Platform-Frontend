import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BadgeIndianRupee,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  { to: "/platform/subscriptions", label: "Subscriptions", icon: Shield },
];

export default function PlatformAdminLayout() {
  const navigate = useNavigate();
  const { admin, logout } = usePlatformAdminAuth();
  const [isOpen, setIsOpen] = useState(false);

return (
  <div className="h-screen flex bg-linear-to-br from-gray-50 to-gray-100 text-gray-900 overflow-hidden">

    {/* Mobile Header */}
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200 flex items-center justify-between px-4 py-3 shadow-sm">
      <h1 className="text-lg font-semibold tracking-tight">Owner Console</h1>

      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100 transition"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>
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
      className={`fixed md:static z-50 top-0 left-0 h-screen w-60 shrink-0 transform transition-transform duration-300
      ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
    >
      <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl border-r border-gray-200 shadow-lg">

        {/* Header */}
        <div className="px-6 py-3 border-b border-gray-100">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">
            Platform
          </p>

          <h1 className="mt-1 text-xl font-bold text-gray-900 tracking-tight">
            Owner Console
          </h1>

          <p className="mt-2 text-sm text-gray-500 truncate">
            {admin?.email}
          </p>

          {/* Close (Mobile) */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden mt-4 p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Nav (Scrollable if needed) */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-linear-to-r from-orange-50 to-orange-100 text-orange-600 shadow-sm border border-orange-200"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout (Sticky bottom) */}
        <div className="p-4 border-t border-gray-100">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-gray-900 to-gray-800 text-white py-3 text-sm font-semibold hover:opacity-90 transition shadow-md"
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
    <main className="flex-1 overflow-y-auto p-2 md:p-4 mt-14 md:mt-0">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 md:p-3">
          <Outlet />
        </div>
      </div>
    </main>
  </div>
);
}
