"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function SetupBadgesPage() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const setupTables = async () => {
    setLoading(true);
    setStatus("Creating tables...");
    setResults(null);

    try {
      const response = await fetch('/api/admin/setup-badges', {
        method: 'POST'
      });

      const data = await response.json();
      setResults(data);

      if (data.success) {
        setStatus("✅ Setup completed successfully!");
      } else {
        setStatus("⚠️ Setup completed with warnings");
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    setLoading(true);
    setStatus("Checking tables status...");

    try {
      const response = await fetch('/api/admin/setup-badges');
      const data = await response.json();
      setResults(data);

      if (data.status === 'ready') {
        setStatus("✅ Badge system is ready!");
      } else {
        setStatus("⚠️ Badge system is not setup yet");
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700"
        >
          <h1 className="text-3xl font-bold text-white mb-4">
            🎯 Badge System Setup
          </h1>

          <p className="text-gray-400 mb-8">
            This page will create the required database tables for the badge system.
          </p>

          <div className="space-y-4">
            <button
              onClick={checkStatus}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              {loading ? "Checking..." : "Check Status"}
            </button>

            <button
              onClick={setupTables}
              disabled={loading}
              className="w-full px-6 py-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 font-semibold"
            >
              {loading ? "Setting up..." : "🚀 Setup Badge Tables"}
            </button>
          </div>

          {status && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700"
            >
              <p className="text-white font-mono text-sm whitespace-pre-wrap">
                {status}
              </p>
            </motion.div>
          )}

          {results && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700"
            >
              <h3 className="text-white font-semibold mb-2">Results:</h3>
              <pre className="text-gray-300 text-xs overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </motion.div>
          )}

          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Important</h3>
            <ul className="text-yellow-300 text-sm space-y-1">
              <li>• This will create 2 new tables: user_badges and task_completion_times</li>
              <li>• Safe to run multiple times (uses IF NOT EXISTS)</li>
              <li>• After setup, you can close this page</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
