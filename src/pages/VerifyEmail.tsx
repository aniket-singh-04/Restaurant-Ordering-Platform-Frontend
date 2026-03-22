import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
    <div className="flex min-h-screen items-center justify-center bg-[#fff9f2] px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-500">
          Email Verification
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[#3b2f2f]">
          {state === "loading"
            ? "Verifying..."
            : state === "success"
              ? "All Set"
              : "Verification Failed"}
        </h1>
        <p
          className={`mt-4 text-sm ${
            state === "error" ? "text-red-600" : "text-gray-600"
          }`}
        >
          {message}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={state === "success" ? "/profile" : "/login"}
            className="rounded-xl bg-linear-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
          >
            {state === "success" ? "Go To Profile" : "Go To Login"}
          </Link>
          <Link
            to="/"
            className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
