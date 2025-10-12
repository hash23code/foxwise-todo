"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, PiggyBank, Pencil, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { getInvestments, createInvestment, updateInvestment, deleteInvestment } from "@/lib/api/investments";
import { batchGetPrices } from "@/lib/api/prices";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  purchaseDate: Date;
  symbol?: string;
  quantity?: number;
  purchasePricePerUnit?: number;
}

export default function InvestmentsPage() {
  const { user } = useUser();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    symbol: "",
    quantity: "",
    amount: "",
    purchaseDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [fetchingPrice, setFetchingPrice] = useState(false);

  useEffect(() => {
    if (user) {
      loadInvestments();
    }
  }, [user]);

  const loadInvestments = async () => {
    try {
      setLoading(true);
      const data = await getInvestments(user!.id);
      setInvestments(
        data.map((inv) => ({
          id: inv.id,
          name: inv.name,
          type: inv.type,
          amount: inv.amount,
          currentValue: inv.current_value,
          purchaseDate: new Date(inv.purchase_date),
          symbol: inv.symbol,
          quantity: inv.quantity,
          purchasePricePerUnit: inv.purchase_price_per_unit,
        }))
      );
    } catch (error) {
      console.error("Error loading investments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPrices = async () => {
    try {
      setRefreshing(true);

      const investmentsWithSymbols = investments.filter(inv => inv.symbol);

      if (investmentsWithSymbols.length === 0) {
        alert("No investments with ticker symbols found. Add a symbol when creating an investment to track prices!");
        return;
      }

      const pricesMap = await batchGetPrices(
        investmentsWithSymbols.map(inv => ({
          symbol: inv.symbol!,
          type: inv.type
        }))
      );

      const updatedInvestments = await Promise.all(
        investments.map(async (inv) => {
          if (!inv.symbol || !inv.quantity) return inv;

          const priceData = pricesMap.get(inv.symbol.toUpperCase());
          if (!priceData) return inv;

          const newCurrentValue = priceData.currentPrice * inv.quantity;

          try {
            await updateInvestment(inv.id, {
              user_id: user!.id,
              name: inv.name,
              type: inv.type,
              amount: inv.amount,
              current_value: newCurrentValue,
              purchase_date: format(inv.purchaseDate, "yyyy-MM-dd"),
              symbol: inv.symbol,
              quantity: inv.quantity,
              purchase_price_per_unit: inv.purchasePricePerUnit,
            });

            return {
              ...inv,
              currentValue: newCurrentValue,
            };
          } catch (error) {
            console.error(`Error updating investment ${inv.name}:`, error);
            return inv;
          }
        })
      );

      setInvestments(updatedInvestments);
      alert("Prices refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing prices:", error);
      alert("Failed to refresh prices. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFetchingPrice(true);

      let finalAmount = Number(formData.amount);
      let finalCurrentValue = finalAmount; // Initially same as invested
      let quantity = formData.quantity ? Number(formData.quantity) : undefined;
      let purchasePricePerUnit = undefined;

      // Calculate purchase price per unit if quantity provided
      if (quantity && finalAmount > 0) {
        purchasePricePerUnit = finalAmount / quantity;
        finalCurrentValue = finalAmount; // Will be updated on refresh
      }

      // If symbol and quantity provided, fetch current price to set initial current value
      if (formData.symbol && quantity) {
        const { getInvestmentPrice } = await import("@/lib/api/prices");
        const priceData = await getInvestmentPrice(
          formData.symbol,
          formData.type,
          process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY
        );

        if (priceData) {
          finalCurrentValue = quantity * priceData.currentPrice;
        }
      }

      if (editingInvestment) {
        const updated = await updateInvestment(editingInvestment.id, {
          user_id: user!.id,
          name: formData.name,
          type: formData.type,
          amount: finalAmount,
          current_value: finalCurrentValue,
          purchase_date: formData.purchaseDate,
          symbol: formData.symbol || undefined,
          quantity: quantity,
          purchase_price_per_unit: purchasePricePerUnit,
        });
        setInvestments(
          investments.map((inv) =>
            inv.id === editingInvestment.id
              ? {
                  id: updated.id,
                  name: updated.name,
                  type: updated.type,
                  amount: updated.amount,
                  currentValue: updated.current_value,
                  purchaseDate: new Date(updated.purchase_date),
                  symbol: updated.symbol,
                  quantity: updated.quantity,
                  purchasePricePerUnit: updated.purchase_price_per_unit,
                }
              : inv
          )
        );
      } else {
        const newInvestment = await createInvestment({
          user_id: user!.id,
          name: formData.name,
          type: formData.type,
          amount: finalAmount,
          current_value: finalCurrentValue,
          purchase_date: formData.purchaseDate,
          symbol: formData.symbol || undefined,
          quantity: quantity,
          purchase_price_per_unit: purchasePricePerUnit,
        });
        setInvestments([
          ...investments,
          {
            id: newInvestment.id,
            name: newInvestment.name,
            type: newInvestment.type,
            amount: newInvestment.amount,
            currentValue: newInvestment.current_value,
            purchaseDate: new Date(newInvestment.purchase_date),
            symbol: newInvestment.symbol,
            quantity: newInvestment.quantity,
            purchasePricePerUnit: newInvestment.purchase_price_per_unit,
          },
        ]);
      }
      setIsModalOpen(false);
      setEditingInvestment(null);
      setFormData({
        name: "",
        type: "",
        symbol: "",
        quantity: "",
        amount: "",
        purchaseDate: format(new Date(), "yyyy-MM-dd"),
      });
    } catch (error) {
      console.error("Error saving investment:", error);
      alert("Failed to save investment. Please try again.");
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setFormData({
      name: investment.name,
      type: investment.type,
      symbol: investment.symbol || "",
      quantity: investment.quantity?.toString() || "",
      amount: investment.amount.toString(),
      purchaseDate: format(investment.purchaseDate, "yyyy-MM-dd"),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this investment?")) return;

    try {
      await deleteInvestment(id);
      setInvestments(investments.filter((inv) => inv.id !== id));
    } catch (error) {
      console.error("Error deleting investment:", error);
      alert("Failed to delete investment. Please try again.");
    }
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalGain = totalValue - totalInvested;
  const totalGainPercentage = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : "0.00";

  // Prepare chart data
  const chartData = investments.map((inv, index) => ({
    name: inv.name,
    value: inv.currentValue,
    color: `hsl(${index * 360 / investments.length}, 70%, 50%)`
  }));

  const COLORS = chartData.map(d => d.color);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading investments...</p>
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Investments
          </h1>
          <p className="text-gray-400 mt-2">Track your portfolio with real-time prices</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefreshPrices}
            disabled={refreshing}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Prices'}
          </button>
          <button
            onClick={() => {
              setEditingInvestment(null);
              setFormData({
                name: "",
                type: "",
                symbol: "",
                quantity: "",
                amount: "",
                purchaseDate: format(new Date(), "yyyy-MM-dd"),
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Investment
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Invested</span>
            <PiggyBank className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-white">${totalInvested.toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Current Value</span>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">${totalValue.toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`bg-gradient-to-br ${
            totalGain >= 0 ? "from-green-600 to-green-800" : "from-red-600 to-red-800"
          } rounded-2xl p-6 border border-gray-700`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/90 text-sm">Total Gain/Loss</span>
            {totalGain >= 0 ? (
              <TrendingUp className="w-5 h-5 text-white/90" />
            ) : (
              <TrendingDown className="w-5 h-5 text-white/90" />
            )}
          </div>
          <p className="text-3xl font-bold text-white">
            {totalGain >= 0 ? "+" : ""}${totalGain.toFixed(2)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`bg-gradient-to-br ${
            totalGain >= 0 ? "from-blue-600 to-blue-800" : "from-orange-600 to-orange-800"
          } rounded-2xl p-6 border border-gray-700`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/90 text-sm">Return</span>
            <TrendingUp className="w-5 h-5 text-white/90" />
          </div>
          <p className="text-3xl font-bold text-white">
            {totalGain >= 0 ? "+" : ""}{totalGainPercentage}%
          </p>
        </motion.div>
      </div>

      {/* Portfolio Distribution Chart */}
      {investments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Portfolio Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
                formatter={(value: any) => `$${Number(value).toFixed(2)}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Investment List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {investments.map((investment, index) => {
          const gain = investment.currentValue - investment.amount;
          const gainPercentage = ((gain / investment.amount) * 100).toFixed(2);
          const isPositive = gain >= 0;

          return (
            <motion.div
              key={investment.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                    <PiggyBank className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{investment.name}</h3>
                      {investment.symbol && (
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-mono rounded">
                          {investment.symbol.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{investment.type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(investment)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(investment.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {investment.quantity && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Quantity</span>
                    <span className="text-white font-medium">{investment.quantity.toFixed(8)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Invested</span>
                  <span className="text-white font-medium">${investment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Current Value</span>
                  <span className="text-white font-medium">${investment.currentValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Gain/Loss</span>
                  <span className={`font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                    {isPositive ? "+" : ""}${gain.toFixed(2)} ({isPositive ? "+" : ""}
                    {gainPercentage}%)
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                  <span className="text-gray-400 text-sm">Purchase Date</span>
                  <span className="text-gray-300 text-sm">
                    {format(investment.purchaseDate, "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {investments.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-700">
          <p className="text-gray-400 text-lg">No investments yet</p>
          <p className="text-gray-500 text-sm mt-2">Add your first investment to start tracking</p>
        </div>
      )}

      {/* Modal - SIMPLIFIED FORM */}
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingInvestment ? "Edit Investment" : "Add New Investment"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., Bitcoin, Apple Stock"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">Select type...</option>
                  <option value="Cryptocurrency">Cryptocurrency</option>
                  <option value="Stocks">Stocks</option>
                  <option value="ETF">ETF</option>
                  <option value="Bonds">Bonds</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Mutual Funds">Mutual Funds</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-300 text-sm mb-3 font-medium">
                  💡 Add ticker symbol for auto price tracking!
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Ticker Symbol (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                    placeholder="e.g., BTC, AAPL, ETH, TSLA"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Crypto (FREE): BTC, ETH, SOL, etc.<br/>
                    Stocks: AAPL, TSLA, GOOGL (requires API key)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Quantity / Units <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., 0.5 (for BTC), 100 (for stocks)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many units/shares did you actually buy? This ensures accurate gain/loss tracking.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Amount Invested
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="1000.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total amount you invested (in dollars)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseDate: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  required
                />
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
                  disabled={fetchingPrice}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {fetchingPrice ? "Calculating..." : editingInvestment ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
