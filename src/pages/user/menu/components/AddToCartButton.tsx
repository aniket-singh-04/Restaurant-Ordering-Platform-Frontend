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
      className={`ui-button ui-button-pill flex h-12 max-w-[60%] items-center justify-center gap-2 px-6 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed sm:h-14 ${className}`}
    >
      <ShoppingCart className="h-5 w-5" />
      <span>Add {formatPrice(totalPrice)}</span>
    </button>
  );
}
