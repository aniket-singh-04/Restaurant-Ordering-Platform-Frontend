import { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  ChefHat,
  Menu,
  X,
} from 'lucide-react';
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


    <div className="min-h-screen bg-[#fff9f2] md:flex">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-[#1f1914] px-4 py-3 text-[#f7f1e3] shadow md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-yellow-400 to-orange-500 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-serif font-bold text-base">Orderly</p>
            <p className="text-[10px] text-[#b0a79d]">Admin Panel</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-lg p-2 text-[#f7f1e3] hover:bg-[#3c2c20] transition-colors"
          aria-label="Open navigation menu"
          aria-expanded={isSidebarOpen}
          aria-controls="admin-sidebar"
        >
          <Menu className="w-5 h-5 cursor-pointer" />
        </button>
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
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r bg-[#1f1914] text-[#f7f1e3] flex flex-col transform transition-transform duration-300 md:static md:w-64 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <div className="p-6 border-b border-[#5a4c4c] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-yellow-400 to-orange-500 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg">Orderly</h1>
              <p className="text-xs text-[#b0a79d]">Admin Panel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden rounded-lg p-2 text-[#f7f1e3] hover:bg-[#3c2c20] transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5 cursor-pointer" />
          </button>
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
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 font-medium ${isActive
                  ? 'bg-[#3c2c20] text-orange-500'
                  : 'text-[#b0a79d] hover:bg-[#5a4c4c] hover:text-[#fff9f2]'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#5a4c4c]">
          <button
            type="button"
            className="flex items-center w-full gap-3 px-4 py-3 rounded-lg text-[#b0a79d] hover:text-[#fff9f2] hover:bg-[#5a4c4c] transition-colors duration-200"
            onClick={() => navigate('/')}
          >
            <LogOut className="w-5 h-5" />
            Back to App
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 bg-[#fff9f2]">
        <Outlet />
      </main>
    </div>

  );
}
