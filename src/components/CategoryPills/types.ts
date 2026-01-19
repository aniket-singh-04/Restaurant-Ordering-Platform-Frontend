export interface Category {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}

export interface CategoryPillsProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (categoryId: string) => void;
}
