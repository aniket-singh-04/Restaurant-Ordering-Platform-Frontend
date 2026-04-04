
export interface Category {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}

export const normalizeCategoryId = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const menuCategoryDefinitions = [
  { name: "Core Meal", icon: "CM" },
  { name: "Protein-Based", icon: "PB" },
  { name: "Cuisine", icon: "C" },
  { name: "Fast Food", icon: "FF" },
  { name: "Desserts", icon: "D" },
  { name: "Beverages", icon: "BV" },
  { name: "Health", icon: "H" },
  { name: "Breakfast", icon: "B" },
  { name: "Specials", icon: "S" },
] as const;

export const menuCategoryNames = menuCategoryDefinitions.map(({ name }) => name);

export const categories: Category[] = [
  { id: "all", name: "All", icon: "ALL", itemCount: 0 },
  ...menuCategoryDefinitions.map(({ name, icon }) => ({
    id: normalizeCategoryId(name),
    name,
    icon,
    itemCount: 0,
  })),
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
export interface multiImage {
  altText: string;
  isPrimary: boolean;
  mimeType: string;
  s3Key: string;
  sizeBytes: number;
  url: string;
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
  image: string;
  images: multiImage[];

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
