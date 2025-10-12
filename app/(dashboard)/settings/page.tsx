"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Lock, Palette, Globe, Save } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getUserSettings, updateUserSettings, CURRENCIES } from "@/lib/api/userSettings";

export default function SettingsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    currency: "CAD",
    language: "English",
    notifications: {
      email: true,
      push: false,
      budgetAlerts: true,
      transactionAlerts: true,
    },
    theme: "dark",
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await getUserSettings(user!.id);
      if (userSettings) {
        setSettings({
          ...settings,
          currency: userSettings.default_currency || "CAD",
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateUserSettings(user!.id, {
        default_currency: settings.currency,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading settings...</p>
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-400 to-slate-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-400 mt-2">Manage your account preferences</p>
      </motion.div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={user?.fullName || user?.firstName || ""}
                disabled
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Managed by your Clerk account</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.primaryEmailAddress?.emailAddress || ""}
                disabled
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Managed by your Clerk account</p>
            </div>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Preferences</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Default Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) =>
                  setSettings({ ...settings, currency: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) =>
                  setSettings({ ...settings, language: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-sm text-gray-400">Receive updates via email</p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      email: !settings.notifications.email,
                    },
                  })
                }
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.notifications.email ? "bg-green-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifications.email ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Push Notifications</p>
                <p className="text-sm text-gray-400">Receive push notifications</p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      push: !settings.notifications.push,
                    },
                  })
                }
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.notifications.push ? "bg-green-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifications.push ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Budget Alerts</p>
                <p className="text-sm text-gray-400">
                  Alert when approaching budget limits
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      budgetAlerts: !settings.notifications.budgetAlerts,
                    },
                  })
                }
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.notifications.budgetAlerts ? "bg-green-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifications.budgetAlerts
                      ? "translate-x-7"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Transaction Alerts</p>
                <p className="text-sm text-gray-400">
                  Alert for new transactions
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      transactionAlerts: !settings.notifications.transactionAlerts,
                    },
                  })
                }
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.notifications.transactionAlerts
                    ? "bg-green-500"
                    : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifications.transactionAlerts
                      ? "translate-x-7"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Appearance</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Theme
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSettings({ ...settings, theme: "dark" })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  settings.theme === "dark"
                    ? "border-pink-500 bg-gray-800"
                    : "border-gray-700 bg-gray-800/50 hover:bg-gray-800"
                }`}
              >
                <div className="w-full h-20 bg-gradient-to-br from-gray-900 to-black rounded-lg mb-2" />
                <p className="text-white font-medium">Dark</p>
              </button>
              <button
                onClick={() => setSettings({ ...settings, theme: "light" })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  settings.theme === "light"
                    ? "border-pink-500 bg-gray-800"
                    : "border-gray-700 bg-gray-800/50 hover:bg-gray-800"
                }`}
              >
                <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-white rounded-lg mb-2" />
                <p className="text-white font-medium">Light</p>
                <p className="text-xs text-gray-500">(Coming soon)</p>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-end"
      >
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-8 py-4 rounded-lg font-medium transition-all ${
            isSaved
              ? "bg-green-600 text-white"
              : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg"
          }`}
        >
          <Save className="w-5 h-5" />
          {isSaved ? "Saved!" : "Save Changes"}
        </button>
      </motion.div>
    </div>
  );
}
