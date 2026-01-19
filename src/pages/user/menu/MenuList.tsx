import CategoryPills from "../../../components/CategoryPills/CategoryPills";
import MenuCard from "../../../components/MenuCard/MenuCard";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/Footer/Footer";
import { menuItems } from "../../../store/store";
import { Filter, Search } from "lucide-react";
import { categories } from "../../../types";
import { motion } from "framer-motion";
import { useState } from "react";

export default function MenuList() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showVegOnly, setShowVegOnly] = useState(false);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "all" || item.category === activeCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesVeg = showVegOnly ? item.isVeg : true;
    return matchesCategory && matchesSearch && matchesVeg;
  });

  return (
    <>
      <Header />

      <main className="w-full px-4">
        <div className="sm:px-6 lg:px-8 space-y-8">
          {/* page title*/}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left"
          >
            <h1 className="font-display text-3xl font-bold">Our Menu</h1>
            <p className="text-muted-foreground mt-1">
              {filteredItems.length} delicious items to explore
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative flex gap-3 mb-5"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for dishes..."
                className="w-full h-12 pl-12 rounded-xl bg-[#f0ebe6] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97415] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
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
            {filteredItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl mb-2">No dishes found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item, index) => (
                  <MenuCard key={item.id} item={item} index={index} />
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </main>

      <Footer />
    </>
  );
}
