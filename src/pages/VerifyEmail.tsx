import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../utils/apiErrorHelpers";

type VerifyState = "loading" | "success" | "error";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const { refresh } = useAuth();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("Checking your verification link...");

  useEffect(() => {
    const userId = searchParams.get("userId")?.trim() ?? "";
    const token = searchParams.get("token")?.trim() ?? "";

    if (!userId || !token) {
      setState("error");
      setMessage("This verification link is incomplete or invalid.");
      return;
    }

    let isActive = true;

    const confirm = async () => {
      try {
        const response = await api.post<{ message?: string }>(
          "/api/v1/auth/verify-email/confirm",
          { userId, token },
        );

        if (!isActive) return;

        try {
          await refresh();
        } catch {
          // Verification also works for signed-out users; refresh is best effort only.
        }

        setState("success");
        setMessage(response.message || "Your email has been verified successfully.");
      } catch (error) {
        if (!isActive) return;
        setState("error");
        setMessage(getApiErrorMessage(error, "Unable to verify your email right now."));
      }
    };

    void confirm();

    return () => {
      isActive = false;
    };
  }, [refresh, searchParams]);

  return (
    <div className="state-shell">
      <div className="mx-auto w-full max-w-3xl">
        <div className="auth-theme-bar">
          <ThemeToggle />
        </div>
        <div className="state-card px-6 py-8 text-center sm:px-8">
          <p className="ui-eyebrow">Email Verification</p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-[color:var(--text-primary)]">
            {state === "loading"
              ? "Verifying..."
              : state === "success"
                ? "All Set"
                : "Verification Failed"}
          </h1>
          <p
            className={`mt-4 text-sm ${
              state === "error"
                ? "text-[color:var(--danger)]"
                : "text-[color:var(--text-secondary)]"
            }`}
          >
            {message}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={state === "success" ? "/profile" : "/login"}
              className="ui-button ui-button-pill px-5 text-sm font-semibold"
            >
              {state === "success" ? "Go To Profile" : "Go To Login"}
            </Link>
            <Link
              to="/"
              className="ui-button-secondary ui-button-pill px-5 text-sm font-semibold"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
