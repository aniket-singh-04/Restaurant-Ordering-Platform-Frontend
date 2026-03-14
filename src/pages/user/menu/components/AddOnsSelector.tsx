import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { AddOn } from "../../../../components/MenuCard/types";
import { formatPrice } from "../../../../utils/formatPrice";

interface AddOnsSelectorProps {
  addOns: AddOn[];
  selectedAddOns: AddOn[];
  toggleAddOn: (addOn: AddOn) => void;
  className?: string;
}

export default function AddOnsSelector({
  addOns,
  selectedAddOns,
  toggleAddOn,
  className = "",
}: AddOnsSelectorProps) {
  if (addOns.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`space-y-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold tracking-tight text-[#2b2b2b]">
          Customize your order
        </h3>
        <span className="text-xs text-[#6b7280]">Optional</span>
      </div>

      <div className="space-y-3">
        {addOns.map((addOn) => {
          const selected = selectedAddOns.some((a) => a.id === addOn.id);

          return (
            <motion.div
              key={addOn.id}
              layout
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleAddOn(addOn)}
              className={`relative flex items-center justify-between rounded-2xl px-5 py-4 cursor-pointer border transition-all duration-300 ${
                selected
                  ? "border-[#f99e1f] bg-linear-to-r from-[#f97415]/20 via-[#f99e1f]/15 to-[#fac938]/20 shadow-md"
                  : "border-[#f5ce9b] bg-white hover:shadow-lg hover:border-[#f99e1f]"
              }`}
            >
              {selected && (
                <span className="absolute inset-0 rounded-2xl ring-1 ring-[#f99e1f]/40 pointer-events-none" />
              )}

              <div className="flex items-center gap-4">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                    selected
                      ? "border-[#f97415] bg-linear-to-r from-[#f97415] via-[#f99e1f] to-[#fac938] text-white"
                      : "border-[#d1d5db] bg-white"
                  }`}
                >
                  {selected && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check className="h-3 w-3 text-white" />
                    </motion.span>
                  )}
                </div>

                <div className="flex flex-col">
                  <span
                    className={`font-medium ${
                      selected ? "text-[#f97415]" : "text-[#2b2b2b]"
                    }`}
                  >
                    {addOn.name}
                  </span>
                  <span className="text-xs text-[#6b7280]">
                    Add extra goodness
                  </span>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  selected
                    ? "bg-linear-to-r from-[#f97415] via-[#f99e1f] to-[#fac938] text-white"
                    : "bg-[#fff3e0] text-[#f97415]"
                }`}
              >
                +{formatPrice(addOn.price)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
