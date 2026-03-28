import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { usePlatformAdminAuth } from "../../features/platform-admin/auth/context";

export default function PlatformAdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, login, loading } = usePlatformAdminAuth();
  const { pushToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (admin) {
    return <Navigate to="/platform" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError("");
      await login({ email: email.trim(), password });

      pushToast({
        title: "Platform access granted",
        variant: "success",
      });

      const redirectTo =
        (location.state as { from?: string } | undefined)?.from ?? "/platform";
      navigate(redirectTo, { replace: true });
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Could not sign in.";
      setError(message);
      pushToast({
        title: "Sign-in failed",
        description: message,
        variant: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e3d1bf,transparent_45%),linear-gradient(135deg,#1d1712,#3a2b1d)] px-4 py-12 text-[#1f1914]">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-4xl bg-[#f7f1e3] shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden bg-[#1f1914] p-10 text-[#f7f1e3] lg:block">
            <p className="text-xs uppercase tracking-[0.35em] text-[#d7c8b7]">Platform Owner</p>
            <h1 className="mt-4 max-w-sm font-serif text-4xl font-bold leading-tight">
              Secure control for the whole ordering network.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-[#d7c8b7]">
              This console is isolated from the restaurant admin area and is intended only
              for manually provisioned platform super admins.
            </p>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mx-auto max-w-md">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-2xl bg-[#1f1914] p-3 text-[#f7f1e3]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#7b6e62]">/platform</p>
                  <h2 className="font-serif text-3xl font-bold">Super Admin Login</h2>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#5e5145]">
                    Admin email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-[#d7c8b7] bg-white px-4 py-3 outline-none ring-0 transition focus:border-[#8f5f2f]"
                    placeholder="owner@platform.com"
                    autoComplete="email"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#5e5145]">
                    Password
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-[#d7c8b7] bg-white px-4 py-3 outline-none ring-0 transition focus:border-[#8f5f2f]"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </label>

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#8f5f2f] px-4 py-3 font-semibold text-white transition hover:bg-[#704518] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Enter platform console"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
