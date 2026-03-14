import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Eye, RefreshCw } from "lucide-react";
import type { Menu } from "../../types/index";
import { menuItems as fallbackMenuItems } from "../../store/store";
import { api } from "../../utils/api";
import { formatPrice } from "../../utils/formatPrice";
import { useDebounce } from "../../hooks/useDebounce";
import { useToast } from "../../context/ToastContext";

const MENU_ENDPOINT = "/api/v1/menu";
const PAGE_SIZE = 9;
type MenuRecord = Menu & { image?: string };

export default function MenuManagement() {
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [items, setItems] = useState<MenuRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchQuery, 250);

  const fetchMenus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<any>(MENU_ENDPOINT);
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const filtered = list.filter((item: MenuRecord) => !item.isDeleted);
      setItems(filtered.length ? filtered : []);
    } catch (error) {
      setItems(
        fallbackMenuItems.map(({ id, ...rest }) => ({
          ...rest,
          _id: id,
          restaurantId: "",
          branchId: "",
          addOns: rest.addOns.map((addOn) => ({
            ...addOn,
            isAvailable: true,
          })),
          images: {
            front: null,
            top: null,
            back: null,
            angled: null,
          },
          isAvailable: true,
          isDeleted: false,
          preparationTimeMinutes: Number(rest.prepTime.replace(/\D/g, "")) || 10,
          rating: { average: rest.rating, count: 0 },
        })),
      );
      pushToast({
        title: "Using sample menu data",
        description: "API request failed. Showing local sample items.",
        variant: "warning",
      });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const normalizedSearch = debouncedSearch.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const searchTarget = `${item.name} ${item.description ?? ""}`.toLowerCase();
      const searchMatch = !normalizedSearch || searchTarget.includes(normalizedSearch);
      const categoryMatch =
        selectedCategory === "all" || item.category === selectedCategory;
      return searchMatch && categoryMatch;
    });
  }, [items, normalizedSearch, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, normalizedSearch]);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    try {
      await api.delete(`${MENU_ENDPOINT}/${id}`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      pushToast({ title: "Menu item deleted", variant: "success" });
    } catch (error) {
      pushToast({
        title: "Delete failed",
        description: "Unable to delete item. Please try again.",
        variant: "error",
      });
    }
  };

  const categories = useMemo(() => {
    const unique = new Set(items.map((item) => item.category).filter(Boolean));
    return ["all", ...Array.from(unique)];
  }, [items]);

  return (
    <div className="min-h-screen bg-[#fff9f2] space-y-8 text-left">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3b2f2f]">
            Menu Management
          </h1>
          <p className="text-[#6b665f]">{items.length} total items</p>
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

      <div className="flex flex-col lg:flex-row gap-4">
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

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap border text-sm transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white hover:bg-orange-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading menu...</div>
      ) : pagedItems.length ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedItems.map((item) => (
              <div
                key={item._id ?? item.name}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition border border-orange-100 overflow-hidden"
              >
                <div className="h-44 overflow-hidden">
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
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
                      className="flex items-center gap-1 hover:text-red-500 cursor-pointer"
                      onClick={() => handleDelete(item._id)}
                    >
                      <Trash2 size={14} />
                      Delete
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

          <div className="flex items-center justify-between pt-4">
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
      )}
    </div>
  );
}
