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
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <AdminSection
          title="Create Restaurant"
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AdminInputField
                label="Restaurant Name *"
                type="text"
                value={restaurantForm.name}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    name: e.target.value,
                  })
                }
              />

              <AdminInputField
                label="Legal Name"
                type="text"
                value={restaurantForm.legalName}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    legalName: e.target.value,
                  })
                }
              />
            </div>

            <AdminInputField
              label="GST Number"
              type="text"
              value={restaurantForm.gstNumber}
              onChange={(e) =>
                setRestaurantForm({
                  ...restaurantForm,
                  gstNumber: e.target.value,
                })
              }
            />
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Contact Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Status */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Status</h2>

            <div className="flex gap-6">
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

          {/* Actions */}
          <div className="pt-4 flex gap-3">
            {!confirmCreate ? (
              <button
                type="button"
                onClick={() => setConfirmCreate(true)}
                className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                Create Restaurant
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCreateRestaurant}
                  disabled={restaurantLoading}
                  className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
                >
                  {restaurantLoading ? "Creating..." : "Confirm Create"}
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmCreate(false)}
                  className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium transition hover:bg-gray-100"
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