import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import type { To } from "react-router-dom";
import ThemeToggle from "../../../../components/ThemeToggle";
import { goBackOrNavigate } from "../../../../utils/navigation";

interface HeaderProps {
  title: string;
  className?: string;
  fallbackTo?: To;
}

export default function Header({ title, className, fallbackTo }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header
      className={`${className ? `${className} ` : ""}sticky top-0 z-40 border-b border-(--border-subtle) bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)] backdrop-blur-xl`}
    >
      <div className="app-container flex h-16 items-center justify-between px-4">
        <button
          type="button"
          onClick={() => {
            if (fallbackTo) {
              goBackOrNavigate(navigate, fallbackTo, location.key);
              return;
            }

            navigate(-1);
          }}
          className="ui-icon-button h-10 min-w-10 rounded-full p-0 text-(--accent)"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="mx-4 min-w-0 flex-1 truncate text-center font-display text-lg font-semibold text-(--text-primary)">
          {title}
        </h1>
        <ThemeToggle compact />
      </div>
    </header>
  );
}
