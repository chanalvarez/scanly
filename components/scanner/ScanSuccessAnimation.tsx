"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface ScanSuccessAnimationProps {
  show: boolean;
}

export function ScanSuccessAnimation({ show }: ScanSuccessAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 backdrop-blur-sm"
          >
            <CheckCircle2 className="h-14 w-14 text-emerald-400" strokeWidth={1.5} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
