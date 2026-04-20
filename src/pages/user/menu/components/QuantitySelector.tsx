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
    <div className="flex items-center gap-3 rounded-[1.25rem] border border-(--border-subtle) bg-(--surface) p-2 shadow-(--shadow-sm)">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={decrease}
        disabled={quantity <= min}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-(--border-subtle) bg-(--surface-muted) text-(--accent) shadow-sm transition hover:bg-(--accent-soft) disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>

      <span className="w-6 select-none text-center text-lg font-bold text-(--text-primary)">
        {quantity}
      </span>

      <button
        type="button"
        aria-label="Increase quantity"
        onClick={increase}
        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--accent) text-white shadow-sm transition hover:bg-(--accent-hover)"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
