import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Camera, KeyRound, LogOut, MailCheck } from "lucide-react";
import { CgProfile } from "react-icons/cg";
import FullPageLoader from "../components/FullPageLoader";
import { LoadingListRows } from "../components/LoadingState";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { confirmPasswordChange, requestPasswordChangeOtp } from "../features/auth/api";
import { useMyOrders } from "../features/orders/api";
import { useLiveOrderSync } from "../features/orders/useLiveOrderSync";
import { api } from "../utils/api";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiErrorHelpers";
import { formatPrice } from "../utils/formatPrice";
import { goBackOrNavigate } from "../utils/navigation";
import { isStrongPassword, isValidEmail, isValidOtp, isValidPhone } from "../utils/validators";

type AccountForm = { name: string; email: string; phone: string };
type ProfileResponse = { message?: string; verificationRequired?: boolean };
type AvatarUploadResponse = { uploadUrl: string; key: string };

const createForm = (user: ReturnType<typeof useAuth>["user"]): AccountForm => ({
  name: user?.name ?? "",
  email: user?.email ?? "",
  phone: user?.phone ?? "",
});

const formatMinorAmount = (value?: number) => formatPrice((value ?? 0) / 100);

export default function ProfilePage() {
  const { user, loading, refresh, logout } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ordersQuery = useMyOrders();
  const [form, setForm] = useState<AccountForm>(() => createForm(user));
  const [errors, setErrors] = useState<Partial<Record<keyof AccountForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useLiveOrderSync();

  useEffect(() => {
    setForm(createForm(user));
    setErrors({});
  }, [user]);

  const recentOrders = useMemo(
    () =>
      [...(ordersQuery.data ?? [])]
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        .slice(0, 3),
    [ordersQuery.data],
  );

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof AccountForm, string>> = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.email.trim() || !isValidEmail(form.email)) nextErrors.email = "Enter a valid email.";
    if (!form.phone.trim() || !isValidPhone(form.phone)) nextErrors.phone = "Enter a valid phone.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveAccount = async () => {
    if (!user || !validateForm()) return;
    setSaving(true);
    try {
      const response = await api.patch<ProfileResponse>("/api/v1/users/me", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setVerificationMessage(
        response.verificationRequired ? response.message || "Check your email to confirm the update." : "",
      );
      await refresh();
      pushToast({ title: "Profile updated", description: response.message, variant: "success" });
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      setErrors((current) => ({ ...current, ...fieldErrors }));
      pushToast({ title: "Profile update failed", description: getApiErrorMessage(error), variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const presign = await api.post<{ data: AvatarUploadResponse }>("/api/v1/users/me/avatar/presign", {
        fileName: file.name,
        contentType: file.type,
      });
      if (!/^https?:\/\//i.test(presign.data.uploadUrl)) {
        throw new Error("Avatar uploads require S3 configuration in this environment.");
      }
      const uploadResponse = await fetch(presign.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("Image upload failed.");
      await api.patch("/api/v1/users/me/avatar", { s3Key: presign.data.key });
      await refresh();
      pushToast({ title: "Profile image updated", variant: "success" });
    } catch (error) {
      pushToast({ title: "Avatar upload failed", description: getApiErrorMessage(error), variant: "error" });
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const sendPasswordOtp = async () => {
    if (!isStrongPassword(newPassword, 8) || newPassword !== confirmPassword) {
      pushToast({ title: "Check your new password first", description: "Use 8+ characters and match both fields.", variant: "warning" });
      return;
    }
    setRequestingOtp(true);
    try {
      const response = await requestPasswordChangeOtp();
      setChallengeId(response.challengeId);
      setMaskedEmail(response.maskedEmail);
      pushToast({ title: "OTP sent", description: response.message, variant: "success" });
    } catch (error) {
      pushToast({ title: "Could not send OTP", description: getApiErrorMessage(error), variant: "error" });
    } finally {
      setRequestingOtp(false);
    }
  };

  const updatePassword = async () => {
    if (!challengeId || !isValidOtp(otp) || !isStrongPassword(newPassword, 8) || newPassword !== confirmPassword) {
      pushToast({ title: "Check OTP and password", variant: "warning" });
      return;
    }
    setSavingPassword(true);
    try {
      const response = await confirmPasswordChange({ challengeId, otp: otp.trim(), newPassword });
      setChallengeId("");
      setMaskedEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      pushToast({ title: "Password updated", description: response.message, variant: "success" });
    } catch (error) {
      pushToast({ title: "Could not update password", description: getApiErrorMessage(error), variant: "error" });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <FullPageLoader label="Loading profile..." />;
  if (!user) return <div className="app-shell flex h-screen items-center justify-center">No user found.</div>;

  return (
    <div className="app-shell min-h-screen px-4 py-6 sm:py-10">
      <div className="app-container space-y-6 sm:space-y-8">
        <div className="flex items-center justify-start gap-3">
          <button type="button" onClick={() => goBackOrNavigate(navigate, "/", location.key)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-[#ef6820] text-white shadow-md transition hover:bg-[#d85a1a] hover:shadow-lg" aria-label="Go back"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
          <div className="flex-1"></div>
          <div className="flex gap-2 sm:gap-3">
            <ThemeToggle />
            <button type="button" onClick={() => navigate("/orders")} className="rounded-lg border-2 border-[#e5d5c6] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-[#3b2f2f] transition hover:bg-[#fff9f2]">Orders</button>
            {user.role === "RESTRO_OWNER" && <button type="button" onClick={() => navigate("/admin")} className="rounded-lg bg-[#3b2f2f] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:bg-[#2a211f] hover:shadow-lg">Dashboard</button>}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
          <section className="rounded-2xl bg-white p-5 shadow-md hover:shadow-lg transition">

            {/* TOP: PROFILE + BASIC INFO */}
            <div className="flex items-center gap-4">

              <div className="relative">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.name || "Profile"}
                    className="h-20 w-20 rounded-full border-4 border-[#ef6820] object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#ef6820] bg-[#fef1e5]">
                    <CgProfile size={36} className="text-[#ef6820]" />
                  </div>
                )}

                <button
                  type="button"
                  disabled={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 rounded-full bg-[#ef6820] p-1.5 text-white"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void uploadAvatar(event)}
                />
              </div>

              <div className="flex-1">
                <h1 className="text-lg font-bold text-[#3b2f2f] leading-tight">
                  {user.name || "Unnamed User"}
                </h1>

                <p className="text-xs text-gray-500 truncate">
                  {user.email || "No email"}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-[10px] rounded-full bg-orange-100 text-orange-600 font-semibold uppercase">
                    {user.role}
                  </span>

                  <span className={`px-2 py-1 text-[10px] rounded-full font-semibold ${user.emailVerifiedAt
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                    }`}>
                    {user.emailVerifiedAt ? "Verified" : "Unverified"}
                  </span>
                </div>
              </div>
            </div>

            {/* INFO GRID (COMPACT) */}
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">

              <div>
                <p className="text-[10px] text-gray-400 uppercase">Phone</p>
                <p className="font-semibold text-[#3b2f2f] truncate">{user.phone || "-"}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase">Restaurant</p>
                <p className="font-semibold text-[#3b2f2f] truncate">{user.restroId || "-"}</p>
              </div>

              {(user.branchIds ?? []).map((branch) => (
                <div key={branch._id} className="col-span-2">
                  <p className="text-[10px] text-gray-400 uppercase">Branch</p>
                  <p className="font-semibold text-[#3b2f2f] truncate">{branch.name}</p>
                </div>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2">

              {!user.emailVerifiedAt && (
                <button
                  type="button"
                  disabled={sendingVerification}
                  onClick={() => void (async () => {
                    setSendingVerification(true);
                    try {
                      const response = await api.post<{ message?: string }>("/api/v1/auth/verify-email/request");
                      pushToast({ title: "Verification email sent", description: response.message, variant: "success" });
                    } catch (error) {
                      pushToast({ title: "Unable", description: getApiErrorMessage(error), variant: "error" });
                    } finally {
                      setSendingVerification(false);
                    }
                  })()}
                  className="flex-1 py-2.5 text-sm rounded-lg border border-[#ef6820] text-[#ef6820] font-semibold hover:bg-orange-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sendingVerification ? "Sending..." : "Verify Email"}
                </button>
              )}

              <button
                type="button"
                disabled={loggingOut}
                onClick={() => void (async () => {
                  setLoggingOut(true);
                  try {
                    await logout();
                    navigate("/login");
                  } catch (error) {
                    pushToast({ title: "Logout failed", description: getApiErrorMessage(error), variant: "error" });
                  } finally {
                    setLoggingOut(false);
                  }
                })()}
                className="flex-1 py-2.5 text-sm rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? "Logging..." : "Logout"}
              </button>

            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[#f0e3d5] bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-bold text-[#3b2f2f]">Account Details</h2>
              <p className="mt-1 text-sm text-gray-600">Update your name, phone, email, and profile image here.</p>
              {verificationMessage && <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{verificationMessage}</div>}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#3b2f2f]">Full Name</label><input type="text" value={form.name} onChange={(event) => { setForm((current) => ({ ...current, name: event.target.value })); setErrors((current) => ({ ...current, name: undefined })); }} className="w-full rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:border-[#ef6820] focus:outline-none focus:ring-2 focus:ring-[#ef6820]/20" />{errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}</div>
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#3b2f2f]">Phone Number</label><input type="tel" value={form.phone} onChange={(event) => { setForm((current) => ({ ...current, phone: event.target.value })); setErrors((current) => ({ ...current, phone: undefined })); }} className="w-full rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:border-[#ef6820] focus:outline-none focus:ring-2 focus:ring-[#ef6820]/20" />{errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}</div>
                <div className="md:col-span-2"><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#3b2f2f]">Email Address</label><input type="email" value={form.email} onChange={(event) => { setForm((current) => ({ ...current, email: event.target.value })); setErrors((current) => ({ ...current, email: undefined })); }} className="w-full rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:border-[#ef6820] focus:outline-none focus:ring-2 focus:ring-[#ef6820]/20" />{errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}</div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" disabled={saving} onClick={() => void saveAccount()} className="rounded-xl bg-linear-to-r from-[#ef6820] to-[#d85a1a] px-6 py-3 text-sm font-bold text-white disabled:opacity-60 hover:shadow-lg uppercase tracking-wide">{saving ? "Saving..." : "Save Changes"}</button>
                <button type="button" onClick={() => { setForm(createForm(user)); setErrors({}); setVerificationMessage(""); }} className="rounded-xl border-2 border-[#e5d5c6] px-6 py-3 text-sm font-bold text-[#3b2f2f] hover:bg-[#fff9f2] uppercase tracking-wide">Reset Form</button>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
              <article className="rounded-2xl border border-[#f0e3d5] bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-2xl font-bold text-[#3b2f2f]">Password Security</h2>
                <p className="mt-1 text-sm text-gray-600">Send an OTP to your current email, then verify it to update your password.</p>
                <div className="mt-6 grid gap-4">
                  <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" className="rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:border-[#ef6820] focus:outline-none focus:ring-2 focus:ring-[#ef6820]/20" />
                  <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" className="rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:border-[#ef6820] focus:outline-none focus:ring-2 focus:ring-[#ef6820]/20" />
                  <button type="button" disabled={requestingOtp} onClick={() => void sendPasswordOtp()} className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#ef6820] px-4 py-3 text-sm font-medium text-[#ef6820] disabled:opacity-60 hover:bg-[#fef1e5]"><MailCheck className="h-4 w-4" />{requestingOtp ? "Sending OTP..." : "Send Password OTP"}</button>
                  {challengeId && <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4"><p className="text-sm font-medium text-blue-900">Enter the code sent to {maskedEmail || "your email"}.</p><input type="text" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter OTP" className="mt-4 w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:border-[#ef6820] focus:outline-none focus:ring-2 focus:ring-[#ef6820]/20" /><button type="button" disabled={savingPassword} onClick={() => void updatePassword()} className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#3b2f2f] px-4 py-3 text-sm font-medium text-white disabled:opacity-60 hover:bg-[#2a211f]"><KeyRound className="h-4 w-4" />{savingPassword ? "Updating..." : "Verify OTP And Update Password"}</button></div>}
                </div>
              </article>

              <article className="rounded-2xl border border-[#f0e3d5] bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div><h2 className="text-2xl font-bold text-[#3b2f2f]">Recent Orders</h2><p className="mt-1 text-sm text-gray-600">Open the full orders page for live payment and tracking actions.</p></div>
                  <button type="button" onClick={() => navigate("/orders")} className="rounded-xl border-2 border-[#e5d5c6] px-3 py-2.5 text-xs sm:text-sm font-semibold text-[#3b2f2f] hover:bg-[#fff9f2]">View All</button>
                </div>
                <div className="mt-5 space-y-3">
                  {ordersQuery.isLoading ? <LoadingListRows rows={3} rowClassName="border-[#f0e3d5] bg-linear-to-br from-[#fff9f2] to-[#fef1e5]" /> : recentOrders.length > 0 ? recentOrders.map((order) => <button key={order.id} type="button" onClick={() => navigate(`/orders?order=${order.id}`)} className="w-full rounded-2xl border border-[#f0e3d5] bg-linear-to-br from-[#fff9f2] to-[#fef1e5] px-4 py-4 text-left transition hover:shadow-md"><div className="flex items-center justify-between gap-4 sm:flex-row"><div className="flex-1"><p className="font-bold text-[#3b2f2f]">{order.id}</p><p className="mt-1 text-xs text-[#8d7967]">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "Created recently"}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${order.OrderStatus === "CONFIRMED" || order.OrderStatus === "DELIVERED" ? "bg-emerald-100 text-emerald-700" : order.OrderStatus === "CANCELLED" || order.OrderStatus === "FAILED" ? "bg-red-100 text-red-700" : order.OrderStatus === "PROCESSING" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>{order.OrderStatus}</span></div><div className="mt-4 grid gap-2 grid-cols-3 sm:grid-cols-3"><div className="rounded-lg bg-white px-3 py-2.5 border border-[#f0e3d5]"><p className="text-xs uppercase tracking-widest font-bold text-[#8d7967]">Total</p><p className="mt-1 font-bold text-[#ef6820]">{formatMinorAmount(order.totalsSnapshot?.grandTotal)}</p></div><div className="rounded-lg bg-white px-3 py-2.5 border border-[#f0e3d5]"><p className="text-xs uppercase tracking-widest font-bold text-[#8d7967]">Payment</p><p className="mt-1 text-xs font-semibold text-[#3b2f2f]">{order.paymentStatus}</p></div><div className="rounded-lg bg-white px-3 py-2.5 border border-[#f0e3d5]"><p className="text-xs uppercase tracking-widest font-bold text-[#8d7967]">Remaining</p><p className="mt-1 font-bold text-[#ef6820]">{formatMinorAmount(order.paymentSummary?.remainingDue)}</p></div></div></button>) : <div className="rounded-2xl bg-[#fff9f2] px-4 py-5 text-sm text-[#6d5c4d]">No orders yet. Place your first order to see updates here.</div>}
                </div>
              </article>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
