import { motion } from "framer-motion";
import { Star, Clock, Flame, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MenuCardProps } from "./types";
import { formatPrice } from "../../utils/formatPrice";
import MenuImageToggle from "../../pages/MenuImageToggle";
import {
  buildQrMenuItemPath,
  useResolvedQrId,
} from "../../features/qr-context/navigation";

export default function MenuCard({ item, index }: MenuCardProps) {
  const navigate = useNavigate();
  const qrId = useResolvedQrId();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4 }}
      onClick={() => navigate(buildQrMenuItemPath(item.id, qrId))}
      className="group cursor-pointer overflow-hidden rounded-[1.85rem] border border-[color:var(--border-subtle)] bg-card shadow-warm transition-all duration-300 hover:border-[color:color-mix(in_srgb,var(--accent)_32%,transparent)] hover:shadow-warm-lg"
    >
      <div className="relative h-44 overflow-hidden">
        <MenuImageToggle
          items={{
            name: item.name,
            image: item.image,
            images: item.images
          }}
        />

        {item.has3DModel && (
          <div className="absolute left-3 top-3 rounded-full warm-linear px-2.5 py-1 text-xs font-bold text-white">
            3D View
          </div>
        )}

        <div className="absolute bottom-3 right-3 rounded-full bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-3 py-1.5 font-bold text-foreground backdrop-blur-md">
          {formatPrice(item.price)}
        </div>

        <div className="absolute top-3 right-3 flex gap-1.5">
          {item.isVeg ? (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--success)] shadow-sm">
              <Leaf className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--danger)] shadow-sm">
              <div className="h-3 w-3 rounded-full bg-white" />
            </div>
          )}
          {item.isSpicy && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--accent)] shadow-sm">
              <Flame className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 text-left">
        <h3 className="mb-1 line-clamp-1 font-display text-xl font-semibold text-[color:var(--text-primary)]">
          {item.name}
        </h3>
        <p className="mb-3 line-clamp-2 text-sm text-[color:var(--text-secondary)]">
          {item.description}
        </p>

        <div className="flex items-center justify-between text-sm text-[color:var(--text-secondary)]">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-[color:var(--accent)] text-[color:var(--accent)]" />
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
