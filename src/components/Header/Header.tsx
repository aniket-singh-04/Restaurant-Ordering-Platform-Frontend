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
  const locationEyebrow = isQrSession ? "Scanned branch" : "Deliver to";
  const locationTitle = isQrSession
    ? qrContext?.branch.name ?? "Scanned branch"
    : `Table #${tableNumber ?? "--"}`;
  const locationSubtitle = isQrSession
    ? `Table #${tableNumber ?? "--"}`
    : "Tap to browse the menu";
  const iconButtonClass =
    "ui-icon-button h-9 w-9 min-h-9 min-w-9 shrink-0 sm:h-auto sm:w-auto sm:min-h-[2.9rem] sm:min-w-[2.9rem]";

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
    <div className="sticky top-0 z-40 border-b border-[color:var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)] px-2.5 py-1.5 backdrop-blur-xl sm:px-4 sm:py-1">
      <div className="app-container flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <button
          type="button"
          className="flex min-w-0 w-fit max-w-full self-start items-center gap-2 rounded-[1.35rem] border border-[color:var(--border-subtle)] bg-[color:var(--surface)] px-2 py-1.5 pr-2.5 text-left shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 sm:w-auto sm:gap-3 sm:rounded-full sm:px-2.5 sm:py-2"
          onClick={() => navigate(buildQrHomePath(qrId))}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full warm-linear shadow-[var(--shadow-glow)] sm:h-11 sm:w-11">
            <MapPin className="h-4.5 w-4.5 text-white sm:h-5 sm:w-5" />
          </span>

          <span className="min-w-0">
            <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)] sm:text-[0.7rem] sm:tracking-[0.22em]">
              {locationEyebrow}
            </span>
            <span className="block truncate text-[0.84rem] font-semibold text-[color:var(--text-primary)] sm:text-sm">
              {locationTitle}
            </span>
            <span className="hidden truncate text-xs text-[color:var(--text-secondary)] sm:block">
              {locationSubtitle}
            </span>
          </span>
        </button>

        <div className="scrollbar-thin flex w-full items-center gap-1.5 overflow-x-auto pb-0.5 sm:w-auto sm:flex-wrap sm:justify-end sm:gap-2 sm:overflow-visible sm:pb-0">
          <ThemeToggle
            compact
            className="h-9 w-9 min-h-9 min-w-9 shrink-0 rounded-full px-0 sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10"
          />
          <button
            type="button"
            className={`${iconButtonClass} warm-linear border-transparent text-white shadow-[var(--shadow-glow)]`}
            onClick={() => {
              void handleQrAction();
            }}
            aria-label="Copy QR session link"
          >
            <QrCode size={17} />
          </button>
          <button
            type="button"
            className={`${iconButtonClass} warm-linear relative border-transparent text-white shadow-[var(--shadow-glow)]`}
            onClick={() => navigate(buildQrCartPath(qrId))}
            aria-label="Open cart"
          >
            <ShoppingCart size={17} />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-[color:var(--danger)] px-1 text-[9px] font-semibold text-white sm:h-5 sm:min-w-5 sm:text-[10px]">
                {totalItems}
              </span>
            )}
          </button>
          <button
            type="button"
            className={iconButtonClass}
            onClick={() =>
              navigate(user ? "/orders" : "/login", {
                state: {
                  from: `${location.pathname}${location.search}`,
                },
              })
            }
            aria-label="Open orders"
          >
            <ClipboardList size={17} />
          </button>
          <button
            type="button"
            className={iconButtonClass}
            onClick={() =>
              navigate(user ? "/profile" : "/login", {
                state: {
                  from: `${location.pathname}${location.search}`,
                },
              })
            }
            aria-label="Open profile"
          >
            <CgProfile size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
