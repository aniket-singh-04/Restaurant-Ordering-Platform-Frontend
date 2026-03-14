import CategoryPills from "../../../components/CategoryPills/CategoryPills";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { categories } from "../../../types/index";
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import { useMemo, useState } from "react";
import { menuItems } from "../../../store/store";
import { useDebounce } from "../../../hooks/useDebounce";
import MenuItemsGrid from "./components/MenuItemsGrid";
import MenuPageLayout from "./components/MenuPageLayout";
import MenuSearchBar from "./components/MenuSearchBar";
import {
  filterMenuItems,
  getActiveCategoryTitle,
  getFeaturedMenuItems,
} from "./menu.utils";

export default function MenuHome() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 250);

  const filteredItems = useMemo(() => {
    return filterMenuItems(menuItems, {
      activeCategory,
      searchQuery: debouncedSearch,
    });
  }, [activeCategory, debouncedSearch]);

  const featuredItems = useMemo(() => getFeaturedMenuItems(menuItems), []);

  const navigate = useNavigate();

  return (
    <MenuPageLayout>
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl mt-3 p-5 sm:p-5 bg-linear-to-br from-[#f97415] via-[#f99e1f] to-[#fac938] shadow-lg"
          >
            {/* Content */}
            <div className="relative z-10 max-w-md sm:max-w-lg md:max-w-xl text-left">
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
                Discover Flavors <br /> in 3D
              </h1>

              <p className="text-white/80 mb-4 text-sm sm:text-base max-w-sm">
                Experience your food before ordering with our interactive 3D menu.
              </p>

              <button
                onClick={() => navigate("/menu")}
                className="cursor-pointer inline-flex items-center gap-2 bg-white/20 text-white border border-white/30 rounded-lg px-4 py-2 font-medium hover:bg-white/30 transition"
              >
                <Sparkles className="w-5 h-5" />
                Explore 3D Menu
              </button>
            </div>

            {/* Decorative Circles */}
            <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -left-16 bottom-0 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute right-10 bottom-10 w-24 h-24 rounded-full bg-white/5 blur-xl" />
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
                <button className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-2xl hover:bg-amber-500" onClick={() => navigate('/menu')}>
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
                  <p className="text-muted-foreground">No items found</p>
                </div>
              }
            />
          </motion.section>
    </MenuPageLayout>
  );
}
