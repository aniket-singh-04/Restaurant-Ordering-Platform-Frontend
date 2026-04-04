import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { resetPassword } from "../features/auth/api";
import { useToast } from "../context/ToastContext";
import { getApiErrorMessage } from "../utils/apiErrorHelpers";
import { isStrongPassword } from "../utils/validators";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pushToast } = useToast();

  const userId = searchParams.get("userId") ?? "";
  const token = searchParams.get("token") ?? "";
  const hasValidLink = Boolean(userId && token);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const helperCopy = useMemo(() => {
    if (hasValidLink) {
      return "Choose a new password to complete the reset.";
    }
    return "This password reset link is missing required information or has already expired.";
  }, [hasValidLink]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!hasValidLink) {
      setError("This password reset link is invalid.");
      return;
    }

    if (!isStrongPassword(password, 8)) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await resetPassword({
        userId,
        token,
        password,
      });
      pushToast({
        title: "Password reset successful",
        description: response.message || "Please sign in with your new password.",
        variant: "success",
      });
      navigate("/login");
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to reset password.");
      setError(message);
      pushToast({
        title: "Reset failed",
        description: message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="state-shell">
      <div className="mx-auto w-full max-w-3xl">
        <div className="auth-theme-bar">
          <ThemeToggle />
        </div>
        <div className="state-card px-6 py-8 sm:px-8">
          <div className="mx-auto max-w-md">
            <p className="ui-eyebrow text-center">Password Reset</p>
            <h2 className="mt-3 text-center font-display text-3xl font-semibold text-[color:var(--text-primary)]">
              Set New Password
            </h2>
            <p className="mt-3 text-center text-sm text-[color:var(--text-secondary)]">{helperCopy}</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="ui-field-label" htmlFor="reset-password">
                  New Password
                </label>
                <input
                  id="reset-password"
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ui-input"
                  disabled={!hasValidLink}
                />
              </div>
              <div>
                <label className="ui-field-label" htmlFor="reset-password-confirm">
                  Confirm Password
                </label>
                <input
                  id="reset-password-confirm"
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="ui-input"
                  disabled={!hasValidLink}
                />
              </div>

              {error ? (
                <p className="rounded-2xl border border-[color:color-mix(in_srgb,var(--danger)_24%,transparent)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger)]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading || !hasValidLink}
                className="ui-button ui-button-pill w-full justify-center text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "Updating..." : "Reset Password"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-5 text-sm font-semibold text-[color:var(--accent)] transition hover:text-[color:var(--accent-hover)]"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
