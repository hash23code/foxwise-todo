"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, TrendingUp, TrendingDown, Calendar, DollarSign, Pencil, Trash2, RefreshCw, Receipt, CreditCard, PiggyBank } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { getTransactions, getTransactionsByDateRange, updateTransaction, deleteTransaction } from "@/lib/api/transactions";

interface Transaction {
  id: string;
  type: "income" | "expense" | "bills" | "debt_payment" | "savings";
  category: string;
  amount: number;
  description: string | null;
  date: Date;
  is_recurring: boolean;
  recurring_frequency: "daily" | "weekly" | "monthly" | "yearly" | null;
  recurring_end_date: Date | null;
}

export default function TransactionsPage() {
  const { user } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "bills" | "debt_payment" | "savings">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "month" | "year">("all");
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, filterPeriod, selectedDate]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      let data;

      if (filterPeriod === "month") {
        const start = format(startOfMonth(selectedDate), "yyyy-MM-dd");
        const end = format(endOfMonth(selectedDate), "yyyy-MM-dd");
        data = await getTransactionsByDateRange(user!.id, start, end);
      } else if (filterPeriod === "year") {
        const start = format(startOfYear(selectedDate), "yyyy-MM-dd");
        const end = format(endOfYear(selectedDate), "yyyy-MM-dd");
        data = await getTransactionsByDateRange(user!.id, start, end);
      } else {
        data = await getTransactions(user!.id);
      }

      setTransactions(data.map(t => ({
        ...t,
        date: new Date(t.date),
        recurring_end_date: t.recurring_end_date ? new Date(t.recurring_end_date) : null,
      })));
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await deleteTransaction(id);
      await loadTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  const filteredTransactions = transactions
    .filter((t) => {
      const matchesSearch =
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === "all" || t.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return b.date.getTime() - a.date.getTime();
      }
      return b.amount - a.amount;
    });

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense" || t.type === "bills" || t.type === "debt_payment")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = filteredTransactions
    .filter((t) => t.type === "savings")
    .reduce((sum, t) => sum + t.amount, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "income": return <TrendingUp className="w-6 h-6 text-white" />;
      case "expense": return <TrendingDown className="w-6 h-6 text-white" />;
      case "bills": return <Receipt className="w-6 h-6 text-white" />;
      case "debt_payment": return <CreditCard className="w-6 h-6 text-white" />;
      case "savings": return <PiggyBank className="w-6 h-6 text-white" />;
      default: return <TrendingDown className="w-6 h-6 text-white" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income": return "from-green-500 to-green-600";
      case "expense": return "from-red-500 to-red-600";
      case "bills": return "from-orange-500 to-orange-600";
      case "debt_payment": return "from-purple-500 to-purple-600";
      case "savings": return "from-blue-500 to-blue-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  const getTypeTextColor = (type: string) => {
    switch (type) {
      case "income": return "text-green-400";
      case "expense": return "text-red-400";
      case "bills": return "text-orange-400";
      case "debt_payment": return "text-purple-400";
      case "savings": return "text-blue-400";
      default: return "text-gray-400";
    }
  };

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case "income": return "bg-green-500/20 text-green-300";
      case "expense": return "bg-red-500/20 text-red-300";
      case "bills": return "bg-orange-500/20 text-orange-300";
      case "debt_payment": return "bg-purple-500/20 text-purple-300";
      case "savings": return "bg-blue-500/20 text-blue-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const changePeriod = (direction: "prev" | "next") => {
    if (filterPeriod === "month") {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
      setSelectedDate(newDate);
    } else if (filterPeriod === "year") {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(newDate.getFullYear() + (direction === "next" ? 1 : -1));
      setSelectedDate(newDate);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
          Transactions
        </h1>
        <p className="text-gray-400 mt-2">View and filter all your transactions</p>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Transactions</p>
              <p className="text-3xl font-bold text-white mt-1">
                {filteredTransactions.length}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-orange-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Income</p>
              <p className="text-3xl font-bold text-white mt-1">
                ${totalIncome.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-100" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Spent</p>
              <p className="text-3xl font-bold text-white mt-1">
                ${totalExpense.toFixed(2)}
              </p>
            </div>
            <TrendingDown className="w-12 h-12 text-red-100" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Saved</p>
              <p className="text-3xl font-bold text-white mt-1">
                ${totalSavings.toFixed(2)}
              </p>
            </div>
            <PiggyBank className="w-12 h-12 text-blue-100" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Filter by Type */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 appearance-none"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="bills">Bills</option>
              <option value="debt_payment">Debt Payment</option>
              <option value="savings">Savings</option>
            </select>
          </div>

          {/* Sort */}
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 appearance-none"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>
          </div>

          {/* Period Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterPeriod}
              onChange={(e) => {
                setFilterPeriod(e.target.value as any);
                setSelectedDate(new Date());
              }}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 appearance-none"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Period Navigation */}
        {(filterPeriod === "month" || filterPeriod === "year") && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => changePeriod("prev")}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Previous
            </button>
            <span className="text-white font-medium">
              {filterPeriod === "month"
                ? format(selectedDate, "MMMM yyyy")
                : format(selectedDate, "yyyy")}
            </span>
            <button
              onClick={() => changePeriod("next")}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </motion.div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTransactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${getTypeColor(transaction.type)}`}>
                  {getTypeIcon(transaction.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {transaction.category}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeBgColor(transaction.type)}`}>
                      {transaction.type.replace('_', ' ')}
                    </span>
                    {transaction.is_recurring && (
                      <span className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                        <RefreshCw className="w-3 h-3" />
                        {transaction.recurring_frequency}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{transaction.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    <p className="text-xs text-gray-500">
                      {format(transaction.date, "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`text-3xl font-bold ${getTypeTextColor(transaction.type)}`}>
                    {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(transaction.id)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-gray-400 text-lg">No transactions found</p>
        </motion.div>
      )}
    </div>
  );
}
