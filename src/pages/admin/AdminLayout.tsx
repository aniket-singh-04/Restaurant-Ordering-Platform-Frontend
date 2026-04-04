import { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  ChefHat,
  Menu,
  X,
} from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { roleMatches } from '../../features/auth/access';
import { useLiveOrderSync } from '../../features/orders/useLiveOrderSync';
import { adminNavItems } from './constants';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useLiveOrderSync();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const visibleItems = useMemo(() => {
    return adminNavItems.filter((item) => {
      if (!item.roles) return true;
      return roleMatches(user?.role, item.roles);
    });
  }, [user]);

  return (


    <div className="panel-shell min-h-screen md:flex">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[color:var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--surface)_85%,transparent)] px-4 py-3 text-[color:var(--text-primary)] shadow-[var(--shadow-sm)] backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl warm-linear">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display text-base font-bold">Orderly</p>
            <p className="text-[10px] text-[color:var(--text-muted)]">Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="ui-icon-button h-10 min-w-10 rounded-xl p-0"
            aria-label="Open navigation menu"
            aria-expanded={isSidebarOpen}
            aria-controls="admin-sidebar"
          >
            <Menu className="w-5 h-5 cursor-pointer" />
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`panel-sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r text-[color:var(--text-primary)] transform transition-transform duration-300 md:static md:w-64 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border-subtle)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl warm-linear">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold">Orderly</h1>
              <p className="text-xs text-[color:var(--text-muted)]">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact className="hidden md:inline-flex" />
            {isSidebarOpen && <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="ui-icon-button h-10 min-w-10 rounded-xl p-0 md:hidden"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5 cursor-pointer" />
            </button>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `panel-nav-link flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive
                  ? 'panel-nav-link--active'
                  : ''
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-[color:var(--border-subtle)] p-4">
          <button
            type="button"
            className="ui-button-secondary ui-button-pill flex w-full gap-3 rounded-lg px-4 py-3 text-sm font-semibold"
            onClick={() => navigate('/')}
          >
            <LogOut className="w-5 h-5" />
            Back to App
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>

  );
}
