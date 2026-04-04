import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IoMdArrowRoundBack } from "react-icons/io";
import { CgProfile } from "react-icons/cg";
import { useLocation, useNavigate } from "react-router-dom";
import FullPageLoader from "../components/FullPageLoader";
import { LoadingOrderCards } from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../utils/api";
import { cancelOrder as cancelOrderRequest, useMyOrders } from "../features/orders/api";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiErrorHelpers";
import {
  isStrongPassword,
  isValidEmail,
  isValidPhone,
} from "../utils/validators";
import { formatPrice } from "../utils/formatPrice";
import { goBackOrNavigate } from "../utils/navigation";

type ProfileResponse = {
  success: boolean;
  message: string;
  verificationRequired?: boolean;
  targetEmail?: string;
  data?: unknown;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const createFormState = (
  user: ReturnType<typeof useAuth>["user"],
): FormState => ({
  name: user?.name ?? "",
  email: user?.email ?? "",
  phone: user?.phone ?? "",
  password: "",
  confirmPassword: "",
});

export default function ProfileLayout() {
  const { user, loading, logout, refresh } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const ordersQuery = useMyOrders();

  const [form, setForm] = useState<FormState>(() => createFormState(user));
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [pendingVerificationMessage, setPendingVerificationMessage] = useState("");
  const [orderActionId, setOrderActionId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const highlightedOrderId = useMemo(
    () => new URLSearchParams(location.search).get("order"),
    [location.search],
  );

  useEffect(() => {
    setForm(createFormState(user));
    setErrors({});
  }, [user]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const hasSensitiveChanges = useMemo(() => {
    if (!user) return false;
    return (
      form.email.trim() !== (user.email ?? "").trim() ||
      Boolean(form.password.trim())
    );
  }, [form.email, form.password, user]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
    } else if (form.name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    } else if (!isValidPhone(form.phone)) {
      nextErrors.phone = "Phone number must be exactly 10 digits.";
    }

    if (form.password.trim() && !isStrongPassword(form.password, 6)) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (form.password.trim() && form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSave = async () => {
    if (!user || !validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch<ProfileResponse>("/api/v1/users/me", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        ...(form.password.trim() ? { password: form.password } : {}),
      });

      setForm((current) => ({
        ...current,
        password: "",
        confirmPassword: "",
      }));

      if (response.verificationRequired) {
        setPendingVerificationMessage(
          response.message ||
          "Check your email and confirm the link to finish updating your account.",
        );
        pushToast({
          title: "Verification required",
          description:
            response.message ||
            "Check your email and confirm the link to finish updating your account.",
          variant: "info",
        });
        return;
      }

      setPendingVerificationMessage("");
      await refresh();
      pushToast({
        title: "Profile updated",
        description: response.message || "Your account details were updated successfully.",
        variant: "success",
      });
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      if (Object.keys(fieldErrors).length) {
        setErrors((current) => ({
          ...current,
          ...(fieldErrors.name ? { name: fieldErrors.name } : {}),
          ...(fieldErrors.email ? { email: fieldErrors.email } : {}),
          ...(fieldErrors.phone ? { phone: fieldErrors.phone } : {}),
          ...(fieldErrors.password ? { password: fieldErrors.password } : {}),
        }));
      }

      pushToast({
        title: hasSensitiveChanges ? "Update request failed" : "Profile update failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      const response = await api.post<{ message?: string }>("/api/v1/auth/verify-email/request");
      pushToast({
        title: "Verification email sent",
        description: response.message || "Check your inbox for the verification link.",
        variant: "success",
      });
    } catch (error) {
      pushToast({
        title: "Unable to send verification email",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      pushToast({ title: "Logged out successfully", variant: "success" });
      navigate("/login");
    } catch (error) {
      pushToast({
        title: "Logout failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    } finally {
      setLoggingOut(false);
    }
  };

  const formatMinorAmount = (value?: number) => formatPrice((value ?? 0) / 100);

  const formatCountdown = (deadline?: string | null) => {
    if (!deadline) return null;

    const remainingMs = Math.max(new Date(deadline).getTime() - now, 0);
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  };

  const handleOrderCancel = async (orderId: string) => {
    setOrderActionId(orderId);
    try {
      await cancelOrderRequest(orderId, "Cancelled by customer after review.");
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      pushToast({
        title: "Order cancelled",
        description: "Refund processing will start automatically for captured online payments.",
        variant: "success",
      });
    } catch (error) {
      pushToast({
        title: "Unable to cancel order",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    } finally {
      setOrderActionId(null);
    }
  };

  if (loading) {
    return <FullPageLoader label="Loading profile..." />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff9f2] p-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow">
          No user found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9f2] px-4 py-6 sm:py-10 text-left">
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
        <div className="sticky top-0 z-10 -mx-4 -mt-6 sm:-mt-10 bg-linear-to-b from-[#fff9f2] to-[#fff9f2]/80 px-4 py-4 sm:py-6 backdrop-blur-sm flex items-center justify-between gap-4 border-b border-[#eedbc8]">
          <button
            onClick={() => goBackOrNavigate(navigate, '/', location.key)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-[#ef6820] text-white shadow-md transition hover:bg-[#d85a1a] hover:shadow-lg"
            aria-label="Go back"
          >
            <IoMdArrowRoundBack size={20} />
          </button>

          <div className="flex-1"></div>
          {user.role === "RESTRO_OWNER" && (
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="cursor-pointer rounded-lg bg-[#3b2f2f] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#2a211f] shadow-md hover:shadow-lg"
            >
              Admin Dashboard
            </button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
          <section className="rounded-2xl border border-[#f0e3d5] bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-[#fff5ed] to-[#ffe5cc] border-3 border-[#ef6820]">
                <CgProfile size={56} className="text-[#ef6820]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#3b2f2f]">
                  {user.name || "Unnamed User"}
                </h1>
                <p className="text-xs sm:text-sm text-[#6b665f] mt-1 break-all">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                  {user.role}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${user.emailVerifiedAt
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                    }`}
                >
                  {user.emailVerifiedAt ? "Email Verified" : "Email Not Verified"}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2 sm:space-y-3 rounded-xl bg-linear-to-br from-[#fffaf5] to-[#fff5ed] p-3 sm:p-4 border border-[#f0e3d5]">
              <div className="flex justify-between items-start gap-2 text-xs sm:text-sm pb-2 sm:pb-3 border-b border-[#e5d5c6]">
                <span className="font-semibold uppercase tracking-widest text-[#8d7967]">Phone</span>
                <span className="font-medium text-[#3b2f2f] text-right">{user.phone || "—"}</span>
              </div>
              <div className="flex justify-between items-start gap-2 text-xs sm:text-sm pb-2 sm:pb-3 border-b border-[#e5d5c6]">
                <span className="font-semibold uppercase tracking-widest text-[#8d7967]">User ID</span>
                <span className="break-all font-medium text-[#3b2f2f] text-right text-xs">{user.id.slice(-8)}</span>
              </div>
              {user.restroId && (
                <div className="flex justify-between items-start gap-2 text-xs sm:text-sm pb-2 sm:pb-3 border-b border-[#e5d5c6]">
                  <span className="font-semibold uppercase tracking-widest text-[#8d7967]">Restaurant</span>
                  <span className="font-medium text-[#3b2f2f] text-right text-xs">{user.restroId.slice(-8)}</span>
                </div>
              )}
              {user.branchIds && user.branchIds.length > 0 && (
                <div className="flex justify-between items-start gap-2 text-xs sm:text-sm">
                  <span className="font-semibold uppercase tracking-widest text-[#8d7967]">Branches</span>
                  <div className="text-right space-y-1">
                    {user.branchIds.map((branch, index) => (
                      <p key={branch._id} className="font-medium text-[#3b2f2f] text-xs">
                        {index === 0 && <span className="text-[#ef6820]">★ </span>}
                        {branch.name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {!user.emailVerifiedAt && (
                <button
                  type="button"
                  disabled={sendingVerification}
                  onClick={() => void handleResendVerification()}
                  className="w-full cursor-pointer rounded-lg border-2 border-[#ef6820] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-[#ef6820] transition hover:bg-[#fef1e5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingVerification ? "Sending..." : "Verify Email"}
                </button>
              )}
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
                className="w-full cursor-pointer rounded-lg bg-red-600 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-[#f0e3d5] bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex flex-col gap-2 border-b border-[#f0e3d5] pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#3b2f2f]">Update Account</h2>
              <p className="text-xs sm:text-sm text-[#6b665f]">
                Update your name, email, phone number, or password. Email and password changes
                need email confirmation before they go live.
              </p>
            </div>

            {pendingVerificationMessage && (
              <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs sm:text-sm text-blue-900">
                <p className="font-semibold">Verification Required</p>
                <p className="mt-1">{pendingVerificationMessage}</p>
              </div>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-[#8d7967]">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  className="rounded-lg border border-[#e5d5c6] bg-[#fff9f2] px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef6820] transition"
                />
                {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-[#8d7967]">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => handleFieldChange("phone", event.target.value)}
                  className="rounded-lg border border-[#e5d5c6] bg-[#fff9f2] px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef6820] transition"
                />
                {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-[#8d7967]">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleFieldChange("email", event.target.value)}
                  className="rounded-lg border border-[#e5d5c6] bg-[#fff9f2] px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef6820] transition"
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-[#8d7967]">New Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => handleFieldChange("password", event.target.value)}
                  placeholder="Leave blank to keep current"
                  className="rounded-lg border border-[#e5d5c6] bg-[#fff9f2] px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef6820] transition"
                />
                {errors.password && (
                  <p className="text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-[#8d7967]">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => handleFieldChange("confirmPassword", event.target.value)}
                  placeholder="Re-enter password"
                  className="rounded-lg border border-[#e5d5c6] bg-[#fff9f2] px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef6820] transition"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col xs:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="cursor-pointer rounded-lg bg-[#ef6820] px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:bg-[#d85a1a] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : hasSensitiveChanges ? "Save & Verify" : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm(createFormState(user));
                  setErrors({});
                  setPendingVerificationMessage("");
                }}
                className="cursor-pointer rounded-lg border-2 border-[#e5d5c6] px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-[#6b665f] transition hover:bg-[#fff9f2] hover:border-[#f0e3d5]"
              >
                Reset
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-[#f0e3d5] pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#3b2f2f]">Order History</h2>
            <p className="text-xs sm:text-sm text-[#6b665f]">
              Track restaurant acceptance, payment state, and refunds for every order.
            </p>
          </div>

          {ordersQuery.isLoading ? (
            <LoadingOrderCards count={2} className="mt-6" />
          ) : ordersQuery.data && ordersQuery.data.length > 0 ? (
            <div className="mt-6 space-y-4">
              {ordersQuery.data.map((order) => {
                const isHighlighted = highlightedOrderId === order.id || highlightedOrderId === order._id;
                const countdown = formatCountdown(order.acceptanceDeadlineAt);

                return (
                  <div
                    key={order.id}
                    className={`rounded-3xl border p-5 shadow-sm ${isHighlighted
                      ? "border-orange-300 bg-orange-50/60"
                      : "border-[#f0e3d5] bg-[#fffaf5]"
                      }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-[#3b2f2f]">{order.id}</h3>
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                            {order.OrderStatus}
                          </span>
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                            {order.orderType}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString()
                            : "Recently created"}
                        </p>
                      </div>

                      <div className="text-sm text-gray-700">
                        <p>Payment: <span className="font-medium">{order.paymentStatus}</span></p>
                        <p>Refund: <span className="font-medium">{order.refundStatus ?? order.refundSummary?.status ?? "NOT_REQUIRED"}</span></p>
                        <p>Total: <span className="font-medium">{formatMinorAmount(order.totalsSnapshot?.grandTotal)}</span></p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-4">
                      <div className="rounded-lg border border-[#f0e3d5] bg-linear-to-br from-[#fffaf5] to-[#fff5ed] px-3 py-2.5 sm:px-4 sm:py-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Subtotal</p>
                        <p className="mt-1.5 font-semibold text-sm text-[#3b2f2f]">
                          {formatMinorAmount(order.totalsSnapshot?.subtotal)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#f0e3d5] bg-linear-to-br from-[#fffaf5] to-[#fff5ed] px-3 py-2.5 sm:px-4 sm:py-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Tax</p>
                        <p className="mt-1.5 font-semibold text-sm text-[#3b2f2f]">
                          {formatMinorAmount(order.totalsSnapshot?.tax)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#f0e3d5] bg-linear-to-br from-[#fffaf5] to-[#fff5ed] px-3 py-2.5 sm:px-4 sm:py-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Charge</p>
                        <p className="mt-1.5 font-semibold text-sm text-[#3b2f2f]">
                          {formatMinorAmount(order.totalsSnapshot?.dineInCharge)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#f0e3d5] bg-linear-to-br from-[#fffaf5] to-[#fff5ed] px-3 py-2.5 sm:px-4 sm:py-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Remaining</p>
                        <p className="mt-1.5 font-bold text-sm text-[#ef6820]">
                          {formatMinorAmount(order.paymentSummary?.remainingDue)}
                        </p>
                      </div>
                    </div>

                    {order.acceptanceDeadlineAt && order.OrderStatus !== "ACCEPTED" && order.OrderStatus !== "COMPLETED" && order.OrderStatus !== "CANCELLED" && (
                      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs sm:text-sm text-blue-900 flex items-center gap-2">
                        <span className="font-semibold">Deadline:</span> {countdown ?? "Expired"}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                      {order.canCustomerCancel ? (
                        <button
                          type="button"
                          disabled={orderActionId === order.id}
                          onClick={() => void handleOrderCancel(order.id)}
                          className="cursor-pointer rounded-lg bg-red-600 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md"
                        >
                          {orderActionId === order.id ? "Cancelling..." : "Cancel"}
                        </button>
                      ) : (
                        <span className="rounded-lg border-2 border-[#e5d5c6] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#6b665f] bg-white">
                          Not cancellable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-[#e5d5c6] bg-[#fff9f2] px-4 py-10 text-sm text-center text-[#6b665f]">
              <p className="font-semibold">No orders yet</p>
              <p className="mt-1 text-xs">Your orders will appear here with payment and refund tracking.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
