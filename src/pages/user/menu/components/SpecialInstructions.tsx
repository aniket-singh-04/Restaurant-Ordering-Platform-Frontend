import { motion } from 'framer-motion';

interface SpecialInstructionsProps {
  value: string;
  onChange: (val: string) => void;
  className?: string; // allow custom classes
}

export default function SpecialInstructions({
  value,
  onChange,
  className = "",
}: SpecialInstructionsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`space-y-3 ${className}`} // merge default with custom
    >
      <h3 className="font-display text-lg font-semibold text-[#4a3f35]">Special Instructions</h3>
      <textarea
        placeholder="Any specific requests? (e.g., less spicy, no onions)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full min-h-24
          rounded-xl border border-[#f0e6d6]
          bg-[#fff9f0] text-[#4a3f35]
          p-4 resize-none
          placeholder:text-[#a28f78]
          focus:outline-none focus:ring-2 focus:ring-[#f97415] focus:ring-offset-1
          shadow-sm transition-all duration-200
        "
      />
    </motion.section>
  );
}
