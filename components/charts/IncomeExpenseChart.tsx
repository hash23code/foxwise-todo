"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useUser } from "@clerk/nextjs";
import { getTransactions } from "@/lib/api/transactions";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default function IncomeExpenseChart() {
  const { user } = useUser();
  const [data, setData] = useState<Array<{ month: string; income: number; expenses: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const transactions = await getTransactions(user!.id);

      // Generate last 6 months of data
      const now = new Date();
      const monthsData = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= monthStart && transactionDate <= monthEnd;
        });

        const income = monthTransactions
          .filter(t => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);

        // Include ALL outgoing transactions (expense, bills, debt_payment, savings)
        const expenses = monthTransactions
          .filter(t => t.type === "expense" || t.type === "bills" || t.type === "debt_payment" || t.type === "savings")
          .reduce((sum, t) => sum + t.amount, 0);

        monthsData.push({
          month: format(monthDate, "MMM"),
          income: Math.round(income),
          expenses: Math.round(expenses)
        });
      }

      setData(monthsData);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
    >
      <h3 className="text-xl font-bold text-white mb-4">Income vs Expenses (Last 6 Months)</h3>
      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="activeIncomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={1} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="activeExpenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={1} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            contentStyle={{
              backgroundColor: "rgba(31, 41, 55, 0.95)",
              border: "1px solid rgba(55, 65, 81, 0.8)",
              borderRadius: "8px",
              color: "#fff",
              padding: "8px 12px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)"
            }}
            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
            animationDuration={200}
          />
          <Legend wrapperStyle={{ color: "#9ca3af" }} />
          <Bar
            dataKey="income"
            fill="url(#colorIncome)"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
            animationBegin={0}
            activeBar={{
              fill: 'url(#activeIncomeGradient)',
              stroke: '#10b981',
              strokeWidth: 2,
              filter: 'brightness(1.3)',
            }}
          />
          <Bar
            dataKey="expenses"
            fill="url(#colorExpense)"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
            animationBegin={0}
            activeBar={{
              fill: 'url(#activeExpenseGradient)',
              stroke: '#ef4444',
              strokeWidth: 2,
              filter: 'brightness(1.3)',
            }}
          />
        </BarChart>
      </ResponsiveContainer>
      )}
    </motion.div>
  );
}
