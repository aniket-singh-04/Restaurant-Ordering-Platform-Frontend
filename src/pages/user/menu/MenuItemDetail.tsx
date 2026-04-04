import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { Star, Clock, Leaf, Flame } from "lucide-react";
import Header from "./components/Header";
import AddOnsSelector from "./components/AddOnsSelector";
import SpecialInstructions from "./components/SpecialInstructions";
import QuantitySelector from "./components/QuantitySelector";
import AddToCartButton from "./components/AddToCartButton";
import { formatPrice } from "../../../utils/formatPrice";
import { useCart } from "../../../context/CartContext";
import { isAdminPanelRole } from "../../../features/auth/access";
import { useMenuItem } from "../../../features/menu/api";
import { useAuth } from "../../../context/AuthContext";
import FullPageLoader from "../../../components/FullPageLoader";
import MenuImageToggle from "../../MenuImageToggle";
import {
  buildQrCartPath,
  buildQrMenuPath,
  useResolvedQrId,
} from "../../../features/qr-context/navigation";
import { useActiveQrContext } from "../../../features/qr-context/useActiveQrContext";

export default function MenuItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const qrId = useResolvedQrId();
  const shouldBlockCustomerMenu = Boolean(!qrId && user && isAdminPanelRole(user.role));
  const qrContextQuery = useActiveQrContext(qrId);
  const qrContext = qrContextQuery.data;

  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<
    { id: string; name: string; price: number }[]
  >([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const menuItemQuery = useMenuItem(shouldBlockCustomerMenu ? undefined : id);
  const item = useMemo(() => menuItemQuery.data, [menuItemQuery.data]);

  useEffect(() => {
    if (!shouldBlockCustomerMenu && !menuItemQuery.isLoading && !item) {
      navigate(buildQrMenuPath(qrId));
    }
  }, [item, menuItemQuery.isLoading, navigate, qrId, shouldBlockCustomerMenu]);

  if (shouldBlockCustomerMenu) {
    return <Navigate to="/admin" replace />;
  }

  if (menuItemQuery.isLoading || (qrId && qrContextQuery.isLoading)) {
    return <FullPageLoader label="Loading item..." />;
  }

  if (qrId && qrContextQuery.isError) {
    return (
      <div className="state-shell flex items-center justify-center px-4 text-center">
        <div className="state-card px-6 py-10 sm:px-8">
          <h1 className="font-display text-2xl font-semibold text-[color:var(--text-primary)]">This QR code is not available.</h1>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
            {qrContextQuery.error instanceof Error
              ? qrContextQuery.error.message
              : "Please ask the restaurant team for a fresh table QR code."}
          </p>
          <button
            type="button"
            onClick={() => navigate(buildQrMenuPath(qrId))}
            className="ui-button ui-button-pill mt-6 px-5 text-sm font-semibold"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="state-shell flex items-center justify-center px-4">
        <div className="state-card px-6 py-10 text-center sm:px-8">
        <p className="mb-4 text-lg text-[color:var(--text-secondary)]">Item not found</p>
        <button
          type="button"
          onClick={() => navigate(buildQrMenuPath(qrId))}
          className="ui-button ui-button-pill px-5 text-sm font-semibold"
        >
          Back to Menu
        </button>
        </div>
      </div>
    );
  }

  const toggleAddOn = (addOn: { id: string; name: string; price: number }) => {
    setSelectedAddOns((prev) =>
      prev.find((a) => a.id === addOn.id)
        ? prev.filter((a) => a.id !== addOn.id)
        : [...prev, addOn],
    );
  };

  const addOnsTotal = selectedAddOns.reduce(
    (sum, addon) => sum + addon.price,
    0,
  );

  const totalPrice = (item.price + addOnsTotal) * quantity;

  const handleAddToCart = () => {
    addItem({
      menuItemId: item.id,
      restaurantId: qrContext?.restaurant.id ?? user?.restroId,
      branchId: qrContext?.branch.id ?? user?.branchId,
      userId: user?.id,
      name: item.name,
      imageUrl: item.image,
      basePrice: item.price,
      finalUnitPrice: item.price + addOnsTotal,
      currency: "INR",
      quantity,
      addOns: selectedAddOns,
      specialInstructions: specialInstructions || undefined,
    });
    navigate(buildQrCartPath(qrId));
  };

  return (
    <div className="app-shell min-h-screen pb-32">
      <Header
        title={item.name}
        className="sticky top-0 z-50"
        fallbackTo={buildQrMenuPath(qrId)}
      />

      <main className="app-page">
        <div className="app-container">
        <div className="ui-section-card overflow-hidden rounded-[2rem]">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative rounded-[2rem] bg-[color:var(--surface-muted)]">
              <MenuImageToggle
                items={{
                  name: item.name,
                  image: item.image,
                  images: item.images
                }}
              />
                {item.has3DModel && (
                <button
                  type="button"
                  aria-label="3D View"
                  className="ui-button-secondary absolute right-3 top-3 px-3 py-2 text-xs font-semibold"
                >
                  3D View
                </button>
              )}
            </div>

            <div className="flex flex-col justify-between p-8 text-left">
              <div className="space-y-4">
                <h1 className="font-display text-3xl font-extrabold text-[color:var(--text-primary)] sm:text-4xl">
                  {item.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-[color:var(--text-secondary)]">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-[color:var(--chart-3)]" />
                    {(item.rating ?? 0).toFixed(1)}
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="h-5 w-5" />
                    {item.prepTime}
                  </div>

                  {item.isVeg && (
                    <div className="flex items-center gap-1 font-semibold text-[color:var(--success)]">
                      <Leaf className="h-5 w-5" />
                      Veg
                    </div>
                  )}

                  {item.isSpicy && (
                    <div className="flex items-center gap-1 font-semibold text-[color:var(--danger)]">
                      <Flame className="h-5 w-5" />
                      Spicy
                    </div>
                  )}
                </div>

                <p className="text-3xl font-extrabold text-[color:var(--accent)]">
                  {formatPrice(item.price)}
                </p>

                <p className="leading-relaxed text-[color:var(--text-secondary)]">
                  {item.description}
                </p>

                {item.addOns.length > 0 && (
                  <AddOnsSelector
                    addOns={item.addOns}
                    selectedAddOns={selectedAddOns}
                    toggleAddOn={toggleAddOn}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <SpecialInstructions
              value={specialInstructions}
              onChange={setSpecialInstructions}
            />
          </div>
        </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4">
        <div className="app-container ui-sticky-bar flex items-center justify-between gap-4 p-3">
          <QuantitySelector quantity={quantity} setQuantity={setQuantity} />

          <AddToCartButton
            totalPrice={totalPrice}
            onClick={handleAddToCart}
            disabled={quantity === 0}
            className="flex-1 h-14"
          />
        </div>
      </div>
    </div>
  );
}
