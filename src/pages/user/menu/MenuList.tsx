import CategoryPills from "../../../components/CategoryPills/CategoryPills";
import { Filter, Search } from "lucide-react";
import { categories } from "../../../types";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useDebounce } from "../../../hooks/useDebounce";
import MenuItemsGrid from "./components/MenuItemsGrid";
import MenuPageLayout from "./components/MenuPageLayout";
import MenuSearchBar from "./components/MenuSearchBar";
import { filterMenuItems } from "./menu.utils";
import FullPageLoader from "../../../components/FullPageLoader";
import { isAdminPanelRole } from "../../../features/auth/access";
import { useBranchMenu } from "../../../features/menu/api";
import { useAuth } from "../../../context/AuthContext";
import { useResolvedQrId } from "../../../features/qr-context/navigation";
import { useActiveQrContext } from "../../../features/qr-context/useActiveQrContext";

export default function MenuList() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showVegOnly, setShowVegOnly] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 250);
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
      showVegOnly,
    });
  }, [activeCategory, debouncedSearch, menuQuery.data, showVegOnly]);

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
          {/* page title*/}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left"
          >
            <h1 className="font-display text-3xl font-bold">Our Menu</h1>
            <p className="text-muted-foreground mt-1">
              {filteredItems.length} delicious items to explore
              {activeContext
                ? ` - ${activeContext.branch.name} table ${activeContext.table.tableNumber}`
                : ""}
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative mb-5"
          >
            <MenuSearchBar
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              action={(
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowVegOnly(!showVegOnly)}
                  className={`px-4 h-12 rounded-xl flex items-center gap-2 font-medium transition  ${
                    showVegOnly
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-[#f97415] text-white hover:bg-[#f97415]/90"
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  Veg
                </motion.button>
              )}
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

          {/* Menu Grid */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <MenuItemsGrid
              items={filteredItems}
              emptyState={
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl mb-2">No dishes found</h3>
                  <p className="text-muted-foreground">
                    {menuQuery.isError ? "We could not load this menu." : "Try adjusting your filters or search"}
                  </p>
                </div>
              }
            />
          </motion.section>
    </MenuPageLayout>
  );
}
