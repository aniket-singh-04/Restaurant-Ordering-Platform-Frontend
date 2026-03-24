import { MapPin, QrCode, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
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
    <div className="px-4 py-2 sticky top-0 z-40 grid grid-cols-[auto_1fr] bg-[#fbfaf8]/70 backdrop-blur rounded-b-sm border-b border-[#e7e1da80]">
      <div className="flex items-center gap-2">
        <div
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-linear-to-br from-[#f97415] via-[#f99e1f] to-[#fac938]"
          onClick={() => navigate(buildQrHomePath(qrId))}
        >
          <MapPin className="text-white" />
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            {isQrSession ? qrContext?.branch.name ?? "Scanned branch" : "Deliver to"}
          </p>
          <p className="text-sm font-semibold">Table #{tableNumber ?? "--"}</p>
        </div>
      </div>

      <div className="justify-self-end flex gap-5">
        <button
          className="flex items-center justify-center w-9 h-9 cursor-pointer rounded-xl bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-md hover:from-amber-500 hover:to-orange-600 hover:shadow-lg transition-all duration-300 active:scale-95"
          onClick={() => {
            void handleQrAction();
          }}
        >
          <QrCode size={20} />
        </button>
        <button
          className="relative flex items-center justify-center w-9 h-9 cursor-pointer rounded-xl bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-md hover:from-amber-500 hover:to-orange-600 hover:shadow-lg transition-all duration-300 active:scale-95"
          onClick={() => navigate(buildQrCartPath(qrId))}
          aria-label="Open cart"
        >
          <ShoppingCart size={20} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-red-500 text-white text-[10px] leading-5 text-center px-1">
              {totalItems}
            </span>
          )}
        </button>
        <button
          className="flex items-center justify-center w-9 h-9 cursor-pointer rounded-xl bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-md hover:from-amber-500 hover:to-orange-600 hover:shadow-lg transition-all duration-300 active:scale-95"
          onClick={() =>
            navigate(user ? "/profile" : "/login", {
              state: {
                from: `${location.pathname}${location.search}`,
              },
            })
          }
        >
          <CgProfile size={20} />
        </button>
      </div>
    </div>
  );
}
