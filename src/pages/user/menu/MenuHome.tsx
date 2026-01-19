import CategoryPills from "../../../components/CategoryPills/CategoryPills";
import { ArrowRight, Search, Sparkles, TrendingUp } from "lucide-react";
import MenuCard from "../../../components/MenuCard/MenuCard";
import Header from "../../../components/Header/Header";
import { categories } from "../../../types/index";
import { useNavigate } from "react-router-dom";
import Footer from "../../../components/Footer/Footer";
import { motion } from 'framer-motion';
import { useState } from "react";
import { menuItems } from "../../../store/store";

export default function MenuHome() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredItems = menuItems.filter((item) => item.rating >= 4.7).slice(0, 3);

  const navigate = useNavigate();

  return (
    <>
      <Header />

      <main className="w-full px-4">
        <div className="sm:px-6 lg:px-8 space-y-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl mt-3 p-5 sm:p-5 bg-[linear-gradient(135deg,rgb(249,116,21)_0%,rgb(249,158,31)_50%,rgb(250,201,56)_100%)] shadow-lg"
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
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for dishes..."
                className="w-full h-12 pl-12 rounded-xl bg-[#f0ebe6] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97415] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredItems.map((item, index) => (
                  <MenuCard key={item.id} item={item} index={index} />
                ))}
              </div>
            </motion.section>
          )}

          {/* All Items */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="font-display text-xl text-left font-semibold mb-4">
              {activeCategory === 'all' ? 'Full Menu' : categories.find((c) => c.id === activeCategory)?.name}
            </h2>

            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No items found</p>
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
