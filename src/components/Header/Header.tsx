import { ClipboardList, MapPin, QrCode, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import ThemeToggle from "../ThemeToggle";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  buildQrCartPath,
  buildQrHomePath,
  useResolvedQrId,
} from "../../features/qr-context/navigation";
import { useQrContextStore } from "../../features/qr-context/store";
import { getStoredRestaurantSelection } from "./storage";

export default function Header() {
  const [table, setTable] = useState<number | null>(null);
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { pushToast } = useToast();
  const qrId = useResolvedQrId();
  const qrContext = useQrContextStore((state) => state.context);
  const isQrRoute = Boolean(qrId);
  const isQrSession = Boolean(qrId && qrContext?.publicQrId === qrId);

  const tableNumber = isQrSession
    ? qrContext?.table.tableNumber
    : isQrRoute
      ? undefined
      : table;

  useEffect(() => {
    const { table: storedTable } = getStoredRestaurantSelection();
    if (storedTable !== null) setTable(storedTable);
  }, []);

  const handleQrAction = async () => {
    if (!isQrSession || !qrContext?.scanUrl) {
      pushToast({
        title: "Scan a table QR to start",
        description: "Once you scan a table QR, we will keep the dine-in link here.",
        variant: "info",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(qrContext.scanUrl);
      pushToast({
        title: "QR link copied",
        description: "You can now share or reopen this table session.",
        variant: "success",
      });
    } catch {
      pushToast({
        title: "Could not copy the QR link",
        description: qrContext.scanUrl,
        variant: "warning",
      });
    }
  };

  return (
    <div className="sticky top-0 z-40 border-b border-[color:var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)] px-4 py-3 backdrop-blur-xl">
      <div className="app-container flex items-center justify-between gap-4">
        <button
          type="button"
          className="flex min-w-0 items-center gap-3 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface)] px-2.5 py-2 text-left shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5"
          onClick={() => navigate(buildQrHomePath(qrId))}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full warm-linear shadow-[var(--shadow-glow)]">
            <MapPin className="text-white" />
          </span>

          <span className="min-w-0">
            <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
              {isQrSession ? "Scanned branch" : "Deliver to"}
            </span>
            <span className="block truncate text-sm font-semibold text-[color:var(--text-primary)]">
              {isQrSession ? qrContext?.branch.name ?? "Scanned branch" : `Table #${tableNumber ?? "--"}`}
            </span>
            <span className="block truncate text-xs text-[color:var(--text-secondary)]">
              {isQrSession ? `Table #${tableNumber ?? "--"}` : "Tap to browse the menu"}
            </span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <button
            type="button"
            className="ui-icon-button warm-linear border-transparent text-white shadow-[var(--shadow-glow)]"
            onClick={() => {
              void handleQrAction();
            }}
            aria-label="Copy QR session link"
          >
            <QrCode size={18} />
          </button>
          <button
            type="button"
            className="ui-icon-button warm-linear relative border-transparent text-white shadow-[var(--shadow-glow)]"
            onClick={() => navigate(buildQrCartPath(qrId))}
            aria-label="Open cart"
          >
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--danger)] px-1 text-[10px] font-semibold text-white">
                {totalItems}
              </span>
            )}
          </button>
          <button
            type="button"
            className="ui-icon-button"
            onClick={() =>
              navigate(user ? "/orders" : "/login", {
                state: {
                  from: `${location.pathname}${location.search}`,
                },
              })
            }
            aria-label="Open orders"
          >
            <ClipboardList size={18} />
          </button>
          <button
            type="button"
            className="ui-icon-button"
            onClick={() =>
              navigate(user ? "/profile" : "/login", {
                state: {
                  from: `${location.pathname}${location.search}`,
                },
              })
            }
            aria-label="Open profile"
          >
            <CgProfile size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
