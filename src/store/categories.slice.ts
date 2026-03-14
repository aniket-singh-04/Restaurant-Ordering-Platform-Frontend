import type { MenuItem } from "../components/MenuCard/types";
import type { Category } from "../types";

export const buildCategories = (items: MenuItem[]): Category[] => {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  const result: Category[] = [
    { id: "all", name: "All", icon: "All", itemCount: items.length },
  ];

  Object.entries(counts).forEach(([id, itemCount]) => {
    result.push({ id, name: id, icon: "", itemCount });
  });

  return result;
};
