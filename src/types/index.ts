export interface Category {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}

export const categories: Category[] = [
  { id: "all", name: "All", icon: "ALL", itemCount: 12 },
  { id: "starters", name: "Starters", icon: "S", itemCount: 3 },
  { id: "main-course", name: "Main Course", icon: "M", itemCount: 4 },
  { id: "pizza", name: "Pizza", icon: "P", itemCount: 2 },
  { id: "burgers", name: "Burgers", icon: "B", itemCount: 2 },
  { id: "desserts", name: "Desserts", icon: "D", itemCount: 2 },
  { id: "beverages", name: "Beverages", icon: "BV", itemCount: 2 },
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

