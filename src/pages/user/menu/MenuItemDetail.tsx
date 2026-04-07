import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  upsertMenuRating,
  useMenuItem,
  useMyMenuRating,
} from "../../../features/menu/api";
import { useAuth } from "../../../context/AuthContext";
import FullPageLoader from "../../../components/FullPageLoader";
import MenuImageToggle from "../../MenuImageToggle";
import {
  buildQrCartPath,
  buildQrMenuPath,
  useResolvedQrId,
} from "../../../features/qr-context/navigation";
import { useActiveQrContext } from "../../../features/qr-context/useActiveQrContext";
import { useToast } from "../../../context/ToastContext";

export default function MenuItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const qrId = useResolvedQrId();
  const shouldBlockCustomerMenu = Boolean(!qrId && user && isAdminPanelRole(user.role));
  const qrContextQuery = useActiveQrContext(qrId);
  const qrContext = qrContextQuery.data;

  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<
    { id: string; name: string; price: number }[]
  >([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [draftRating, setDraftRating] = useState(0);
  const [draftReview, setDraftReview] = useState("");

  const menuItemQuery = useMenuItem(shouldBlockCustomerMenu ? undefined : id);
  const item = useMemo(() => menuItemQuery.data, [menuItemQuery.data]);
  const canUseRatings = Boolean(item?.id && user?.role === "CUSTOMER");
  const ratingQuery = useMyMenuRating(item?.id, canUseRatings);
  const ratingMutation = useMutation({
    mutationFn: (payload: { rating: number; review?: string }) =>
      upsertMenuRating(item?.id ?? "", payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["menu-item", item?.id] }),
        queryClient.invalidateQueries({ queryKey: ["menu-rating", item?.id] }),
        queryClient.invalidateQueries({ queryKey: ["menu"] }),
      ]);
      pushToast({
        title: "Rating saved",
        description: "Your feedback now helps other guests choose with confidence.",
        variant: "success",
      });
    },
    onError: (error) => {
      pushToast({
        title: "Rating could not be saved",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    },
  });

  useEffect(() => {
    if (!shouldBlockCustomerMenu && !menuItemQuery.isLoading && !item) {
      navigate(buildQrMenuPath(qrId));
    }
  }, [item, menuItemQuery.isLoading, navigate, qrId, shouldBlockCustomerMenu]);

  useEffect(() => {
    if (!ratingQuery.data?.myRating) {
      return;
    }

    setDraftRating(ratingQuery.data.myRating.rating ?? 0);
    setDraftReview(ratingQuery.data.myRating.review ?? "");
  }, [ratingQuery.data?.myRating]);

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
  const ratingSummary = ratingQuery.data?.summary ?? {
    avgRating: item.avgRating ?? item.rating ?? 0,
    totalRatings: item.totalRatings ?? 0,
  };

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

  const handleSubmitRating = async () => {
    if (!item?.id || draftRating < 1) {
      return;
    }

    await ratingMutation.mutateAsync({
      rating: draftRating,
      review: draftReview.trim() || undefined,
    });
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
                    {(ratingSummary.avgRating ?? 0).toFixed(1)}
                    <span className="text-xs text-[color:var(--text-secondary)]">
                      ({ratingSummary.totalRatings ?? 0})
                    </span>
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

                <div className="rounded-[1.5rem] border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
                        Guest Rating
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-[color:var(--text-primary)]">
                        {(ratingSummary.avgRating ?? 0).toFixed(1)}
                        <span className="ml-2 text-sm font-medium text-[color:var(--text-secondary)]">
                          / 5 from {ratingSummary.totalRatings ?? 0} ratings
                        </span>
                      </p>
                    </div>
                    {ratingQuery.data?.myRating ? (
                      <div className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[color:var(--text-secondary)]">
                        Your rating: {ratingQuery.data.myRating.rating}/5
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    {!canUseRatings ? (
                      <p className="text-sm text-[color:var(--text-secondary)]">
                        Customer accounts can rate menu items after ordering.
                      </p>
                    ) : ratingQuery.isLoading ? (
                      <p className="text-sm text-[color:var(--text-secondary)]">
                        Checking rating eligibility...
                      </p>
                    ) : !ratingQuery.data?.eligible ? (
                      <p className="text-sm text-[color:var(--text-secondary)]">
                        Complete an order with this item first, then you can leave a rating here.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: 5 }, (_, index) => {
                            const nextRating = index + 1;
                            const isActive = nextRating <= draftRating;

                            return (
                              <button
                                key={nextRating}
                                type="button"
                                onClick={() => setDraftRating(nextRating)}
                                className={`rounded-full border px-3 py-2 transition ${
                                  isActive
                                    ? "border-amber-300 bg-amber-50 text-amber-600"
                                    : "border-[color:var(--border-subtle)] bg-white text-[color:var(--text-secondary)]"
                                }`}
                              >
                                <Star className={`h-4 w-4 ${isActive ? "fill-current" : ""}`} />
                              </button>
                            );
                          })}
                        </div>

                        <textarea
                          value={draftReview}
                          onChange={(event) => setDraftReview(event.target.value)}
                          placeholder="Optional: share a quick note about this dish."
                          rows={3}
                          className="w-full rounded-2xl border border-[color:var(--border-subtle)] bg-white px-4 py-3 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--accent)]"
                        />

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            disabled={draftRating < 1 || ratingMutation.isPending}
                            onClick={() => {
                              void handleSubmitRating();
                            }}
                            className="ui-button ui-button-pill px-5 py-3 text-sm font-semibold disabled:opacity-60"
                          >
                            {ratingMutation.isPending
                              ? "Saving..."
                              : ratingQuery.data?.myRating
                                ? "Update Rating"
                                : "Submit Rating"}
                          </button>
                          <p className="text-xs text-[color:var(--text-secondary)]">
                            One rating per guest. You can update it later.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

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
