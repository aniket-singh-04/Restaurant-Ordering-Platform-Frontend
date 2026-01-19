import { Bell, MapPin, QrCode, ShoppingCart } from "lucide-react";
import { useState } from "react";
import RestaurantSelector from "./RestaurantSelector";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const [table, setTable] = useState<number | null>(null);

  function handleApply(restaurant: string, table: number) {
    localStorage.setItem("selectedRestaurant", restaurant);
    localStorage.setItem("selectedTable", String(table));
    setTable(table);
  }
  const navigate = useNavigate();

  return (
    <div className="px-4 py-2 sticky top-0 z-40 grid grid-cols-[auto_1fr] bg-[#fbfaf8]/70 backdrop-blur rounded-b-sm border-b-[#e7e1da80]">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-[linear-gradient(135deg,rgb(249,116,21)_0%,rgb(249,158,31)_50%,rgb(250,201,56)_100%)] flex items-center justify-center cursor-pointer" onClick={() => navigate("/")} >
          <MapPin className="text-white" />
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Deliver to</p>
          <p className="text-sm font-semibold">Table #{table ?? ""}</p>
        </div>

        <RestaurantSelector onApply={handleApply} />
      </div>

      <div className="justify-self-end flex gap-5">
        <button className="cursor-pointer p-2 rounded hover:bg-gray-200 transition">
          <QrCode />
        </button>
        <button className="cursor-pointer p-2 rounded hover:bg-gray-200 transition">
          <Bell />
        </button>
        <button className="cursor-pointer p-2 rounded hover:bg-gray-200 transition">
          <ShoppingCart />
        </button>
      </div>

    </div>
  );
}
