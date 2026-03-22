import type { MenuItem } from "../../../components/MenuCard/types";
import type { Category } from "../../../types";

type MenuFilterOptions = {
  activeCategory: string;
  searchQuery: string;
  showVegOnly?: boolean;
};

export const filterMenuItems = (
  items: MenuItem[],
  { activeCategory, searchQuery, showVegOnly = false }: MenuFilterOptions,
) => {
  const query = searchQuery.toLowerCase();

  return items.filter((item) => {
    const matchesCategory =
      activeCategory === "all" || item.category.toLowerCase() === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(query);
    const matchesVeg = showVegOnly ? item.isVeg : true;

    return matchesCategory && matchesSearch && matchesVeg;
  });
};

export const getFeaturedMenuItems = (items: MenuItem[]) =>
  items.filter((item) => item.rating >= 4.7).slice(0, 3);

export const getActiveCategoryTitle = (
  categories: Category[],
  activeCategory: string,
) =>
  activeCategory === "all"
    ? "Full Menu"
    : categories.find((category) => category.id === activeCategory)?.name;
