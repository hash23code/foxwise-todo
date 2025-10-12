"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getWallets, createWallet, updateWallet, deleteWallet } from "@/lib/api/wallets";
import { getUserSettings, CURRENCIES, getCurrencySymbol } from "@/lib/api/userSettings";

interface Wallet {
  id: string;
  name: string;
  type: "main" | "savings" | "business" | "investment" | "other";
  currency: string;
  beginning_balance: number;
  current_balance: number;
  color: string;
  is_active: boolean;
}

export default function WalletsPage() {
  const { user } = useUser();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState("CAD");
  const [formData, setFormData] = useState({
    name: "",
    type: "main" as "main" | "savings" | "business" | "investment" | "other",
    currency: "CAD",
    beginning_balance: "",
    current_balance: "",
    color: "#6366f1",
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletsData, settings] = await Promise.all([
        getWallets(user!.id),
        getUserSettings(user!.id)
      ]);
      setWallets(walletsData);
      setDefaultCurrency(settings.default_currency);
      setFormData(prev => ({ ...prev, currency: settings.default_currency }));
    } catch (error) {
      console.error("Error loading wallets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWallet) {
        await updateWallet(editingWallet.id, {
          name: formData.name,
          type: formData.type,
          currency: formData.currency,
          beginning_balance: Number(formData.beginning_balance),
          current_balance: formData.current_balance ? Number(formData.current_balance) : Number(formData.beginning_balance),
          color: formData.color,
        });
      } else {
        await createWallet({
          user_id: user!.id,
          name: formData.name,
          type: formData.type,
          currency: formData.currency,
          beginning_balance: Number(formData.beginning_balance),
          color: formData.color,
        });
      }
      await loadData();
      setIsModalOpen(false);
      setEditingWallet(null);
      setFormData({
        name: "",
        type: "main",
        currency: defaultCurrency,
        beginning_balance: "",
        current_balance: "",
        color: "#6366f1",
      });
    } catch (error) {
      console.error("Error saving wallet:", error);
      alert("Failed to save wallet. Please try again.");
    }
  };

  const handleEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      type: wallet.type,
      currency: wallet.currency,
      beginning_balance: wallet.beginning_balance.toString(),
      current_balance: wallet.current_balance.toString(),
      color: wallet.color,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wallet?")) return;

    try {
      await deleteWallet(id);
      await loadData();
    } catch (error) {
      console.error("Error deleting wallet:", error);
      alert("Failed to delete wallet. Please try again.");
    }
  };

  const totalBalance = wallets.reduce((sum, w) => sum + w.current_balance, 0);

  const walletTypeLabels = {
    main: "Main Wallet",
    savings: "Savings Account",
    business: "Business Account",
    investment: "Investment Account",
    other: "Other",
  };

  const walletColors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#f97316", "#14b8a6", "#10b981", "#06b6d4"
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading wallets...</p>
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Wallets & Accounts
          </h1>
          <p className="text-gray-400 mt-2">Manage your multiple accounts and track balances</p>
        </div>
        <button
          onClick={() => {
            setEditingWallet(null);
            setFormData({
              name: "",
              type: "main",
              currency: defaultCurrency,
              beginning_balance: "",
              current_balance: "",
              color: "#6366f1",
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Wallet
        </button>
      </motion.div>

      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl p-8 border border-cyan-500/20 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-cyan-100 text-sm">Total Net Worth</p>
            <p className="text-5xl font-bold text-white mt-2">
              {getCurrencySymbol(defaultCurrency)}{totalBalance.toFixed(2)}
            </p>
            <p className="text-cyan-100 text-sm mt-2">Across {wallets.length} account{wallets.length !== 1 && 's'}</p>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl">
            <DollarSign className="w-16 h-16 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map((wallet, index) => {
          const diff = wallet.current_balance - wallet.beginning_balance;
          const diffPercent = wallet.beginning_balance !== 0
            ? ((diff / wallet.beginning_balance) * 100).toFixed(1)
            : "0";

          return (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
              style={{ borderColor: wallet.color + '40' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: wallet.color + '30' }}
                  >
                    <Wallet className="w-6 h-6" style={{ color: wallet.color }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{wallet.name}</h3>
                    <p className="text-sm text-gray-400">{walletTypeLabels[wallet.type]}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(wallet)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(wallet.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Current Balance</p>
                  <p className="text-3xl font-bold text-white">
                    {getCurrencySymbol(wallet.currency)}{wallet.current_balance.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                  {diff >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {diff >= 0 ? '+' : ''}{getCurrencySymbol(wallet.currency)}{diff.toFixed(2)} ({diffPercent}%)
                  </span>
                  <span className="text-xs text-gray-500">vs starting</span>
                </div>

                <div className="text-xs text-gray-500">
                  Started with: {getCurrencySymbol(wallet.currency)}{wallet.beginning_balance.toFixed(2)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {wallets.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-700"
        >
          <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No wallets yet</p>
          <p className="text-gray-500 text-sm mt-2">Create your first wallet to start tracking your finances</p>
        </motion.div>
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
              {editingWallet ? "Edit Wallet" : "Add New Wallet"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Wallet Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="e.g., Main Checking, Savings"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Account Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="main">Main Wallet</option>
                  <option value="savings">Savings Account</option>
                  <option value="business">Business Account</option>
                  <option value="investment">Investment Account</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Beginning Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.beginning_balance}
                  onChange={(e) => setFormData({ ...formData, beginning_balance: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The initial balance when you created this wallet
                </p>
              </div>

              {editingWallet && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Current Balance <span className="text-cyan-400">(Editable)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_balance}
                    onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-cyan-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Manually adjust your current balance
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {walletColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
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
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {editingWallet ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
