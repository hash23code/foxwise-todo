"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Lock, Palette, Globe, Save, FileText } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getUserSettings, updateUserSettings, CURRENCIES } from "@/lib/api/userSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { TIMEZONES } from "@/lib/user-timezone";

export default function SettingsPage() {
  const { user } = useUser();
  const { language, setLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    currency: "CAD",
    timezone: "America/Toronto",
    notifications: {
      email: true,
      push: false,
      budgetAlerts: true,
      transactionAlerts: true,
    },
    reports: {
      reportType: "ai-automated" as "standard" | "ai-automated",
      dailyReport: true,
      monthlyReport: true,
      dailyReportEmail: false,
      monthlyReportEmail: false,
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
      console.log('[Settings] Loading settings for user:', user?.id);

      // Load user settings from database with timeout
      let userSettings = null;
      try {
        const settingsPromise = getUserSettings(user!.id);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        userSettings = await Promise.race([settingsPromise, timeoutPromise]) as any;
        console.log('[Settings] User settings loaded:', userSettings);
      } catch (settingsError) {
        console.error('[Settings] Error loading user settings:', settingsError);
      }

      // Load user memory (including timezone) with timeout
      let userMemory = null;
      try {
        const memoryPromise = fetch('/api/user-memory');
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        const memoryResponse = await Promise.race([memoryPromise, timeoutPromise]) as Response;
        console.log('[Settings] Memory response status:', memoryResponse?.status);

        if (memoryResponse?.ok) {
          userMemory = await memoryResponse.json();
          console.log('[Settings] User memory loaded:', userMemory);
        }
      } catch (memoryError) {
        console.error('[Settings] Error loading user memory:', memoryError);
      }

      setSettings(prev => ({
        ...prev,
        theme: userSettings?.theme || "dark",
        timezone: userMemory?.timezone || "America/Toronto",
      }));

      console.log('[Settings] Settings updated successfully');
    } catch (error) {
      console.error("[Settings] Error loading settings:", error);
    } finally {
      setLoading(false);
      console.log('[Settings] Loading complete');
    }
  };

  const handleSave = async () => {
    try {
      // Language is already saved automatically via LanguageContext (localStorage)
      // Save theme and timezone to database

      // Save timezone to user_memory
      await fetch('/api/user-memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timezone: settings.timezone,
        }),
      });

      // Save theme to user_settings
      try {
        await updateUserSettings(user!.id, {
          theme: settings.theme as 'light' | 'dark',
        });
      } catch (dbError) {
        console.log("Database save skipped (table may not exist yet):", dbError);
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">{t.common.loading}...</p>
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
          {t.settings.title}
        </h1>
        <p className="text-gray-400 mt-2">{t.settings.subtitle}</p>
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
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
              <p className="text-xs text-green-500 mt-1">✓ Changes automatically</p>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {language === 'fr' ? 'Fuseau horaire' : 'Timezone'}
            </label>
            <select
              value={settings.timezone}
              onChange={(e) =>
                setSettings({ ...settings, timezone: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'fr'
                ? 'Utilisé pour les badges et les calculs de temps'
                : 'Used for badges and time calculations'}
            </p>
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

        {/* Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {language === 'fr' ? 'Rapports' : 'Reports'}
            </h2>
          </div>
          <div className="space-y-4">
            {/* Report Type Selection */}
            <div className="p-4 bg-gray-800/50 rounded-lg border-2 border-teal-500/30">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                {language === 'fr' ? 'Type de rapport' : 'Report Type'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      reports: {
                        ...settings.reports,
                        reportType: 'standard',
                      },
                    })
                  }
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    settings.reports.reportType === 'standard'
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      settings.reports.reportType === 'standard'
                        ? 'border-teal-500'
                        : 'border-gray-600'
                    }`}>
                      {settings.reports.reportType === 'standard' && (
                        <div className="w-3 h-3 rounded-full bg-teal-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {language === 'fr' ? 'Rapport Standard' : 'Standard Report'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {language === 'fr'
                          ? 'Format simple avec statistiques de base'
                          : 'Simple format with basic statistics'}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      reports: {
                        ...settings.reports,
                        reportType: 'ai-automated',
                      },
                    })
                  }
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    settings.reports.reportType === 'ai-automated'
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      settings.reports.reportType === 'ai-automated'
                        ? 'border-teal-500'
                        : 'border-gray-600'
                    }`}>
                      {settings.reports.reportType === 'ai-automated' && (
                        <div className="w-3 h-3 rounded-full bg-teal-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium flex items-center gap-2">
                        {language === 'fr' ? 'Rapport IA Automatisé' : 'AI Automated Report'}
                        <span className="text-[10px] bg-yellow-400 text-teal-900 px-1.5 py-0.5 rounded-full font-bold">AI</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {language === 'fr'
                          ? 'Analyses intelligentes et recommandations personnalisées'
                          : 'Smart insights and personalized recommendations'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Daily Report */}
            <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">
                    {language === 'fr' ? 'Rapport Quotidien' : 'Daily Report'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {language === 'fr'
                      ? 'Reçois un résumé de ta journée à 23h'
                      : 'Receive a summary of your day at 11 PM'}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      reports: {
                        ...settings.reports,
                        dailyReport: !settings.reports.dailyReport,
                      },
                    })
                  }
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings.reports.dailyReport ? "bg-teal-500" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.reports.dailyReport ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Email option for daily report */}
              {settings.reports.dailyReport && (
                <div className="flex items-center gap-3 pl-4 pt-2 border-t border-gray-700">
                  <input
                    type="checkbox"
                    id="dailyReportEmail"
                    checked={settings.reports.dailyReportEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        reports: {
                          ...settings.reports,
                          dailyReportEmail: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-teal-500"
                  />
                  <label htmlFor="dailyReportEmail" className="text-sm text-gray-300 cursor-pointer">
                    {language === 'fr'
                      ? 'Envoyer aussi par email'
                      : 'Also send via email'}
                  </label>
                </div>
              )}
            </div>

            {/* Monthly Report */}
            <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">
                    {language === 'fr' ? 'Rapport Mensuel' : 'Monthly Report'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {language === 'fr'
                      ? 'Reçois un résumé complet à la fin de chaque mois'
                      : 'Receive a complete summary at the end of each month'}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      reports: {
                        ...settings.reports,
                        monthlyReport: !settings.reports.monthlyReport,
                      },
                    })
                  }
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings.reports.monthlyReport ? "bg-teal-500" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.reports.monthlyReport ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Email option for monthly report */}
              {settings.reports.monthlyReport && (
                <div className="flex items-center gap-3 pl-4 pt-2 border-t border-gray-700">
                  <input
                    type="checkbox"
                    id="monthlyReportEmail"
                    checked={settings.reports.monthlyReportEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        reports: {
                          ...settings.reports,
                          monthlyReportEmail: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-teal-500"
                  />
                  <label htmlFor="monthlyReportEmail" className="text-sm text-gray-300 cursor-pointer">
                    {language === 'fr'
                      ? 'Envoyer aussi par email'
                      : 'Also send via email'}
                  </label>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 italic">
              {language === 'fr'
                ? '💡 Les rapports incluent : tâches complétées, temps passé par liste, progression des projets, et statistiques de productivité.'
                : '💡 Reports include: completed tasks, time spent by list, project progress, and productivity statistics.'}
            </p>
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
          {isSaved ? (language === 'en' ? 'Saved!' : 'Enregistré!') : (language === 'en' ? 'Save Changes' : 'Enregistrer les modifications')}
        </button>
      </motion.div>
    </div>
  );
}
