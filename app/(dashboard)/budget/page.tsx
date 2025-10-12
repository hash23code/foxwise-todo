"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Receipt, CreditCard, PiggyBank } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getBudgets, createBudget, updateBudget, deleteBudget } from "@/lib/api/budgets";
import { getTransactions } from "@/lib/api/transactions";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

interface Budget {
  id: string;
  category: string;
  amount: number;
  period: "monthly" | "yearly";
  parent_type: "income" | "expense" | "bills" | "debt_payment" | "savings";
  spent: number;
}

export default function BudgetPage() {
  const { user } = useUser();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    period: "monthly" as "monthly" | "yearly",
    parent_type: "expense" as "income" | "expense" | "bills" | "debt_payment" | "savings",
  });

  useEffect(() => {
    if (user) {
      loadBudgets();
    }
  }, [user]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const [budgetsData, transactionsData] = await Promise.all([
        getBudgets(user!.id),
        getTransactions(user!.id)
      ]);

      // Calculate spent for each budget based on parent_type
      const budgetsWithSpent = budgetsData.map((budget) => {
        const now = new Date();
        let start: Date, end: Date;

        if (budget.period === "monthly") {
          start = startOfMonth(now);
          end = endOfMonth(now);
        } else {
          start = startOfYear(now);
          end = endOfYear(now);
        }

        // Sum transactions matching this budget's category AND parent_type
        const spent = transactionsData
          .filter((t) => {
            const transactionDate = new Date(t.date);
            return (
              t.type === budget.parent_type &&
              t.category.toLowerCase() === budget.category.toLowerCase() &&
              transactionDate >= start &&
              transactionDate <= end
            );
          })
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          ...budget,
          spent
        };
      });

      setBudgets(budgetsWithSpent);
    } catch (error) {
      console.error("Error loading budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          category: formData.category,
          amount: Number(formData.amount),
          period: formData.period,
          parent_type: formData.parent_type,
        });
      } else {
        await createBudget({
          user_id: user!.id,
          category: formData.category,
          amount: Number(formData.amount),
          period: formData.period,
          parent_type: formData.parent_type,
        });
      }
      await loadBudgets();
      setIsModalOpen(false);
      setEditingBudget(null);
      setFormData({ category: "", amount: "", period: "monthly", parent_type: "expense" });
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("Failed to save budget. Please try again.");
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      parent_type: budget.parent_type,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    try {
      await deleteBudget(id);
      await loadBudgets();
    } catch (error) {
      console.error("Error deleting budget:", error);
      alert("Failed to delete budget. Please try again.");
    }
  };

  const getProgressColor = (spent: number, amount: number) => {
    const percentage = (spent / amount) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "income": return <TrendingUp className="w-6 h-6 text-green-400" />;
      case "expense": return <TrendingDown className="w-6 h-6 text-red-400" />;
      case "bills": return <Receipt className="w-6 h-6 text-orange-400" />;
      case "debt_payment": return <CreditCard className="w-6 h-6 text-purple-400" />;
      case "savings": return <PiggyBank className="w-6 h-6 text-blue-400" />;
      default: return <TrendingDown className="w-6 h-6 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income": return "bg-green-500/20";
      case "expense": return "bg-red-500/20";
      case "bills": return "bg-orange-500/20";
      case "debt_payment": return "bg-purple-500/20";
      case "savings": return "bg-blue-500/20";
      default: return "bg-gray-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading budgets...</p>
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Budget Management
          </h1>
          <p className="text-gray-400 mt-2">Track budgets for income, expenses, bills, debt & savings</p>
        </div>
        <button
          onClick={() => {
            setEditingBudget(null);
            setFormData({ category: "", amount: "", period: "monthly", parent_type: "expense" });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Budget
        </button>
      </motion.div>

      {/* Budget List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget, index) => {
          const percentage = (budget.spent / budget.amount) * 100;
          return (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${getTypeColor(budget.parent_type)}`}>
                    {getTypeIcon(budget.parent_type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{budget.category}</h3>
                    <p className="text-sm text-gray-400 capitalize">{budget.parent_type.replace('_', ' ')} • {budget.period}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Spent</span>
                  <span className="text-white font-medium">
                    ${budget.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`h-full ${getProgressColor(budget.spent, budget.amount)}`}
                  />
                </div>
                <p className="text-sm text-gray-400">
                  {percentage.toFixed(0)}% used
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-700">
          <p className="text-gray-400 text-lg">No budgets yet</p>
          <p className="text-gray-500 text-sm mt-2">Create your first budget to start tracking</p>
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
            className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingBudget ? "Edit Budget" : "Add New Budget"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Budget Type
                </label>
                <select
                  value={formData.parent_type}
                  onChange={(e) => setFormData({ ...formData, parent_type: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="income">💰 Income Budget</option>
                  <option value="expense">💳 Expense Budget</option>
                  <option value="bills">🧾 Bills Budget</option>
                  <option value="debt_payment">💸 Debt Payment Budget</option>
                  <option value="savings">🏦 Savings Goal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g., Food, Rent, Emergency Fund"
                  required
                />
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
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as "monthly" | "yearly" })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {editingBudget ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
