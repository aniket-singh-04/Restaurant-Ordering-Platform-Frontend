import type { ReactNode } from "react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FullPageLoader from "../components/FullPageLoader";
import { useAuth } from "../context/AuthContext";

export default function QrRouteGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cancelledPath, setCancelledPath] = useState<string | null>(null);
  const currentPath = `${location.pathname}${location.search}`;
  const cancelled = cancelledPath === currentPath;

  if (loading) {
    return <FullPageLoader label="Checking QR access..." />;
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#1f1914] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,158,31,0.36),_transparent_45%),linear-gradient(135deg,_rgba(249,116,21,0.16),_rgba(31,25,20,0.95))]" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white p-7 text-center shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
          Table QR Detected
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          Login required to open this menu
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#6d5c4d]">
          To continue with table ordering, please login first. If you cancel, the menu will stay
          locked and nothing will be ordered.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="flex-1 rounded-2xl bg-orange-500 px-5 py-3 font-medium text-white transition hover:bg-orange-600"
            onClick={() =>
              navigate("/login", {
                state: {
                  from: `${location.pathname}${location.search}`,
                },
              })
            }
          >
            Go to Login
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl border border-[#d8c0a7] px-5 py-3 font-medium text-[#5d4d3f] transition hover:bg-[#fff8ef]"
            onClick={() => setCancelledPath(currentPath)}
          >
            Cancel
          </button>
        </div>

        {cancelled ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Menu access was cancelled. Login whenever you are ready to continue with this table QR.
          </div>
        ) : null}
      </div>
    </div>
  );
}
