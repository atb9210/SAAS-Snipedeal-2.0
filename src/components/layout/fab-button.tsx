// src/components/layout/fab-button.tsx - Floating Action Button
// Timestamp: 2024-12-09

'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export function FABButton() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 500, damping: 30 }}
    >
      <Link href="/campaigns/new" className="fab">
        <Plus className="w-7 h-7" />
      </Link>
    </motion.div>
  );
}
