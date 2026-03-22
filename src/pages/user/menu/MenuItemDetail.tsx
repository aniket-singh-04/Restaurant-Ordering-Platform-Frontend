import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Clock, Leaf, Flame } from "lucide-react";
import Header from "./components/Header";
import AddOnsSelector from "./components/AddOnsSelector";
import SpecialInstructions from "./components/SpecialInstructions";
import QuantitySelector from "./components/QuantitySelector";
import AddToCartButton from "./components/AddToCartButton";
import { formatPrice } from "../../../utils/formatPrice";
import { useCart } from "../../../context/CartContext";
import { useMenuItem } from "../../../features/menu/api";
import { useQrContextStore } from "../../../features/qr-context/store";
import { useAuth } from "../../../context/AuthContext";
import FullPageLoader from "../../../components/FullPageLoader";

export default function MenuItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const qrContext = useQrContextStore((state) => state.context);

  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<
    { id: string; name: string; price: number }[]
  >([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const menuItemQuery = useMenuItem(id);
  const item = useMemo(() => menuItemQuery.data, [menuItemQuery.data]);

  useEffect(() => {
    if (!menuItemQuery.isLoading && !item) navigate("/menu");
  }, [item, menuItemQuery.isLoading, navigate]);

  if (menuItemQuery.isLoading) {
    return <FullPageLoader label="Loading item..." />;
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fff9f0]">
        <p className="text-lg text-gray-500 mb-4">Item not found</p>
        <button
          onClick={() => navigate("/menu")}
          className="px-5 py-2 cursor-pointer rounded-lg bg-orange-500 text-white font-medium"
        >
          Back to Menu
        </button>
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
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-[#fff9f0] pb-32 font-sans">
      <Header title={item.name} className="sticky top-0 z-50 border-b bg-white " />

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* IMAGE SECTION */}
            <div className="relative bg-orange-50 rounded-3xl">
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                className="w-full object-cover rounded-3xl"
              />
              {item.has3DModel && (
                <button
                  type="button"
                  aria-label="3D View"
                  className="cursor-pointer absolute top-3 right-3 rounded-full bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-800 shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  3D View
                </button>
              )}
            </div>

            {/* DETAILS SECTION */}
            <div className="text-left p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold">
                  {item.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500" />
                    {(item.rating ?? 0).toFixed(1)}
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="w-5 h-5" />
                    {item.prepTime}
                  </div>

                  {item.isVeg && (
                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                      <Leaf className="w-5 h-5" />
                      Veg
                    </div>
                  )}

                  {item.isSpicy && (
                    <div className="flex items-center gap-1 text-red-500 font-semibold">
                      <Flame className="w-5 h-5" />
                      Spicy
                    </div>
                  )}
                </div>

                <p className="text-3xl font-extrabold text-orange-500">
                  {formatPrice(item.price)}
                </p>

                <p className="text-gray-700 leading-relaxed">
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
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl p-4">
        <div className="container mx-auto max-w-5xl flex items-center justify-between gap-4">
          <QuantitySelector quantity={quantity} setQuantity={setQuantity} />

          <AddToCartButton
            totalPrice={totalPrice}
            onClick={handleAddToCart}
            disabled={quantity === 0}
            className="flex-1 bg-orange-500 text-white rounded-xl h-14 font-semibold hover:opacity-90"
          />
        </div>
      </div>
    </div>
  );
}
