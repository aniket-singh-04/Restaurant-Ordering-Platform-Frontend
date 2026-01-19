import type { CategoryPillsProps } from "./types";

export default function CategoryPills({
  categories,
  activeCategory,
  onSelect,
}: CategoryPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
      {categories.map((category) => {
        const isActive = activeCategory === category.id;
        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap
              text-sm font-medium transition-all duration-300 ease-out
              active:scale-95 focus:outline-none cursor-pointer
              ${
                isActive
                  ? "text-white bg-linear-to-br from-orange-500 via-orange-400 to-yellow-400"
                  : "bg-[#eae4dc] hover:bg-linear-to-br from-orange-250 via-orange-200 to-yellow-200 text-gray-700"
              }
            `}
          >
            <span className="text-lg">{category.icon}</span>
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}
