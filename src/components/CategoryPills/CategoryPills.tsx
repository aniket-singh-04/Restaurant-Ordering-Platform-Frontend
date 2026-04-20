import { useEffect, useRef } from "react";
import type { CategoryPillsProps } from "./types";

export default function CategoryPills({
  categories,
  activeCategory,
  onSelect,
}: CategoryPillsProps) {
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const activePill = pillRefs.current[activeCategory];
    if (!activePill) {
      return;
    }

    activePill.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategory, categories]);

  return (
    <div
      className="scrollbar-thin min-w-0 max-w-full w-full overflow-x-auto overscroll-x-contain pb-2"
      style={{ WebkitOverflowScrolling: "touch" }}
      aria-label="Menu categories"
    >
      <div className="flex w-max snap-x snap-mandatory gap-2 pr-1">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              ref={(node) => {
                pillRefs.current[category.id] = node;
              }}
              type="button"
              onClick={() => onSelect(category.id)}
              aria-pressed={isActive}
              className={`
              flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5
              text-sm font-semibold transition-all duration-300 ease-out
              active:scale-95 focus:outline-none
              ${isActive
                  ? "warm-linear text-white shadow-(--shadow-glow)"
                  : "border border-(--border-subtle) bg-(--surface) text-(--text-secondary) hover:border-(--accent) hover:text-(--accent)"
                }
            `}
            >
              <span className="text-lg">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
