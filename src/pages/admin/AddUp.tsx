import { useState } from "react";
import { api } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import { isValidEmail, isValidPhone } from "../../utils/validators";
import {
  AdminCheckboxField,
  AdminInputField,
  AdminSection,
} from "./components/shared/AdminFormControls";

export default function AddUp() {
  const { pushToast } = useToast();

  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    legalName: "",
    gstNumber: "",
    supportEmail: "",
    supportPhone: "",
    isActive: false,
    isVerified: false,
  });

  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [confirmCreate, setConfirmCreate] = useState(false);

  const handleCreateRestaurant = async () => {
    if (!restaurantForm.name.trim()) {
      pushToast({ title: "Restaurant name is required", variant: "error" });
      return;
    }

    if (!isValidEmail(restaurantForm.supportEmail)) {
      pushToast({ title: "Valid support email is required", variant: "error" });
      return;
    }

    if (!isValidPhone(restaurantForm.supportPhone)) {
      pushToast({ title: "Valid support phone is required", variant: "error" });
      return;
    }

    setRestaurantLoading(true);
    try {
      await api.post("/api/v1/restaurants/create-restaurant", restaurantForm, {
        credentials: "include",
      });

      pushToast({ title: "Restaurant created", variant: "success" });

      setRestaurantForm({
        name: "",
        legalName: "",
        gstNumber: "",
        supportEmail: "",
        supportPhone: "",
        isActive: false,
        isVerified: false,
      });

      setConfirmCreate(false);
    } catch (err: any) {
      pushToast({
        title: "Unable to create restaurant",
        description: err?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setRestaurantLoading(false);
    }
  };

return (
  <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
    <div className="mx-auto max-w-5xl space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Create Restaurant
          </h1>
          <p className="text-sm text-gray-500">
            Add a new restaurant with details and configuration
          </p>
        </div>
      </div>

      {/* FORM CARD */}
      <AdminSection
        title=""
        className="rounded-3xl bg-white p-8 shadow-lg hover:shadow-xl transition duration-300 space-y-8"
      >

        {/* BASIC INFO */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              🏢 Basic Information
            </h2>
            <p className="text-xs text-gray-500">
              Enter official and display details of the restaurant
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <AdminInputField
                label="Restaurant Name *"
                type="text"
                value={restaurantForm.name}
                onChange={(e) =>
                  setRestaurantForm({ ...restaurantForm, name: e.target.value })
                }
              />

              <AdminInputField
                label="Legal Name"
                type="text"
                value={restaurantForm.legalName}
                onChange={(e) =>
                  setRestaurantForm({ ...restaurantForm, legalName: e.target.value })
                }
              />
            </div>

            <AdminInputField
              label="GST Number"
              type="text"
              value={restaurantForm.gstNumber}
              onChange={(e) =>
                setRestaurantForm({ ...restaurantForm, gstNumber: e.target.value })
              }
            />
          </div>
        </div>

        {/* CONTACT */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              📞 Contact Details
            </h2>
            <p className="text-xs text-gray-500">
              Provide support contact details for customers
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <AdminInputField
                label="Support Email *"
                type="email"
                value={restaurantForm.supportEmail}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    supportEmail: e.target.value,
                  })
                }
              />

              <AdminInputField
                label="Support Phone *"
                type="tel"
                value={restaurantForm.supportPhone}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    supportPhone: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* STATUS */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              ⚙️ Status
            </h2>
            <p className="text-xs text-gray-500">
              Control restaurant visibility and verification
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 flex flex-wrap gap-6">
            <AdminCheckboxField
              label="Active"
              checked={restaurantForm.isActive}
              onChange={(e) =>
                setRestaurantForm({
                  ...restaurantForm,
                  isActive: e.target.checked,
                })
              }
            />

            <AdminCheckboxField
              label="Verified"
              checked={restaurantForm.isVerified}
              onChange={(e) =>
                setRestaurantForm({
                  ...restaurantForm,
                  isVerified: e.target.checked,
                })
              }
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">

          {!confirmCreate ? (
            <button
              type="button"
              onClick={() => setConfirmCreate(true)}
              className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-md hover:bg-orange-600 hover:scale-[1.02] transition"
            >
              Create Restaurant
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCreateRestaurant}
                disabled={restaurantLoading}
                className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-green-700 hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {restaurantLoading ? "Creating..." : "Confirm Create"}
              </button>

              <button
                type="button"
                onClick={() => setConfirmCreate(false)}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </>
          )}
        </div>

      </AdminSection>
    </div>
  </div>
);
}