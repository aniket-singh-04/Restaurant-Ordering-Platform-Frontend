import { useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { isAdminPanelRole } from "../../features/auth/access";
import { goBackOrNavigate } from "../../utils/navigation";

export default function NotAuthorized() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const fallbackPath = user && isAdminPanelRole(user.role) ? "/admin" : "/";

  return (
    <div className="state-shell px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="auth-theme-bar">
          <ThemeToggle />
        </div>
        <div className="state-card px-6 py-10 text-center sm:px-8">
          <p className="ui-eyebrow">Authorization</p>
          <h1 className="mt-3 font-display text-5xl font-extrabold text-[color:var(--text-primary)]">
            Access Denied
          </h1>
          <p className="mt-4 text-base text-[color:var(--text-secondary)]">
            You do not have permission to view this page.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => goBackOrNavigate(navigate, fallbackPath, location.key)}
              className="ui-button-secondary ui-button-pill px-6 text-sm font-semibold"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="ui-button ui-button-pill px-6 text-sm font-semibold"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
