import { useState, type FormEvent } from "react";
import { MdFoodBank, MdOutlinePassword, MdOutlineSms } from "react-icons/md";
import { HiOutlineMailOpen } from "react-icons/hi";
import { FaPhone } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdminPanelRole } from "../features/auth/access";
import { initiateLogin, verifyLoginOtp, type AuthOtpChallenge } from "../features/auth/api";
import { setAuthToken } from "../features/auth/storage";
import { authStore } from "../features/auth/store";
import { mapAuthUser } from "../features/auth/user";
import { useToast } from "../context/ToastContext";
import { getApiErrorMessage } from "../utils/apiErrorHelpers";
import {
  isStrongPassword,
  isValidEmail,
  isValidOtp,
  isValidPhone,
} from "../utils/validators";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const { pushToast } = useToast();

  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("restro@gmail.com");
  const [password, setPassword] = useState<string>("123456");
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
    <div className="min-h-screen flex justify-center items-center bg-linear-to-r from-pink-400 via-orange-400 to-yellow-300 px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-xl text-center">
        <h2 className="flex items-center justify-center mb-2 text-4xl font-semibold">
          Orderly <MdFoodBank />
        </h2>
        <p className="mb-5 text-gray-500">
          {isOtpStep ? "Enter the email OTP to finish login" : "Login to continue"}
        </p>

        {!isOtpStep ? (
          <form onSubmit={handleLogin}>
            <div className="flex items-center gap-2 mb-1 border border-gray-300 p-2 rounded-xl">
              <FaPhone />
              <input
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 outline-none text-lg"
              />
            </div>

            <div className="mb-1 text-gray-400 text-sm">OR</div>

            <div className="flex items-center gap-2 mb-4 border border-gray-300 p-2 rounded-xl">
              <HiOutlineMailOpen />
              <input
                type="email"
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 outline-none text-lg"
              />
            </div>

            <div className="flex items-center gap-2 mb-4 border border-gray-300 p-2 rounded-xl">
              <MdOutlinePassword />
              <input
                type="password"
                placeholder="Enter your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 outline-none text-lg"
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-red-500 text-white rounded-xl text-lg hover:bg-red-600 transition cursor-pointer disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-left text-sm text-orange-800">
              <p className="font-medium">Verification code sent</p>
              <p className="mt-1">
                {challenge?.message || `Check ${challenge?.maskedEmail ?? "your email"}.`}
              </p>
            </div>

            <div className="flex items-center gap-2 mb-4 border border-gray-300 p-2 rounded-xl">
              <MdOutlineSms />
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="flex-1 outline-none text-lg"
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-2 bg-red-500 text-white rounded-xl text-lg hover:bg-red-600 transition cursor-pointer disabled:opacity-60"
            >
              {verifying ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setChallenge(null);
                  setOtp("");
                  setError("");
                }}
                className="text-gray-600 hover:underline cursor-pointer"
              >
                Change login details
              </button>
              <button
                type="button"
                disabled={resending}
                onClick={() => void handleResendOtp()}
                className="text-blue-600 hover:underline cursor-pointer disabled:opacity-60"
              >
                {resending ? "Resending..." : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>By continuing, you agree to our Terms & Privacy Policy</span>
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot password?
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-2">
          You don't have an account?
          <button
            className="text-blue-600 hover:underline font-medium cursor-pointer"
            onClick={() => navigate("/register")}
          >
            &nbsp;Sign up here
          </button>
        </p>
      </div>
    </div>
  );
}
