import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IoMdArrowRoundBack } from "react-icons/io";
import { CgProfile } from "react-icons/cg";
import { useLocation, useNavigate } from "react-router-dom";
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
    return (
      <div className="flex h-screen items-center justify-center text-lg font-semibold text-gray-700">
        Loading profile...
      </div>
    );
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
    <div className="min-h-screen bg-[#fff9f2] px-4 py-10 text-left">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => goBackOrNavigate(navigate, '/', location.key)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-lg transition hover:shadow-xl"
            aria-label="Go back"
          >
            <IoMdArrowRoundBack size={20} />
          </button>

          {user.role === "RESTRO_OWNER" && (
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="cursor-pointer rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Open Dashboard
            </button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-amber-300 bg-amber-50">
                <CgProfile size={62} className="text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#3b2f2f]">
                  {user.name || "Unnamed User"}
                </h1>
                <p className="text-sm text-gray-500">{user.email}</p>
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

            <div className="mt-6 space-y-3 rounded-2xl bg-[#fff9f2] p-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-gray-800">{user.phone || "-"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">User ID</span>
                <span className="break-all font-medium text-gray-800">{user.id}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Restaurant ID</span>
                <span className="break-all font-medium text-gray-800">
                  {user.restroId || "-"}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {user.branchIds?.map((branch, index) => (
                  <div key={branch._id} className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      {index === 0? "Primary Branch":`Branch ${index + 1}`}
                    </span>
                    <span className="break-all font-medium text-gray-800">
                      {branch.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {!user.emailVerifiedAt && (
              <button
                type="button"
                disabled={sendingVerification}
                onClick={() => void handleResendVerification()}
                className="mt-5 w-full cursor-pointer rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-medium text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingVerification ? "Sending..." : "Resend Email Verification"}
              </button>
            )}

            <button
              type="button"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
              className="mt-3 w-full cursor-pointer rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </section>

          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-orange-100 pb-4">
              <h2 className="text-2xl font-semibold text-[#3b2f2f]">Update Account</h2>
              <p className="text-sm text-gray-600">
                Update your name, email, phone number, or password. Email and password changes
                need email confirmation before they go live.
              </p>
            </div>

            {pendingVerificationMessage && (
              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {pendingVerificationMessage}
              </div>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  className="rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => handleFieldChange("phone", event.target.value)}
                  className="rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleFieldChange("email", event.target.value)}
                  className="rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => handleFieldChange("password", event.target.value)}
                  placeholder="Leave blank to keep your current password"
                  className="rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => handleFieldChange("confirmPassword", event.target.value)}
                  placeholder="Re-enter the new password"
                  className="rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="cursor-pointer rounded-xl bg-linear-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : hasSensitiveChanges ? "Save And Send Verification" : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm(createFormState(user));
                  setErrors({});
                  setPendingVerificationMessage("");
                }}
                className="cursor-pointer rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Reset Form
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-orange-100 pb-4">
            <h2 className="text-2xl font-semibold text-[#3b2f2f]">Order History</h2>
            <p className="text-sm text-gray-600">
              Track restaurant acceptance, payment state, and refunds for every order.
            </p>
          </div>

          {ordersQuery.isLoading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#e5d5c6] bg-[#fff9f2] px-4 py-6 text-sm text-gray-600">
              Loading your orders...
            </div>
          ) : ordersQuery.data && ordersQuery.data.length > 0 ? (
            <div className="mt-6 space-y-4">
              {ordersQuery.data.map((order) => {
                const isHighlighted = highlightedOrderId === order.id || highlightedOrderId === order._id;
                const countdown = formatCountdown(order.acceptanceDeadlineAt);

                return (
                  <div
                    key={order.id}
                    className={`rounded-3xl border p-5 shadow-sm ${
                      isHighlighted
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

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl border border-[#f0e3d5] bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Subtotal</p>
                        <p className="mt-1 font-semibold text-[#3b2f2f]">
                          {formatMinorAmount(order.totalsSnapshot?.subtotal)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#f0e3d5] bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Tax</p>
                        <p className="mt-1 font-semibold text-[#3b2f2f]">
                          {formatMinorAmount(order.totalsSnapshot?.tax)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#f0e3d5] bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Dine-in fee</p>
                        <p className="mt-1 font-semibold text-[#3b2f2f]">
                          {formatMinorAmount(order.totalsSnapshot?.dineInCharge)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#f0e3d5] bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Remaining</p>
                        <p className="mt-1 font-semibold text-[#3b2f2f]">
                          {formatMinorAmount(order.paymentSummary?.remainingDue)}
                        </p>
                      </div>
                    </div>

                    {order.acceptanceDeadlineAt && order.OrderStatus !== "ACCEPTED" && order.OrderStatus !== "COMPLETED" && order.OrderStatus !== "CANCELLED" && (
                      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        Acceptance deadline: {countdown ?? "Expired"}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {order.canCustomerCancel ? (
                        <button
                          type="button"
                          disabled={orderActionId === order.id}
                          onClick={() => void handleOrderCancel(order.id)}
                          className="cursor-pointer rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {orderActionId === order.id ? "Cancelling..." : "Cancel Order"}
                        </button>
                      ) : (
                        <span className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600">
                          Cancellation becomes available after the restaurant misses the acceptance window.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#e5d5c6] bg-[#fff9f2] px-4 py-6 text-sm text-gray-600">
              No orders yet. Your placed orders will appear here with payment and refund updates.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
