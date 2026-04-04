import { useState, type FormEvent } from "react";
import { FaPhone } from "react-icons/fa";
import { HiOutlineMailOpen } from "react-icons/hi";
import { MdFoodBank, MdOutlinePassword, MdOutlineSms } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isAdminPanelRole } from "../features/auth/access";
import {
  initiateLogin,
  verifyLoginOtp,
  type AuthOtpChallenge,
  type AuthSessionPayload,
} from "../features/auth/api";
import { setAuthToken } from "../features/auth/storage";
import { authStore } from "../features/auth/store";
import { mapAuthUser } from "../features/auth/user";
import { getApiErrorMessage } from "../utils/apiErrorHelpers";
import { isStrongPassword, isValidEmail, isValidOtp, isValidPhone } from "../utils/validators";

const fieldShellClass =
  "ui-field-shell";
const fieldInputClass =
  "w-full bg-transparent text-[15px] font-medium outline-none";
const fieldLabelClass = "ui-field-label";
const primaryButtonClass =
  "ui-button ui-button-pill w-full justify-center text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass =
  "text-sm font-semibold text-[color:var(--accent)] transition hover:text-[color:var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const { pushToast } = useToast();

  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState<AuthOtpChallenge | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const validateCredentials = () => {
    const normalizedEmail = email.trim();
    const normalizedPhone = phone.trim();

    if (!normalizedEmail && !normalizedPhone) {
      setError("Enter phone number or email");
      return null;
    }

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address");
      return null;
    }

    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      setError("Enter valid 10 digit phone number");
      return null;
    }

    if (!isStrongPassword(password, 6)) {
      setError("Password must be at least 6 characters");
      return null;
    }

    return {
      password,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      ...(normalizedPhone ? { phone: normalizedPhone } : {}),
    };
  };

  const persistSession = (payload: AuthSessionPayload) => {
    setAuthToken(payload.accessToken);
    const mappedUser = mapAuthUser(payload.user);
    authStore.setUser(mappedUser);
    setUser(mappedUser);

    const redirectTo =
      (location.state as { from?: string } | undefined)?.from ??
      (mappedUser && isAdminPanelRole(mappedUser.role) ? "/admin" : "/");
    navigate(redirectTo, { replace: true });
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = validateCredentials();
    if (!payload) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await initiateLogin(payload);
      setChallenge(data);
      setOtp("");

      pushToast({
        title: "OTP sent",
        description: data.message || `Enter the code sent to ${data.maskedEmail}.`,
        variant: "success",
      });
    } catch (err) {
      const message = getApiErrorMessage(err, "Login could not be started.");
      setError(message);
      pushToast({
        title: "Login failed",
        description: message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!challenge?.challengeId) {
      setError("Start login again to receive a new OTP.");
      return;
    }

    if (!isValidOtp(otp)) {
      setError("Enter a valid OTP");
      return;
    }

    try {
      setVerifying(true);
      setError("");

      const data = await verifyLoginOtp({
        challengeId: challenge.challengeId,
        otp: otp.trim(),
      });

      pushToast({ title: "Login successful", variant: "success" });
      persistSession(data);
    } catch (err) {
      const message = getApiErrorMessage(err, "OTP verification failed.");
      setError(message);
      pushToast({
        title: "OTP verification failed",
        description: message,
        variant: "error",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    const payload = validateCredentials();
    if (!payload) {
      return;
    }

    try {
      setResending(true);
      setError("");

      const data = await initiateLogin(payload);
      setChallenge(data);
      setOtp("");

      pushToast({
        title: "New OTP sent",
        description: data.message || `Enter the new code sent to ${data.maskedEmail}.`,
        variant: "success",
      });
    } catch (err) {
      const message = getApiErrorMessage(err, "Could not resend OTP.");
      setError(message);
      pushToast({
        title: "Resend failed",
        description: message,
        variant: "error",
      });
    } finally {
      setResending(false);
    }
  };

  const isOtpStep = Boolean(challenge?.challengeId);

  return (
    <div className="auth-shell">
      <div className="auth-frame">
        <div className="auth-theme-bar">
          <ThemeToggle />
        </div>
        <div className="auth-card auth-grid">
          <section className="auth-aside hidden lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium">
                <MdFoodBank className="text-xl" />
                Orderly
              </div>
              <h1 className="mt-8 font-display text-4xl font-semibold leading-tight">
                Restaurant orders, payments, and access in one place.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-[#f4dcc5]">
                Sign in with your registered email or phone number. We will send a
                verification code to your registered email before the session is created.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-sm text-[#f7e7d4]">
              <p className="font-medium text-white">What to expect</p>
              <p className="mt-2 leading-6">
                Your session stays protected with password plus OTP verification. Use the
                same details you registered with.
              </p>
            </div>
          </section>

          <section className="auth-body">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--surface-muted)] px-4 py-2 text-sm font-medium text-[color:var(--accent)] lg:hidden">
                  <MdFoodBank className="text-lg" />
                  Orderly
                </div>
                <h2 className="mt-4 font-display text-3xl font-semibold text-[color:var(--text-primary)]">
                  {isOtpStep ? "Verify Your Sign In" : "Welcome Back"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                  {isOtpStep
                    ? "Enter the code we sent to your registered email address."
                    : "Sign in to continue to the menu, orders, and dashboard experience."}
                </p>
              </div>

              {!isOtpStep ? (
                <form onSubmit={handleLogin} className="space-y-5" noValidate>
                  <div>
                    <label htmlFor="login-phone" className={fieldLabelClass}>
                      Phone Number
                    </label>
                    <div className={fieldShellClass}>
                      <FaPhone className="text-[color:var(--accent)]" aria-hidden="true" />
                      <input
                        id="login-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="Optional if you sign in with email"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={fieldInputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="login-email" className={fieldLabelClass}>
                      Email Address
                    </label>
                    <div className={fieldShellClass}>
                      <HiOutlineMailOpen className="text-xl text-[color:var(--accent)]" aria-hidden="true" />
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Optional if you sign in with phone"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={fieldInputClass}
                      />
                    </div>
                    <p className="ui-helper-text">
                      Use either your email or your phone number. At least one is required.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="login-password" className={fieldLabelClass}>
                      Password
                    </label>
                    <div className={fieldShellClass}>
                      <MdOutlinePassword className="text-xl text-[color:var(--accent)]" aria-hidden="true" />
                      <input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={fieldInputClass}
                      />
                    </div>
                  </div>

                  {error ? (
                    <p
                      className="rounded-2xl border border-[color:color-mix(in_srgb,var(--danger)_24%,transparent)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger)]"
                      role="alert"
                      aria-live="polite"
                    >
                      {error}
                    </p>
                  ) : null}

                  <button type="submit" disabled={loading} className={primaryButtonClass}>
                    {loading ? "Sending OTP..." : "Continue"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
                  <div className="rounded-3xl border border-[color:color-mix(in_srgb,var(--accent)_24%,transparent)] bg-[color:var(--accent-soft)] px-4 py-4 text-sm text-[color:var(--accent)]">
                    <p className="font-medium text-[color:var(--text-primary)]">Verification code sent</p>
                    <p className="mt-1 leading-6">
                      {challenge?.message || `Check ${challenge?.maskedEmail ?? "your email"}.`}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="login-otp" className={fieldLabelClass}>
                      One-Time Password
                    </label>
                    <div className={fieldShellClass}>
                      <MdOutlineSms className="text-xl text-[color:var(--accent)]" aria-hidden="true" />
                      <input
                        id="login-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter the OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className={fieldInputClass}
                      />
                    </div>
                  </div>

                  {error ? (
                    <p
                      className="rounded-2xl border border-[color:color-mix(in_srgb,var(--danger)_24%,transparent)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger)]"
                      role="alert"
                      aria-live="polite"
                    >
                      {error}
                    </p>
                  ) : null}

                  <button type="submit" disabled={verifying} className={primaryButtonClass}>
                    {verifying ? "Verifying..." : "Verify OTP"}
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setChallenge(null);
                        setOtp("");
                        setError("");
                      }}
                      className={secondaryButtonClass}
                    >
                      Change login details
                    </button>
                    <button
                      type="button"
                      disabled={resending}
                      onClick={() => void handleResendOtp()}
                      className={secondaryButtonClass}
                    >
                      {resending ? "Resending..." : "Resend OTP"}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border-subtle)] pt-5 text-sm text-[color:var(--text-secondary)]">
                <span>By continuing, you agree to our Terms and Privacy Policy.</span>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot password?
                </button>
              </div>

              <p className="mt-4 text-sm text-[color:var(--text-secondary)]">
                Need an account?
                <button
                  type="button"
                  className="ml-1 font-semibold text-[color:var(--accent)] transition hover:text-[color:var(--accent-hover)]"
                  onClick={() => navigate("/register")}
                >
                  Create one
                </button>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
