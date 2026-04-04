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
              flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5
              text-sm font-semibold transition-all duration-300 ease-out
              active:scale-95 focus:outline-none
              ${
                isActive
                  ? "warm-linear text-white shadow-[var(--shadow-glow)]"
                  : "border border-[color:var(--border-subtle)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
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
