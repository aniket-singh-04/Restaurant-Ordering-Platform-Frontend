import type { MenuItem } from "../../../components/MenuCard/types";
import { normalizeCategoryId, type Category } from "../../../types";

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
  const normalizedActiveCategory = normalizeCategoryId(activeCategory);

  return items.filter((item) => {
    const matchesCategory =
      normalizedActiveCategory === "all" ||
      normalizeCategoryId(item.category) === normalizedActiveCategory;
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
    : categories.find(
        (category) =>
          normalizeCategoryId(category.id) === normalizeCategoryId(activeCategory),
      )?.name;
