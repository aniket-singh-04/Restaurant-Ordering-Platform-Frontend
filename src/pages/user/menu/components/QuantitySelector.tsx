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
    <div className="flex items-center gap-3 rounded-[1.25rem] border border-[color:var(--border-subtle)] bg-[color:var(--surface)] p-2 shadow-[var(--shadow-sm)]">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={decrease}
        disabled={quantity <= min}
        className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] text-[color:var(--accent)] shadow-sm transition hover:bg-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>

      <span className="w-6 select-none text-center text-lg font-bold text-[color:var(--text-primary)]">
        {quantity}
      </span>

      <button
        type="button"
        aria-label="Increase quantity"
        onClick={increase}
        className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[color:var(--accent)] text-white shadow-sm transition hover:bg-[color:var(--accent-hover)]"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
