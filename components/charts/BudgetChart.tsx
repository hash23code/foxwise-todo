"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useUser } from "@clerk/nextjs";
import { getBudgets } from "@/lib/api/budgets";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#14b8a6", "#10b981", "#06b6d4"];

export default function BudgetChart() {
  const { user } = useUser();
  const [data, setData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBudgets();
    }
  }, [user]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const budgets = await getBudgets(user!.id);
      const chartData = budgets.map((budget, index) => ({
        name: budget.category,
        value: budget.amount,
        color: COLORS[index % COLORS.length]
      }));
      setData(chartData);
    } catch (error) {
      console.error("Error loading budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
    >
      <h3 className="text-xl font-bold text-white mb-4">Budget Distribution</h3>
      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-gray-400">No budgets yet. Create one to see your budget distribution!</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Legend
              wrapperStyle={{ color: "#9ca3af" }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
