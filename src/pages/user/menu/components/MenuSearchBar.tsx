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
    <div className={`relative flex flex-col gap-3 sm:flex-row ${className}`}>
      <div className="relative min-w-0 flex-1 gap-2">
        <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2" />
        <input
          value={value}
          onChange={onChange}
          placeholder="Search for dishes..."
          className="ui-input h-12 pl-11! disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {action}
    </div>
  );
}
