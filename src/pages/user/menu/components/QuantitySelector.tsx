import { Plus, Minus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  setQuantity: (qty: number) => void;
  min?: number;
}

export default function QuantitySelector({
  quantity,
  setQuantity,
  min = 1,
}: QuantitySelectorProps) {
  const decrease = () => setQuantity(Math.max(min, quantity - 1));
  const increase = () => setQuantity(quantity + 1);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-orange-50 p-2">
      {/* Minus */}
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={decrease}
        disabled={quantity <= min}
        className="
          cursor-pointer
          h-10 w-10 rounded-lg
          flex items-center justify-center
          bg-white text-orange-500
          shadow
          hover:bg-orange-100
          disabled:opacity-40 disabled:cursor-not-allowed
          transition
        "
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* Quantity */}
      <span className="w-6 text-center text-lg font-bold text-gray-800 select-none">
        {quantity}
      </span>

      {/* Plus */}
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={increase}
        className="
          cursor-pointer
          h-10 w-10 rounded-lg
          flex items-center justify-center
          bg-orange-500 text-white
          shadow
          hover:bg-orange-600
          transition
        "
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
