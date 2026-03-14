import { MapPin, QrCode, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import RestaurantSelector from "./RestaurantSelector";
import { useNavigate } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { useCart } from "../../context/CartContext";
import {
  getStoredRestaurantSelection,
  saveRestaurantSelection,
} from "./storage";

export default function Header() {
  const [table, setTable] = useState<number | null>(null);
  const { totalItems } = useCart();

  function handleApply(restaurant: string, table: number) {
    saveRestaurantSelection(restaurant, table);
    setTable(table);
  }

  useEffect(() => {
    const { table: storedTable } = getStoredRestaurantSelection();
    if (storedTable !== null) setTable(storedTable);
  }, []);
  const navigate = useNavigate();

  return (
    <div className="px-4 py-2 sticky top-0 z-40 grid grid-cols-[auto_1fr] bg-[#fbfaf8]/70 backdrop-blur rounded-b-sm border-b border-[#e7e1da80]">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#f97415] via-[#f99e1f] to-[#fac938] flex items-center justify-center cursor-pointer" onClick={() => navigate("/")} >
          <MapPin className="text-white" />
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Deliver to</p>
          <p className="text-sm font-semibold">Table #{table ?? "--"}</p>
        </div>

        <RestaurantSelector onApply={handleApply} />
      </div>

      <div className="justify-self-end flex gap-5">
        {/* QR Code Button */}
        <button
          className="flex items-center justify-center w-9 h-9 cursor-pointer rounded-xl bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-md hover:from-amber-500 hover:to-orange-600 hover:shadow-lg transition-all duration-300 active:scale-95"
        >
          <QrCode size={20} />
        </button>

        {/* Notification Button (commented) */}
        {/* 
           <button
             className="flex items-center justify-center w-9 h-9 cursor-pointer rounded-xl bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-md hover:from-amber-500 hover:to-orange-600 hover:shadow-lg transition-all duration-300 active:scale-95"
           >
             <Bell size={20} />
           </button>
           */}

        {/* Shopping Cart Button */}
        <button
          className="relative flex items-center justify-center w-9 h-9 cursor-pointer rounded-xl bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-md hover:from-amber-500 hover:to-orange-600 hover:shadow-lg transition-all duration-300 active:scale-95"
          onClick={() => navigate("/cart")}
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
          onClick={() => navigate("/profile")} // navigate to profile page
        >
          <CgProfile size={20} />
        </button>
      </div>

    </div>
  );
}
