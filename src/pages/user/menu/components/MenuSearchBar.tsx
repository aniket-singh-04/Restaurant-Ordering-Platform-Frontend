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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
        <input
          value={value}
          onChange={onChange}
          placeholder="Search for dishes..."
          className="w-full h-12 pl-12 rounded-xl bg-[#f0ebe6] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f97415] disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {action}
    </div>
  );
}
