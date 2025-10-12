"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Receipt, CreditCard, PiggyBank, ChevronLeft, ChevronRight, Wallet, DollarSign } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getTransactions } from "@/lib/api/transactions";
import { getWallets } from "@/lib/api/wallets";
import { getBudgets } from "@/lib/api/budgets";
import { getUserSettings, getCurrencySymbol } from "@/lib/api/userSettings";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from "recharts";
import BudgetChart from "@/components/charts/BudgetChart";
import IncomeExpenseChart from "@/components/charts/IncomeExpenseChart";
import InvestmentsChart from "@/components/charts/InvestmentsChart";

interface Transaction {
  id: string;
  type: "income" | "expense" | "bills" | "debt_payment" | "savings";
  category: string;
  amount: number;
  description: string | null;
  date: Date;
}

interface WalletType {
  id: string;
  name: string;
  type: string;
  currency: string;
  current_balance: number;
  beginning_balance: number;
  color: string;
}

interface Budget {
  id: string;
  category: string;
  amount: number;
  period: "monthly" | "yearly";
  parent_type: "income" | "expense" | "bills" | "debt_payment" | "savings";
}

const COLORS = {
  income: "#10b981",
  expense: "#ef4444",
  bills: "#f97316",
  debt_payment: "#a855f7",
  savings: "#3b82f6"
};

export default function DashboardPage() {
  const { user } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [currency, setCurrency] = useState("CAD");

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, walletsData, budgetsData, userSettings] = await Promise.all([
        getTransactions(user!.id),
        getWallets(user!.id),
        getBudgets(user!.id),
        getUserSettings(user!.id)
      ]);

      setTransactions(transactionsData.map(t => ({
        ...t,
        date: new Date(t.date),
      })));
      setWallets(walletsData);
      setBudgets(budgetsData);
      if (userSettings) {
        setCurrency(userSettings.default_currency || "CAD");
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const monthlyTransactions = transactions.filter(t =>
    t.date >= monthStart && t.date <= monthEnd
  );

  // Calculate totals
  const monthlyIncome = monthlyTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = monthlyTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const monthlyBills = monthlyTransactions.filter(t => t.type === "bills").reduce((sum, t) => sum + t.amount, 0);
  const monthlyDebtPayment = monthlyTransactions.filter(t => t.type === "debt_payment").reduce((sum, t) => sum + t.amount, 0);
  const monthlySavings = monthlyTransactions.filter(t => t.type === "savings").reduce((sum, t) => sum + t.amount, 0);

  // Current Month Balance = Income - All Outgoing (expenses + bills + debt + savings)
  const totalOutgoing = monthlyExpenses + monthlyBills + monthlyDebtPayment + monthlySavings;
  const currentMonthBalance = monthlyIncome - totalOutgoing;

  // Prepare chart data
  const pieChartData = [
    { name: "Income", value: monthlyIncome, color: COLORS.income },
    { name: "Expense", value: monthlyExpenses, color: COLORS.expense },
    { name: "Bills", value: monthlyBills, color: COLORS.bills },
    { name: "Debt Payment", value: monthlyDebtPayment, color: COLORS.debt_payment },
    { name: "Savings", value: monthlySavings, color: COLORS.savings }
  ].filter(item => item.value > 0);

  const categoryData = (type: string) => {
    // Group by category case-insensitively, keeping the first occurrence's capitalization
    const categoryMap = new Map<string, { displayName: string; amount: number }>();

    monthlyTransactions
      .filter(t => t.type === type)
      .forEach(t => {
        const lowerCategory = t.category.toLowerCase();
        const existing = categoryMap.get(lowerCategory);

        if (existing) {
          existing.amount += t.amount;
        } else {
          categoryMap.set(lowerCategory, { displayName: t.category, amount: t.amount });
        }
      });

    return Array.from(categoryMap.values())
      .map(({ displayName, amount }) => ({ name: displayName, value: amount }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  // Combined category data for expenses, bills, and debt payments
  const combinedExpensesData = () => {
    // Group by category case-insensitively, keeping the first occurrence's capitalization
    const categoryMap = new Map<string, { displayName: string; amount: number }>();

    monthlyTransactions
      .filter(t => t.type === "expense" || t.type === "bills" || t.type === "debt_payment")
      .forEach(t => {
        const lowerCategory = t.category.toLowerCase();
        const existing = categoryMap.get(lowerCategory);

        if (existing) {
          existing.amount += t.amount;
        } else {
          categoryMap.set(lowerCategory, { displayName: t.category, amount: t.amount });
        }
      });

    return Array.from(categoryMap.values())
      .map(({ displayName, amount }) => ({ name: displayName, value: amount }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const currencySymbol = getCurrencySymbol(currency);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      {/* Header with Month Selector */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {format(selectedMonth, "MMMM yyyy")}
            </h2>
          </div>
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">Currency:</span>
          <span className="text-lg font-bold text-purple-400">{currency}</span>
        </div>
      </motion.div>

      {/* Current Month Balance */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`bg-gradient-to-br ${
          currentMonthBalance >= 0
            ? 'from-green-600 via-emerald-600 to-teal-600'
            : 'from-red-600 via-rose-600 to-pink-600'
        } rounded-2xl p-8 mb-8 shadow-2xl border ${
          currentMonthBalance >= 0 ? 'border-green-500/50' : 'border-red-500/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`${currentMonthBalance >= 0 ? 'text-green-100' : 'text-red-100'} text-sm font-medium uppercase tracking-wide`}>
              Current Month Balance
            </p>
            <h1 className="text-6xl font-bold text-white mt-2">
              {currentMonthBalance >= 0 ? '+' : ''}{currencySymbol}{currentMonthBalance.toFixed(2)}
            </h1>
            <p className={`${currentMonthBalance >= 0 ? 'text-green-200' : 'text-red-200'} text-sm mt-2`}>
              {format(selectedMonth, "MMMM yyyy")} • Income {currencySymbol}{monthlyIncome.toFixed(2)} - Outgoing {currencySymbol}{totalOutgoing.toFixed(2)}
            </p>
          </div>
          <DollarSign className={`w-24 h-24 ${currentMonthBalance >= 0 ? 'text-green-200/30' : 'text-red-200/30'}`} />
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-6 shadow-xl border border-green-500/50"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-10 h-10 text-green-100" />
            <span className="text-xs text-green-100 font-semibold uppercase">Income</span>
          </div>
          <p className="text-3xl font-bold text-white">{currencySymbol}{monthlyIncome.toFixed(2)}</p>
          <p className="text-green-200 text-sm mt-1">{monthlyTransactions.filter(t => t.type === "income").length} transactions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-red-600 to-rose-700 rounded-xl p-6 shadow-xl border border-red-500/50"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingDown className="w-10 h-10 text-red-100" />
            <span className="text-xs text-red-100 font-semibold uppercase">Expense</span>
          </div>
          <p className="text-3xl font-bold text-white">{currencySymbol}{monthlyExpenses.toFixed(2)}</p>
          <p className="text-red-200 text-sm mt-1">{monthlyTransactions.filter(t => t.type === "expense").length} transactions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-600 to-amber-700 rounded-xl p-6 shadow-xl border border-orange-500/50"
        >
          <div className="flex items-center justify-between mb-3">
            <Receipt className="w-10 h-10 text-orange-100" />
            <span className="text-xs text-orange-100 font-semibold uppercase">Bills</span>
          </div>
          <p className="text-3xl font-bold text-white">{currencySymbol}{monthlyBills.toFixed(2)}</p>
          <p className="text-orange-200 text-sm mt-1">{monthlyTransactions.filter(t => t.type === "bills").length} transactions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-xl p-6 shadow-xl border border-purple-500/50"
        >
          <div className="flex items-center justify-between mb-3">
            <CreditCard className="w-10 h-10 text-purple-100" />
            <span className="text-xs text-purple-100 font-semibold uppercase">Debt</span>
          </div>
          <p className="text-3xl font-bold text-white">{currencySymbol}{monthlyDebtPayment.toFixed(2)}</p>
          <p className="text-purple-200 text-sm mt-1">{monthlyTransactions.filter(t => t.type === "debt_payment").length} transactions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-600 to-cyan-700 rounded-xl p-6 shadow-xl border border-blue-500/50"
        >
          <div className="flex items-center justify-between mb-3">
            <PiggyBank className="w-10 h-10 text-blue-100" />
            <span className="text-xs text-blue-100 font-semibold uppercase">Savings</span>
          </div>
          <p className="text-3xl font-bold text-white">{currencySymbol}{monthlySavings.toFixed(2)}</p>
          <p className="text-blue-200 text-sm mt-1">{monthlyTransactions.filter(t => t.type === "savings").length} transactions</p>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart - Money Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-purple-400" />
            Money Distribution
          </h3>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: any) => `${currencySymbol}${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">No data for this month</p>
            </div>
          )}
        </motion.div>

        {/* Bar Chart - Expense Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <TrendingDown className="w-6 h-6 text-red-400" />
            Top Expenses by Category
          </h3>
          <p className="text-gray-400 text-sm mb-4">Includes Expenses, Bills & Debt Payments</p>
          {combinedExpensesData().length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={combinedExpensesData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    border: '1px solid rgba(55, 65, 81, 0.8)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '8px 12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                  }}
                  formatter={(value: any) => [`${currencySymbol}${value.toFixed(2)}`, 'Amount']}
                  labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                  animationDuration={200}
                />
                <Bar
                  dataKey="value"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                  animationBegin={0}
                  activeBar={{
                    fill: 'url(#activeGradient)',
                    stroke: '#fff',
                    strokeWidth: 2,
                    filter: 'brightness(1.3)',
                  }}
                >
                  {combinedExpensesData().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(${index * 45}, 70%, 50%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">No expenses, bills, or debt payments this month</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Additional Charts - Budget, Income/Expense, Investments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
        >
          <BudgetChart />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.54 }}
        >
          <IncomeExpenseChart />
        </motion.div>
      </div>

      {/* Investments Chart - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.56 }}
        className="mb-8"
      >
        <InvestmentsChart />
      </motion.div>

      {/* Category Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Income Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-gradient-to-br from-green-900/30 to-gray-900 rounded-2xl p-6 border border-green-700/50 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">Income Categories</h3>
              <p className="text-green-400 text-sm">{currencySymbol}{monthlyIncome.toFixed(2)}</p>
            </div>
          </div>
          <div className="space-y-2">
            {categoryData("income").map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <span className="text-gray-300">{item.name}</span>
                <span className="text-green-400 font-semibold">{currencySymbol}{item.value.toFixed(2)}</span>
              </motion.div>
            ))}
            {categoryData("income").length === 0 && (
              <p className="text-gray-500 text-center py-4">No income this month</p>
            )}
          </div>
        </motion.div>

        {/* Bills Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-orange-900/30 to-gray-900 rounded-2xl p-6 border border-orange-700/50 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Receipt className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">Bills Categories</h3>
              <p className="text-orange-400 text-sm">{currencySymbol}{monthlyBills.toFixed(2)}</p>
            </div>
          </div>
          <div className="space-y-2">
            {categoryData("bills").map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + index * 0.05 }}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <span className="text-gray-300">{item.name}</span>
                <span className="text-orange-400 font-semibold">{currencySymbol}{item.value.toFixed(2)}</span>
              </motion.div>
            ))}
            {categoryData("bills").length === 0 && (
              <p className="text-gray-500 text-center py-4">No bills this month</p>
            )}
          </div>
        </motion.div>

        {/* Debt Payment Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-gradient-to-br from-purple-900/30 to-gray-900 rounded-2xl p-6 border border-purple-700/50 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">Debt Payments</h3>
              <p className="text-purple-400 text-sm">{currencySymbol}{monthlyDebtPayment.toFixed(2)}</p>
            </div>
          </div>
          <div className="space-y-2">
            {categoryData("debt_payment").map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <span className="text-gray-300">{item.name}</span>
                <span className="text-purple-400 font-semibold">{currencySymbol}{item.value.toFixed(2)}</span>
              </motion.div>
            ))}
            {categoryData("debt_payment").length === 0 && (
              <p className="text-gray-500 text-center py-4">No debt payments this month</p>
            )}
          </div>
        </motion.div>

        {/* Savings Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-blue-900/30 to-gray-900 rounded-2xl p-6 border border-blue-700/50 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <PiggyBank className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">Savings Categories</h3>
              <p className="text-blue-400 text-sm">{currencySymbol}{monthlySavings.toFixed(2)}</p>
            </div>
          </div>
          <div className="space-y-2">
            {categoryData("savings").map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 + index * 0.05 }}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <span className="text-gray-300">{item.name}</span>
                <span className="text-blue-400 font-semibold">{currencySymbol}{item.value.toFixed(2)}</span>
              </motion.div>
            ))}
            {categoryData("savings").length === 0 && (
              <p className="text-gray-500 text-center py-4">No savings this month</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Wallets */}
      {wallets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
        >
          <h3 className="text-xl font-bold text-white mb-6">Your Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {wallets.map((wallet, index) => (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.05 }}
                className="p-5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border-l-4 hover:scale-105 transition-transform"
                style={{ borderLeftColor: wallet.color }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm font-medium">{wallet.name}</p>
                  <span className="text-xs text-gray-500 uppercase font-semibold">{wallet.currency}</span>
                </div>
                <p className="text-3xl font-bold text-white">{currencySymbol}{wallet.current_balance.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Started: {currencySymbol}{wallet.beginning_balance.toFixed(2)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
