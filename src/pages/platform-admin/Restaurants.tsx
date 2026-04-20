import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
  reviewPlatformRestaurant,
  updatePlatformRestaurantSuspension,
  usePlatformAdminRestaurantMetrics,
  usePlatformAdminRestaurants,
} from "../../features/platform-admin/restaurants/api";
import type { AdminRestaurantRecord } from "../../features/platform-admin/auth/types";
import { formatPrice } from "../../utils/formatPrice";
import { FilterListBox } from "../../components/FilterListBox";
import { reviewStatusOptions, suspensionStatusOptions } from "../../utils/filterOptions";

// const cardClass = "rounded-4xl p-4 shadow-md border border-[#f0e6dc]";
const cardClass = "ui-card";

export default function PlatformAdminRestaurants() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [search, setSearch] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [suspensionStatus, setSuspensionStatus] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | undefined>();

  const query = useMemo(
    () => ({
      page: 1,
      limit: 20,
      search,
      reviewStatus,
      suspensionStatus,
    }),
    [search, reviewStatus, suspensionStatus],
  );

  const restaurants = usePlatformAdminRestaurants(query);
  const metrics = usePlatformAdminRestaurantMetrics(selectedRestaurantId);

  useEffect(() => {
    if (!selectedRestaurantId && restaurants.data?.items[0]?.id) {
      setSelectedRestaurantId(restaurants.data.items[0].id);
    }
  }, [restaurants.data, selectedRestaurantId]);

  const reviewMutation = useMutation({
    mutationFn: (payload: {
      restaurantId: string;
      action: "APPROVE" | "REJECT";
      reason?: string;
    }) => reviewPlatformRestaurant(payload.restaurantId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform-admin", "restaurants"] });
      void queryClient.invalidateQueries({ queryKey: ["platform-admin", "restaurant-metrics"] });
    },
  });

  const suspensionMutation = useMutation({
    mutationFn: (payload: {
      restaurantId: string;
      action: "SUSPEND" | "UNSUSPEND";
      reason?: string;
    }) => updatePlatformRestaurantSuspension(payload.restaurantId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform-admin", "restaurants"] });
      void queryClient.invalidateQueries({ queryKey: ["platform-admin", "restaurant-metrics"] });
    },
  });

  const handleReview = async (restaurant: AdminRestaurantRecord, action: "APPROVE" | "REJECT") => {
    const reason =
      action === "REJECT"
        ? window.prompt(`Reject ${restaurant.name}\nReason:`, "")
        : window.prompt(`Approve ${restaurant.name}\nOptional note:`, "") ?? "";

    if (action === "REJECT" && !reason?.trim()) return;

    try {
      await reviewMutation.mutateAsync({
        restaurantId: restaurant.id,
        action,
        reason: reason?.trim() || undefined,
      });
      pushToast({
        title: action === "APPROVE" ? "Restaurant approved" : "Restaurant rejected",
        variant: "success",
      });
    } catch (error) {
      pushToast({
        title: "Restaurant review failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  const handleSuspension = async (
    restaurant: AdminRestaurantRecord,
    action: "SUSPEND" | "UNSUSPEND",
  ) => {
    const reason =
      action === "SUSPEND"
        ? window.prompt(`Suspend ${restaurant.name}\nReason:`, "")
        : window.prompt(`Unsuspend ${restaurant.name}\nOptional note:`, "") ?? "";

    if (action === "SUSPEND" && !reason?.trim()) return;

    try {
      await suspensionMutation.mutateAsync({
        restaurantId: restaurant.id,
        action,
        reason: reason?.trim() || undefined,
      });
      pushToast({
        title: action === "SUSPEND" ? "Restaurant suspended" : "Restaurant reactivated",
        variant: "success",
      });
    } catch (error) {
      pushToast({
        title: "Suspension update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <div className="grid gap-3 xl:grid-cols-[1.5fr_0.5fr] overflow-x-hidden">

      {/* LEFT SIDE */}
      <section className="space-y-6 min-w-0">

        {/* Filters Card */}
        <div className={`${cardClass} relative z-20 p-5 sm:p-6`}>
          <p className="text-xs uppercase tracking-[0.35em] text-[#8b7661]">
            Restaurants
          </p>

          <h1 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#2a221c]">
            Review & Control
          </h1>

          <div className="mt-5 space-y-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurants..."
              className="w-full rounded-xl border border-[#e0d2c3] px-4 py-3 text-sm placeholder-[#a89c8f] transition-all focus:border-[#9d8c7a] focus:outline-none focus:ring-2 focus:ring-[#8f5f2f]/20"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FilterListBox
                label="Review Status"
                options={reviewStatusOptions}
                value={reviewStatus}
                onChange={setReviewStatus}
              />
              <FilterListBox
                label="Suspension Status"
                options={suspensionStatusOptions}
                value={suspensionStatus}
                onChange={setSuspensionStatus}
              />
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className={`${cardClass} p-4 sm:p-6`}>
          {restaurants.isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-[#f4efe7]" />
              ))}
            </div>
          ) : restaurants.isError || !restaurants.data ? (
            <div className="rounded-xl bg-[#fef3f0] p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-[#d84040]" />
              <div>
                <p className="font-semibold text-[#d84040]">
                  Failed to load restaurants
                </p>
                <p className="text-sm text-[#b84040]">
                  {restaurants.error instanceof Error
                    ? restaurants.error.message
                    : "Please try again."}
                </p>
              </div>
            </div>
          ) : restaurants.data.items.length ? (
            <div className="overflow-x-auto scrollbar-thin rounded-xl shadow-md border border-gray-200">
              <table className="min-w-full text-sm divide-y divide-gray-200">
                {/* HEADER */}
                <thead className="bg-[#faf6f0] sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#8b7661] uppercase tracking-wide">
                      Restaurant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#8b7661] uppercase tracking-wide">
                      Review
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#8b7661] uppercase tracking-wide">
                      Suspension
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#8b7661] uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* BODY */}
                <tbody className=" divide-y divide-gray-100">
                  {restaurants.data.items.map((restaurant) => (
                    <tr
                      key={restaurant.id}
                      onClick={() => setSelectedRestaurantId(restaurant.id)}
                      className={`transition cursor-pointer `}
                    >
                      {/* Restaurant Info */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-[#2a221c]">{restaurant.name}</p>
                        <p
                          className="text-xs text-[#a89c8f] truncate"
                          title={restaurant.supportEmail}
                        >
                          {restaurant.supportEmail}
                        </p>
                      </td>

                      {/* Review Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${restaurant.platformReview.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : restaurant.platformReview.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-[#f4efe7] text-[#8b7661]"
                            }`}
                        >
                          {restaurant.platformReview.status}
                        </span>
                      </td>

                      {/* Suspension Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${restaurant.platformSuspension.status === "SUSPENDED"
                            ? "bg-red-100 text-red-800"
                            : "bg-[#f4efe7] text-[#8b7661]"
                            }`}
                        >
                          {restaurant.platformSuspension.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview(restaurant, "APPROVE");
                            }}
                            className="px-4 py-2 text-xs font-semibold rounded-full bg-green-100 text-green-700 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-200 focus:ring-opacity-50 transition-colors"
                          >
                            Approve
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview(restaurant, "REJECT");
                            }}
                            className="px-4 py-2 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:ring-opacity-50 transition-colors"
                          >
                            Reject
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSuspension(restaurant, "SUSPEND");
                            }}
                            className="px-4 py-2 text-xs font-semibold rounded-full bg-red-100 text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-opacity-50 transition-colors"
                          >
                            Suspend
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSuspension(restaurant, "UNSUSPEND");
                            }}
                            className="px-4 py-2 text-xs font-semibold rounded-full bg-green-200 text-green-800 hover:bg-green-300 focus:outline-none focus:ring-2 focus:ring-green-200 focus:ring-opacity-50 transition-colors"
                          >
                            Unsuspend
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl bg-[#f4efe7] p-4 text-center text-sm text-[#a89c8f]">
              No restaurants matched the filters
            </div>
          )}
        </div>
      </section>

      {/* RIGHT SIDE */}
      <aside className={`${cardClass} p-5 sm:p-6`}>
        <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#2a221c]">
          Selected Restaurant
        </h2>

        {metrics.isLoading ? (
          <div className="mt-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-[#f4efe7]" />
            ))}
          </div>
        ) : metrics.isError || !metrics.data ? (
          <p className="mt-4 text-sm text-[#a89c8f]">
            Select a restaurant to view details
          </p>
        ) : (
          <div className="mt-5 space-y-5 text-sm">
            <div className="border-b pb-3">
              <p className="label">Name</p>
              <p className="value">{metrics.data.restaurant.name}</p>
            </div>

            <div className="border-b pb-3">
              <p className="label">Orders</p>
              <p className="value text-xl">{metrics.data.totalOrders}</p>
            </div>

            <div className="border-b pb-3">
              <p className="label">Revenue</p>
              <p className="value text-[#8f5f2f] text-xl">
                {formatPrice(metrics.data.totalRevenueMinor / 100)}
              </p>
            </div>

            <div>
              <p className="label">Subscription</p>
              {metrics.data.currentSubscription ? (
                <p className="value">
                  {metrics.data.currentSubscription.planCode}
                </p>
              ) : (
                <p className="text-[#a89c8f]">No subscription</p>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
