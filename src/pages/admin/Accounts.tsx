
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { ChevronDownIcon, Edit, Trash2, UserPlus, Plus } from "lucide-react";
import { api } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { useDebounce } from "../../hooks/useDebounce";
import { isValidEmail, isValidGst, isValidPhone, isStrongPassword } from "../../utils/validators";

type StatusOption = "ACTIVE" | "INACTIVE" | "OPEN" | "CLOSED" | "DISABLED";
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

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  status: "OPEN" | "CLOSED" | "DISABLED";
  owner?: string;
  staffCount: number;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: RoleOption;
  branch?: string;
  status: StatusOption;
  isVerified: boolean;
}

type ModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

function Modal({ title, open, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sm text-gray-500">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

export default function Accounts() {
  const { user } = useAuth();
  const { pushToast } = useToast();

  const [restaurantId, setRestaurantId] = useState(user?.restroId ?? "");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleOption | "">("");
  const [branchFilter, setBranchFilter] = useState<string | "">("");
  const [statusFilter, setStatusFilter] = useState<StatusOption | "">("");
  const [sortBy, setSortBy] = useState<"name" | "status" | "role">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [userPage, setUserPage] = useState(1);
  const [branchPage, setBranchPage] = useState(1);

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "STAFF" as RoleOption,
    branch: "",
    status: "ACTIVE" as StatusOption,
    isVerified: false,
    password: "",
  });

  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: "",
    address: "",
    city: "",
    status: "OPEN" as Branch["status"],
  });

  const debouncedSearch = useDebounce(search, 250);
  const fetchData = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const [resRes, resBranches, resUsers] = await Promise.all([
        api.get<Restaurant>(`/api/v1/restaurants/${restaurantId}`),
        api.get<Branch[]>(`/api/v1/branches?restaurantId=${restaurantId}`),
        api.get<User[]>(`/api/v1/users?restaurantId=${restaurantId}`),
      ]);
      setRestaurant(resRes);
      setBranches(resBranches ?? []);
      setUsers(resUsers ?? []);
    } catch (err: any) {
      pushToast({
        title: "Failed to fetch data",
        description: err?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [restaurantId, pushToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    const list = users.filter((u) => {
      const searchMatch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q);
      const roleMatch = !roleFilter || u.role === roleFilter;
      const branchMatch = !branchFilter || u.branch === branchFilter;
      const statusMatch = !statusFilter || u.status === statusFilter;
      return searchMatch && roleMatch && branchMatch && statusMatch;
    });

    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") return a.fullName.localeCompare(b.fullName) * dir;
      if (sortBy === "role") return a.role.localeCompare(b.role) * dir;
      return a.status.localeCompare(b.status) * dir;
    });
    return list;
  }, [users, debouncedSearch, roleFilter, branchFilter, statusFilter, sortBy, sortDir]);

  const filteredBranches = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    const list = branches.filter((b) => {
      const searchMatch = !q || b.name.toLowerCase().includes(q);
      const statusMatch = !statusFilter || b.status === statusFilter;
      return searchMatch && statusMatch;
    });
    return list;
  }, [branches, debouncedSearch, statusFilter]);

  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const branchTotalPages = Math.max(1, Math.ceil(filteredBranches.length / PAGE_SIZE));

  const pagedUsers = filteredUsers.slice(
    (userPage - 1) * PAGE_SIZE,
    userPage * PAGE_SIZE,
  );
  const pagedBranches = filteredBranches.slice(
    (branchPage - 1) * PAGE_SIZE,
    branchPage * PAGE_SIZE,
  );

  const toggleUserSelection = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBranchSelection = (id: string) => {
    setSelectedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllUsers = () => {
    if (selectedUsers.size === pagedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(pagedUsers.map((u) => u.id)));
    }
  };

  const toggleSelectAllBranches = () => {
    if (selectedBranches.size === pagedBranches.length) {
      setSelectedBranches(new Set());
    } else {
      setSelectedBranches(new Set(pagedBranches.map((b) => b.id)));
    }
  };

  const handleRestaurantSave = async () => {
    if (!restaurant) return;
    if (!restaurant.name.trim() || !restaurant.legalName.trim()) {
      pushToast({ title: "Name and legal name are required", variant: "error" });
      return;
    }
    if (!isValidGst(restaurant.gstNumber)) {
      pushToast({ title: "Invalid GST number", variant: "error" });
      return;
    }
    if (!isValidEmail(restaurant.supportEmail)) {
      pushToast({ title: "Invalid support email", variant: "error" });
      return;
    }
    if (!isValidPhone(restaurant.supportPhone)) {
      pushToast({ title: "Invalid support phone", variant: "error" });
      return;
    }

    try {
      await api.put(`/api/v1/restaurants/${restaurant.id}`, restaurant);
      pushToast({ title: "Restaurant updated", variant: "success" });
    } catch (err: any) {
      pushToast({
        title: "Update failed",
        description: err?.message || "Please try again.",
        variant: "error",
      });
    }
  };
  const openUserModal = (target?: User) => {
    setEditingUser(target ?? null);
    setUserForm({
      fullName: target?.fullName ?? "",
      email: target?.email ?? "",
      phone: target?.phone ?? "",
      role: target?.role ?? "STAFF",
      branch: target?.branch ?? "",
      status: target?.status ?? "ACTIVE",
      isVerified: target?.isVerified ?? false,
      password: "",
    });
    setUserModalOpen(true);
  };

  const openBranchModal = (target?: Branch) => {
    setEditingBranch(target ?? null);
    setBranchForm({
      name: target?.name ?? "",
      address: target?.address ?? "",
      city: target?.city ?? "",
      status: target?.status ?? "OPEN",
    });
    setBranchModalOpen(true);
  };

  const saveUser = async () => {
    if (!userForm.fullName.trim()) {
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
    if (!editingUser && !isStrongPassword(userForm.password, 8)) {
      pushToast({ title: "Password must be at least 8 characters", variant: "error" });
      return;
    }

    try {
      if (editingUser) {
        await api.put(`/api/v1/users/${editingUser.id}`, {
          ...userForm,
          restaurantId,
        });
        pushToast({ title: "User updated", variant: "success" });
      } else {
        await api.post("/api/v1/users", {
          ...userForm,
          restaurantId,
        });
        pushToast({ title: "User created", variant: "success" });
      }
      setUserModalOpen(false);
      fetchData();
    } catch (err: any) {
      pushToast({
        title: "Save failed",
        description: err?.message || "Please try again.",
        variant: "error",
      });
    }
  };

  const saveBranch = async () => {
    if (!branchForm.name.trim() || !branchForm.address.trim() || !branchForm.city.trim()) {
      pushToast({ title: "Branch name, address and city are required", variant: "error" });
      return;
    }

    try {
      if (editingBranch) {
        await api.put(`/api/v1/branches/${editingBranch.id}`, {
          ...branchForm,
          restaurantId,
        });
        pushToast({ title: "Branch updated", variant: "success" });
      } else {
        await api.post("/api/v1/branches", { ...branchForm, restaurantId });
        pushToast({ title: "Branch created", variant: "success" });
      }
      setBranchModalOpen(false);
      fetchData();
    } catch (err: any) {
      pushToast({
        title: "Save failed",
        description: err?.message || "Please try again.",
        variant: "error",
      });
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/api/v1/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      pushToast({ title: "User deleted", variant: "success" });
    } catch (err: any) {
      pushToast({
        title: "Delete failed",
        description: err?.message || "Please try again.",
        variant: "error",
      });
    }
  };

  const deleteBranch = async (id: string) => {
    if (!confirm("Delete this branch?")) return;
    try {
      await api.delete(`/api/v1/branches/${id}`);
      setBranches((prev) => prev.filter((b) => b.id !== id));
      pushToast({ title: "Branch deleted", variant: "success" });
    } catch (err: any) {
      pushToast({
        title: "Delete failed",
        description: err?.message || "Please try again.",
        variant: "error",
      });
    }
  };

  const bulkUpdate = async (type: "users" | "branches", action: "activate" | "deactivate") => {
    const ids = type === "users" ? Array.from(selectedUsers) : Array.from(selectedBranches);
    if (ids.length === 0) return;

    const payload = { status: action === "activate" ? "ACTIVE" : "INACTIVE" };
    try {
      await Promise.all(
        ids.map((id) =>
          api.patch(type === "users" ? `/api/v1/users/${id}` : `/api/v1/branches/${id}`, payload),
        ),
      );
      pushToast({ title: "Bulk update completed", variant: "success" });
      fetchData();
    } catch (err: any) {
      pushToast({
        title: "Bulk update failed",
        description: err?.message || "Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 space-y-10 text-left">
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
        Restaurant Management
      </h1>

      {/* RESTAURANT FORM */}
      <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Restaurant ID"
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="w-full sm:flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
          />
          <button
            onClick={fetchData}
            className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition shadow-sm"
          >
            Load
          </button>
        </div>

        {restaurant && (
          <>
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Main Restaurant Info
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                ["Name", "name"],
                ["Legal Name", "legalName"],
                ["GST Number", "gstNumber"],
                ["Support Email", "supportEmail"],
              ].map(([label, key]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={(restaurant as any)[key]}
                    onChange={(e) =>
                      setRestaurant({
                        ...restaurant,
                        [key]: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                  />
                </div>
              ))}

              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  Support Phone
                </label>
                <input
                  type="tel"
                  value={restaurant.supportPhone}
                  onChange={(e) =>
                    setRestaurant({
                      ...restaurant,
                      supportPhone: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restaurant.isActive}
                  onChange={(e) =>
                    setRestaurant({
                      ...restaurant,
                      isActive: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-orange-500"
                />
                Active
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restaurant.isVerified}
                  onChange={(e) =>
                    setRestaurant({
                      ...restaurant,
                      isVerified: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-orange-500"
                />
                Verified
              </label>
            </div>

            <button
              onClick={handleRestaurantSave}
              className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition shadow-sm"
            >
              Save Restaurant
            </button>
          </>
        )}
      </div>

      {/* BRANCHES */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Branches</h2>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openBranchModal()}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white flex items-center gap-2 text-sm hover:bg-orange-600"
            >
              <Plus size={16} /> Add Branch
            </button>

            <button
              onClick={() => bulkUpdate("branches", "activate")}
              className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              Activate
            </button>

            <button
              onClick={() => bulkUpdate("branches", "deactivate")}
              className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              Deactivate
            </button>
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedBranches.size === pagedBranches.length &&
                      pagedBranches.length > 0
                    }
                    onChange={toggleSelectAllBranches}
                  />
                </th>
                {["Name", "Address", "City", "Status", "Owner", "Staff", "Actions"].map(
                  (h) => (
                    <th key={h} className="p-3 text-left font-medium">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y">
              {pagedBranches.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedBranches.has(b.id)}
                      onChange={() => toggleBranchSelection(b.id)}
                    />
                  </td>

                  <td className="p-3 font-medium">{b.name}</td>
                  <td className="p-3">{b.address}</td>
                  <td className="p-3">{b.city}</td>
                  <td className="p-3">{b.status}</td>
                  <td className="p-3">{b.owner || "Unassigned"}</td>
                  <td className="p-3">{b.staffCount}</td>

                  <td className="p-3 flex gap-3">
                    <button onClick={() => openBranchModal(b)}>
                      <Edit size={18} />
                    </button>

                    <button onClick={() => deleteBranch(b.id)}>
                      <Trash2 size={18} className="text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden space-y-4">
          {pagedBranches.map((b) => (
            <div
              key={b.id}
              className="border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm bg-white"
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">{b.name}</h3>
                <input
                  type="checkbox"
                  checked={selectedBranches.has(b.id)}
                  onChange={() => toggleBranchSelection(b.id)}
                />
              </div>

              <p className="text-sm text-gray-600">{b.address}</p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>
                  <span className="font-medium">City:</span> {b.city}
                </p>
                <p>
                  <span className="font-medium">Status:</span> {b.status}
                </p>
                <p>
                  <span className="font-medium">Owner:</span>{" "}
                  {b.owner || "Unassigned"}
                </p>
                <p>
                  <span className="font-medium">Staff:</span> {b.staffCount}
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button onClick={() => openBranchModal(b)}>
                  <Edit size={18} />
                </button>

                <button onClick={() => deleteBranch(b.id)}>
                  <Trash2 size={18} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
          <p className="text-sm text-gray-500">
            Page {branchPage} of {branchTotalPages}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setBranchPage((prev) => Math.max(1, prev - 1))}
              disabled={branchPage === 1}
              className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Prev
            </button>

            <button
              onClick={() =>
                setBranchPage((prev) => Math.min(branchTotalPages, prev + 1))
              }
              disabled={branchPage === branchTotalPages}
              className="px-4 py-1.5 rounded border text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Users</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "",
                  "Name",
                  "Email",
                  "Phone",
                  "Role",
                  "Branch",
                  "Status",
                  "Verified",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="p-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y">
              {pagedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(u.id)}
                      onChange={() => toggleUserSelection(u.id)}
                    />
                  </td>
                  <td className="p-3 font-medium">{u.fullName}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.phone}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{u.branch || "Unassigned"}</td>
                  <td className="p-3">{u.status}</td>
                  <td className="p-3">
                    {u.isVerified ? "Verified" : "Unverified"}
                  </td>

                  <td className="p-3 flex gap-3">
                    <button onClick={() => openUserModal(u)}>
                      <Edit size={18} />
                    </button>

                    <button onClick={() => deleteUser(u.id)}>
                      <Trash2 size={18} className="text-red-500" />
                    </button>

                    <button onClick={() => openUserModal(u)}>
                      <UserPlus size={18} className="text-green-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white px-6 py-3 rounded-lg shadow text-sm">
            Loading...
          </div>
        </div>
      )}
    </div>
  );
}
