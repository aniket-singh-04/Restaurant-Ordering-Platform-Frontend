import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
};

export default function ThemeToggle({
  className = "",
  compact = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`ui-icon-button ui-theme-toggle ${compact ? "h-10 min-w-10 rounded-full px-0" : "ui-button-pill px-4"} ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="theme-toggle__icon" aria-hidden="true" />
      ) : (
        <Moon className="theme-toggle__icon" aria-hidden="true" />
      )}
      {!compact ? (
        <span>{isDark ? "Light mode" : "Dark mode"}</span>
      ) : null}
    </button>
  );
}
