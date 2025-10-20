"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  PieChart,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface AIReport {
  id: string;
  title: string;
  report_type: string;
  period_start: string;
  period_end: string;
  category_filter: string | null;
  summary: string;
  ai_analysis: string;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
  }>;
  comparison: {
    tasksDiff: number;
    tasksPercentChange: number;
    completionDiff: number;
    hoursDiff: number;
    hoursPercentChange: number;
    productivityDiff: number;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    totalHours: number;
    productivity: number;
    categoryBreakdown: Array<{
      category: string;
      hours: number;
      percentage: number;
    }>;
    priorityDistribution: Record<string, { count: number; completed: number }>;
  };
  charts_data: any;
  created_at: string;
}

interface AIReportViewerProps {
  report: AIReport;
  language: 'en' | 'fr';
  onDelete: (id: string) => void;
}

export default function AIReportViewer({ report, language, onDelete }: AIReportViewerProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const t = language === 'fr' ? {
    aiAnalysis: 'Analyse IA',
    summary: 'Résumé',
    comparison: 'Comparaison',
    recommendations: 'Recommandations',
    statistics: 'Statistiques',
    charts: 'Graphiques',
    categoryDistribution: 'Répartition par Catégorie',
    priorityDistribution: 'Répartition par Priorité',
    downloadPDF: 'Télécharger en PDF',
    deleteReport: 'Supprimer',
    confirmDelete: 'Confirmer la suppression',
    cancelDelete: 'Annuler',
    vsPrevious: 'vs Période Précédente',
    tasks: 'Tâches',
    hours: 'Heures',
    completionRate: 'Taux de Complétion',
    productivity: 'Productivité',
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Basse',
    urgent: 'Urgent',
    impact: 'Impact',
    total: 'Total',
    completed: 'Complétées',
  } : {
    aiAnalysis: 'AI Analysis',
    summary: 'Summary',
    comparison: 'Comparison',
    recommendations: 'Recommendations',
    statistics: 'Statistics',
    charts: 'Charts',
    categoryDistribution: 'Category Distribution',
    priorityDistribution: 'Priority Distribution',
    downloadPDF: 'Download PDF',
    deleteReport: 'Delete',
    confirmDelete: 'Confirm Deletion',
    cancelDelete: 'Cancel',
    vsPrevious: 'vs Previous Period',
    tasks: 'Tasks',
    hours: 'Hours',
    completionRate: 'Completion Rate',
    productivity: 'Productivity',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    urgent: 'Urgent',
    impact: 'Impact',
    total: 'Total',
    completed: 'Completed',
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getComparisonColor = (value: number) => {
    return value >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getComparisonIcon = (value: number) => {
    return value >= 0 ? TrendingUp : TrendingDown;
  };

  const COLORS = ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#06b6d4', '#10b981'];

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(139, 92, 246); // Purple
    doc.text(report.title, pageWidth / 2, 20, { align: 'center' });

    // Period
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175); // Gray
    doc.text(`${report.period_start} - ${report.period_end}`, pageWidth / 2, 28, { align: 'center' });

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255); // White (will appear as black in PDF)
    doc.text(t.summary, 15, 40);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const summaryLines = doc.splitTextToSize(report.summary, pageWidth - 30);
    doc.text(summaryLines, 15, 48);

    let yPos = 48 + (summaryLines.length * 5) + 10;

    // Statistics
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(t.statistics, 15, yPos);
    yPos += 8;

    const stats = [
      [t.tasks, report.stats.totalTasks.toString()],
      [t.completed, report.stats.completedTasks.toString()],
      [t.completionRate, `${report.stats.completionRate}%`],
      [t.hours, `${report.stats.totalHours}h`],
      [t.productivity, `${report.stats.productivity}/100`],
    ];

    (doc as any).autoTable({
      startY: yPos,
      head: [[t.statistics, '']],
      body: stats,
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Analysis
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(t.aiAnalysis, 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const analysisLines = doc.splitTextToSize(report.ai_analysis, pageWidth - 30);
    doc.text(analysisLines, 15, yPos);

    yPos += (analysisLines.length * 5) + 10;

    // Recommendations
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(t.recommendations, 15, yPos);
    yPos += 8;

    report.recommendations.forEach((rec, idx) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(139, 92, 246);
      doc.text(`${idx + 1}. ${rec.title}`, 15, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const descLines = doc.splitTextToSize(rec.description, pageWidth - 30);
      doc.text(descLines, 15, yPos);
      yPos += (descLines.length * 5) + 5;
    });

    // Save
    doc.save(`${report.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{report.title}</h2>
            <p className="text-sm text-gray-400">
              {report.period_start} - {report.period_end}
              {report.category_filter && ` • ${report.category_filter}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t.downloadPDF}</span>
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.deleteReport}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onDelete(report.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                {t.confirmDelete}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                {t.cancelDelete}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-500/30"
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          {t.summary}
        </h3>
        <p className="text-gray-300 leading-relaxed">{report.summary}</p>
      </motion.div>

      {/* Comparison Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ComparisonCard
          label={t.tasks}
          value={report.stats.totalTasks}
          change={report.comparison.tasksDiff}
          percentChange={report.comparison.tasksPercentChange}
          icon={Target}
          t={t}
        />
        <ComparisonCard
          label={t.completionRate}
          value={`${report.stats.completionRate}%`}
          change={report.comparison.completionDiff}
          percentChange={null}
          icon={CheckCircle2}
          t={t}
        />
        <ComparisonCard
          label={t.hours}
          value={`${report.stats.totalHours}h`}
          change={report.comparison.hoursDiff}
          percentChange={report.comparison.hoursPercentChange}
          icon={Clock}
          t={t}
        />
        <ComparisonCard
          label={t.productivity}
          value={`${report.stats.productivity}/100`}
          change={report.comparison.productivityDiff}
          percentChange={null}
          icon={TrendingUp}
          t={t}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-cyan-400" />
            {t.categoryDistribution}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPie>
              <Pie
                data={report.stats.categoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.category}: ${entry.percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="hours"
              >
                {report.stats.categoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </motion.div>

        {/* Priority Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            {t.priorityDistribution}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={Object.entries(report.stats.priorityDistribution).map(([priority, data]) => ({
                name: priority.toUpperCase(),
                [t.total]: data.count,
                [t.completed]: data.completed,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Bar dataKey={t.total} fill="#8b5cf6" />
              <Bar dataKey={t.completed} fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* AI Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          {t.aiAnalysis}
        </h3>
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{report.ai_analysis}</p>
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-400" />
          {t.recommendations}
        </h3>
        <div className="space-y-4">
          {report.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="bg-gray-800/50 rounded-lg p-4 border-l-4"
              style={{ borderLeftColor: getPriorityColor(rec.priority) }}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-white font-semibold">{rec.title}</h4>
                <span
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{ color: getPriorityColor(rec.priority), backgroundColor: `${getPriorityColor(rec.priority)}20` }}
                >
                  {rec.priority.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-2">{rec.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <AlertCircle className="w-3 h-3" />
                <span>{t.impact}: {rec.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Comparison Card Component
function ComparisonCard({ label, value, change, percentChange, icon: Icon, t }: any) {
  const ComparisonIcon = change >= 0 ? TrendingUp : TrendingDown;
  const colorClass = change >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-purple-400" />
        <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
          <ComparisonIcon className="w-3 h-3" />
          <span>
            {change >= 0 ? '+' : ''}{change}
            {percentChange !== null && ` (${percentChange >= 0 ? '+' : ''}${percentChange}%)`}
          </span>
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xs text-gray-500 mt-1">{t.vsPrevious}</p>
    </motion.div>
  );
}
