import type { ChangeEventHandler, ReactNode } from "react";
import { Search } from "lucide-react";

interface MenuSearchBarProps {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  action?: ReactNode;
  className?: string;
}

export default function MenuSearchBar({
  value,
  onChange,
  action,
  className = "",
}: MenuSearchBarProps) {
  return (
    <div className={`relative flex gap-3 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--text-muted)]" />
        <input
          value={value}
          onChange={onChange}
          placeholder="Search for dishes..."
          className="ui-input h-12 pl-12 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {action}
    </div>
  );
}
