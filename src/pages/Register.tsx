import { useState, type FormEvent } from "react";
import { FaPhone } from "react-icons/fa";
import { HiOutlineMailOpen } from "react-icons/hi";
import { MdFoodBank, MdOutlineSms } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isAdminPanelRole } from "../features/auth/access";
import {
  initiateRegistration,
  verifyRegistrationOtp,
  type AuthOtpChallenge,
} from "../features/auth/api";
import { setAuthToken } from "../features/auth/storage";
import { authStore } from "../features/auth/store";
import { mapAuthUser } from "../features/auth/user";
import { getApiErrorMessage } from "../utils/apiErrorHelpers";
import {
  isStrongPassword,
  isValidEmail,
  isValidOtp,
  isValidPhone,
} from "../utils/validators";

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

const roles: UserRole[] = ["CUSTOMER", "RESTRO_OWNER"];

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
    const emailValue = form.email?.trim() ?? "";
    const phoneValue = form.phone?.trim() ?? "";

    if (!form.name.trim()) {
      setError("Full name is required");
      return null;
    }

    if (!emailValue && !phoneValue) {
      setError("Email or phone is required");
      return null;
    }

    if (emailValue && !isValidEmail(emailValue)) {
      setError("Enter valid email");
      return null;
    }

    if (phoneValue && !isValidPhone(phoneValue)) {
      setError("Enter valid 10 digit phone number");
      return null;
    }

    if (!isStrongPassword(form.password, 6)) {
      setError("Password must be at least 6 characters");
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
      name: form.name.trim(),
      email: emailValue || undefined,
      phone: phoneValue || undefined,
      password: form.password,
      role: form.role,
    };
  };

  const persistSession = (payload: { accessToken: string; user: any }) => {
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

  return (
    <div className="min-h-screen flex justify-center items-center bg-linear-to-r from-orange-400 via-red-400 to-pink-400 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl">
        <h2 className="flex items-center justify-center text-3xl font-bold mb-4">
          Orderly <MdFoodBank className="ml-2" />
        </h2>
        <p className="text-center text-gray-500 mb-6">
          {isOtpStep ? "Enter the verification code to finish signup" : "Create your account"}
        </p>

        {!isOtpStep ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 border rounded-xl outline-none"
            />

            <div className="flex items-center border rounded-xl p-2">
              <HiOutlineMailOpen />
              <input
                type="email"
                placeholder="Enter Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="flex-1 outline-none ml-2"
              />
            </div>

            <div className="flex items-center border rounded-xl p-2">
              <FaPhone />
              <input
                type="tel"
                placeholder="Enter Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="flex-1 outline-none ml-2"
              />
            </div>

            <div className="flex items-center mb-4 gap-2">
              <label className="text-xl font-semibold text-black-500">Role:</label>

              <Listbox
                value={form.role}
                onChange={(value) => setForm({ ...form, role: value })}
              >
                <div className="relative w-full">
                  <ListboxButton
                    className="cursor-pointer w-full rounded-md border border-black bg-white px-3 py-2 text-sm flex justify-between items-center hover:border-gray-700"
                  >
                    <span>{form.role}</span>
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  </ListboxButton>

                  <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-black bg-white shadow-lg">
                    {roles.map((r) => (
                      <ListboxOption
                        key={r}
                        value={r}
                        className={({ focus }) =>
                          `cursor-pointer px-3 py-2 text-sm ${
                            focus ? "bg-gray-100 text-black" : "text-gray-900"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <div className="flex justify-between items-center">
                            <span>{r}</span>
                            {selected && (
                              <CheckIcon className="h-4 w-4 text-black" />
                            )}
                          </div>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-3 border rounded-xl outline-none"
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              className="w-full p-3 border rounded-xl outline-none"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) =>
                  setForm({ ...form, acceptTerms: e.target.checked })
                }
              />
              <span className="text-sm text-gray-600">
                I accept Terms & Privacy Policy
              </span>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              {challenge?.message ||
                `Enter the code sent to ${challenge?.maskedEmail ?? "your email"}.`}
            </div>

            <div className="flex items-center border rounded-xl p-2">
              <MdOutlineSms />
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="flex-1 outline-none ml-2"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-60"
            >
              {verifying ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setChallenge(null);
                  setOtp("");
                  setError("");
                }}
                className="text-gray-600 hover:underline cursor-pointer"
              >
                Edit details
              </button>
              <button
                type="button"
                disabled={resending}
                onClick={() => void handleResend()}
                className="text-blue-600 hover:underline cursor-pointer disabled:opacity-60"
              >
                {resending ? "Resending..." : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        <p className="text-sm text-gray-600 mt-2">
          Already have an account?
          <button
            className="text-blue-600 hover:underline font-medium cursor-pointer"
            onClick={() => navigate("/login")}
          >
            &nbsp;Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}
