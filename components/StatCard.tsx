"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  gradient: string;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  gradient,
  delay = 0,
}: StatCardProps) {
  const isPositive = change.startsWith("+");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-xl border border-gray-700 relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-200">{title}</h3>
          <Icon className="w-6 h-6 text-white/80" />
        </div>
        <p className="text-3xl font-bold text-white mb-2">{value}</p>
        <p className={`text-sm ${isPositive ? "text-green-300" : "text-red-300"}`}>
          {change} from last month
        </p>
      </div>
    </motion.div>
  );
}
