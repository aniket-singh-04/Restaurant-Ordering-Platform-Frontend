import { IoMdArrowRoundBack } from "react-icons/io";
import { useAuth } from "../context/AuthContext";
import { CgProfile } from "react-icons/cg";
import { createPortal } from "react-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

interface User {
  name?: string;
  phone?: string;
  email?: string;
  role: string;
  id: string;
  imageUrl?: string;
  restroId?: string;
  branchId?: string;
  gstNo?: string;
}

export default function ProfileLayout() {
  const { user, loading, logout } = useAuth() as {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
  };
  const { pushToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    imageUrl: user?.imageUrl || "",
  });
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const navigate = useNavigate();
  const handleBack = () => navigate("/");

  const handleLogout = async () => {
    try {
      await logout();
      pushToast({ title: "Logged out successfully", variant: "success" });
      navigate("/login");
    } catch (error: any) {
      pushToast({
        title: "Logout failed",
        description: error?.message || "Please try again.",
        variant: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <div className="text-center mt-10">No user found</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-lg p-6 space-y-6">
          <div className="relative">
            <button
              onClick={handleBack}
              className="absolute flex items-center justify-center cursor-pointer w-12 h-12 rounded-full bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-lg hover:from-amber-500 hover:to-orange-600 hover:shadow-xl transition-all duration-300 active:scale-95"
            >
              <IoMdArrowRoundBack size={22} />
            </button>
          </div>

          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              {formData.imageUrl ? (
                <img
                  src={formData.imageUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 flex items-center justify-center rounded-full border-4 border-amber-400 shadow-md bg-gray-200">
                  <CgProfile size={60} className="text-gray-500" />
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold capitalize">
              {formData.name || "No Name"}
            </h2>
            <p className="text-gray-500 text-sm">{formData.email}</p>
          </div>

          <div className="border-t pt-4 space-y-2 text-sm">
            <h3 className="font-semibold text-gray-700 mb-2">Personal Info</h3>

            <div className="flex justify-between">
              <span className="text-gray-500">Phone:</span>
              <span>{formData.phone || "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">User ID:</span>
              <span>{user.id}</span>
            </div>

            <div className="flex justify-between items-center gap-2">
              <span className="text-gray-500">Role:</span>
              <span className="capitalize flex items-center gap-2">
                {user.role === "RESTRO_OWNER" && (
                  <button
                    className="bg-blue-600 cursor-pointer text-white text-sm px-3 py-1 rounded hover:bg-blue-700 transition-colors duration-200"
                    onClick={() => navigate("/admin")}
                  >
                    Dashboard
                  </button>
                )}
                {user.role}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">GST No:</span>
              <span>{user.gstNo || "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Restaurant ID:</span>
              <span>{user.restroId || "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Branch ID:</span>
              <span>{user.branchId || "-"}</span>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg transition duration-300 shadow-md cursor-pointer"
              onClick={() => {
                setFormData({
                  name: user.name ?? "",
                  email: user.email ?? "",
                  phone: user.phone ?? "",
                  imageUrl: user.imageUrl || "",
                });
                setEmailVerified(false);
                setPhoneVerified(false);
                setIsOpen(true);
              }}
            >
              Edit
            </button>
            <button
              className="w-full bg-red-500 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition duration-300 shadow-md cursor-pointer"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl space-y-4">
              <h2 className="text-lg font-bold">Edit Profile</h2>

              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setEmailVerified(false);
                  }}
                  className="w-full border p-2 rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setEmailVerified(true);
                    pushToast({ title: "Email verified", variant: "success" });
                  }}
                  className="text-xs text-blue-500 mt-1"
                >
                  Verify Email
                </button>
                {emailVerified && (
                  <p className="text-green-500 text-xs">Email Verified</p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    setPhoneVerified(false);
                  }}
                  className="w-full border p-2 rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhoneVerified(true);
                    pushToast({ title: "Phone verified", variant: "success" });
                  }}
                  className="text-xs text-blue-500 mt-1"
                >
                  Verify Phone
                </button>
                {phoneVerified && (
                  <p className="text-green-500 text-xs">Phone Verified</p>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const imageUrl = URL.createObjectURL(file);
                    setFormData({ ...formData, imageUrl });
                  }
                }}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-linear-to-r file:from-amber-500 file:to-orange-500 file:text-white hover:file:from-amber-600 hover:file:to-orange-600 file:cursor-pointer cursor-pointer transition-all duration-300"
              />

              <div className="flex justify-end gap-2 pt-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1 bg-gray-300 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  disabled={!emailVerified || !phoneVerified}
                  className="px-4 py-1 bg-amber-500 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

