import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Eye, RefreshCw, ChevronDownIcon, CheckIcon, } from "lucide-react";
import type { Menu } from "../../types/index";
import { api } from "../../utils/api";
import { getApiErrorMessage } from "../../utils/apiErrorHelpers";
import { formatPrice } from "../../utils/formatPrice";
import { useDebounce } from "../../hooks/useDebounce";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { LoadingCardGrid } from "../../components/LoadingState";
import MenuImageToggle from "../MenuImageToggle";

const MENU_ENDPOINT = "/api/v1/menu";
const PAGE_SIZE = 9;
type MenuRecord = Menu & { image?: string };

export default function MenuManagement() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<MenuRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchQuery, 250);
  const branchId = user?.branchIds?.[0]?._id ?? user?.branchId ?? "";
  const restaurantId = user?.restroId ?? "";

  const fetchMenus = useCallback(async () => {
    if (authLoading) return;

    const endpoint = selectedBranches.length
      ? `${MENU_ENDPOINT}?branchIds=${selectedBranches.join(",")}`
      : restaurantId
        ? `${MENU_ENDPOINT}?restaurantId=${encodeURIComponent(restaurantId)}`
        : branchId
          ? `${MENU_ENDPOINT}/branch/${encodeURIComponent(branchId)}`
          : "";

    if (!endpoint) {
      setItems([]);
      setLoadError("No branch is linked to this account yet.");
      return;
    }

    try {
      setLoading(true);
      setLoadError("");
      const data = await api.get<any>(endpoint);
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const filtered = list.filter((item: MenuRecord) => !item.isDeleted);
      setItems(filtered.length ? filtered : []);
    } catch (error) {
      setItems([]);
      const message = getApiErrorMessage(error, "Unable to load menu items.");
      setLoadError(message);
      pushToast({
        title: "Failed to load menu",
        description: message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [authLoading, branchId, pushToast, restaurantId]);

  useEffect(() => {
    if (authLoading) return;
    void fetchMenus();
  }, [authLoading, fetchMenus, selectedBranches]);

  const normalizedSearch = debouncedSearch.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const searchTarget = `${item.name} ${item.description ?? ""}`.toLowerCase();
      const searchMatch = !normalizedSearch || searchTarget.includes(normalizedSearch);
      const categoryMatch =
        selectedCategory === "all" || item.category === selectedCategory;
      const branchMatch =
        selectedBranches.length === 0 ||
        item.branchIds?.some((id: string) => selectedBranches.includes(id));

      return searchMatch && categoryMatch && branchMatch;
    });
  }, [items, normalizedSearch, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, normalizedSearch, selectedBranches]);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    try {
      setDeletingId(id);
      const response = await api.delete<{ message?: string }>(`${MENU_ENDPOINT}/${id}`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      pushToast({
        title: "Menu item deleted",
        description: response?.message || "The menu item and its related assets were removed.",
        variant: "success",
      });
    } catch (error) {
      pushToast({
        title: "Delete failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to delete item. Please try again.",
        variant: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const categories = useMemo(() => {
    const unique = new Set(items.map((item) => item.category).filter(Boolean));
    return ["all", ...Array.from(unique)];
  }, [items]);

  const isPageLoading = authLoading || loading;

  return (
    <div className="min-h-screen space-y-8 text-left">
      <div className="ui-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#3b2f2f]">
            Menu Management
          </h1>
          <p className="text-[#6b665f]">{isPageLoading ? "Loading menu items..." : `${items.length} total items`}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchMenus}
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => navigate("/admin/menu/new")}
            className="cursor-pointer max-w-fit flex items-center gap-2 px-5 py-2.5 bg-linear-to-tr from-yellow-400 to-orange-500 text-white rounded-lg shadow hover:shadow-lg transition"
          >
            <Plus size={18} />
            Add Menu
          </button>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      <div className="ui-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu..."
            className="w-full pl-10 pr-4 h-11 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:outline-none"
          />
        </div>
        <div className="relative flex-1">
          <Listbox
            value={selectedBranches}
            onChange={(vals: string[]) => setSelectedBranches(vals)}
            multiple
          >
            <div className="relative">
              <ListboxButton className="cursor-pointer w-full rounded-xl border border-[#e5d5c6] px-4 py-3 text-left focus:outline-none flex items-center justify-between">
                <span className="truncate text-gray-600">
                  {selectedBranches.length > 0
                    ? user?.branchIds
                      ?.filter((b) => selectedBranches.includes(b._id))
                      .map((b) => b.name)
                      .join(", ")
                    : "Filter By Branch"}
                </span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500 shrink-0" />
              </ListboxButton>

              <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-[#e5d5c6] bg-white shadow-lg focus:outline-none">
                {user?.branchIds && user.branchIds.length > 0 ? (
                  user.branchIds.map(({ _id, name }) => (
                    <ListboxOption
                      key={_id}
                      value={_id}
                      className={({ focus }) =>
                        `cursor-pointer select-none px-4 py-2 flex items-center justify-between ${focus ? "bg-orange-100 text-orange-700" : "text-gray-700"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span>{name}</span>
                          {selected && <CheckIcon className="h-4 w-4 text-orange-500" />}
                        </>
                      )}
                    </ListboxOption>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No branches available
                  </div>
                )}
              </ListboxOptions>
            </div>
          </Listbox>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap border text-sm transition cursor-pointer ${selectedCategory === cat
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white hover:bg-orange-50"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {
        isPageLoading ? (
          <LoadingCardGrid count={6} />
        ) : pagedItems.length ? (
          <>
            <div className="ui-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagedItems.map((item) => (
                <div
                  key={item._id ?? item.name}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition border border-orange-100 overflow-hidden"
                >
                  <div className="h-44 overflow-hidden">

                    <MenuImageToggle
                      items={{
                        name: item.name,
                        image: item.image,
                        images: item.images,
                        video: item.video,
                      }}
                    />
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-[#3b2f2f]">
                        {item.name}
                      </h3>
                      <span className="text-orange-500 font-bold">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{item.isVeg ? "Veg" : "Non-Veg"}</span>
                      <span>{item.preparationTimeMinutes} mins</span>
                      <span>Rating {item.rating?.average ?? 0}</span>
                    </div>

                    <div className="flex justify-between text-sm pt-3 border-t">
                      <button
                        className="flex items-center gap-1 hover:text-blue-500 cursor-pointer"
                        onClick={() =>
                          item._id && navigate(`/admin/menu/edit/${item._id}`)
                        }
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        className="flex items-center gap-1 hover:text-red-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                      >
                        <Trash2 size={14} />
                        {deletingId === item._id ? "Deleting..." : "Delete"}
                      </button>

                      <button className="flex items-center gap-1 hover:text-orange-500 cursor-pointer">
                        <Eye size={14} />
                        3D View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ui-card flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">
            No menu items found
          </div>
        )
      }
    </div >
  );
}
