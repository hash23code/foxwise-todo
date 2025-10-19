"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Calendar, TrendingUp, Clock, CheckSquare, Target, BarChart3, Loader2, Download } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface DailyReport {
  date: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionRate: number;
  timeByCategory: Array<{ category: string; hours: number; color: string }>;
  topPriorities: Array<{ title: string; priority: string; completed: boolean }>;
  productivity: number;
}

interface MonthlyReport {
  month: string;
  totalTasks: number;
  completedTasks: number;
  averageCompletionRate: number;
  totalHours: number;
  projectsProgress: Array<{ name: string; progress: number; color: string }>;
  categoryBreakdown: Array<{ category: string; hours: number; percentage: number; color: string }>;
  productivity: number;
  trends: {
    tasksCompleted: number;
    improvement: number;
  };
}

export default function ReportsPage() {
  const { user } = useUser();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);

  const t = {
    en: {
      title: "Reports",
      subtitle: "Detailed insights into your productivity",
      daily: "Daily Report",
      monthly: "Monthly Report",
      selectDate: "Select Date",
      generate: "Generate Report",
      generating: "Generating...",
      noData: "No data available for this period",

      // Daily report
      tasksCompleted: "Tasks Completed",
      completionRate: "Completion Rate",
      inProgress: "In Progress",
      productivity: "Productivity Score",
      timeByCategory: "Time by Category",
      topPriorities: "Top Priority Tasks",

      // Monthly report
      totalHours: "Total Hours",
      averageCompletion: "Average Completion",
      projectProgress: "Project Progress",
      categoryBreakdown: "Category Breakdown",
      trends: "Trends",
      improvement: "vs Last Month",
    },
    fr: {
      title: "Rapports",
      subtitle: "Aperçu détaillé de votre productivité",
      daily: "Rapport Quotidien",
      monthly: "Rapport Mensuel",
      selectDate: "Sélectionner la Date",
      generate: "Générer le Rapport",
      generating: "Génération...",
      noData: "Aucune donnée disponible pour cette période",

      // Daily report
      tasksCompleted: "Tâches Complétées",
      completionRate: "Taux de Complétion",
      inProgress: "En Cours",
      productivity: "Score de Productivité",
      timeByCategory: "Temps par Catégorie",
      topPriorities: "Tâches Prioritaires",

      // Monthly report
      totalHours: "Heures Totales",
      averageCompletion: "Complétion Moyenne",
      projectProgress: "Progression des Projets",
      categoryBreakdown: "Répartition par Catégorie",
      trends: "Tendances",
      improvement: "vs Mois Dernier",
    }
  };

  const content = t[language];

  useEffect(() => {
    if (user) {
      generateReport();
    }
  }, [user, reportType, selectedDate]);

  const generateReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'daily') {
        const response = await fetch(`/api/reports/daily?date=${selectedDate}`);
        if (response.ok) {
          const data = await response.json();
          setDailyReport(data);
          setMonthlyReport(null);
        }
      } else {
        // Extract year and month from selectedDate
        const [year, month] = selectedDate.split('-');
        const response = await fetch(`/api/reports/monthly?year=${year}&month=${month}`);
        if (response.ok) {
          const data = await response.json();
          setMonthlyReport(data);
          setDailyReport(null);
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductivityColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            {content.title}
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">{content.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-gray-700 w-full sm:w-auto">
          <button
            onClick={() => setReportType('daily')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-md transition-all text-sm sm:text-base ${
              reportType === 'daily'
                ? 'bg-teal-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            {content.daily}
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-md transition-all text-sm sm:text-base ${
              reportType === 'monthly'
                ? 'bg-teal-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            {content.monthly}
          </button>
        </div>
      </motion.div>

      {/* Date Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <label className="text-sm font-medium text-gray-300">
            {content.selectDate}:
          </label>
          <input
            type={reportType === 'daily' ? 'date' : 'month'}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
          />
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {content.generating}
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                {content.generate}
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Daily Report */}
      {!loading && dailyReport && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-green-500/30"
            >
              <div className="flex items-center justify-between mb-2">
                <CheckSquare className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{dailyReport.completedTasks}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{content.tasksCompleted}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-blue-500/30"
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{dailyReport.completionRate}%</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{content.completionRate}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-yellow-500/30"
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{dailyReport.inProgressTasks}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{content.inProgress}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-purple-500/30"
            >
              <div className="flex items-center justify-between mb-2">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${getProductivityColor(dailyReport.productivity)}`}>
                {dailyReport.productivity}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{content.productivity}</p>
            </motion.div>
          </div>

          {/* Time by Category */}
          {dailyReport.timeByCategory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                {content.timeByCategory}
              </h3>
              <div className="space-y-3">
                {dailyReport.timeByCategory.map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{cat.category}</span>
                      <span className="text-sm font-semibold" style={{ color: cat.color }}>
                        {cat.hours}h
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(cat.hours / Math.max(...dailyReport.timeByCategory.map(c => c.hours))) * 100}%`,
                          backgroundColor: cat.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Top Priorities */}
          {dailyReport.topPriorities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-400" />
                {content.topPriorities}
              </h3>
              <div className="space-y-2">
                {dailyReport.topPriorities.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border-l-4"
                    style={{ borderLeftColor: getPriorityColor(task.priority) }}
                  >
                    <CheckSquare
                      className={`w-4 h-4 flex-shrink-0 ${task.completed ? 'text-green-400' : 'text-gray-400'}`}
                    />
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                      {task.title}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-1 rounded"
                      style={{ color: getPriorityColor(task.priority) }}
                    >
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Monthly Report */}
      {!loading && monthlyReport && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-green-500/30"
            >
              <CheckSquare className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mb-2" />
              <p className="text-2xl sm:text-3xl font-bold text-white">{monthlyReport.completedTasks}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{content.tasksCompleted}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-blue-500/30"
            >
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mb-2" />
              <p className="text-2xl sm:text-3xl font-bold text-white">{monthlyReport.averageCompletionRate}%</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{content.averageCompletion}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-purple-500/30"
            >
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mb-2" />
              <p className="text-2xl sm:text-3xl font-bold text-white">{monthlyReport.totalHours}h</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{content.totalHours}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-teal-500/30"
            >
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-teal-400 mb-2" />
              <p className={`text-2xl sm:text-3xl font-bold ${getProductivityColor(monthlyReport.productivity)}`}>
                {monthlyReport.productivity}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{content.productivity}</p>
            </motion.div>
          </div>

          {/* Projects Progress */}
          {monthlyReport.projectsProgress.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-400" />
                {content.projectProgress}
              </h3>
              <div className="space-y-3">
                {monthlyReport.projectsProgress.map((project, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{project.name}</span>
                      <span className="text-sm font-semibold" style={{ color: project.color }}>
                        {project.progress}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${project.progress}%`,
                          backgroundColor: project.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Category Breakdown */}
          {monthlyReport.categoryBreakdown.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                {content.categoryBreakdown}
              </h3>
              <div className="space-y-3">
                {monthlyReport.categoryBreakdown.map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{cat.percentage}%</span>
                        <span className="text-sm font-semibold" style={{ color: cat.color }}>
                          {cat.hours}h
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700"
          >
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              {content.trends}
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-400">{content.tasksCompleted}</p>
                <p className="text-2xl font-bold text-white">{monthlyReport.trends.tasksCompleted}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">{content.improvement}</p>
                <p className={`text-2xl font-bold ${monthlyReport.trends.improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {monthlyReport.trends.improvement >= 0 ? '+' : ''}{monthlyReport.trends.improvement}%
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* No Data */}
      {!loading && !dailyReport && !monthlyReport && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-12 border border-gray-700 text-center"
        >
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">{content.noData}</p>
        </motion.div>
      )}
    </div>
  );
}
