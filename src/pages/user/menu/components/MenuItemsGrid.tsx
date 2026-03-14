import type { ReactNode } from "react";
import MenuCard from "../../../../components/MenuCard/MenuCard";
import type { MenuItem } from "../../../../components/MenuCard/types";

interface MenuItemsGridProps {
  items: MenuItem[];
  emptyState: ReactNode;
  className?: string;
}

export default function MenuItemsGrid({
  items,
  emptyState,
  className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4",
}: MenuItemsGridProps) {
  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <MenuCard key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}
