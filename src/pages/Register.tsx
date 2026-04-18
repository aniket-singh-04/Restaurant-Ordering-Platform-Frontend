import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { useState, type FormEvent } from "react";
import { FaPhone } from "react-icons/fa";
import { HiOutlineMailOpen } from "react-icons/hi";
import { MdFoodBank, MdOutlinePassword, MdOutlineSms } from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isAdminPanelRole } from "../features/auth/access";
import {
  initiateRegistration,
  verifyRegistrationOtp,
  type AuthOtpChallenge,
  type AuthSessionPayload,
} from "../features/auth/api";
import { setAuthToken } from "../features/auth/storage";
import { authStore } from "../features/auth/store";
import { mapAuthUser } from "../features/auth/user";
import { getApiErrorMessage } from "../utils/apiErrorHelpers";
import { isStrongPassword, isValidEmail, isValidName, isValidOtp, isValidPhone } from "../utils/validators";

type UserRole = "RESTRO_OWNER" | "CUSTOMER";

interface RegisterForm {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  role: UserRole;
}

const roleOptions: Array<{
  value: UserRole;
  label: string;
  description: string;
}> = [
  {
    value: "CUSTOMER",
    label: "Customer",
    description: "Browse menus, place orders, and track your meals.",
  },
  {
    value: "RESTRO_OWNER",
    label: "Restaurant Owner",
    description: "Manage menus, orders, tables, and restaurant operations.",
  },
];

const fieldShellClass =
  "ui-field-shell";
const fieldInputClass =
  "w-full bg-transparent text-[15px] font-medium outline-none";
const fieldLabelClass = "ui-field-label";
const primaryButtonClass =
  "ui-button ui-button-pill w-full justify-center text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass =
  "text-sm font-semibold text-(--accent) transition hover:text-(--accent-hover) disabled:cursor-not-allowed disabled:opacity-60";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    role: "CUSTOMER",
  });
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState<AuthOtpChallenge | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);


  const validateRegistration = () => {
    const nameValue = form.name.trim();
    const emailValue = form.email?.trim() ?? "";
    const phoneValue = form.phone?.trim() ?? "";

    if (!isValidName(nameValue)) {
      setError("Name must be at least 2 characters and contain no special control characters");
      return null;
    }

    if (!emailValue) {
      setError("Email is required");
      return null;
    }

    if (!isValidEmail(emailValue)) {
      setError("Enter valid email");
      return null;
    }

    if (phoneValue && !isValidPhone(phoneValue)) {
      setError("Enter valid 10 digit phone number");
      return null;
    }

    if (!isStrongPassword(form.password, 6)) {
      setError("Password must be at least 6 characters and not blank");
      return null;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return null;
    }

    if (!form.acceptTerms) {
      setError("You must accept Terms & Privacy Policy");
      return null;
    }

    if (!form.role) {
      setError("Please select a role");
      return null;
    }

    return {
      name: nameValue,
      email: emailValue,
      phone: phoneValue || undefined,
      password: form.password,
      role: form.role,
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = validateRegistration();
    if (!payload) {
      return;
    }

    setError("");
    try {
      setLoading(true);
      const data = await initiateRegistration(payload);
      setChallenge(data);
      setOtp("");

      pushToast({
        title: "OTP sent",
        description: data.message || `Enter the code sent to ${data.maskedEmail}.`,
        variant: "success",
      });
    } catch (err) {
      const message = getApiErrorMessage(err, "Registration failed.");
      setError(message);
      pushToast({
        title: "Registration failed",
        description: message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!challenge?.challengeId) {
      setError("Start registration again to receive a fresh OTP.");
      return;
    }

    if (!isValidOtp(otp)) {
      setError("Enter a valid OTP");
      return;
    }

    try {
      setVerifying(true);
      setError("");

      const data = await verifyRegistrationOtp({
        challengeId: challenge.challengeId,
        otp: otp.trim(),
      });

      pushToast({
        title: "Account created",
        description: "You are signed in now. Check your email for the verification link.",
        variant: "success",
      });
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

  const handleResend = async () => {
    const payload = validateRegistration();
    if (!payload) {
      return;
    }

    try {
      setResending(true);
      setError("");

      const data = await initiateRegistration(payload);
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
  const selectedRole =
    roleOptions.find((option) => option.value === form.role) ?? roleOptions[0];

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
                Mealtap
              </div>
              <h1 className="mt-8 font-display text-4xl font-semibold leading-tight">
                Start with a verified account that fits your role.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-[#ffe6cf]">
                Registration uses email verification first, then signs you in. Phone
                number stays optional, but email is required for OTP delivery and account
                recovery.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-sm leading-6 text-[#fff0e1]">
              Choose <strong>Customer</strong> for ordering access or{" "}
              <strong>Restaurant Owner</strong> if you manage restaurant operations.
            </div>
          </section>

          <section className="auth-body">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-(--surface-muted) px-4 py-2 text-sm font-medium text-(--accent) lg:hidden">
                  <MdFoodBank className="text-lg" />
                  Mealtap
                </div>
                <h2 className="mt-4 font-display text-3xl font-semibold text-(--text-primary)">
                  {isOtpStep ? "Verify Your Account" : "Create Your Account"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
                  {isOtpStep
                    ? "Enter the verification code from your inbox to finish setup."
                    : "Set up your account with the essentials below. We will verify your email before activation."}
                </p>
              </div>

              {!isOtpStep ? (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div>
                    <label htmlFor="register-name" className={fieldLabelClass}>
                      Full Name
                    </label>
                    <div className={fieldShellClass}>
                      <MdFoodBank className="text-xl text-(--accent)" aria-hidden="true" />
                      <input
                        id="register-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Enter your full name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={fieldInputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="register-email" className={fieldLabelClass}>
                      Email Address
                    </label>
                    <div className={fieldShellClass}>
                      <HiOutlineMailOpen className="text-xl text-(--accent)" aria-hidden="true" />
                      <input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={fieldInputClass}
                      />
                    </div>
                    <p className="ui-helper-text">
                      Required for OTP verification, sign-in, and account recovery.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="register-phone" className={fieldLabelClass}>
                      Phone Number
                    </label>
                    <div className={fieldShellClass}>
                      <FaPhone className="text-(--accent)" aria-hidden="true" />
                      <input
                        id="register-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="Optional"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className={fieldInputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="register-role" className={fieldLabelClass}>
                      Account Type
                    </label>
                    <Listbox
                      value={form.role}
                      onChange={(value: UserRole) => setForm({ ...form, role: value })}
                    >
                      <div className="relative">
                        <ListboxButton
                          id="register-role"
                          className="ui-select relative text-left"
                        >
                          <span className="block pr-10 text-[15px] font-medium text-(--text-primary)">
                            {selectedRole.label}
                          </span>
                          <span className="mt-1 block pr-10 text-xs leading-5 text-(--text-muted)">
                            {selectedRole.description}
                          </span>
                          <ChevronDown
                            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)"
                            aria-hidden="true"
                          />
                        </ListboxButton>

                        <ListboxOptions className="absolute left-0 z-20 mt-2 max-h-64 w-full overflow-auto rounded-[1.25rem] border border-(--border-subtle) bg-(--surface-strong) p-1 shadow-[var(--shadow-md) focus:outline-none">
                          {roleOptions.map((option) => (
                            <ListboxOption
                              key={option.value}
                              value={option.value}
                              className={({ focus }) =>
                                `cursor-pointer rounded-2xl px-4 py-3 transition ${
                                  focus
                                    ? "bg-(--accent-soft)"
                                    : "text-(--text-secondary)"
                                }`
                              }
                            >
                              {({ selected }) => (
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p
                                      className={`text-sm font-semibold ${
                                        selected
                                          ? "text-(--accent)"
                                          : "text-(--text-primary)"
                                      }`}
                                    >
                                      {option.label}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-(--text-muted)">
                                      {option.description}
                                    </p>
                                  </div>
                                  <Check
                                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                                      selected
                                        ? "opacity-100 text-(--accent)"
                                        : "opacity-0"
                                    }`}
                                    aria-hidden="true"
                                  />
                                </div>
                              )}
                            </ListboxOption>
                          ))}
                        </ListboxOptions>
                      </div>
                    </Listbox>
                    <p className="ui-helper-text">
                      Choose Customer for ordering access or Restaurant Owner for
                      operational tools.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="register-password" className={fieldLabelClass}>
                      Password
                    </label>
                    <div className={fieldShellClass}>
                      <MdOutlinePassword className="text-xl text-(--accent)" aria-hidden="true" />
                      <input
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className={fieldInputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="register-confirm-password" className={fieldLabelClass}>
                      Confirm Password
                    </label>
                    <div className={fieldShellClass}>
                      <MdOutlinePassword className="text-xl text-(--accent)" aria-hidden="true" />
                      <input
                        id="register-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        value={form.confirmPassword}
                        onChange={(e) =>
                          setForm({ ...form, confirmPassword: e.target.value })
                        }
                        className={fieldInputClass}
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl border border-(--border-subtle) bg-(--surface) px-4 py-3 text-sm text-(--text-secondary)">
                    <input
                      type="checkbox"
                      checked={form.acceptTerms}
                      onChange={(e) =>
                        setForm({ ...form, acceptTerms: e.target.checked })
                      }
                      className="mt-1 h-4 w-4 rounded border-(--border-strong) text-(--accent)"
                    />
                    <span>I accept the <Link to="/terms-and-conditions" className="text-(--accent) hover:underline">Terms of Service</Link> and <Link to="/privacy-policy" className="text-(--accent) hover:underline">Privacy Policy</Link>.</span>
                  </label>

                  {error ? (
                    <p
                      className="rounded-2xl border border-[color:color-mix(in_srgb,var(--danger)_24%,transparent) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)"
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
                <form onSubmit={handleVerify} className="space-y-5" noValidate>
                  <div className="rounded-3xl border border-[color:color-mix(in_srgb,var(--accent)_24%,transparent) bg-(--accent-soft) px-4 py-4 text-sm text-(--accent)">
                    <p className="font-medium text-(--text-primary)">Verification code sent</p>
                    <p className="mt-1 leading-6">
                      {challenge?.message ||
                        `Enter the code sent to ${challenge?.maskedEmail ?? "your email"}.`}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="register-otp" className={fieldLabelClass}>
                      One-Time Password
                    </label>
                    <div className={fieldShellClass}>
                      <MdOutlineSms className="text-xl text-(--accent)" aria-hidden="true" />
                      <input
                        id="register-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      maxLength={6}
                        placeholder="Enter the OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className={fieldInputClass}
                      />
                    </div>
                  </div>

                  {error ? (
                    <p
                      className="rounded-2xl border border-[color:color-mix(in_srgb,var(--danger)_24%,transparent) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)"
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
                      Edit details
                    </button>
                    <button
                      type="button"
                      disabled={resending}
                      onClick={() => void handleResend()}
                      className={secondaryButtonClass}
                    >
                      {resending ? "Resending..." : "Resend OTP"}
                    </button>
                  </div>
                </form>
              )}

              <p className="mt-6 border-t border-(--border-subtle) pt-5 text-sm text-(--text-secondary)">
                Already have an account?
                <button
                  type="button"
                  className="ml-1 font-semibold text-(--accent) transition hover:text-(--accent-hover)"
                  onClick={() => navigate("/login")}
                >
                  Sign in
                </button>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
