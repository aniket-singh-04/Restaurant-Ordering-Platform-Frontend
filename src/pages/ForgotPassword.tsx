import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineMailOpen } from "react-icons/hi";
import { FaPhone } from "react-icons/fa";
import ThemeToggle from "../components/ThemeToggle";
import { requestPasswordReset } from "../features/auth/api";
import { getApiErrorMessage } from "../utils/apiErrorHelpers";
import { isValidEmail, isValidPhone } from "../utils/validators";
import { useToast } from "../context/ToastContext";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    const normalizedPhone = phone.trim();

    if (!normalizedEmail && !normalizedPhone) {
      setError("Email or phone is required");
      return;
    }
    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      setError("Enter a valid email");
      return;
    }
    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      setError("Enter a valid phone number");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await requestPasswordReset({
        email: normalizedEmail || undefined,
        phone: normalizedPhone || undefined,
      });
      const message =
        response.message ||
        "We sent a password reset link to your email. Open that link to choose a new password.";
      setSuccessMessage(message);
      setRequested(true);
      pushToast({
        title: "Reset link sent",
        description: message,
        variant: "success",
      });
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to send reset link.");
      setError(message);
      pushToast({
        title: "Request failed",
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
            <p className="ui-eyebrow text-center">Account Recovery</p>
            <h2 className="mt-3 text-center font-display text-3xl font-semibold text-(--text-primary)">
              Reset Password
            </h2>
            <p className="mt-3 text-center text-sm text-(--text-secondary)">
              Enter your email or phone number. We will send a password reset link to the
              account email.
            </p>

            {!requested ? (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label className="ui-field-label" htmlFor="forgot-email">
                    Email Address
                  </label>
                  <div className="ui-field-shell">
                    <HiOutlineMailOpen className="text-(--accent)" />
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="ui-field-label" htmlFor="forgot-phone">
                    Phone Number
                  </label>
                  <div className="ui-field-shell">
                    <FaPhone className="text-(--accent)" />
                    <input
                      id="forgot-phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                {error ? (
                  <p className="rounded-2xl border border-[color-mix(in_srgb,var(--danger)_24%,transparent)] bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="ui-button ui-button-pill w-full justify-center text-sm font-semibold disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            ) : (
              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-[color-mix(in_srgb,var(--success)_24%,transparent)] bg-(--success-soft) px-4 py-4 text-sm text-(--success)">
                  {successMessage}
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="ui-button-secondary ui-button-pill w-full justify-center text-sm font-semibold"
                >
                  Back to login
                </button>
              </div>
            )}

            {!requested && (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-5 text-sm font-semibold text-(--accent) transition hover:text-(--accent-hover)"
              >
                Back to login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
