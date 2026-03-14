import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineMailOpen } from "react-icons/hi";
import { FaPhone } from "react-icons/fa";
import { api } from "../utils/api";
import { isValidEmail, isValidPhone } from "../utils/validators";
import { useToast } from "../context/ToastContext";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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

    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/auth/forgot-password", {
        email: normalizedEmail || undefined,
        phone: normalizedPhone || undefined,
      });
      pushToast({
        title: "OTP sent",
        description: "Please check your inbox or SMS for the verification code.",
        variant: "success",
      });
      navigate("/reset-password", { state: { email: normalizedEmail, phone: normalizedPhone } });
    } catch (err: any) {
      setError(err?.message || "Unable to send OTP");
      pushToast({
        title: "Request failed",
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
        <h2 className="text-2xl font-bold mb-2 text-center">Reset Password</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your email or phone to receive an OTP.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center border rounded-xl p-2">
            <HiOutlineMailOpen />
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 outline-none ml-2"
            />
          </div>

          <div className="flex items-center border rounded-xl p-2">
            <FaPhone />
            <input
              type="tel"
              placeholder="Enter Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 outline-none ml-2"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send OTP"}
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
