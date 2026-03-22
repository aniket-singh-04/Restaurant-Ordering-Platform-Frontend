import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/api";
import type { MenuItem } from "../../components/MenuCard/types";

type MenuApiItem = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price?: number;
  priceMinor?: number;
  image?: string;
  images?: Array<{ url?: string }>;
  category: string;
  isVeg?: boolean;
  isSpicy?: boolean;
  rating?: { average?: number };
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
  category: item.category,
  isVeg: item.isVeg ?? false,
  isSpicy: item.isSpicy ?? false,
  rating: item.rating?.average ?? 4.5,
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
      const searchParams = new URLSearchParams();
      if (branchId) searchParams.set("branchId", branchId);
      if (restaurantId) searchParams.set("restaurantId", restaurantId);
      const response = await api.get<{ data: MenuApiItem[] }>(
        `/api/v1/menu?${searchParams.toString()}`,
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
