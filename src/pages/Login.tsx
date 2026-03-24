import { MdFoodBank, MdOutlinePassword } from "react-icons/md";
import { HiOutlineMailOpen } from "react-icons/hi";
import { FaPhone } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { isAdminPanelRole } from "../features/auth/access";
import { setAuthToken } from "../features/auth/storage";
import { authStore } from "../features/auth/store";
import { mapAuthUser } from "../features/auth/user";
import { api } from "../utils/api";
import { isStrongPassword, isValidEmail, isValidPhone } from "../utils/validators";
import { useToast } from "../context/ToastContext";

type FormType = {
  email?: string;
  phone?: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const { pushToast } = useToast();

  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("restro@gmail.com");
  const [password, setPassword] = useState<string>("123456");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    const normalizedPhone = phone.trim();

    if (!normalizedEmail && !normalizedPhone) {
      setError("Enter phone number or email");
      return;
    }

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address");
      return;
    }

    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      setError("Enter valid 10 digit phone number");
      return;
    }

    if (!isStrongPassword(password, 6)) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload: FormType = {
        password,
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      };

      const data = await api.post<any>("/api/v1/auth/login", payload, {
        skipRefresh: true,
      });
      const accessToken = data?.data?.accessToken;
      const userData = data?.data?.user ?? data?.user ?? data;

      if (accessToken) {
        setAuthToken(accessToken);
      }

      const mappedUser = mapAuthUser(userData);
      authStore.setUser(mappedUser);
      setUser(mappedUser);

      pushToast({ title: "Login successful", variant: "success" });
      const redirectTo =
        (location.state as { from?: string } | undefined)?.from ??
        (mappedUser && isAdminPanelRole(mappedUser.role) ? "/admin" : "/");
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      pushToast({
        title: "Login failed",
        description: err?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-linear-to-r from-pink-400 via-orange-400 to-yellow-300 px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-xl text-center">
        <h2 className="flex items-center justify-center mb-2 text-4xl font-semibold">
          Orderly <MdFoodBank />
        </h2>
        <p className="mb-5 text-gray-500">Login to continue</p>

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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

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
