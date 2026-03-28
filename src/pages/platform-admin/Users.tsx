import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ShieldBan, UserX } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { usePlatformAdminUsers, softDeletePlatformAdminUser, updatePlatformAdminUserStatus } from "../../features/platform-admin/users/api";
import type { AdminUserRecord } from "../../features/platform-admin/auth/types";
import { FilterListBox } from "../../components/FilterListBox";
import { userRoleOptions, userStatusOptions, recordStatusOptions } from "../../utils/filterOptions";

const cardClass = "rounded-[28px] bg-white p-6 shadow-sm";

export default function PlatformAdminUsers() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [isDeleted, setIsDeleted] = useState("");

  const query = useMemo(
    () => ({
      page: 1,
      limit: 20,
      search,
      role,
      status,
      isDeleted,
    }),
    [search, role, status, isDeleted],
  );

  const users = usePlatformAdminUsers(query);

  const statusMutation = useMutation({
    mutationFn: (payload: {
      userId: string;
      action: "BLOCK" | "UNBLOCK";
      reason: string;
    }) => updatePlatformAdminUserStatus(payload.userId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform-admin", "users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (payload: { userId: string; reason: string }) =>
      softDeletePlatformAdminUser(payload.userId, payload.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform-admin", "users"] });
    },
  });

  const handleStatusAction = async (user: AdminUserRecord) => {
    const nextAction = user.blockedAt ? "UNBLOCK" : "BLOCK";
    const reason = window.prompt(
      `${nextAction === "BLOCK" ? "Block" : "Unblock"} ${user.email}\nReason:`,
      "",
    );

    if (!reason?.trim()) return;

    try {
      await statusMutation.mutateAsync({
        userId: user.id,
        action: nextAction,
        reason: reason.trim(),
      });
      pushToast({
        title: nextAction === "BLOCK" ? "User blocked" : "User unblocked",
        variant: "success",
      });
    } catch (error) {
      pushToast({
        title: "User update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  const handleDelete = async (user: AdminUserRecord) => {
    const reason = window.prompt(`Soft delete ${user.email}\nReason:`, "");
    if (!reason?.trim()) return;

    try {
      await deleteMutation.mutateAsync({ userId: user.id, reason: reason.trim() });
      pushToast({
        title: "User deleted",
        variant: "success",
      });
    } catch (error) {
      pushToast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-8">

      {/* Filters Section */}
      <section className={`${cardClass} p-4 sm:p-6`}>
        <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">
          Users
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Platform user management
        </h1>

        <div className="mt-6 space-y-4">
          {/* Search */}
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone..."
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder-gray-400 
          focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 
          hover:border-gray-300 transition"
          />

          {/* Filters */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FilterListBox
              label="Role"
              options={userRoleOptions}
              value={role}
              onChange={setRole}
              placeholder="Filter by role"
            />
            <FilterListBox
              label="Status"
              options={userStatusOptions}
              value={status}
              onChange={setStatus}
              placeholder="Filter by status"
            />
            <FilterListBox
              label="Records"
              options={recordStatusOptions}
              value={isDeleted}
              onChange={setIsDeleted}
              placeholder="Filter records"
            />
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className={`${cardClass} p-4 sm:p-6`}>
        {users.isLoading ? (
          <div className="space-y-3">
            <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
          </div>
        ) : users.isError || !users.data ? (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-600">
                Failed to load users
              </h3>
              <p className="text-sm text-red-500 mt-1">
                {users.error instanceof Error
                  ? users.error.message
                  : "Please try again."}
              </p>
            </div>
          </div>
        ) : users.data.items.length ? (
          <div className="w-full overflow-x-auto">
            <table className="min-w-175 w-full text-sm">

              {/* Head */}
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-3 py-3 sm:px-4 sm:py-3 font-semibold text-gray-500">
                    User
                  </th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3 font-semibold text-gray-500">
                    Role
                  </th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3 font-semibold text-gray-500">
                    Status
                  </th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3 font-semibold text-gray-500">
                    Flags
                  </th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3 font-semibold text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {users.data.items.map((user, i) => (
                  <tr
                    key={user.id}
                    className={`border-t transition hover:bg-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                  >
                    {/* User */}
                    <td className="px-3 py-3 sm:px-4 sm:py-4">
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {user.name}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          {user.phone || "No phone"}
                        </p>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-3 py-3 sm:px-4 sm:py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                        {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 sm:px-4 sm:py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-50 text-green-600">
                        {user.status}
                      </span>
                    </td>

                    {/* Flags */}
                    <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs text-gray-500">
                      {user.deletedAt
                        ? "Deleted"
                        : user.blockedAt
                          ? "Blocked"
                          : "Operational"}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 sm:px-4 sm:py-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        {!user.deletedAt ? (
                          <>
                            <button
                              onClick={() => void handleStatusAction(user)}
                              className="w-full sm:w-auto px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                              disabled={
                                statusMutation.isPending ||
                                deleteMutation.isPending
                              }
                            >
                              <ShieldBan className="h-3.5 w-3.5 inline mr-1" />
                              {user.blockedAt ? "Unblock" : "Block"}
                            </button>

                            <button
                              onClick={() => void handleDelete(user)}
                              className="w-full sm:w-auto px-3 py-2 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                              disabled={
                                statusMutation.isPending ||
                                deleteMutation.isPending
                              }
                            >
                              <UserX className="h-3.5 w-3.5 inline mr-1" />
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Soft-deleted
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-6 text-center">
            <p className="text-gray-400">
              No users matched the current filters.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
