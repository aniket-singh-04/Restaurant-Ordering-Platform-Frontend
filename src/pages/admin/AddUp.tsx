import { useState, type FormEvent } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { api } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import { isValidEmail, isValidGst, isValidPhone, isStrongPassword } from "../../utils/validators";
import { useAuth } from "../../context/AuthContext";
import {
  AdminCheckboxField,
  AdminField,
  AdminInputField,
  AdminSection,
  ADMIN_LISTBOX_BUTTON_CLASS,
  ADMIN_LISTBOX_OPTIONS_CLASS,
  getAdminListboxOptionClass,
} from "./components/shared/AdminFormControls";

type UserRole = "BRANCH_OWNER" | "STAFF";
type Status = "ACTIVE" | "INACTIVE";

interface RoleOption {
  id: UserRole;
  name: string;
}

const roles: RoleOption[] = [
  { id: "BRANCH_OWNER", name: "Branch Owner" },
  { id: "STAFF", name: "Staff" },
];

const statusOptions: Status[] = ["ACTIVE", "INACTIVE"];

interface BranchForm {
  restaurantId: string;
  name: string;
  address: string;
  city: string;
  geoLocation: {
    type: "Point";
    coordinates: [number, number];
  };
  status: Status;
  openingHours: {
    open: string;
    close: string;
  };
}

export default function AddUp() {
  const { user } = useAuth();
  const { pushToast } = useToast();

  const [selectedRole, setSelectedRole] = useState<RoleOption>(roles[1]);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    branchId: "",
  });
  const [userLoading, setUserLoading] = useState(false);

  const [branchForm, setBranchForm] = useState<BranchForm>({
    restaurantId: user?.restroId ?? "",
    name: "",
    address: "",
    city: "",
    geoLocation: { type: "Point", coordinates: [77.6, 12.97] },
    status: "ACTIVE",
    openingHours: { open: "10:00", close: "22:00" },
  });
  const [branchLoading, setBranchLoading] = useState(false);

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

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim()) {
      pushToast({ title: "Name is required", variant: "error" });
      return;
    }
    if (!isValidEmail(userForm.email)) {
      pushToast({ title: "Valid email is required", variant: "error" });
      return;
    }
    if (!isValidPhone(userForm.phone)) {
      pushToast({ title: "Valid phone is required", variant: "error" });
      return;
    }
    if (!isStrongPassword(userForm.password, 6)) {
      pushToast({ title: "Password must be at least 6 characters", variant: "error" });
      return;
    }

    setUserLoading(true);
    try {
      await api.post("/api/v1/auth/createuser", {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        password: userForm.password,
        role: selectedRole.id,
      }, {
        credentials: "include",
      }
      );
      pushToast({ title: "User created", variant: "success" });
      setUserForm({ name: "", email: "", phone: "", password: "", branchId: "" });
    } catch (err: any) {
      console.log(err);
      pushToast({
        title: "Unable to create user",
        description: err?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setUserLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!branchForm.restaurantId) {
      pushToast({ title: "Restaurant ID is required", variant: "error" });
      return;
    }
    if (!branchForm.name.trim()) {
      pushToast({ title: "Branch name is required", variant: "error" });
      return;
    }
    if (!branchForm.address.trim() || !branchForm.city.trim()) {
      pushToast({ title: "Address and city are required", variant: "error" });
      return;
    }

    setBranchLoading(true);
    try {
      await api.post("/api/v1/branches", branchForm);
      pushToast({ title: "Branch created", variant: "success" });
      setBranchForm((prev) => ({ ...prev, name: "", address: "", city: "" }));
    } catch (err: any) {
      pushToast({
        title: "Unable to create branch",
        description: err?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setBranchLoading(false);
    }
  };

  const handleCreateRestaurant = async () => {
    if (!restaurantForm.name.trim()) {
      pushToast({ title: "Restaurant name is required", variant: "error" });
      return;
    }
    if (!restaurantForm.legalName.trim()) {
      pushToast({ title: "Legal name is required", variant: "error" });
      return;
    }
    if (!isValidGst(restaurantForm.gstNumber)) {
      pushToast({ title: "Valid GST number is required", variant: "error" });
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
      await api.post("/api/v1/restaurants", restaurantForm);
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
    <div className="space-y-10 font-serif font-bold flex flex-wrap justify-evenly">
      <AdminSection
        title="Create User"
        className="w-full sm:w-100 shadow-md space-y-6"
        titleClassName="text-2xl text-[#1f1914] mb-6"
      >
        <form onSubmit={handleCreateUser} className="space-y-5 text-left">
          <AdminInputField
            label="Full Name"
            type="text"
            name="name"
            required
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            labelClassName="text-sm text-[#5a4c4c] mb-2"
          />

          <AdminInputField
            label="Email"
            type="email"
            name="email"
            required
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            labelClassName="text-sm text-[#5a4c4c] mb-2"
          />

          <AdminInputField
            label="Phone"
            type="tel"
            name="phone"
            required
            value={userForm.phone}
            onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
            labelClassName="text-sm text-[#5a4c4c] mb-2"
          />

          <AdminInputField
            label="Password"
            type="password"
            name="password"
            required
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            labelClassName="text-sm text-[#5a4c4c] mb-2"
          />

          {/* <div>
            <label className="block text-sm font-medium text-[#5a4c4c] mb-2">
              Branch ID (optional)
            </label>
            <input
              type="text"
              name="branchId"
              value={userForm.branchId}
              onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
              className="w-full rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div> */}

          <AdminField label="Role" labelClassName="text-sm text-[#5a4c4c] mb-2">
            <Listbox value={selectedRole} onChange={setSelectedRole}>
              <div className="relative">
                <ListboxButton className={`relative cursor-pointer py-3 pl-4 pr-10 ${ADMIN_LISTBOX_BUTTON_CLASS}`}>
                  <span className="block truncate text-[#1f1914]">
                    {selectedRole.name}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <ChevronDownIcon className="h-5 w-5 text-[#5a4c4c]" />
                  </span>
                </ListboxButton>

                <ListboxOptions className="absolute mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white border border-[#e5d5c6] shadow-lg focus:outline-none z-10">
                  {roles.map((role) => (
                    <ListboxOption
                      key={role.id}
                      value={role}
                      className={({ focus }) => getAdminListboxOptionClass(focus)}
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? "font-semibold" : "font-normal"}`}>
                            {role.name}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-3 flex items-center text-orange-500">
                              <CheckIcon className="h-5 w-5" />
                            </span>
                          )}
                        </>
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
          </AdminField>

          <button
            type="submit"
            disabled={userLoading}
            className="cursor-pointer w-full bg-linear-to-r from-yellow-400 to-orange-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-60"
          >
            {userLoading ? "Creating..." : "Create User"}
          </button>
        </form>
      </AdminSection>

      <AdminSection
        title="Create Branch"
        className="w-full sm:w-100 shadow-md space-y-6"
      >
        <AdminInputField
          label="Restaurant ID"
          type="text"
          value={branchForm.restaurantId}
          onChange={(e) =>
            setBranchForm({ ...branchForm, restaurantId: e.target.value })
          }
          labelClassName="text-sm text-[#5a4c4c] mb-1"
        />

        <AdminInputField
          label="Branch Name"
          type="text"
          value={branchForm.name}
          onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
          labelClassName="text-sm text-[#5a4c4c] mb-1"
        />

        <AdminInputField
          label="Address"
          type="text"
          value={branchForm.address}
          onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
          labelClassName="text-sm text-[#5a4c4c] mb-1"
        />

        <AdminInputField
          label="City"
          type="text"
          value={branchForm.city}
          onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
          labelClassName="text-sm text-[#5a4c4c] mb-1"
        />

        <div className="flex gap-4">
          <AdminInputField
            label="Longitude"
            type="number"
            value={branchForm.geoLocation.coordinates[0]}
            onChange={(e) =>
              setBranchForm({
                ...branchForm,
                geoLocation: {
                  ...branchForm.geoLocation,
                  coordinates: [
                    parseFloat(e.target.value),
                    branchForm.geoLocation.coordinates[1],
                  ],
                },
              })
            }
            containerClassName="flex-1"
            labelClassName="text-sm text-[#5a4c4c] mb-1"
          />
          <AdminInputField
            label="Latitude"
            type="number"
            value={branchForm.geoLocation.coordinates[1]}
            onChange={(e) =>
              setBranchForm({
                ...branchForm,
                geoLocation: {
                  ...branchForm.geoLocation,
                  coordinates: [
                    branchForm.geoLocation.coordinates[0],
                    parseFloat(e.target.value),
                  ],
                },
              })
            }
            containerClassName="flex-1"
            labelClassName="text-sm text-[#5a4c4c] mb-1"
          />
        </div>

        <AdminField label="Status" labelClassName="text-sm text-[#5a4c4c] mb-1">
          <Listbox
            value={branchForm.status}
            onChange={(val) => setBranchForm({ ...branchForm, status: val })}
          >
            <div className="relative">
              <ListboxButton className={`${ADMIN_LISTBOX_BUTTON_CLASS} flex justify-between items-center`}>
                {branchForm.status}
                <ChevronDownIcon className="w-5 h-5 text-[#5a4c4c]" />
              </ListboxButton>
              <ListboxOptions className={ADMIN_LISTBOX_OPTIONS_CLASS}>
                {statusOptions.map((status) => (
                  <ListboxOption
                    key={status}
                    value={status}
                    className={({ focus }) => getAdminListboxOptionClass(focus)}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? "font-semibold" : "font-normal"}`}>
                          {status}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-3 flex items-center text-orange-500">
                            <CheckIcon className="h-5 w-5" />
                          </span>
                        )}
                      </>

                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </div>
          </Listbox>
        </AdminField>

        <div className="flex gap-4">
          <AdminInputField
            label="Open Time"
            type="time"
            value={branchForm.openingHours.open}
            onChange={(e) =>
              setBranchForm({
                ...branchForm,
                openingHours: { ...branchForm.openingHours, open: e.target.value },
              })
            }
            containerClassName="flex-1"
            labelClassName="text-sm text-[#5a4c4c] mb-1"
          />
          <AdminInputField
            label="Close Time"
            type="time"
            value={branchForm.openingHours.close}
            onChange={(e) =>
              setBranchForm({
                ...branchForm,
                openingHours: { ...branchForm.openingHours, close: e.target.value },
              })
            }
            containerClassName="flex-1"
            labelClassName="text-sm text-[#5a4c4c] mb-1"
          />
        </div>

        <button
          onClick={handleCreateBranch}
          disabled={branchLoading}
          className="w-full bg-linear-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-60"
        >
          {branchLoading ? "Creating..." : "Create Branch"}
        </button>
      </AdminSection>

      <AdminSection
        title="Create Restaurant"
        className="w-full sm:w-100 mb-10 shadow-md space-y-6"
      >
        <AdminInputField
          label="Restaurant Name"
          type="text"
          value={restaurantForm.name}
          onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
          labelClassName="text-sm text-[#5a4c4c] mb-1"
        />

        <AdminInputField
          label="Legal Name"
          type="text"
          value={restaurantForm.legalName}
          onChange={(e) =>
            setRestaurantForm({ ...restaurantForm, legalName: e.target.value })
          }
          labelClassName="text-sm text-[#5a4c4c] mb-1"
        />

        <AdminInputField
          label="GST Number"
          type="text"
          value={restaurantForm.gstNumber}
          onChange={(e) =>
            setRestaurantForm({ ...restaurantForm, gstNumber: e.target.value })
          }
          labelClassName="text-sm text-[#5a4c4c] mb-1"
        />

        <AdminInputField
          label="Support Email"
          type="email"
          value={restaurantForm.supportEmail}
          onChange={(e) =>
            setRestaurantForm({ ...restaurantForm, supportEmail: e.target.value })
          }
          labelClassName="text-sm text-[#5a4c4c] mb-1"
        />

        <AdminInputField
          label="Support Phone"
          type="tel"
          value={restaurantForm.supportPhone}
          onChange={(e) =>
            setRestaurantForm({ ...restaurantForm, supportPhone: e.target.value })
          }
          labelClassName="text-sm text-[#5a4c4c] mb-1"
        />

        <div className="flex gap-6">
          <AdminCheckboxField
            label="Active"
            checked={restaurantForm.isActive}
            onChange={(e) =>
              setRestaurantForm({ ...restaurantForm, isActive: e.target.checked })
            }
            className="h-4 w-4 accent-orange-500"
          />

          <AdminCheckboxField
            label="Verified"
            checked={restaurantForm.isVerified}
            onChange={(e) =>
              setRestaurantForm({ ...restaurantForm, isVerified: e.target.checked })
            }
            className="h-4 w-4 accent-orange-500"
          />
        </div>

        <button
          onClick={handleCreateRestaurant}
          disabled={restaurantLoading}
          className="w-full bg-linear-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-60"
        >
          {restaurantLoading ? "Creating..." : "Create Restaurant"}
        </button>
      </AdminSection>
    </div>
  );
}
