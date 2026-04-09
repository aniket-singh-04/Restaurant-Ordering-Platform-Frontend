import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import QRCode from "react-qr-code";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  createTable,
  deleteTable,
  getTablesByBranch,
  updateTable,
} from "../../features/tables/api";
import type { AuthUser } from "../../features/auth/types";
import type {
  CreateTablePayload,
  Table,
  TableOccupancyStatus,
  UpdateTablePayload,
} from "../../types/table";
import { TableStatus } from "../../types/table";
import {
  getApiErrorMessage,
  getApiRequestId,
} from "../../utils/apiErrorHelpers";
import { SkeletonBlock } from "../../components/LoadingState";
import { api } from "../../utils/api";
import { isTrustedAppUrl } from "../../security";

type BranchOption = {
  id: string;
  name: string;
  city?: string;
  status?: string;
};

type BranchApiRecord = BranchOption;

type BranchApiResponse = {
  success: boolean;
  data: BranchApiRecord[];
};

type CreateFormState = CreateTablePayload & {
  branchId: string;
};

const TABLE_STATUS_OPTIONS = Object.values(TableStatus);

const occupancyToneClass: Record<string, string> = {
  FREE: "bg-emerald-100 text-emerald-700",
  OCCUPIED: "bg-amber-100 text-amber-800",
  COOLDOWN: "bg-sky-100 text-sky-700",
};

const formatOccupancyLabel = (status?: TableOccupancyStatus) => {
  if (status === "OCCUPIED") return "Occupied";
  if (status === "COOLDOWN") return "Cooldown";
  return "Free";
};

const formatCooldownRemaining = (cooldownEndsAt?: string, now = Date.now()) => {
  if (!cooldownEndsAt) {
    return null;
  }

  const remainingMs = new Date(cooldownEndsAt).getTime() - now;
  if (remainingMs <= 0) {
    return "Releasing soon";
  }

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

const formatApiError = (error: unknown, fallback: string) => {
  const message = getApiErrorMessage(error, fallback);
  const requestId = getApiRequestId(error);

  return requestId ? `${message} Request ID: ${requestId}` : message;
};

const createInitialFormState = (branchId = ""): CreateFormState => ({
  branchId,
  tableNumber: "",
  capacity: 2,
  status: TableStatus.ACTIVE,
});

const getFallbackBranches = (user: AuthUser | null): BranchOption[] =>
  (user?.branchIds ?? []).map((branch) => ({
    id: branch._id,
    name: branch.name,
  }));

const isRestaurantScopedRole = (user: AuthUser | null) =>
  Boolean(user && (user.role === "ADMIN" || user.role === "RESTRO_OWNER"));

export default function TableManagement() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [tablesByBranch, setTablesByBranch] = useState<Record<string, Table[]>>({});
  const [branchErrors, setBranchErrors] = useState<Record<string, string>>({});
  const [createForm, setCreateForm] = useState<CreateFormState>(createInitialFormState());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingTableId, setSavingTableId] = useState<string | null>(null);
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const totalTables = useMemo(
    () => Object.values(tablesByBranch).reduce((sum, tables) => sum + tables.length, 0),
    [tablesByBranch],
  );
  const occupiedTables = useMemo(
    () =>
      Object.values(tablesByBranch)
        .flat()
        .filter((table) => table.occupancyStatus === "OCCUPIED").length,
    [tablesByBranch],
  );
  const cooldownTables = useMemo(
    () =>
      Object.values(tablesByBranch)
        .flat()
        .filter((table) => table.occupancyStatus === "COOLDOWN").length,
    [tablesByBranch],
  );
  const showInitialLoading = loading && branches.length === 0;

  const updateTableDraft = useCallback(
    (branchId: string, tableId: string, updater: (table: Table) => Table) => {
      setTablesByBranch((current) => ({
        ...current,
        [branchId]: (current[branchId] ?? []).map((table) =>
          table.id === tableId ? updater(table) : table,
        ),
      }));
    },
    [],
  );

  const fetchAccessibleBranches = useCallback(async () => {
    if (!user) {
      return [] as BranchOption[];
    }

    if (isRestaurantScopedRole(user) && user.restroId) {
      const response = await api.get<BranchApiResponse>(
        `/api/v1/branches/restaurant/${user.restroId}`,
      );

      return response.data.map((branch) => ({
        id: branch.id,
        name: branch.name,
        city: branch.city,
        status: branch.status,
      }));
    }

    return getFallbackBranches(user);
  }, [user]);

  const loadTables = useCallback(async () => {
    if (!user) {
      setBranches([]);
      setTablesByBranch({});
      setBranchErrors({});
      return;
    }

    setLoading(true);

    try {
      const nextBranches = await fetchAccessibleBranches();
      const nextBranchId = nextBranches[0]?.id ?? "";
      setBranches(nextBranches);
      setCreateForm((current) => {
        const branchId = nextBranches.some((branch) => branch.id === current.branchId)
          ? current.branchId
          : nextBranchId;

        return {
          ...current,
          branchId,
        };
      });

      if (!nextBranches.length) {
        setTablesByBranch({});
        setBranchErrors({});
        return;
      }

      const branchResults = await Promise.allSettled(
        nextBranches.map(async (branch) => ({
          branchId: branch.id,
          tables: await getTablesByBranch(branch.id),
        })),
      );

      const nextTablesByBranch: Record<string, Table[]> = {};
      const nextBranchErrors: Record<string, string> = {};

      branchResults.forEach((result, index) => {
        const branchId = nextBranches[index]?.id;

        if (!branchId) {
          return;
        }

        if (result.status === "fulfilled") {
          nextTablesByBranch[branchId] = result.value.tables;
          return;
        }

        nextTablesByBranch[branchId] = [];
        nextBranchErrors[branchId] = formatApiError(
          result.reason,
          "Unable to load this branch's tables.",
        );
      });

      setTablesByBranch(nextTablesByBranch);
      setBranchErrors(nextBranchErrors);
    } catch (error) {
      pushToast({
        title: "Could not load QR tables",
        description: formatApiError(error, "Unable to load table data."),
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchAccessibleBranches, pushToast, user]);

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCreateTable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createForm.branchId) {
      pushToast({
        title: "Select a branch first",
        description: "A table QR code must belong to a branch.",
        variant: "error",
      });
      return;
    }

    if (!createForm.tableNumber.trim()) {
      pushToast({
        title: "Table number is required",
        description: "Give the new table a visible table number before saving.",
        variant: "error",
      });
      return;
    }

    if (!createForm.capacity || createForm.capacity < 1) {
      pushToast({
        title: "Capacity must be at least 1",
        variant: "error",
      });
      return;
    }

    setCreating(true);

    try {
      await createTable(createForm.branchId, {
        tableNumber: createForm.tableNumber.trim(),
        capacity: createForm.capacity,
        status: createForm.status,
      });

      pushToast({
        title: "Table QR created",
        description: "The new table is now ready to be scanned.",
        variant: "success",
      });
      setCreateForm(createInitialFormState(createForm.branchId));
      await loadTables();
    } catch (error) {
      pushToast({
        title: "Could not create table",
        description: formatApiError(error, "Unable to create this table."),
        variant: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSaveTable = async (table: Table) => {
    const payload: UpdateTablePayload = {
      tableNumber: table.tableNumber.trim(),
      capacity: table.capacity,
      status: table.status,
    };

    if (!payload.tableNumber) {
      pushToast({
        title: "Table number is required",
        description: "Each QR code must stay linked to a table number.",
        variant: "error",
      });
      return;
    }

    if (!payload.capacity || payload.capacity < 1) {
      pushToast({
        title: "Capacity must be at least 1",
        variant: "error",
      });
      return;
    }

    setSavingTableId(table.id);

    try {
      await updateTable(table.id, payload);
      pushToast({
        title: "Table updated",
        description: `Table ${table.tableNumber} was updated successfully.`,
        variant: "success",
      });
      await loadTables();
    } catch (error) {
      pushToast({
        title: "Could not update table",
        description: formatApiError(error, "Unable to save this table."),
        variant: "error",
      });
    } finally {
      setSavingTableId(null);
    }
  };

  const handleDeleteTable = async (table: Table) => {
    const confirmed = window.confirm(
      `Delete table ${table.tableNumber}? The QR code link will stop working immediately.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingTableId(table.id);

    try {
      await deleteTable(table.id);
      pushToast({
        title: "Table deleted",
        description: `Table ${table.tableNumber} and its QR code were removed.`,
        variant: "success",
      });
      await loadTables();
    } catch (error) {
      pushToast({
        title: "Could not delete table",
        description: formatApiError(error, "Unable to delete this table."),
        variant: "error",
      });
    } finally {
      setDeletingTableId(null);
    }
  };

  const handleCopyQrLink = async (table: Table) => {
    try {
      await navigator.clipboard.writeText(table.qrUrl);
      pushToast({
        title: "QR link copied",
        description: `Table ${table.tableNumber} link is ready to share.`,
        variant: "success",
      });
    } catch {
      pushToast({
        title: "Could not copy QR link",
        description: table.qrUrl,
        variant: "warning",
      });
    }
  };

  const handleOpenQrLink = (table: Table) => {
    if (!isTrustedAppUrl(table.qrUrl)) {
      pushToast({
        title: "Blocked an unsafe QR link",
        description: "Only same-origin QR URLs can be opened from the admin dashboard.",
        variant: "error",
      });
      return;
    }

    window.open(
      new URL(table.qrUrl, window.location.origin).toString(),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="space-y-6">
      <section className="ui-card bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-600">
              Table QR Management
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Branch Table Operations & QR Control
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#6b665f]">
              Every generated QR routes guests to the correct branch menu and keeps the dine-in
              session tied to the right table.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl p-4 text-center text-sm md:grid-cols-4">
            <div>
              <p className="text-2xl font-semibold">{branches.length}</p>
              <p>Accessible Branches</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalTables}</p>
              <p>Total QR Tables</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{occupiedTables}</p>
              <p>Occupied Now</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{cooldownTables}</p>
              <p>In Cooldown</p>
            </div>
          </div>
        </div>
      </section>

      <section className="ui-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-semibold">Create a New Table QR</h2>
        </div>

        <form
          onSubmit={(event) => {
            void handleCreateTable(event);
          }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <label className="flex flex-col gap-2 text-sm">
            Branch

            <Listbox
              value={createForm.branchId}
              onChange={(value: string) =>
                setCreateForm((current) => ({
                  ...current,
                  branchId: value,
                }))
              }
            >
              <div className="relative">
                {/* Button */}
                <ListboxButton className="cursor-pointer w-full rounded-2xl border border-[#e4d2bf] bg-white px-4 py-3 text-left outline-none focus:ring-2 focus:ring-orange-400 flex items-center justify-between">
                  <span>
                    {createForm.branchId
                      ? branches.find((b) => b.id === createForm.branchId)?.name +
                      (branches.find((b) => b.id === createForm.branchId)?.city
                        ? ` - ${branches.find((b) => b.id === createForm.branchId)?.city}`
                        : "")
                      : "Select branch"}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                </ListboxButton>

                {/* Options */}
                <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-[#e4d2bf] bg-white shadow-lg focus:outline-none">

                  {/* Default option */}
                  <ListboxOption
                    value=""
                    className={({ active }) =>
                      `cursor-pointer select-none px-4 py-2 ${active ? "bg-orange-100 text-orange-700" : "text-gray-700"
                      }`
                    }
                  >
                    {({ selected }) => (
                      <div className="flex justify-between">
                        <span>Select branch</span>
                        {selected && <CheckIcon className="h-4 w-4 text-orange-500" />}
                      </div>
                    )}
                  </ListboxOption>

                  {/* Branch options */}
                  {branches.map((branch) => (
                    <ListboxOption
                      key={branch.id}
                      value={branch.id}
                      className={({ active }) =>
                        `cursor-pointer select-none px-4 py-2 flex items-center justify-between ${active ? "bg-orange-100 text-orange-700" : "text-gray-700"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span>
                            {branch.name}
                            {branch.city ? ` - ${branch.city}` : ""}
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
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Table Number
            <input
              type="text"
              value={createForm.tableNumber}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  tableNumber: event.target.value,
                }))
              }
              placeholder="Table 12"
              className="w-full rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Capacity
            <input
              type="number"
              min={1}
              value={createForm.capacity ?? 2}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  capacity: Math.max(1, Number(event.target.value) || 1),
                }))
              }
              className="w-full rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Status

            <Listbox
              value={createForm.status ?? TableStatus.ACTIVE}
              onChange={(value: Table["status"]) =>
                setCreateForm((current) => ({
                  ...current,
                  status: value,
                }))
              }
            >
              <div className="relative">
                {/* Button */}
                <ListboxButton className="cursor-pointer w-full rounded-2xl border border-[#e4d2bf] bg-white px-4 py-3 text-left outline-none focus:ring-2 focus:ring-orange-400 flex items-center justify-between">
                  <span>{createForm.status ?? TableStatus.ACTIVE}</span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                </ListboxButton>

                {/* Options */}
                <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-[#e4d2bf] bg-white shadow-lg focus:outline-none">
                  {TABLE_STATUS_OPTIONS.map((status) => (
                    <ListboxOption
                      key={status}
                      value={status}
                      className={({ focus }) =>
                        `cursor-pointer select-none px-4 py-2 flex items-center justify-between ${focus ? "bg-orange-100 text-orange-700" : "text-gray-700"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span>{status}</span>
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
          </label>

          <div className="md:col-span-2 xl:col-span-4 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={creating || !branches.length}
              className="cursor-pointer rounded-2xl bg-orange-500 px-5 py-3 font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create Table QR"}
            </button>
            <button
              type="button"
              onClick={() => {
                void loadTables();
              }}
              disabled={loading}
              className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-[#d8c0a7] px-5 py-3 font-medium transition text-[#3b2f2f] hover:bg-[#fff9f2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh All Branches
            </button>
          </div>
        </form>
      </section>

      {showInitialLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <section key={index} className="ui-card bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 border-b border-[#f0e3d5] pb-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <SkeletonBlock className="h-7 w-44" />
                  <SkeletonBlock className="h-4 w-32" />
                </div>
                <SkeletonBlock className="h-7 w-24 rounded-full" />
              </div>

              <div className="mt-6 space-y-5">
                {Array.from({ length: 2 }).map((__, cardIndex) => (
                  <article
                    key={cardIndex}
                    className="grid gap-5 rounded-3xl border border-[#f0e3d5] bg-[#fffaf5] p-4 lg:grid-cols-[minmax(0,1fr)_220px]"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <SkeletonBlock className="h-4 w-20" />
                          <SkeletonBlock className="h-6 w-28" />
                        </div>
                        <SkeletonBlock className="h-7 w-20 rounded-full" />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <SkeletonBlock className="h-4 w-24" />
                          <SkeletonBlock className="h-11 w-full rounded-2xl" />
                        </div>
                        <div className="space-y-2">
                          <SkeletonBlock className="h-4 w-24" />
                          <SkeletonBlock className="h-11 w-full rounded-2xl" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <SkeletonBlock className="h-4 w-20" />
                          <SkeletonBlock className="h-11 w-full rounded-2xl" />
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <SkeletonBlock className="h-4 w-full" />
                        <SkeletonBlock className="mt-2 h-3.5 w-32" />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <SkeletonBlock className="h-10 w-32 rounded-2xl" />
                        <SkeletonBlock className="h-10 w-28 rounded-2xl" />
                        <SkeletonBlock className="h-10 w-36 rounded-2xl" />
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#eedbc8] bg-linear-to-b from-white to-[#fff7f0] p-4 shadow-sm">
                      <SkeletonBlock className="h-4 w-24" />
                      <SkeletonBlock className="mt-4 h-40 w-40 rounded-2xl" />
                      <SkeletonBlock className="mt-4 h-5 w-28" />
                      <SkeletonBlock className="mt-2 h-3.5 w-36" />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : !branches.length ? (
        <section className="ui-card bg-white px-6 py-8 text-center">
          No accessible branches were found for your account yet.
        </section>
      ) : null}

      {!showInitialLoading && branches.map((branch) => {
        const tables = tablesByBranch[branch.id] ?? [];
        const branchError = branchErrors[branch.id];
        const branchTableLimit = tables[0]?.branchMaxTableCount ?? tables.length;
        const branchOccupiedCount = tables.filter(
          (table) => table.occupancyStatus === "OCCUPIED",
        ).length;
        const branchCooldownCount = tables.filter(
          (table) => table.occupancyStatus === "COOLDOWN",
        ).length;

        return (
          <section
            key={branch.id}
            className="ui-card bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-3 border-b border-[#f0e3d5] pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{branch.name}</h2>
                <p className="mt-1 text-sm text-[#6b665f]">
                  {branch.city ? `${branch.city} - ` : ""}
                  {tables.length} / {branchTableLimit || tables.length} tables configured
                </p>
                <p className="mt-1 text-xs text-[#6b665f]">
                  {branchOccupiedCount} occupied, {branchCooldownCount} cooling down
                </p>
              </div>
              <span className="rounded-full w-fit bg-[#fff4e6] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-orange-600">
                {branch.status ?? "ACTIVE"}
              </span>
            </div>

            {branchError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {branchError}
              </div>
            ) : null}

            {!branchError && !tables.length ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[#d9c1a8] bg-[#fffaf5] px-4 py-6 text-sm">
                No table QR codes have been generated for this branch yet.
              </div>
            ) : null}

            {tables.length ? (
              <div className="mt-6 flex gap-5 xl:flex-col">
                {tables.map((table) => (
                  <article
                    key={table.id}
                    className="w-full grid gap-5 rounded-3xl border border-[#f0e3d5] bg-[#fffaf5] p-4 lg:grid-cols-[minmax(0,1fr)_220px]"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-orange-600">
                            Table QR
                          </p>
                          <h3 className="mt-1 text-xl font-semibold">
                            Table {table.tableNumber}
                          </h3>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm
                            ${table.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : table.status === "BLOCKED"
                                ? "bg-red-100 text-red-700"
                                : table.status === "ARCHIVED"
                                  ? "bg-gray-200 text-gray-600"
                                  : "bg-gray-100 text-gray-600"
                            }
  `}
                        >
                          {table.status.charAt(0) + table.status.slice(1).toLowerCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            occupancyToneClass[table.occupancyStatus ?? "FREE"] ??
                            occupancyToneClass.FREE
                          }`}
                        >
                          {formatOccupancyLabel(table.occupancyStatus)}
                        </span>
                        {table.cooldownEndsAt ? (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium">
                            {formatCooldownRemaining(table.cooldownEndsAt, now)}
                          </span>
                        ) : null}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm">
                          Table Number
                          <input
                            type="text"
                            value={table.tableNumber}
                            onChange={(event) =>
                              updateTableDraft(branch.id, table.id, (current) => ({
                                ...current,
                                tableNumber: event.target.value,
                              }))
                            }
                            className="rounded-2xl border border-[#e4d2bf] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400"
                          />
                        </label>

                        <label className="flex flex-col gap-2 text-sm">
                          Capacity
                          <input
                            type="number"
                            min={1}
                            value={table.capacity}
                            onChange={(event) =>
                              updateTableDraft(branch.id, table.id, (current) => ({
                                ...current,
                                capacity: Math.max(1, Number(event.target.value) || 1),
                              }))
                            }
                            className="rounded-2xl border border-[#e4d2bf] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400"
                          />
                        </label>

                        <label className="flex flex-col gap-2 text-sm sm:col-span-2">
                          Status

                          <Listbox
                            value={table.status}
                            onChange={(value: Table["status"]) =>
                              updateTableDraft(branch.id, table.id, (current) => ({
                                ...current,
                                status: value,
                              }))
                            }
                          >
                            <div className="relative">
                              {/* Button */}
                              <ListboxButton className="cursor-pointer w-full rounded-2xl border border-[#e4d2bf] bg-white px-4 py-3 text-left outline-none focus:ring-2 focus:ring-orange-400 flex items-center justify-between">
                                <span>{table.status}</span>
                                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                              </ListboxButton>

                              {/* Options */}
                              <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-[#e4d2bf] bg-white shadow-lg focus:outline-none">
                                {TABLE_STATUS_OPTIONS.map((status) => (
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
                        </label>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                        <p className="break-all font-medium">{table.qrUrl}</p>
                        <p className="mt-1 text-xs text-[#6b665f]">
                          Public QR ID: <span className="font-medium">{table.publicQrId}</span>
                        </p>
                        <p className="mt-1 text-xs text-[#6b665f]">
                          Occupancy version: <span className="font-medium">{table.occupancyVersion ?? 0}</span>
                        </p>
                        {table.activeOrderId ? (
                          <p className="mt-1 text-xs text-[#6b665f]">
                            Active order: <span className="font-medium">#{table.activeOrderId.slice(-6).toUpperCase()}</span>
                          </p>
                        ) : null}
                        {table.occupiedAt ? (
                          <p className="mt-1 text-xs text-[#6b665f]">
                            Occupied at: {new Date(table.occupiedAt).toLocaleString()}
                          </p>
                        ) : null}
                        {table.cooldownEndsAt ? (
                          <p className="mt-1 text-xs text-[#6b665f]">
                            Cooldown ends: {new Date(table.cooldownEndsAt).toLocaleString()}
                          </p>
                        ) : null}
                        {table.updatedAt ? (
                          <p className="mt-1 text-xs text-[#6b665f]">Updated: {new Date(table.updatedAt).toLocaleString()}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={savingTableId === table.id}
                          onClick={() => {
                            void handleSaveTable(table);
                          }}
                          className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-[#2f241d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#46362b] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Pencil className="h-4 w-4" />
                          {savingTableId === table.id ? "Saving..." : "Save Changes"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            void handleCopyQrLink(table);
                          }}
                          className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-[#d8c0a7] px-4 py-2.5 text-sm font-medium transition text-[#3b2f2f] hover:bg-[#fff9f2]"
                        >
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleOpenQrLink(table);
                          }}
                          className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-[#d8c0a7] px-4 py-2.5 text-sm font-medium transition text-[#3b2f2f] hover:bg-[#fff9f2]"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open Scan View
                        </button>

                        <button
                          type="button"
                          disabled={deletingTableId === table.id}
                          onClick={() => {
                            void handleDeleteTable(table);
                          }}
                          className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingTableId === table.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#eedbc8]  p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-widest text-orange-600">
                        Scan Preview
                      </p>

                      <div className="mt-4 w-full flex justify-center">
                        <div className="rounded-2xl bg-white shadow-inner">
                          <QRCode
                            value={table.qrUrl}
                            size={160}
                            bgColor="#ffffff"
                            fgColor="#1f1914"
                            className="w-full rounded-sm h-auto max-w-40 sm:max-w-45 md:max-w-50 border-2 border-white"
                          />
                        </div>
                      </div>

                      <p className="mt-4 text-sm font-semibold">
                        Table {table.tableNumber}
                      </p>

                      <p className="mt-1 text-center text-xs  max-w-55">
                        Guests can scan this QR to view the menu instantly.
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
