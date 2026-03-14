import { useLocation, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { api } from "../utils/api";
import { isStrongPassword, isValidEmail, isValidOtp, isValidPhone } from "../utils/validators";
import { useToast } from "../context/ToastContext";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pushToast } = useToast();

  const initialEmail = (location.state as { email?: string } | undefined)?.email ?? "";
  const initialPhone = (location.state as { phone?: string } | undefined)?.phone ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    if (!isValidOtp(otp)) {
      setError("Enter a valid OTP");
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
      await api.post("/api/v1/auth/reset-password", {
        email: normalizedEmail || undefined,
        phone: normalizedPhone || undefined,
        otp,
        password,
      });
      pushToast({ title: "Password reset successful", variant: "success" });
      navigate("/login");
    } catch (err: any) {
      setError(err?.message || "Unable to reset password");
      pushToast({
        title: "Reset failed",
        description: err?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-r from-orange-400 via-red-400 to-pink-400 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl">
        <h2 className="text-2xl font-bold mb-2 text-center">Verify OTP</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter the OTP and set your new password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-xl outline-none"
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 border rounded-xl outline-none"
          />
          <input
            type="text"
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-3 border rounded-xl outline-none"
          />
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-xl outline-none"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 border rounded-xl outline-none"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-60"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
