import { motion } from "framer-motion";
import { Star, Clock, Flame, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MenuCardProps } from "./types";
import { formatPrice } from "../../utils/formatPrice";

export default function MenuCard({ item, index }: MenuCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/menu/${item.id}`)}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-card shadow-warm transition-all duration-300 hover:shadow-warm-lg"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />

        {/* 3D Badge */}
        {item.has3DModel && (
          <div className="absolute top-3 left-3 rounded-full bg-[linear-linear(135deg,rgb(249,116,21)_0%,rgb(249,158,31)_50%,rgb(250,201,56)_100%)] px-2 py-1 text-xs font-bold text-white">
            3D View
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute bottom-3 right-3 rounded-full bg-white/70 px-3 py-1.5 font-bold text-foreground backdrop-blur-md">
          {formatPrice(item.price)}
        </div>

        {/* Diet indicators */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {item.isVeg ? (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow-sm">
              <Leaf className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 shadow-sm">
              <div className="h-3 w-3 rounded-full bg-white" />
            </div>
          )}
          {item.isSpicy && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 shadow-sm">
              <Flame className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 text-left">
        <h3 className="mb-1 line-clamp-1 font-display text-lg font-semibold">
          {item.name}
        </h3>
        <p className="mb-3 line-clamp-2 text-sm">{item.description}</p>

        {/* Meta info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
            <span className="font-medium">{item.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{item.prepTime}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
