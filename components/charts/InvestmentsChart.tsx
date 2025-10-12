"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useUser } from "@clerk/nextjs";
import { getInvestments } from "@/lib/api/investments";

export default function InvestmentsChart() {
  const { user } = useUser();
  const [data, setData] = useState<{ name: string; invested: number; currentValue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadInvestments();
    }
  }, [user]);

  const loadInvestments = async () => {
    try {
      setLoading(true);
      const investments = await getInvestments(user!.id);

      // Generate last 6 months of data
      const now = new Date();
      const monthsData = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });

        // Calculate invested amount and current value up to this month
        const investmentsUpToMonth = investments.filter(inv => {
          const purchaseDate = new Date(inv.purchase_date);
          return purchaseDate <= monthDate;
        });

        const invested = investmentsUpToMonth.reduce((sum, inv) => sum + inv.amount, 0);
        const currentValue = investmentsUpToMonth.reduce((sum, inv) => sum + inv.current_value, 0);

        monthsData.push({
          name: monthName,
          invested: 0,
          currentValue: Math.round(currentValue),
        });
      }

      // If we have current investments, show current value in the latest month
      if (investments.length > 0) {
        const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);
        monthsData[monthsData.length - 1].currentValue = Math.round(totalCurrentValue);
      }

      setData(monthsData);
    } catch (error) {
      console.error("Error loading investments:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
    >
      <h3 className="text-xl font-bold text-white mb-4">Investment Growth</h3>
      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : data.length === 0 || data.every(d => d.currentValue === 0) ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-gray-500">No investment data available. Add investments to see your growth!</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: '#8b5cf6' }}
              contentStyle={{
                backgroundColor: "rgba(31, 41, 55, 0.95)",
                border: "1px solid rgba(55, 65, 81, 0.8)",
                borderRadius: "8px",
                color: "#fff",
                padding: "8px 12px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)"
              }}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Portfolio Value']}
              labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
              animationDuration={200}
            />
            <Area
              type="monotone"
              dataKey="currentValue"
              stroke="#8b5cf6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1200}
              animationBegin={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
