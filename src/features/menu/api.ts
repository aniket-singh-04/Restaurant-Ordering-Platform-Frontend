import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/api";
import type { MenuItem, multiImage } from "../../components/MenuCard/types";

export type MenuRatingRecord = {
  id: string;
  menuId: string;
  restaurantId?: string;
  branchId?: string;
  userId?: string;
  rating: number;
  review?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MenuRatingSummary = {
  avgRating: number;
  totalRatings: number;
};

type MenuApiItem = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price?: number;
  priceMinor?: number;
  image?: string;
  images?: multiImage[];
  category: string;
  isVeg?: boolean;
  isSpicy?: boolean;
  rating?: { average?: number; count?: number };
  avgRating?: number;
  totalRatings?: number;
  myRating?: { rating?: number } | number | null;
  preparationTimeMinutes?: number;
  addOns?: Array<{ code?: string; name: string; price?: number; priceDeltaMinor?: number }>;
  has3DModel?: boolean;
};

const toMajorPrice = (item: MenuApiItem) => {
  if (typeof item.price === "number") return item.price;
  if (typeof item.priceMinor === "number") return item.priceMinor / 100;
  return 0;
};

const mapMenuItem = (item: MenuApiItem): MenuItem => ({
  id: item._id ?? item.id ?? "",
  name: item.name,
  description: item.description ?? "",
  price: toMajorPrice(item),
  image: item.image ?? item.images?.[0]?.url ?? "",
  images: item.images?.map((img): multiImage => ({
    altText: img.altText ?? "",
    isPrimary: img.isPrimary ?? false,
    mimeType: img.mimeType ?? "",
    s3Key: img.s3Key ?? "",
    sizeBytes: img.sizeBytes ?? 0,
    url: img.url ?? ""
  })) ?? [],
  category: item.category,
  isVeg: item.isVeg ?? false,
  isSpicy: item.isSpicy ?? false,
  rating: item.avgRating ?? item.rating?.average ?? 0,
  avgRating: item.avgRating ?? item.rating?.average ?? 0,
  totalRatings: item.totalRatings ?? item.rating?.count ?? 0,
  myRating:
    typeof item.myRating === "number"
      ? item.myRating
      : item.myRating?.rating ?? null,
  prepTime: `${item.preparationTimeMinutes ?? 15} min`,
  addOns:
    item.addOns?.map((addOn, index) => ({
      id: addOn.code ?? `${item._id ?? item.id}-addon-${index}`,
      name: addOn.name,
      price:
        typeof addOn.price === "number"
          ? addOn.price
          : typeof addOn.priceDeltaMinor === "number"
            ? addOn.priceDeltaMinor / 100
            : 0,
    })) ?? [],
  has3DModel: item.has3DModel ?? false,
});

export const useBranchMenu = (branchId?: string, restaurantId?: string) =>
  useQuery({
    queryKey: ["menu", branchId, restaurantId],
    enabled: Boolean(branchId || restaurantId),
    queryFn: async () => {
      const response = branchId
        ? await api.get<{ data: MenuApiItem[] }>(
            `/api/v1/menu/branch/${encodeURIComponent(branchId)}`,
          )
        : await api.get<{ data: MenuApiItem[] }>(
            `/api/v1/menu?restaurantId=${encodeURIComponent(restaurantId ?? "")}`,
          );
      return response.data.map(mapMenuItem);
    },
  });

export const useMenuItem = (menuId?: string) =>
  useQuery({
    queryKey: ["menu-item", menuId],
    enabled: Boolean(menuId),
    queryFn: async () => {
      const response = await api.get<{ data: MenuApiItem }>(`/api/v1/menu/${menuId}`);
      return mapMenuItem(response.data);
    },
  });

export const useMyMenuRating = (menuId?: string, enabled = true) =>
  useQuery({
    queryKey: ["menu-rating", menuId],
    enabled: Boolean(menuId) && enabled,
    queryFn: async () => {
      const response = await api.get<{
        data: {
          eligible: boolean;
          myRating: MenuRatingRecord | null;
          summary: MenuRatingSummary;
        };
      }>(`/api/v1/menu/${menuId}/ratings/me`);
      return response.data;
    },
  });

export const upsertMenuRating = async (
  menuId: string,
  payload: {
    rating: number;
    review?: string;
  },
) => {
  const response = await api.post<{
    data: {
      myRating: MenuRatingRecord | null;
      summary: MenuRatingSummary;
    };
  }>(`/api/v1/menu/${menuId}/ratings`, payload);
  return response.data;
};
