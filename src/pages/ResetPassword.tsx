import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-r from-orange-400 via-red-400 to-pink-400 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl">
        <h2 className="text-2xl font-bold mb-2 text-center">Set New Password</h2>
        <p className="text-sm text-gray-500 text-center mb-6">{helperCopy}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-xl outline-none"
            disabled={!hasValidLink}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 border rounded-xl outline-none"
            disabled={!hasValidLink}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !hasValidLink}
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
