import { ShoppingCart } from "lucide-react";
import { formatPrice } from "../../../../utils/formatPrice";

interface AddToCartButtonProps {
  totalPrice: number;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export default function AddToCartButton({
  totalPrice,
  onClick,
  disabled = false,
  className = "",
}: AddToCartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-xl px-6 max-w-[60%] cursor-pointer h-12 sm:h-14 text-sm font-semibold text-white bg-linear-to-r from-orange-500 via-orange-400 to-yellow-400 shadow-md transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${className}`}
    >
      <ShoppingCart className="h-5 w-5" />
      <span>Add {formatPrice(totalPrice)}</span>
    </button>
  );
}

