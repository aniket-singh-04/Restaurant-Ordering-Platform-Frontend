import CategoryPills from "../../../components/CategoryPills/CategoryPills";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { categories } from "../../../types/index";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useDebounce } from "../../../hooks/useDebounce";
import MenuItemsGrid from "./components/MenuItemsGrid";
import MenuPageLayout from "./components/MenuPageLayout";
import MenuSearchBar from "./components/MenuSearchBar";
import {
  filterMenuItems,
  getActiveCategoryTitle,
  getFeaturedMenuItems,
} from "./menu.utils";
import FullPageLoader from "../../../components/FullPageLoader";
import { isAdminPanelRole } from "../../../features/auth/access";
import { useBranchMenu } from "../../../features/menu/api";
import { useAuth } from "../../../context/AuthContext";
import {
  buildQrMenuPath,
  useResolvedQrId,
} from "../../../features/qr-context/navigation";
import { useActiveQrContext } from "../../../features/qr-context/useActiveQrContext";

export default function MenuHome() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 250);
  const navigate = useNavigate();
  const qrId = useResolvedQrId();
  const { user } = useAuth();
  const shouldBlockCustomerMenu = Boolean(!qrId && user && isAdminPanelRole(user.role));
  const qrContext = useActiveQrContext(qrId);
  const activeContext = qrContext.data;
  const menuQuery = useBranchMenu(
    shouldBlockCustomerMenu ? undefined : activeContext?.branch.id ?? user?.branchId,
    shouldBlockCustomerMenu ? undefined : activeContext?.restaurant.id ?? user?.restroId,
  );

  const filteredItems = useMemo(() => {
    return filterMenuItems(menuQuery.data ?? [], {
      activeCategory,
      searchQuery: debouncedSearch,
    });
  }, [activeCategory, debouncedSearch, menuQuery.data]);

  const featuredItems = useMemo(() => getFeaturedMenuItems(menuQuery.data ?? []), [menuQuery.data]);

  if (qrContext.isLoading || menuQuery.isLoading) {
    return <FullPageLoader label="Loading menu..." />;
  }

  if (qrId && qrContext.isError) {
    return (
      <MenuPageLayout>
        <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-left text-red-800">
          <h1 className="text-2xl font-semibold">This QR code is not available.</h1>
          <p className="mt-2 text-sm text-red-700">
            {qrContext.error instanceof Error
              ? qrContext.error.message
              : "Please ask the restaurant team for a fresh table QR code."}
          </p>
        </section>
      </MenuPageLayout>
    );
  }

  if (shouldBlockCustomerMenu) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <MenuPageLayout>
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mt-3 overflow-hidden rounded-3xl bg-linear-to-br from-[#f97415] via-[#f99e1f] to-[#fac938] p-5 shadow-lg sm:p-5"
          >
            {/* Content */}
            <div className="relative z-10 max-w-md sm:max-w-lg md:max-w-xl text-left">
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
                Discover Flavors <br /> in 3D
              </h1>

              <p className="text-white/80 mb-4 text-sm sm:text-base max-w-sm">
                {activeContext
                  ? `${activeContext.restaurant.name}, ${activeContext.branch.name} - Table ${activeContext.table.tableNumber}`
                  : "Experience your food before ordering with our interactive menu."}
              </p>

              <button
                onClick={() => navigate(buildQrMenuPath(qrId))}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/30 bg-white/20 px-4 py-2 font-medium text-white transition hover:bg-white/30"
              >
                <Sparkles className="h-5 w-5" />
                Explore 3D Menu
              </button>
            </div>

            {/* Decorative Circles */}
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-10 right-10 h-24 w-24 rounded-full bg-white/5 blur-xl" />
          </motion.section>


          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative">
            <MenuSearchBar
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </motion.div>

          {/* Categories */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CategoryPills
              categories={categories}
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
            />
          </motion.section>

          {/* Featured Section */}
          {activeCategory === 'all' && !searchQuery && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h2 className="font-display text-xl font-semibold">Top Picks</h2>
                </div>
                <button className="flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-1.5 hover:bg-amber-500" onClick={() => navigate(buildQrMenuPath(qrId))}>
                  View All
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <MenuItemsGrid
                items={featuredItems}
                emptyState={null}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              />
            </motion.section>
          )}

          {/* All Items */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="font-display text-xl text-left font-semibold mb-4">
              {getActiveCategoryTitle(categories, activeCategory)}
            </h2>

            <MenuItemsGrid
              items={filteredItems}
              emptyState={
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {menuQuery.isError ? "Could not load menu" : "No items found"}
                  </p>
                </div>
              }
            />
          </motion.section>
    </MenuPageLayout>
  );
}
