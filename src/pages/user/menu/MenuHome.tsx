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
        className="ui-hero mt-2 p-6 sm:p-7"
      >
        <div className="relative z-10 text-left">
          <p className="ui-eyebrow text-white/72!">Featured Experience</p>
          <h1 className="mb-1 mt-3 font-display text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Discover Flavors <br /> in 3D
          </h1>

          <p className="mb-5 max-w-sm text-sm text-white/82 sm:text-base">
            {activeContext
              ? `${activeContext.restaurant.name}, ${activeContext.branch.name} - Table ${activeContext.table.tableNumber}`
              : "Experience your food before ordering with our interactive menu."}
          </p>

          <button
            type="button"
            onClick={() => navigate(buildQrMenuPath(qrId))}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/16 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/24"
          >
            <Sparkles className="h-5 w-5" />
            Explore 3D Menu
          </button>
        </div>

        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-10 right-10 h-24 w-24 rounded-full bg-white/5 blur-xl" />
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <MenuSearchBar
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </motion.div>

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

      {activeCategory === "all" && !searchQuery && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="ui-card"
        >
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <TrendingUp className="h-5 w-5 text-(--accent)" />
              <h2 className="font-display text-2xl font-semibold text-(--text-primary)">Top Picks</h2>
            </div>
            <button
              type="button"
              className="ui-button-secondary ui-button-pill w-full px-4 text-sm font-semibold sm:w-auto"
              onClick={() => navigate(buildQrMenuPath(qrId))}
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <MenuItemsGrid
            items={featuredItems}
            emptyState={null}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          />
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="ui-card"
      >
        <h2 className="mb-4 text-left font-display text-2xl font-semibold text-(--text-primary)">
          {getActiveCategoryTitle(categories, activeCategory)}
        </h2>

        <MenuItemsGrid
          items={filteredItems}
          emptyState={
            <div className="ui-empty-state py-12 text-center">
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
