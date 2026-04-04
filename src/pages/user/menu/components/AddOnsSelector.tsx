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
        <h3 className="font-display text-2xl font-semibold tracking-tight text-[color:var(--text-primary)]">
          Customize your order
        </h3>
        <span className="text-xs text-[color:var(--text-muted)]">Optional</span>
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
              className={`relative flex cursor-pointer items-center justify-between rounded-2xl border px-5 py-4 transition-all duration-300 ${
                selected
                  ? "border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color:var(--accent-soft)] shadow-[var(--shadow-sm)]"
                  : "border-[color:var(--border-subtle)] bg-[color:var(--surface)] hover:border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)] hover:shadow-[var(--shadow-sm)]"
              }`}
            >
              {selected && (
                <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-[color:color-mix(in_srgb,var(--accent)_28%,transparent)]" />
              )}

              <div className="flex items-center gap-4">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                    selected
                      ? "border-[color:var(--accent)] warm-linear text-white"
                      : "border-[color:var(--border-subtle)] bg-[color:var(--surface-strong)]"
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
                      selected ? "text-[color:var(--accent)]" : "text-[color:var(--text-primary)]"
                    }`}
                  >
                    {addOn.name}
                  </span>
                  <span className="text-xs text-[color:var(--text-muted)]">
                    Add extra goodness
                  </span>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  selected
                    ? "warm-linear text-white"
                    : "bg-[color:var(--surface-muted)] text-[color:var(--accent)]"
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
