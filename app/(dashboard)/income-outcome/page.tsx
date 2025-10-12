"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, Calendar, Pencil, Trash2, RefreshCw, Receipt, CreditCard, PiggyBank, FileText, Wallet } from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from "@/lib/api/transactions";
import { getWallets } from "@/lib/api/wallets";
import { getBudgets } from "@/lib/api/budgets";
import { getCurrencySymbol } from "@/lib/api/userSettings";

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
  wallet_id: string | null;
  budget_id: string | null;
}

interface WalletType {
  id: string;
  name: string;
  currency: string;
}

interface Budget {
  id: string;
  category: string;
  parent_type: string;
}

export default function IncomeOutcomePage() {
  const { user } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense" | "bills" | "debt_payment" | "savings">("all");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense" | "bills" | "debt_payment" | "savings",
    category: "",
    amount: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    wallet_id: "",
    is_recurring: false,
    recurring_frequency: null as "daily" | "weekly" | "monthly" | "yearly" | null,
    recurring_end_date: "",
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, walletsData, budgetsData] = await Promise.all([
        getTransactions(user!.id),
        getWallets(user!.id),
        getBudgets(user!.id)
      ]);

      setTransactions(transactionsData.map(t => ({
        ...t,
        date: new Date(t.date),
        recurring_end_date: t.recurring_end_date ? new Date(t.recurring_end_date) : null,
      })));
      setWallets(walletsData);
      setBudgets(budgetsData);

      if (walletsData.length > 0 && !formData.wallet_id) {
        setFormData(prev => ({ ...prev, wallet_id: walletsData[0].id }));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const matchingBudget = budgets.find(b =>
        b.category.toLowerCase() === formData.category.toLowerCase() &&
        b.parent_type === formData.type
      );

      const transactionData = {
        user_id: user.id,
        type: formData.type,
        category: formData.category,
        amount: Number(formData.amount),
        description: formData.description || null,
        date: formData.date + 'T12:00:00', // Add noon time to avoid timezone issues
        wallet_id: formData.wallet_id || null,
        budget_id: matchingBudget ? matchingBudget.id : null,
        is_recurring: formData.is_recurring,
        recurring_frequency: formData.is_recurring ? formData.recurring_frequency : null,
        recurring_end_date: formData.is_recurring && formData.recurring_end_date ? formData.recurring_end_date + 'T12:00:00' : null,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, transactionData);
      } else {
        await createTransaction(transactionData);
      }

      await loadData();
      setIsModalOpen(false);
      setEditingTransaction(null);
      resetForm();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert(`Failed to save transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      description: transaction.description || "",
      date: format(transaction.date, "yyyy-MM-dd"),
      wallet_id: transaction.wallet_id || (wallets.length > 0 ? wallets[0].id : ""),
      is_recurring: transaction.is_recurring,
      recurring_frequency: transaction.recurring_frequency,
      recurring_end_date: transaction.recurring_end_date ? format(transaction.recurring_end_date, "yyyy-MM-dd") : "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await deleteTransaction(id);
      await loadData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      type: "income",
      category: "",
      amount: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      wallet_id: wallets.length > 0 ? wallets[0].id : "",
      is_recurring: false,
      recurring_frequency: null,
      recurring_end_date: "",
    });
  };

  const filteredTransactions = transactions.filter((t) =>
    activeTab === "all" ? true : t.type === activeTab
  );

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const totalBills = transactions.filter((t) => t.type === "bills").reduce((sum, t) => sum + t.amount, 0);
  const totalDebtPayment = transactions.filter((t) => t.type === "debt_payment").reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = transactions.filter((t) => t.type === "savings").reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - (totalExpense + totalBills + totalDebtPayment);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "income": return <TrendingUp className="w-6 h-6 text-green-400" />;
      case "expense": return <TrendingDown className="w-6 h-6 text-red-400" />;
      case "bills": return <Receipt className="w-6 h-6 text-orange-400" />;
      case "debt_payment": return <CreditCard className="w-6 h-6 text-purple-400" />;
      case "savings": return <PiggyBank className="w-6 h-6 text-blue-400" />;
      default: return <FileText className="w-6 h-6 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case "income": return "bg-green-500/20";
      case "expense": return "bg-red-500/20";
      case "bills": return "bg-orange-500/20";
      case "debt_payment": return "bg-purple-500/20";
      case "savings": return "bg-blue-500/20";
      default: return "bg-gray-500/20";
    }
  };

  const getTypeTextColor = (type: string) => {
    switch(type) {
      case "income": return "text-green-400";
      case "expense": return "text-red-400";
      case "bills": return "text-orange-400";
      case "debt_payment": return "text-purple-400";
      case "savings": return "text-blue-400";
      default: return "text-gray-400";
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
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Transactions
          </h1>
          <p className="text-gray-400 mt-2">Track your income, expenses, bills, debt payments & savings</p>
        </div>
        <button
          onClick={() => {
            setEditingTransaction(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-green-100 text-sm">Income</span>
            <TrendingUp className="w-5 h-5 text-green-100" />
          </div>
          <p className="text-2xl font-bold text-white">${totalIncome.toFixed(2)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }} className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-red-100 text-sm">Expenses</span>
            <TrendingDown className="w-5 h-5 text-red-100" />
          </div>
          <p className="text-2xl font-bold text-white">${totalExpense.toFixed(2)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-orange-100 text-sm">Bills</span>
            <Receipt className="w-5 h-5 text-orange-100" />
          </div>
          <p className="text-2xl font-bold text-white">${totalBills.toFixed(2)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-purple-100 text-sm">Debt Payment</span>
            <CreditCard className="w-5 h-5 text-purple-100" />
          </div>
          <p className="text-2xl font-bold text-white">${totalDebtPayment.toFixed(2)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-blue-100 text-sm">Savings</span>
            <PiggyBank className="w-5 h-5 text-blue-100" />
          </div>
          <p className="text-2xl font-bold text-white">${totalSavings.toFixed(2)}</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-700 overflow-x-auto">
        {(["all", "income", "expense", "bills", "debt_payment", "savings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-4 font-medium capitalize whitespace-nowrap transition-colors relative ${
              activeTab === tab ? "text-green-400" : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.replace('_', ' ')}
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400"
              />
            )}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTransactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className={`p-3 rounded-lg ${getTypeColor(transaction.type)}`}>
                  {getTypeIcon(transaction.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{transaction.category}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(transaction.type)} ${getTypeTextColor(transaction.type)} capitalize`}>
                      {transaction.type.replace('_', ' ')}
                    </span>
                    {transaction.is_recurring && (
                      <span className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                        <RefreshCw className="w-3 h-3" />
                        {transaction.recurring_frequency}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{transaction.description || "No description"}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(transaction.date, "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getTypeTextColor(transaction.type)}`}>
                    {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(transaction)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No transactions found. Add your first transaction!</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingTransaction ? "Edit Transaction" : "Add Transaction"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  <option value="income">💰 Income</option>
                  <option value="expense">💳 Expense</option>
                  <option value="bills">🧾 Bills</option>
                  <option value="debt_payment">💸 Debt Payment</option>
                  <option value="savings">🏦 Savings</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Wallet / Account
                </label>
                <select
                  value={formData.wallet_id}
                  onChange={(e) => setFormData({ ...formData, wallet_id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  required
                >
                  {wallets.length === 0 ? (
                    <option value="">No wallets available - create one first</option>
                  ) : (
                    wallets.map(wallet => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name} ({wallet.currency})
                      </option>
                    ))
                  )}
                </select>
                {wallets.length === 0 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Go to Wallets page to create your first wallet
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  list="category-suggestions"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="e.g., Salary, Food, Rent"
                  required
                />
                <datalist id="category-suggestions">
                  {budgets
                    .filter(b => b.parent_type === formData.type)
                    .map(b => (
                      <option key={b.id} value={b.category} />
                    ))}
                </datalist>
                {budgets.filter(b => b.parent_type === formData.type).length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Type to see suggestions from your budgets or enter a new category
                  </p>
                )}
                {budgets.some(b => b.category.toLowerCase() === formData.category.toLowerCase() && b.parent_type === formData.type) && (
                  <p className="text-xs text-green-400 mt-1">
                    ✓ Will be linked to your "{formData.category}" budget
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="Brief description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  required
                />
              </div>

              {/* Recurring Transaction Options */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="w-4 h-4 bg-gray-800 border-gray-700 rounded"
                  />
                  <label htmlFor="is_recurring" className="text-sm font-medium text-gray-400">
                    Recurring Transaction
                  </label>
                </div>

                {formData.is_recurring && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Frequency
                      </label>
                      <select
                        value={formData.recurring_frequency || ""}
                        onChange={(e) => setFormData({ ...formData, recurring_frequency: e.target.value as any })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                        required={formData.is_recurring}
                      >
                        <option value="">Select frequency</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.recurring_end_date}
                        onChange={(e) => setFormData({ ...formData, recurring_end_date: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTransaction(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all"
                  disabled={wallets.length === 0}
                >
                  {editingTransaction ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
