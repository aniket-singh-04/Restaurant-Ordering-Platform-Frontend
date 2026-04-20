import { useNavigate } from "react-router-dom";
import ThemeToggle from "../../components/ThemeToggle";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="state-shell">
      <div className="mx-auto w-full max-w-3xl">
        <div className="auth-theme-bar">
          <ThemeToggle />
        </div>
        <div className="state-card px-6 py-10 text-center sm:px-8">
          <p className="ui-eyebrow">Not Found</p>
          <h1 className="mt-3 font-display text-6xl font-extrabold text-(--text-primary)">404</h1>
          <p className="mt-4 text-base text-(--text-secondary)">
            Page not found
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="ui-button ui-button-pill mt-8 px-6 text-sm font-semibold"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
