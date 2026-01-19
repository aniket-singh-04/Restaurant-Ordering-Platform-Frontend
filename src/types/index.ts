export interface Category {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}

export const categories: Category[] = [
  { id: "all", name: "All", icon: "🍽️", itemCount: 12 },
  { id: "starters", name: "Starters", icon: "🥗", itemCount: 3 },
  { id: "main-course", name: "Main Course", icon: "🍛", itemCount: 4 },
  { id: "pizza", name: "Pizza", icon: "🍕", itemCount: 2 },
  { id: "burgers", name: "Burgers", icon: "🍔", itemCount: 2 },
  { id: "desserts", name: "Desserts", icon: "🍰", itemCount: 2 },
  { id: "beverages", name: "Beverages", icon: "🥤", itemCount: 2 },
];
