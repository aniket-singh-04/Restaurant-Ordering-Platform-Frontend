import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { AddOn } from "../components/MenuCard/types";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { useLocalStorage } from "../hooks/useLocalStorage";

export interface CartItem {
  id: string;
  menuItemId: string;
  restaurantId?: string;
  branchId?: string;
  userId?: string;
  name: string;
  imageUrl: string;
  basePrice: number;
  finalUnitPrice: number;
  currency: "INR";
  quantity: number;
  addOns: AddOn[];
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "createdAt" | "updatedAt">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>(STORAGE_KEYS.cartItems, []);

  const addItem: CartContextValue["addItem"] = useCallback((item) => {
    const now = new Date().toISOString();
    const id = `${item.menuItemId}-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        ...item,
        id,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }, [setItems]);

  const updateQuantity: CartContextValue["updateQuantity"] = useCallback((id, quantity) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, quantity), updatedAt: new Date().toISOString() }
          : item,
      ),
    );
  }, [setItems]);

  const removeItem: CartContextValue["removeItem"] = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, [setItems]);

  const clearCart = useCallback(() => setItems([]), [setItems]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.finalUnitPrice * item.quantity, 0),
    [items],
  );

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      subtotal,
      totalItems,
    }),
    [items, addItem, updateQuantity, removeItem, clearCart, subtotal, totalItems],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("CartProvider missing");
  return ctx;
}
