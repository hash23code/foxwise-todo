"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  AlertCircle,
  CreditCard,
  Target,
  Wallet,
  X
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, AreaChart, Area } from "recharts";

export default function DemoPage() {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(true);

  // Demo data - all fictive
  const demoTransactions = [
    { id: 1, type: "expense", category: "Food", amount: 125.50, date: "2025-01-10", description: "Grocery shopping" },
    { id: 2, type: "income", category: "Salary", amount: 5000, date: "2025-01-01", description: "Monthly salary" },
    { id: 3, type: "expense", category: "Transport", amount: 45.00, date: "2025-01-09", description: "Gas" },
    { id: 4, type: "expense", category: "Entertainment", amount: 89.99, date: "2025-01-08", description: "Netflix & Spotify" },
    { id: 5, type: "income", category: "Freelance", amount: 800, date: "2025-01-05", description: "Web design project" },
    { id: 6, type: "expense", category: "Shopping", amount: 250.00, date: "2025-01-07", description: "New shoes" },
    { id: 7, type: "expense", category: "Food", amount: 78.30, date: "2025-01-06", description: "Restaurant dinner" },
  ];

  const demoBills = [
    { id: 1, name: "Rent", amount: 1500, due_date: "2025-01-01", status: "paid" },
    { id: 2, name: "Electricity", amount: 120, due_date: "2025-01-15", status: "upcoming" },
    { id: 3, name: "Internet", amount: 60, due_date: "2025-01-20", status: "upcoming" },
  ];

  const demoInvestments = [
    { id: 1, name: "Tech Stock Portfolio", purchase_value: 5000, current_value: 6200 },
    { id: 2, name: "S&P 500 Index Fund", purchase_value: 10000, current_value: 11500 },
    { id: 3, name: "Crypto Portfolio", purchase_value: 2000, current_value: 2400 },
  ];

  const demoDebts = [
    { id: 1, name: "Car Loan", total_amount: 15000, remaining_amount: 8500, interest_rate: 4.5 },
    { id: 2, name: "Credit Card", total_amount: 3000, remaining_amount: 1200, interest_rate: 18.9 },
  ];

  const demoBudgets = [
    { id: 1, category: "Food", limit: 500, spent: 203.80 },
    { id: 2, category: "Transport", limit: 200, spent: 45.00 },
    { id: 3, category: "Entertainment", limit: 150, spent: 89.99 },
    { id: 4, category: "Shopping", limit: 300, spent: 250.00 },
  ];

  // Calculate totals
  const totalIncome = demoTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = demoTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalInvestments = demoInvestments.reduce((sum, i) => sum + i.current_value, 0);
  const investmentGain = demoInvestments.reduce((sum, i) => sum + (i.current_value - i.purchase_value), 0);

  const totalDebts = demoDebts.reduce((sum, d) => sum + d.remaining_amount, 0);

  const netWorth = totalIncome - totalExpenses + totalInvestments - totalDebts;

  // Chart data
  const incomeExpenseData = [
    { name: "Aug", income: 4800, expenses: 3200 },
    { name: "Sep", income: 5200, expenses: 3500 },
    { name: "Oct", income: 5000, expenses: 2800 },
    { name: "Nov", income: 5500, expenses: 4100 },
    { name: "Dec", income: 5800, expenses: 3900 },
    { name: "Jan", income: 5800, expenses: 588.79 },
  ];

  const categoryData = [
    { name: "Food", value: 203.80 },
    { name: "Shopping", value: 250.00 },
    { name: "Entertainment", value: 89.99 },
    { name: "Transport", value: 45.00 },
  ];

  const investmentData = [
    { name: "Jul", value: 15800 },
    { name: "Aug", value: 16200 },
    { name: "Sep", value: 17500 },
    { name: "Oct", value: 18100 },
    { name: "Nov", value: 19200 },
    { name: "Dec", value: 20100 },
  ];

  const COLORS = ["#a855f7", "#ec4899", "#8b5cf6", "#f59e0b", "#10b981"];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Demo Banner */}
      {showBanner && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 py-3 px-6 relative"
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">
                You&apos;re viewing a demo with sample data. Changes won&apos;t be saved.
              </span>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/sign-up")}
                className="px-6 py-2 bg-white text-purple-600 rounded-lg font-semibold text-sm"
              >
                Sign Up to Save Data
              </motion.button>
              <button onClick={() => setShowBanner(false)} className="hover:opacity-70">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between border-b border-gray-800"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/logo.png"
            alt="FoxWise Finance"
            width={180}
            height={60}
            className="object-contain"
            priority
          />
        </motion.div>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/sign-in")}
            className="px-6 py-2 rounded-lg border border-purple-500/50 text-purple-300 hover:bg-purple-500/10 transition-colors"
          >
            Sign In
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/sign-up")}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg shadow-purple-500/50"
          >
            Get Started
          </motion.button>
        </div>
      </motion.nav>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Interactive Demo Dashboard
          </h1>
          <p className="text-gray-400">
            Explore all features with sample data. Your actual dashboard will have real data.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">This Month</span>
            </div>
            <h3 className="text-3xl font-bold text-green-400 mb-1">
              ${totalIncome.toLocaleString()}
            </h3>
            <p className="text-gray-400 text-sm">Total Income</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-sm text-gray-400">This Month</span>
            </div>
            <h3 className="text-3xl font-bold text-red-400 mb-1">
              ${totalExpenses.toLocaleString()}
            </h3>
            <p className="text-gray-400 text-sm">Total Expenses</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">Portfolio</span>
            </div>
            <h3 className="text-3xl font-bold text-purple-400 mb-1">
              ${totalInvestments.toLocaleString()}
            </h3>
            <p className="text-gray-400 text-sm">
              <span className="text-green-400">+${investmentGain.toLocaleString()}</span> gain
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm text-gray-400">Net Worth</span>
            </div>
            <h3 className="text-3xl font-bold text-blue-400 mb-1">
              ${netWorth.toLocaleString()}
            </h3>
            <p className="text-gray-400 text-sm">Total Balance</p>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Income vs Expenses */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Income vs Expenses (Last 6 Months)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeExpenseData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#4b5563" />
                <YAxis stroke="#4b5563" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="income" fill="url(#colorIncome)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="url(#colorExpense)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-pink-400" />
              Expenses by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              </RePieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Investment Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 mb-8"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-400" />
            Investment Portfolio Growth
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={investmentData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#4b5563" />
              <YAxis stroke="#4b5563" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#a855f7"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Budgets & Bills Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Budget Progress */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              Budget Progress
            </h3>
            <div className="space-y-4">
              {demoBudgets.map((budget) => {
                const percentage = (budget.spent / budget.limit) * 100;
                const isOverBudget = percentage > 100;
                return (
                  <div key={budget.id}>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">{budget.category}</span>
                      <span className={`font-semibold ${isOverBudget ? "text-red-400" : "text-gray-300"}`}>
                        ${budget.spent.toFixed(2)} / ${budget.limit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isOverBudget
                            ? "bg-gradient-to-r from-red-500 to-red-600"
                            : "bg-gradient-to-r from-green-500 to-emerald-500"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Upcoming Bills */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Bills & Payments
            </h3>
            <div className="space-y-4">
              {demoBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700"
                >
                  <div>
                    <h4 className="font-semibold">{bill.name}</h4>
                    <p className="text-sm text-gray-400">Due: {bill.due_date}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">${bill.amount}</div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        bill.status === "paid"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
        >
          <h3 className="text-xl font-bold mb-6">Recent Transactions</h3>
          <div className="space-y-3">
            {demoTransactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      transaction.type === "income"
                        ? "bg-green-500/20"
                        : "bg-red-500/20"
                    }`}
                  >
                    {transaction.type === "income" ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{transaction.category}</h4>
                    <p className="text-sm text-gray-400">{transaction.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-bold text-lg ${
                      transaction.type === "income" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-400">{transaction.date}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-12 p-12 rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4 text-white">
              Like What You See?
            </h2>
            <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto">
              Sign up now to start tracking your real finances and achieve your financial goals with FoxWise Finance.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/sign-up")}
              className="px-12 py-4 rounded-xl bg-white text-purple-600 font-bold text-lg shadow-2xl hover:shadow-white/50 transition-shadow"
            >
              Get Started Free
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
