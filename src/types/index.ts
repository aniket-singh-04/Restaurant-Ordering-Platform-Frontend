export interface Category {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}

export const categories: Category[] = [
  { id: "all", name: "All", icon: "ALL", itemCount: 12 },
  { id: "core-meal", name: "Core Meal", icon: "CM", itemCount: 0 },
  { id: "protein-based", name: "Protein-Based", icon: "PB", itemCount: 0 },
  { id: "cuisine", name: "Cuisine", icon: "C", itemCount: 0 },
  { id: "fast-food", name: "Fast Food", icon: "FF", itemCount: 0 },
  { id: "desserts", name: "Desserts", icon: "D", itemCount: 0 },
  { id: "beverages", name: "Beverages", icon: "BV", itemCount: 0 },
  { id: "health", name: "Health", icon: "H", itemCount: 0 },
  { id: "breakfast", name: "Breakfast", icon: "B", itemCount: 0 },
  { id: "specials", name: "Specials", icon: "S", itemCount: 0 },
];

export interface AddOn {
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface Rating {
  average: number;
  count: number;
}

export interface Menu {
  _id?: string;

  restaurantId: string;
  branchIds: string[];

  name: string;
  description?: string;
  price: number;

  addOns: AddOn[];

  category: string;
  images: {
    front?: File | null
    top?: File | null
    back?: File | null
    angled?: File | null
  }

  isVeg: boolean;
  isSpicy: boolean;
  has3DModel: boolean;
  isAvailable: boolean;

  isDeleted?: boolean;

  preparationTimeMinutes: number;

  rating?: Rating;

  menuVersion?: number;

  createdAt?: string;
  updatedAt?: string;
}

