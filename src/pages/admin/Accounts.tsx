import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../utils/api";
import {
  getApiErrorMessage,
  getApiFieldErrors,
  getApiRequestId,
} from "../../utils/apiErrorHelpers";
import {
  isStrongPassword,
  isValidEmail,
  isValidGst,
  isValidPhone,
} from "../../utils/validators";

type BranchStatus = "OPEN" | "CLOSED" | "DISABLED";
type RoleOption = "STAFF" | "BRANCH_OWNER";

interface Restaurant {
  id: string;
  name: string;
  legalName: string;
  gstNumber: string;
  supportEmail: string;
  supportPhone: string;
  isActive: boolean;
  isVerified: boolean;
}

interface BranchOpeningHours {
  open: string;
  close: string;
}

interface BranchOwner {
  ownerId: string;
  name: string;
  email: string;
  phone: string;
}

interface BranchStaff {
  staffId: string;
  role: string;
  name: string;
  email: string;
}

interface BranchResponse {
  id: string;
  restaurantId: string;
  name: string;
  address: string;
  city: string;
  status: BranchStatus;
  openingHours: BranchOpeningHours;
  branchOwner: BranchOwner | null;
  branchStaffId: BranchStaff[];
  createdAt: string;
  updatedAt: string;
}

interface EditableBranch extends BranchResponse {
  branchOwnerId: string;
  staffIds: string[];
}

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: RoleOption;
  restroId: string | null;
  branchIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditableUser extends ManagedUser {
  draftPassword: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

interface BranchForm {
  name: string;
  address: string;
  city: string;
  status: BranchStatus;
  openingHours: BranchOpeningHours;
}

interface UserForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: RoleOption;
  branchIds: string[];
  isActive: boolean;
}

type BranchFormFieldKey = "name" | "address" | "city" | "open" | "close";
type UserFormFieldKey = "name" | "email" | "phone" | "password" | "branchIds";

type RestaurantFieldKey =
  | "name"
  | "legalName"
  | "gstNumber"
  | "supportEmail"
  | "supportPhone";

const DEFAULT_OPENING_HOURS: BranchOpeningHours = {
  open: "10:00",
  close: "22:00",
};

const BRANCH_STATUS_OPTIONS: BranchStatus[] = ["OPEN", "CLOSED", "DISABLED"];

const ROLE_OPTIONS: Array<{ label: string; value: RoleOption }> = [
  { label: "Staff", value: "STAFF" },
  { label: "Branch Owner", value: "BRANCH_OWNER" },
];

const RESTAURANT_FIELDS: Array<{
  label: string;
  key: RestaurantFieldKey;
  type: "text" | "email" | "tel";
  full?: boolean;
}> = [
    { label: "Name", key: "name", type: "text" },
    { label: "Legal Name", key: "legalName", type: "text" },
    { label: "GST Number", key: "gstNumber", type: "text" },
    { label: "Support Email", key: "supportEmail", type: "email" },
    { label: "Support Phone", key: "supportPhone", type: "tel", full: true },
  ];

const createEmptyBranchForm = (): BranchForm => ({
  name: "",
  address: "",
  city: "",
  status: "OPEN",
  openingHours: { ...DEFAULT_OPENING_HOURS },
});

const createEmptyUserForm = (): UserForm => ({
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "STAFF",
  branchIds: [],
  isActive: true,
});

const toggleIdSelection = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((currentId) => currentId !== id) : [...ids, id];

const getRoleBadgeClass = (role: RoleOption) =>
  role === "BRANCH_OWNER"
    ? "bg-orange-100 text-orange-700"
    : "bg-blue-100 text-blue-700";

const getStatusBadgeClass = (status: BranchStatus) => {
  if (status === "OPEN") return "bg-emerald-100 text-emerald-700";
  if (status === "CLOSED") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
};

const mapBranchToDraft = (branch: BranchResponse): EditableBranch => ({
  ...branch,
  openingHours: {
    open: branch.openingHours?.open ?? DEFAULT_OPENING_HOURS.open,
    close: branch.openingHours?.close ?? DEFAULT_OPENING_HOURS.close,
  },
  branchOwnerId: branch.branchOwner?.ownerId ?? "",
  staffIds: branch.branchStaffId.map((staff) => staff.staffId),
});

const mapUserToDraft = (managedUser: ManagedUser): EditableUser => ({
  ...managedUser,
  branchIds: [...managedUser.branchIds],
  draftPassword: "",
});

const withRequestId = (error: unknown, fallback: string) => {
  const message = getApiErrorMessage(error, fallback);
  const requestId = getApiRequestId(error);
  return requestId ? `${message} Request ID: ${requestId}` : message;
};

export default function Accounts() {
  const { user } = useAuth();
  const { pushToast } = useToast();

  const [restaurantId, setRestaurantId] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branches, setBranches] = useState<EditableBranch[]>([]);
  const [users, setUsers] = useState<EditableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [restaurantSaving, setRestaurantSaving] = useState(false);
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [savingBranchId, setSavingBranchId] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [confirmRestaurantSave, setConfirmRestaurantSave] = useState(false);
  const [branchForm, setBranchForm] = useState<BranchForm>(createEmptyBranchForm);
  const [userForm, setUserForm] = useState<UserForm>(createEmptyUserForm);
  const [restaurantErrors, setRestaurantErrors] = useState<
    Partial<Record<RestaurantFieldKey, string>>
  >({});
  const [restaurantMessage, setRestaurantMessage] = useState("");
  const [branchFormErrors, setBranchFormErrors] = useState<
    Partial<Record<BranchFormFieldKey, string>>
  >({});
  const [branchFormMessage, setBranchFormMessage] = useState("");
  const [userFormErrors, setUserFormErrors] = useState<
    Partial<Record<UserFormFieldKey, string>>
  >({});
  const [userFormMessage, setUserFormMessage] = useState("");
  const [branchSaveMessages, setBranchSaveMessages] = useState<Record<string, string>>({});
  const [userSaveMessages, setUserSaveMessages] = useState<Record<string, string>>({});

  const clearBranchSaveMessage = (branchId: string) => {
    setBranchSaveMessages((current) => {
      if (!current[branchId]) return current;
      const next = { ...current };
      delete next[branchId];
      return next;
    });
  };

  const clearUserSaveMessage = (userId: string) => {
    setUserSaveMessages((current) => {
      if (!current[userId]) return current;
      const next = { ...current };
      delete next[userId];
      return next;
    });
  };

  const validateRestaurantForm = (value: Restaurant | null) => {
    const nextErrors: Partial<Record<RestaurantFieldKey, string>> = {};

    if (!value) {
      return nextErrors;
    }

    if (!value.name.trim()) {
      nextErrors.name = "Restaurant name is required.";
    }

    if (!value.supportEmail.trim()) {
      nextErrors.supportEmail = "Support email is required.";
    } else if (!isValidEmail(value.supportEmail)) {
      nextErrors.supportEmail = "Enter a valid support email.";
    }

    if (!value.supportPhone.trim()) {
      nextErrors.supportPhone = "Support phone is required.";
    } else if (!isValidPhone(value.supportPhone)) {
      nextErrors.supportPhone = "Support phone must be exactly 10 digits.";
    }

    if (value.gstNumber.trim() && !isValidGst(value.gstNumber)) {
      nextErrors.gstNumber = "Enter a valid GST number.";
    }

    return nextErrors;
  };

  const validateBranchCreateForm = (value: BranchForm) => {
    const nextErrors: Partial<Record<BranchFormFieldKey, string>> = {};

    if (!value.name.trim()) nextErrors.name = "Branch name is required.";
    if (!value.city.trim()) nextErrors.city = "City is required.";
    if (!value.address.trim()) nextErrors.address = "Address is required.";
    if (!value.openingHours.open.trim()) nextErrors.open = "Open time is required.";
    if (!value.openingHours.close.trim()) nextErrors.close = "Close time is required.";

    return nextErrors;
  };

  const validateUserCreateForm = (value: UserForm) => {
    const nextErrors: Partial<Record<UserFormFieldKey, string>> = {};

    if (!value.name.trim()) nextErrors.name = "User name is required.";
    if (!value.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(value.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!value.phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    } else if (!isValidPhone(value.phone)) {
      nextErrors.phone = "Phone number must be exactly 10 digits.";
    }

    if (!isStrongPassword(value.password, 6)) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (!value.branchIds.length) {
      nextErrors.branchIds = "Select at least one branch.";
    }

    return nextErrors;
  };

  const fetchData = useCallback(async () => {
    if (!restaurantId) {
      setRestaurant(null);
      setBranches([]);
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const [restaurantResponse, branchResponse, userResponse] = await Promise.all([
        api.get<ApiResponse<Restaurant>>(`/api/v1/restaurants/${restaurantId}`),
        api.get<ApiResponse<BranchResponse[]>>(`/api/v1/branches/restaurant/${restaurantId}`),
        api.get<ApiResponse<ManagedUser[]>>(`/api/v1/users?restaurantId=${restaurantId}`),
      ]);

      setRestaurant(restaurantResponse.data);
      setBranches(branchResponse.data.map(mapBranchToDraft));
      setUsers(userResponse.data.map(mapUserToDraft));
    } catch (error) {
      setRestaurant(null);
      setBranches([]);
      setUsers([]);
      pushToast({
        title: "Failed to load account data",
        description: withRequestId(error, "Unable to load account data."),
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [pushToast, restaurantId]);

  useEffect(() => {
    setRestaurantId(user?.restroId ?? "");
  }, [user?.restroId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const updateBranchDraft = (
    branchId: string,
    updater: (branch: EditableBranch) => EditableBranch,
  ) => {
    clearBranchSaveMessage(branchId);
    setBranches((current) =>
      current.map((branch) => (branch.id === branchId ? updater(branch) : branch)),
    );
  };

  const updateUserDraft = (
    userId: string,
    updater: (managedUser: EditableUser) => EditableUser,
  ) => {
    clearUserSaveMessage(userId);
    setUsers((current) =>
      current.map((managedUser) =>
        managedUser.id === userId ? updater(managedUser) : managedUser,
      ),
    );
  };

  const handleRestaurantSave = async () => {
    if (!restaurant) return;

    const normalizedRestaurant = {
      ...restaurant,
      name: restaurant.name.trim(),
      legalName: restaurant.legalName.trim(),
      gstNumber: restaurant.gstNumber.trim().toUpperCase(),
      supportEmail: restaurant.supportEmail.trim(),
      supportPhone: restaurant.supportPhone.trim(),
    };

    const nextErrors = validateRestaurantForm(normalizedRestaurant);
    setRestaurantErrors(nextErrors);
    setRestaurantMessage("");

    if (Object.keys(nextErrors).length) {
      pushToast({ title: "Please fix the restaurant form errors", variant: "error" });
      return;
    }

    setRestaurantSaving(true);
    try {
      const { id, ...payload } = normalizedRestaurant;
      const response = await api.put<ApiResponse<Restaurant>>(`/api/v1/restaurants/${id}`, payload);
      setRestaurant(response.data);
      setRestaurantErrors({});
      setRestaurantMessage("");
      setConfirmRestaurantSave(false);
      pushToast({ title: "Restaurant updated", variant: "success" });
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      setRestaurantErrors((current) => ({
        ...current,
        ...(fieldErrors.name ? { name: fieldErrors.name } : {}),
        ...(fieldErrors.legalName ? { legalName: fieldErrors.legalName } : {}),
        ...(fieldErrors.gstNumber ? { gstNumber: fieldErrors.gstNumber } : {}),
        ...(fieldErrors.supportEmail ? { supportEmail: fieldErrors.supportEmail } : {}),
        ...(fieldErrors.supportPhone ? { supportPhone: fieldErrors.supportPhone } : {}),
      }));
      setRestaurantMessage(withRequestId(error, "Unable to update restaurant."));
      pushToast({
        title: "Unable to update restaurant",
        description: withRequestId(error, "Unable to update restaurant."),
        variant: "error",
      });
    } finally {
      setRestaurantSaving(false);
    }
  };

  const handleCreateBranch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      ...branchForm,
      name: branchForm.name.trim(),
      address: branchForm.address.trim(),
      city: branchForm.city.trim(),
    };

    const nextErrors = validateBranchCreateForm(payload);
    setBranchFormErrors(nextErrors);
    setBranchFormMessage("");

    if (Object.keys(nextErrors).length) {
      pushToast({ title: "Please fix the branch form errors", variant: "error" });
      return;
    }

    setCreatingBranch(true);
    try {
      await api.post<ApiResponse<BranchResponse>>("/api/v1/branches/create-branch", payload);
      setBranchForm(createEmptyBranchForm());
      setBranchFormErrors({});
      setBranchFormMessage("");
      pushToast({ title: "Branch created", variant: "success" });
      await fetchData();
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      setBranchFormErrors((current) => ({
        ...current,
        ...(fieldErrors.name ? { name: fieldErrors.name } : {}),
        ...(fieldErrors.address ? { address: fieldErrors.address } : {}),
        ...(fieldErrors.city ? { city: fieldErrors.city } : {}),
        ...(fieldErrors["openingHours.open"] ? { open: fieldErrors["openingHours.open"] } : {}),
        ...(fieldErrors["openingHours.close"] ? { close: fieldErrors["openingHours.close"] } : {}),
      }));
      setBranchFormMessage(withRequestId(error, "Unable to create branch."));
      pushToast({
        title: "Unable to create branch",
        description: withRequestId(error, "Unable to create branch."),
        variant: "error",
      });
    } finally {
      setCreatingBranch(false);
    }
  };
  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: userForm.name.trim(),
      email: userForm.email.trim(),
      phone: userForm.phone.trim(),
      password: userForm.password,
      role: userForm.role,
      branchIds: userForm.branchIds,
      restroId: restaurantId,
      isActive: userForm.isActive,
    };

    const nextErrors = validateUserCreateForm(userForm);
    setUserFormErrors(nextErrors);
    setUserFormMessage("");

    if (Object.keys(nextErrors).length) {
      pushToast({ title: "Please fix the user form errors", variant: "error" });
      return;
    }

    setCreatingUser(true);
    try {
      await api.post("/api/v1/auth/createuser", payload);
      setUserForm(createEmptyUserForm());
      setUserFormErrors({});
      setUserFormMessage("");
      pushToast({ title: "User created", variant: "success" });
      await fetchData();
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      setUserFormErrors((current) => ({
        ...current,
        ...(fieldErrors.name ? { name: fieldErrors.name } : {}),
        ...(fieldErrors.email ? { email: fieldErrors.email } : {}),
        ...(fieldErrors.phone ? { phone: fieldErrors.phone } : {}),
        ...(fieldErrors.password ? { password: fieldErrors.password } : {}),
        ...(fieldErrors.branchIds ? { branchIds: fieldErrors.branchIds } : {}),
      }));
      setUserFormMessage(withRequestId(error, "Unable to create user."));
      pushToast({
        title: "Unable to create user",
        description: withRequestId(error, "Unable to create user."),
        variant: "error",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSaveBranch = async (branch: EditableBranch) => {
    const payload = {
      name: branch.name.trim(),
      address: branch.address.trim(),
      city: branch.city.trim(),
      status: branch.status,
      openingHours: {
        open: branch.openingHours.open,
        close: branch.openingHours.close,
      },
      branchOwnerId: branch.branchOwnerId || null,
      staffIds: branch.staffIds,
    };

    if (!payload.name) {
      const message = "Branch name is required.";
      setBranchSaveMessages((current) => ({ ...current, [branch.id]: message }));
      pushToast({ title: message, variant: "error" });
      return;
    }
    if (!payload.address || !payload.city) {
      const message = "Address and city are required.";
      setBranchSaveMessages((current) => ({ ...current, [branch.id]: message }));
      pushToast({ title: message, variant: "error" });
      return;
    }
    if (!payload.openingHours.open || !payload.openingHours.close) {
      const message = "Opening hours are required.";
      setBranchSaveMessages((current) => ({ ...current, [branch.id]: message }));
      pushToast({ title: message, variant: "error" });
      return;
    }
    if (payload.branchOwnerId && payload.staffIds.includes(payload.branchOwnerId)) {
      const message = "The branch owner cannot also be assigned as staff.";
      setBranchSaveMessages((current) => ({ ...current, [branch.id]: message }));
      pushToast({
        title: message,
        variant: "error",
      });
      return;
    }

    setSavingBranchId(branch.id);
    clearBranchSaveMessage(branch.id);
    try {
      await api.put<ApiResponse<BranchResponse>>(`/api/v1/branches/${branch.id}`, payload);
      pushToast({ title: "Branch updated", variant: "success" });
      await fetchData();
    } catch (error) {
      const message = withRequestId(error, "Unable to update branch.");
      setBranchSaveMessages((current) => ({ ...current, [branch.id]: message }));
      pushToast({
        title: "Unable to update branch",
        description: message,
        variant: "error",
      });
    } finally {
      setSavingBranchId(null);
    }
  };

  const handleSaveUser = async (managedUser: EditableUser) => {
    const payload = {
      name: managedUser.name.trim(),
      email: managedUser.email.trim(),
      phone: managedUser.phone.trim(),
      role: managedUser.role,
      branchIds: managedUser.branchIds,
      isActive: managedUser.isActive,
      ...(managedUser.draftPassword.trim()
        ? { password: managedUser.draftPassword }
        : {}),
    };

    if (!payload.name) {
      const message = "User name is required.";
      setUserSaveMessages((current) => ({ ...current, [managedUser.id]: message }));
      pushToast({ title: message, variant: "error" });
      return;
    }
    if (!isValidEmail(payload.email)) {
      const message = "Enter a valid email address.";
      setUserSaveMessages((current) => ({ ...current, [managedUser.id]: message }));
      pushToast({ title: message, variant: "error" });
      return;
    }
    if (!isValidPhone(payload.phone)) {
      const message = "Phone number must be exactly 10 digits.";
      setUserSaveMessages((current) => ({ ...current, [managedUser.id]: message }));
      pushToast({ title: message, variant: "error" });
      return;
    }
    if (
      "password" in payload &&
      typeof payload.password === "string" &&
      !isStrongPassword(payload.password, 6)
    ) {
      const message = "New password must be at least 6 characters.";
      setUserSaveMessages((current) => ({ ...current, [managedUser.id]: message }));
      pushToast({
        title: message,
        variant: "error",
      });
      return;
    }

    setSavingUserId(managedUser.id);
    clearUserSaveMessage(managedUser.id);
    try {
      await api.put<ApiResponse<ManagedUser>>(`/api/v1/users/${managedUser.id}`, payload);
      pushToast({ title: "User updated", variant: "success" });
      await fetchData();
    } catch (error) {
      const message = withRequestId(error, "Unable to update user.");
      setUserSaveMessages((current) => ({ ...current, [managedUser.id]: message }));
      pushToast({
        title: "Unable to update user",
        description: message,
        variant: "error",
      });
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="min-h-screen space-y-8 bg-gray-50 text-left">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
          Restaurant Accounts
        </h1>
        <p className="text-sm text-gray-600">
          Manage restaurant details, branch assignments, and team access from one
          place.
        </p>
      </div>

      {!restaurantId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No restaurant is linked to the current account yet.
        </div>
      )}

      <section className="mx-auto max-w-6xl space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center justify-between gap-3 border-b pb-2">
          <h2 className="text-lg font-semibold text-gray-800">Restaurant Info</h2>
          {restaurant && (
            <span className="text-xs text-gray-500">ID: {restaurant.id}</span>
          )}
        </div>

        {restaurant ? (
          <>
            {restaurantMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {restaurantMessage}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {RESTAURANT_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className={`flex flex-col gap-1 ${field.full ? "sm:col-span-2" : ""}`}
                >
                  <label className="text-xs font-medium text-gray-500">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={restaurant[field.key]}
                    onChange={(event) => {
                      setRestaurantErrors((current) => ({ ...current, [field.key]: undefined }));
                      setRestaurantMessage("");
                      setRestaurant((current) =>
                        current
                          ? {
                              ...current,
                              [field.key]: event.target.value,
                            }
                          : current,
                      );
                    }}
                    className="w-full rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  {restaurantErrors[field.key] ? (
                    <p className="text-sm text-red-600">{restaurantErrors[field.key]}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-6 pt-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={restaurant.isActive}
                  onChange={(event) =>
                    setRestaurant((current) =>
                      current
                        ? { ...current, isActive: event.target.checked }
                        : current,
                    )
                  }
                  className="h-4 w-4 accent-orange-500"
                />
                Active
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={restaurant.isVerified}
                  onChange={(event) =>
                    setRestaurant((current) =>
                      current
                        ? { ...current, isVerified: event.target.checked }
                        : current,
                    )
                  }
                  className="h-4 w-4 accent-orange-500"
                />
                Verified
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              {!confirmRestaurantSave ? (
                <button
                  type="button"
                  onClick={() => setConfirmRestaurantSave(true)}
                  className="cursor-pointer rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600"
                >
                  Save Restaurant
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={restaurantSaving}
                    onClick={() => void handleRestaurantSave()}
                    className="cursor-pointer rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {restaurantSaving ? "Saving..." : "Confirm Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRestaurantSave(false)}
                    className="cursor-pointer rounded-lg border px-6 py-2 text-sm transition hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-600">
            {loading
              ? "Loading restaurant data..."
              : "Restaurant information will appear here once a linked restaurant is available."}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-1 border-b pb-2">
          <h2 className="text-lg font-semibold text-gray-800">Branch Management</h2>
          <p className="text-sm text-gray-500">
            Review every branch, edit its details, and assign one owner plus as many
            staff members as needed.
          </p>
        </div>

        <form onSubmit={handleCreateBranch} className="space-y-4 rounded-2xl border border-[#e5d5c6] bg-[#fff9f2] p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900">Add Branch</h3>
            <span className="text-xs text-gray-500">{branches.length} branches loaded</span>
          </div>

          {branchFormMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {branchFormMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Branch Name</label>
              <input
                type="text"
                value={branchForm.name}
                onChange={(event) => {
                  setBranchFormErrors((current) => ({ ...current, name: undefined }));
                  setBranchFormMessage("");
                  setBranchForm((current) => ({ ...current, name: event.target.value }));
                }}
                className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {branchFormErrors.name ? (
                <p className="text-sm text-red-600">{branchFormErrors.name}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">City</label>
              <input
                type="text"
                value={branchForm.city}
                onChange={(event) => {
                  setBranchFormErrors((current) => ({ ...current, city: undefined }));
                  setBranchFormMessage("");
                  setBranchForm((current) => ({ ...current, city: event.target.value }));
                }}
                className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {branchFormErrors.city ? (
                <p className="text-sm text-red-600">{branchFormErrors.city}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-medium text-gray-500">Address</label>
              <input
                type="text"
                value={branchForm.address}
                onChange={(event) => {
                  setBranchFormErrors((current) => ({ ...current, address: undefined }));
                  setBranchFormMessage("");
                  setBranchForm((current) => ({ ...current, address: event.target.value }));
                }}
                className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {branchFormErrors.address ? (
                <p className="text-sm text-red-600">{branchFormErrors.address}</p>
              ) : null}
            </div>




            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Status</label>

              <Listbox
                value={branchForm.status}
                onChange={(value: BranchStatus) =>
                  setBranchForm((current) => ({
                    ...current,
                    status: value,
                  }))
                }
              >
                <div className="relative">
                  {/* Button */}
                  <ListboxButton className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-orange-400 flex items-center justify-between">
                    <span>{branchForm.status}</span>
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  </ListboxButton>

                  {/* Options */}
                  <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-[#e5d5c6] bg-white shadow-lg focus:outline-none">
                    {BRANCH_STATUS_OPTIONS.map((status) => (
                      <ListboxOption
                        key={status}
                        value={status}
                        className={({ active }) =>
                          `cursor-pointer select-none px-4 py-2 flex items-center justify-between ${active ? "bg-orange-100 text-orange-700" : "text-gray-700"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span>{status}</span>
                            {selected && <CheckIcon className="h-4 w-4 text-orange-500" />}
                          </>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>







            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Open Time</label>
                <input
                  type="time"
                  value={branchForm.openingHours.open}
                  onChange={(event) => {
                    setBranchFormErrors((current) => ({ ...current, open: undefined }));
                    setBranchFormMessage("");
                    setBranchForm((current) => ({
                      ...current,
                      openingHours: {
                        ...current.openingHours,
                        open: event.target.value,
                      },
                    }));
                  }}
                  className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {branchFormErrors.open ? (
                  <p className="text-sm text-red-600">{branchFormErrors.open}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Close Time</label>
                <input
                  type="time"
                  value={branchForm.openingHours.close}
                  onChange={(event) => {
                    setBranchFormErrors((current) => ({ ...current, close: undefined }));
                    setBranchFormMessage("");
                    setBranchForm((current) => ({
                      ...current,
                      openingHours: {
                        ...current.openingHours,
                        close: event.target.value,
                      },
                    }));
                  }}
                  className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {branchFormErrors.close ? (
                  <p className="text-sm text-red-600">{branchFormErrors.close}</p>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={creatingBranch || !restaurantId}
            className="cursor-pointer rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingBranch ? "Creating..." : "Create Branch"}
          </button>
        </form>

        {branches.length ? (
          <div className="space-y-4">
            {branches.map((branch) => {
              const owner = users.find((managedUser) => managedUser.id === branch.branchOwnerId);
              const availableStaff = users.filter(
                (managedUser) => managedUser.id !== branch.branchOwnerId,
              );

              return (
                <article
                  key={branch.id}
                  className="rounded-2xl border border-[#e5d5c6] bg-[#fff9f2] p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {branch.name || "Unnamed Branch"}
                      </h3>
                      <p className="text-xs text-gray-500">{branch.id}</p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                        branch.status,
                      )}`}
                    >
                      {branch.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">Branch Name</label>
                      <input
                        type="text"
                        value={branch.name}
                        onChange={(event) =>
                          updateBranchDraft(branch.id, (current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">City</label>
                      <input
                        type="text"
                        value={branch.city}
                        onChange={(event) =>
                          updateBranchDraft(branch.id, (current) => ({
                            ...current,
                            city: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-xs font-medium text-gray-500">Address</label>
                      <input
                        type="text"
                        value={branch.address}
                        onChange={(event) =>
                          updateBranchDraft(branch.id, (current) => ({
                            ...current,
                            address: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">Status</label>

                      <Listbox
                        value={branch.status}
                        onChange={(value: BranchStatus) =>
                          updateBranchDraft(branch.id, (current) => ({
                            ...current,
                            status: value,
                          }))
                        }
                      >
                        <div className="relative">
                          {/* Button */}
                          <ListboxButton className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-orange-400 flex items-center justify-between">
                            <span>{branch.status}</span>
                            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                          </ListboxButton>

                          {/* Options */}
                          <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-[#e5d5c6] bg-white shadow-lg focus:outline-none">
                            {BRANCH_STATUS_OPTIONS.map((status) => (
                              <ListboxOption
                                key={status}
                                value={status}
                                className={({ active }) =>
                                  `cursor-pointer select-none px-4 py-2 flex items-center justify-between ${active ? "bg-orange-100 text-orange-700" : "text-gray-700"
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <span>{status}</span>
                                    {selected && <CheckIcon className="h-4 w-4 text-orange-500" />}
                                  </>
                                )}
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </div>
                      </Listbox>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">Open Time</label>
                        <input
                          type="time"
                          value={branch.openingHours.open}
                          onChange={(event) =>
                            updateBranchDraft(branch.id, (current) => ({
                              ...current,
                              openingHours: {
                                ...current.openingHours,
                                open: event.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">Close Time</label>
                        <input
                          type="time"
                          value={branch.openingHours.close}
                          onChange={(event) =>
                            updateBranchDraft(branch.id, (current) => ({
                              ...current,
                              openingHours: {
                                ...current.openingHours,
                                close: event.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs font-medium text-gray-500">Branch Owner</label>
                        <span className="text-xs text-gray-500">
                          {branch.branchOwnerId ? "Owner assigned" : "Unassigned"}
                        </span>
                      </div>

                      <Listbox
                        value={branch.branchOwnerId || ""}
                        onChange={(value: string) =>
                          updateBranchDraft(branch.id, (current) => ({
                            ...current,
                            branchOwnerId: value,
                            staffIds: current.staffIds.filter((staffId) => staffId !== value),
                          }))
                        }
                      >
                        <div className="relative">
                          {/* Button */}
                          <ListboxButton className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-orange-400 flex items-center justify-between">
                            <span>
                              {branch.branchOwnerId
                                ? (() => {
                                  const selectedUser = users.find(
                                    (u) => u.id === branch.branchOwnerId
                                  );
                                  return selectedUser
                                    ? `${selectedUser.name} (${selectedUser.role})`
                                    : "Unknown user";
                                })()
                                : "Unassigned"}
                            </span>
                            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                          </ListboxButton>

                          {/* Options */}
                          <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-[#e5d5c6] bg-white shadow-lg focus:outline-none">
                            {/* Unassigned option */}
                            <ListboxOption
                              value=""
                              className={({ active }) =>
                                `cursor-pointer select-none px-4 py-2 flex items-center justify-between ${active ? "bg-orange-100 text-orange-700" : "text-gray-700"
                                }`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span>Unassigned</span>
                                  {selected && <CheckIcon className="h-4 w-4 text-orange-500" />}
                                </>
                              )}
                            </ListboxOption>

                            {/* Users */}
                            {users.map((managedUser) => (
                              <ListboxOption
                                key={managedUser.id}
                                value={managedUser.id}
                                className={({ active }) =>
                                  `cursor-pointer select-none px-4 py-2 flex items-center justify-between ${active ? "bg-orange-100 text-orange-700" : "text-gray-700"
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <span>
                                      {managedUser.name} ({managedUser.role})
                                    </span>
                                    {selected && (
                                      <CheckIcon className="h-4 w-4 text-orange-500" />
                                    )}
                                  </>
                                )}
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </div>
                      </Listbox>

                      <p className="text-xs text-gray-500">
                        {owner
                          ? `${owner.email}${owner.phone ? ` • ${owner.phone}` : ""}`
                          : "Select a user to mark them as the branch owner."}
                      </p>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs font-medium text-gray-500">Assigned Staff</label>
                        <span className="text-xs text-gray-500">{branch.staffIds.length} selected</span>
                      </div>

                      {availableStaff.length ? (
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          {availableStaff.map((managedUser) => (
                            <label
                              key={managedUser.id}
                              className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-[#e5d5c6] bg-white px-4 py-3"
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={branch.staffIds.includes(managedUser.id)}
                                  onChange={() =>
                                    updateBranchDraft(branch.id, (current) => ({
                                      ...current,
                                      staffIds: toggleIdSelection(current.staffIds, managedUser.id),
                                    }))
                                  }
                                  className="mt-1 h-4 w-4 accent-orange-500"
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {managedUser.name}
                                  </p>
                                  <p className="text-xs text-gray-500">{managedUser.email}</p>
                                </div>
                              </div>
                              <span
                                className={`rounded-full px-2 py-1 text-[11px] font-medium ${getRoleBadgeClass(
                                  managedUser.role,
                                )}`}
                              >
                                {managedUser.role}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                          Create users first, then assign them here as staff.
                        </div>
                      )}
                    </div>
                  </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {branchSaveMessages[branch.id] ? (
                    <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {branchSaveMessages[branch.id]}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    disabled={savingBranchId === branch.id}
                      onClick={() => void handleSaveBranch(branch)}
                      className="cursor-pointer rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingBranchId === branch.id ? "Saving..." : "Save Branch"}
                    </button>
                    <span className="text-xs text-gray-500">
                      {branch.branchOwnerId
                        ? `Owner: ${owner?.name ?? "Assigned"}`
                        : "No owner assigned"}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-600">
            {loading ? "Loading branches..." : "No branches found for this restaurant yet."}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-1 border-b pb-2">
          <h2 className="text-lg font-semibold text-gray-800">User Management</h2>
          <p className="text-sm text-gray-500">
            Create team members, update their information, change their role, and
            control which branches they belong to.
          </p>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-4 rounded-2xl border border-[#e5d5c6] bg-[#fff9f2] p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900">Add Team Member</h3>
            <span className="text-xs text-gray-500">{users.length} users loaded</span>
          </div>

          {userFormMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {userFormMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Full Name</label>
              <input
                type="text"
                value={userForm.name}
                onChange={(event) => {
                  setUserFormErrors((current) => ({ ...current, name: undefined }));
                  setUserFormMessage("");
                  setUserForm((current) => ({ ...current, name: event.target.value }));
                }}
                className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {userFormErrors.name ? (
                <p className="text-sm text-red-600">{userFormErrors.name}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Role</label>

              <Listbox
                value={userForm.role}
                onChange={(value: RoleOption) => {
                  setUserFormMessage("");
                  setUserForm((current) => ({
                    ...current,
                    role: value,
                  }));
                }}
              >
                <div className="relative">
                  {/* Button */}
                  <ListboxButton className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-orange-400 flex items-center justify-between">
                    <span>
                      {
                        ROLE_OPTIONS.find((opt) => opt.value === userForm.role)?.label ??
                        "Select role"
                      }
                    </span>
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  </ListboxButton>

                  {/* Options */}
                  <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-[#e5d5c6] bg-white shadow-lg focus:outline-none">
                    {ROLE_OPTIONS.map((option) => (
                      <ListboxOption
                        key={option.value}
                        value={option.value}
                        className={({ active }) =>
                          `cursor-pointer select-none px-4 py-2 flex items-center justify-between ${active ? "bg-orange-100 text-orange-700" : "text-gray-700"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span>{option.label}</span>
                            {selected && (
                              <CheckIcon className="h-4 w-4 text-orange-500" />
                            )}
                          </>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Email</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(event) => {
                  setUserFormErrors((current) => ({ ...current, email: undefined }));
                  setUserFormMessage("");
                  setUserForm((current) => ({ ...current, email: event.target.value }));
                }}
                className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {userFormErrors.email ? (
                <p className="text-sm text-red-600">{userFormErrors.email}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Phone</label>
              <input
                type="tel"
                value={userForm.phone}
                onChange={(event) => {
                  setUserFormErrors((current) => ({ ...current, phone: undefined }));
                  setUserFormMessage("");
                  setUserForm((current) => ({ ...current, phone: event.target.value }));
                }}
                className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {userFormErrors.phone ? (
                <p className="text-sm text-red-600">{userFormErrors.phone}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Password</label>
              <input
                type="password"
                value={userForm.password}
                onChange={(event) => {
                  setUserFormErrors((current) => ({ ...current, password: undefined }));
                  setUserFormMessage("");
                  setUserForm((current) => ({ ...current, password: event.target.value }));
                }}
                className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {userFormErrors.password ? (
                <p className="text-sm text-red-600">{userFormErrors.password}</p>
              ) : null}
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={userForm.isActive}
                onChange={(event) =>
                  setUserForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-orange-500"
              />
              Make this user active immediately
            </label>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-medium text-gray-500">Assigned Branches</label>
                <span className="text-xs text-gray-500">{userForm.branchIds.length} selected</span>
              </div>

              {branches.length ? (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {branches.map((branch) => (
                    <label
                      key={branch.id}
                      className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-[#e5d5c6] bg-white px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={userForm.branchIds.includes(branch.id)}
                          onChange={() => {
                            setUserFormErrors((current) => ({ ...current, branchIds: undefined }));
                            setUserFormMessage("");
                            setUserForm((current) => ({
                              ...current,
                              branchIds: toggleIdSelection(current.branchIds, branch.id),
                            }));
                          }}
                          className="mt-1 h-4 w-4 accent-orange-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                          <p className="text-xs text-gray-500">{branch.city}</p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-medium ${getStatusBadgeClass(
                          branch.status,
                        )}`}
                      >
                        {branch.status}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                  Create a branch before assigning one to a new user.
                </div>
              )}
              {userFormErrors.branchIds ? (
                <p className="text-sm text-red-600">{userFormErrors.branchIds}</p>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={creatingUser || !restaurantId}
            className="cursor-pointer rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingUser ? "Creating..." : "Create User"}
          </button>
        </form>

        {users.length ? (
          <div className="space-y-4">
            {users.map((managedUser) => (
              <article
                key={managedUser.id}
                className="rounded-2xl border border-[#e5d5c6] bg-[#fff9f2] p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {managedUser.name || "Unnamed User"}
                    </h3>
                    <p className="text-xs text-gray-500">{managedUser.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getRoleBadgeClass(
                        managedUser.role,
                      )}`}
                    >
                      {managedUser.role}
                    </span>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={managedUser.isActive}
                        onChange={(event) =>
                          updateUserDraft(managedUser.id, (current) => ({
                            ...current,
                            isActive: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-orange-500"
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Full Name</label>
                    <input
                      type="text"
                      value={managedUser.name}
                      onChange={(event) =>
                        updateUserDraft(managedUser.id, (current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Role</label>

                    <Listbox
                      value={managedUser.role}
                      onChange={(value: RoleOption) =>
                        updateUserDraft(managedUser.id, (current) => ({
                          ...current,
                          role: value,
                        }))
                      }
                    >
                      <div className="relative">
                        {/* Button */}
                        <ListboxButton className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-orange-400 flex items-center justify-between">
                          <span>
                            {
                              ROLE_OPTIONS.find((opt) => opt.value === managedUser.role)?.label ??
                              "Select role"
                            }
                          </span>
                          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                        </ListboxButton>

                        {/* Options */}
                        <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-[#e5d5c6] bg-white shadow-lg focus:outline-none">
                          {ROLE_OPTIONS.map((option) => (
                            <ListboxOption
                              key={option.value}
                              value={option.value}
                              className={({ active }) =>
                                `cursor-pointer select-none px-4 py-2 flex items-center justify-between ${active ? "bg-orange-100 text-orange-700" : "text-gray-700"
                                }`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span>{option.label}</span>
                                  {selected && (
                                    <CheckIcon className="h-4 w-4 text-orange-500" />
                                  )}
                                </>
                              )}
                            </ListboxOption>
                          ))}
                        </ListboxOptions>
                      </div>
                    </Listbox>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Email</label>
                    <input
                      type="email"
                      value={managedUser.email}
                      onChange={(event) =>
                        updateUserDraft(managedUser.id, (current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">Phone</label>
                    <input
                      type="tel"
                      value={managedUser.phone}
                      onChange={(event) =>
                        updateUserDraft(managedUser.id, (current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-xs font-medium text-gray-500">New Password</label>
                    <input
                      type="password"
                      value={managedUser.draftPassword}
                      onChange={(event) =>
                        updateUserDraft(managedUser.id, (current) => ({
                          ...current,
                          draftPassword: event.target.value,
                        }))
                      }
                      placeholder="Leave blank to keep the current password"
                      className="w-full rounded-xl border border-[#e5d5c6] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-medium text-gray-500">Assigned Branches</label>
                      <span className="text-xs text-gray-500">{managedUser.branchIds.length} selected</span>
                    </div>

                    {branches.length ? (
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {branches.map((branch) => (
                          <label
                            key={branch.id}
                            className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-[#e5d5c6] bg-white px-4 py-3"
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={managedUser.branchIds.includes(branch.id)}
                                onChange={() =>
                                  updateUserDraft(managedUser.id, (current) => ({
                                    ...current,
                                    branchIds: toggleIdSelection(current.branchIds, branch.id),
                                  }))
                                }
                                className="mt-1 h-4 w-4 accent-orange-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                                <p className="text-xs text-gray-500">{branch.city}</p>
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-medium ${getStatusBadgeClass(
                                branch.status,
                              )}`}
                            >
                              {branch.status}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                        Create a branch before assigning one here.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {userSaveMessages[managedUser.id] ? (
                    <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {userSaveMessages[managedUser.id]}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    disabled={savingUserId === managedUser.id}
                    onClick={() => void handleSaveUser(managedUser)}
                    className="cursor-pointer rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingUserId === managedUser.id ? "Saving..." : "Save User"}
                  </button>
                  <span className="text-xs text-gray-500">
                    {managedUser.branchIds.length
                      ? `${managedUser.branchIds.length} branches assigned`
                      : "No branches assigned"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-600">
            {loading ? "Loading users..." : "No team members found for this restaurant yet."}
          </div>
        )}
      </section>

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="rounded-lg bg-white px-6 py-3 text-sm shadow">Loading...</div>
        </div>
      )}
    </div>
  );
}
