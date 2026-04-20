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
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ui-card"
      >
        <div className="text-left">
          <p className="ui-eyebrow">Browse Menu</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-(--text-primary)">Our Menu</h1>
          <p className="mt-2 text-muted-foreground">
            {filteredItems.length} delicious items to explore
            {activeContext
              ? ` - ${activeContext.branch.name} table ${activeContext.table.tableNumber}`
              : ""}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mt-6"
        >
          <MenuSearchBar
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            action={(
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setShowVegOnly(!showVegOnly)}
                className={`ui-button-pill flex h-12 items-center gap-2 rounded-full px-4 font-semibold transition ${
                  showVegOnly
                    ? "bg-(--success) text-white shadow-(--shadow-sm)"
                    : "ui-button text-sm"
                }`}
              >
                <Filter className="h-5 w-5" />
                Veg
              </motion.button>
            )}
          />
        </motion.div>
      </motion.section>

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

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="ui-card"
      >
        <MenuItemsGrid
          items={filteredItems}
          emptyState={
            <div className="ui-empty-state py-16 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 font-display text-xl text-(--text-primary)">No dishes found</h3>
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
