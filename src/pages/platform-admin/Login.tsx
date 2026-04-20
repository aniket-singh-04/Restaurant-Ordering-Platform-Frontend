import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";
import { useToast } from "../../context/ToastContext";
import { usePlatformAdminAuth } from "../../features/platform-admin/auth/context";

export default function PlatformAdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, login, loading } = usePlatformAdminAuth();
  const { pushToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (admin) {
    return <Navigate to="/platform" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError("");
      await login({ email: email.trim(), password });

      pushToast({
        title: "Platform access granted",
        variant: "success",
      });

      const redirectTo =
        (location.state as { from?: string } | undefined)?.from ?? "/platform";
      navigate(redirectTo, { replace: true });
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Could not sign in.";
      setError(message);
      pushToast({
        title: "Sign-in failed",
        description: message,
        variant: "error",
      });
    }
  };

  return (
    <div className="auth-shell px-4 py-12 text-(--text-primary)">
      <div className="auth-frame">
        <div className="auth-theme-bar">
          <ThemeToggle />
        </div>
        <div className="auth-card auth-grid overflow-hidden rounded-[2.2rem]">
          <div className="hidden bg-[#1f1914] p-10 text-[#f7f1e3] lg:block">
            <p className="text-xs uppercase tracking-[0.35em] text-[#d7c8b7]">Platform Owner</p>
            <h1 className="mt-4 max-w-sm font-display text-4xl font-bold leading-tight">
              Secure control for the whole ordering network.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-[#d7c8b7]">
              This console is isolated from the restaurant admin area and is intended only
              for manually provisioned platform super admins.
            </p>
          </div>

          <div className="auth-body">
            <div className="mx-auto max-w-md">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-2xl bg-[#1f1914] p-3 text-[#f7f1e3]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-(--text-muted)">/platform</p>
                  <h2 className="font-display text-3xl font-bold text-(--text-primary)">Super Admin Login</h2>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="ui-field-label !mb-2 !text-(--text-secondary) !tracking-[0.16em]">
                    Admin email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="ui-input"
                    placeholder="owner@platform.com"
                    autoComplete="email"
                  />
                </label>

                <label className="block">
                  <span className="ui-field-label !mb-2 !text-(--text-secondary) !tracking-[0.16em]">
                    Password
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="ui-input"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </label>

                {error ? (
                  <div className="rounded-2xl border border-[color-mix(in_srgb,var(--danger)_24%,transparent)] bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="ui-button ui-button-pill w-full justify-center font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Enter platform console"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
