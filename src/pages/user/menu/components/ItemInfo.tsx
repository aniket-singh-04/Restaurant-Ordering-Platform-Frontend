import { Star, Clock, Leaf, Flame } from "lucide-react";
import { motion } from "framer-motion";
import type { MenuItem } from "../../../../components/MenuCard/types";
import { formatPrice } from "../../../../utils/formatPrice";

interface ItemInfoProps {
  item: MenuItem;
}

export default function ItemInfo({ item }: ItemInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">{item.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span className="font-medium">{item.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{item.prepTime}</span>
            </div>
            {item.isVeg && (
              <div className="flex items-center gap-1 text-success">
                <Leaf className="w-4 h-4" />
                <span className="text-sm">Veg</span>
              </div>
            )}
            {item.isSpicy && (
              <div className="flex items-center gap-1 text-warning">
                <Flame className="w-4 h-4" />
                <span className="text-sm">Spicy</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            {formatPrice(item.price)}
          </p>
        </div>
      </div>

      <p className="text-left">{item.description}</p>
    </motion.div>
  );
}
