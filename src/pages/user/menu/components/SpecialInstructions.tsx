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
      className={`space-y-3 ${className}`}
    >
      <h3 className="font-display text-lg font-semibold text-(--text-primary)">Special Instructions</h3>
      <textarea
        placeholder="Any specific requests? (e.g., less spicy, no onions)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ui-textarea min-h-24 resize-none"
      />
    </motion.section>
  );
}
