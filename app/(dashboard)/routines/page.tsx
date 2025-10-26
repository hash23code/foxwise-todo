"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Edit,
  Trash2,
  Clock,
  Calendar,
  Heart,
  Briefcase,
  Gamepad2,
  Dumbbell,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Routine {
  id: string;
  title: string;
  description: string | null;
  category: 'family' | 'leisure' | 'work' | 'sport' | 'wellness';
  frequency_type: 'daily' | 'weekly' | 'monthly';
  start_time: string;
  duration_hours: number;
  weekly_days: number[] | null;
  monthly_days: number[] | null;
  skip_weekends: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { id: 'family', icon: Users, color: '#3b82f6', labelFr: 'Famille', labelEn: 'Family' },
  { id: 'leisure', icon: Gamepad2, color: '#8b5cf6', labelFr: 'Détente', labelEn: 'Leisure' },
  { id: 'work', icon: Briefcase, color: '#f59e0b', labelFr: 'Travail', labelEn: 'Work' },
  { id: 'sport', icon: Dumbbell, color: '#ef4444', labelFr: 'Sport', labelEn: 'Sport' },
  { id: 'wellness', icon: Heart, color: '#10b981', labelFr: 'Bien-être', labelEn: 'Wellness' },
];

const WEEKDAYS = [
  { id: 1, labelFr: 'Lun', labelEn: 'Mon' },
  { id: 2, labelFr: 'Mar', labelEn: 'Tue' },
  { id: 3, labelFr: 'Mer', labelEn: 'Wed' },
  { id: 4, labelFr: 'Jeu', labelEn: 'Thu' },
  { id: 5, labelFr: 'Ven', labelEn: 'Fri' },
  { id: 6, labelFr: 'Sam', labelEn: 'Sat' },
  { id: 0, labelFr: 'Dim', labelEn: 'Sun' },
];

export default function RoutinesPage() {
  const { language } = useLanguage();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: 'family' | 'leisure' | 'work' | 'sport' | 'wellness';
    frequency_type: 'daily' | 'weekly' | 'monthly';
    start_time: string;
    duration_hours: number;
    weekly_days: number[];
    monthly_days: number[];
    skip_weekends: boolean;
    is_active: boolean;
  }>({
    title: '',
    description: '',
    category: 'family',
    frequency_type: 'daily',
    start_time: '09:00',
    duration_hours: 1,
    weekly_days: [],
    monthly_days: [],
    skip_weekends: false,
    is_active: true,
  });

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    try {
      const response = await fetch('/api/routines');
      if (response.ok) {
        const data = await response.json();
        setRoutines(data);
      }
    } catch (error) {
      console.error('Error fetching routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingRoutine ? '/api/routines' : '/api/routines';
      const method = editingRoutine ? 'PATCH' : 'POST';

      const body = editingRoutine
        ? { id: editingRoutine.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchRoutines();
        closeModal();
      } else {
        alert(language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving routine');
      }
    } catch (error) {
      console.error('Error saving routine:', error);
      alert(language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving routine');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'fr' ? 'Supprimer cette routine ?' : 'Delete this routine?')) {
      return;
    }

    try {
      const response = await fetch(`/api/routines?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRoutines();
      }
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  const openModal = (routine?: Routine) => {
    if (routine) {
      setEditingRoutine(routine);
      setFormData({
        title: routine.title,
        description: routine.description || '',
        category: routine.category,
        frequency_type: routine.frequency_type,
        start_time: routine.start_time,
        duration_hours: routine.duration_hours,
        weekly_days: routine.weekly_days || [],
        monthly_days: routine.monthly_days || [],
        skip_weekends: routine.skip_weekends,
        is_active: routine.is_active,
      });
    } else {
      setEditingRoutine(null);
      setFormData({
        title: '',
        description: '',
        category: 'family',
        frequency_type: 'daily',
        start_time: '09:00',
        duration_hours: 1,
        weekly_days: [],
        monthly_days: [],
        skip_weekends: false,
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoutine(null);
  };

  const toggleWeekday = (day: number) => {
    setFormData(prev => ({
      ...prev,
      weekly_days: prev.weekly_days.includes(day)
        ? prev.weekly_days.filter(d => d !== day)
        : [...prev.weekly_days, day]
    }));
  };

  const toggleMonthday = (day: number) => {
    setFormData(prev => ({
      ...prev,
      monthly_days: prev.monthly_days.includes(day)
        ? prev.monthly_days.filter(d => d !== day)
        : [...prev.monthly_days, day]
    }));
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  const formatFrequency = (routine: Routine) => {
    if (routine.frequency_type === 'daily') {
      if (routine.skip_weekends) {
        return language === 'fr' ? 'Tous les jours (sauf week-end)' : 'Daily (except weekends)';
      }
      return language === 'fr' ? 'Tous les jours' : 'Daily';
    }

    if (routine.frequency_type === 'weekly' && routine.weekly_days && routine.weekly_days.length > 0) {
      const dayLabels = routine.weekly_days
        .sort((a, b) => a - b)
        .map(d => {
          const day = WEEKDAYS.find(wd => wd.id === d);
          return language === 'fr' ? day?.labelFr : day?.labelEn;
        })
        .join(', ');
      return dayLabels;
    }

    if (routine.frequency_type === 'monthly' && routine.monthly_days && routine.monthly_days.length > 0) {
      const days = routine.monthly_days.sort((a, b) => a - b).join(', ');
      return language === 'fr' ? `Les ${days} du mois` : `Days ${days} of month`;
    }

    return routine.frequency_type;
  };

  const groupedRoutines = routines.reduce((acc, routine) => {
    if (!acc[routine.category]) {
      acc[routine.category] = [];
    }
    acc[routine.category].push(routine);
    return acc;
  }, {} as Record<string, Routine[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 sm:p-6 lg:p-8 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              {language === 'fr' ? 'Routines' : 'Routines'}
            </h1>
            <p className="text-gray-400 mt-2">
              {language === 'fr'
                ? 'Gérez vos activités récurrentes quotidiennes'
                : 'Manage your recurring daily activities'}
            </p>
          </div>

          <button
            onClick={() => openModal()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {language === 'fr' ? 'Nouvelle Routine' : 'New Routine'}
          </button>
        </div>

        {/* Routines by Category */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">
            {language === 'fr' ? 'Chargement...' : 'Loading...'}
          </div>
        ) : routines.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>{language === 'fr' ? 'Aucune routine pour le moment' : 'No routines yet'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {CATEGORIES.map(category => {
              const categoryRoutines = groupedRoutines[category.id] || [];
              if (categoryRoutines.length === 0) return null;

              const Icon = category.icon;

              return (
                <div key={category.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: category.color }} />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {language === 'fr' ? category.labelFr : category.labelEn}
                    </h2>
                    <span className="text-gray-400 text-sm">({categoryRoutines.length})</span>
                  </div>

                  <div className="space-y-3">
                    {categoryRoutines.map(routine => {
                      const isExpanded = expandedRoutine === routine.id;
                      const categoryInfo = getCategoryInfo(routine.category);

                      return (
                        <motion.div
                          key={routine.id}
                          layout
                          className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-white text-lg">{routine.title}</h3>
                                {!routine.is_active && (
                                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                                    {language === 'fr' ? 'Inactive' : 'Inactive'}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {routine.start_time} ({routine.duration_hours}h)
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatFrequency(routine)}
                                </span>
                              </div>

                              {routine.description && (
                                <p className="text-gray-400 text-sm mt-2">{routine.description}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openModal(routine)}
                                className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(routine.id)}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {editingRoutine
                      ? (language === 'fr' ? 'Modifier la Routine' : 'Edit Routine')
                      : (language === 'fr' ? 'Nouvelle Routine' : 'New Routine')}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {language === 'fr' ? 'Titre' : 'Title'} *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={language === 'fr' ? 'Ex: Aller chercher les enfants' : 'Ex: Pick up kids'}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {language === 'fr' ? 'Description' : 'Description'}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {language === 'fr' ? 'Catégorie' : 'Category'} *
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {CATEGORIES.map(category => {
                        const Icon = category.icon;
                        const isSelected = formData.category === category.id;

                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: category.id as 'family' | 'leisure' | 'work' | 'sport' | 'wellness' })}
                            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                              isSelected
                                ? 'border-current'
                                : 'border-gray-700 hover:border-gray-600'
                            }`}
                            style={isSelected ? { borderColor: category.color, backgroundColor: `${category.color}20` } : {}}
                          >
                            <Icon className="w-6 h-6" style={{ color: category.color }} />
                            <span className="text-xs text-white">
                              {language === 'fr' ? category.labelFr : category.labelEn}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time & Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {language === 'fr' ? 'Heure' : 'Time'} *
                      </label>
                      <input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {language === 'fr' ? 'Durée (heures)' : 'Duration (hours)'} *
                      </label>
                      <input
                        type="number"
                        min="0.25"
                        max="24"
                        step="0.25"
                        value={formData.duration_hours}
                        onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Frequency Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {language === 'fr' ? 'Fréquence' : 'Frequency'} *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['daily', 'weekly', 'monthly'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, frequency_type: type })}
                          className={`px-2 sm:px-4 py-2 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                            formData.frequency_type === type
                              ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                              : 'border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          {type === 'daily' && (language === 'fr' ? 'Quotidien' : 'Daily')}
                          {type === 'weekly' && (language === 'fr' ? 'Hebdo.' : 'Weekly')}
                          {type === 'monthly' && (language === 'fr' ? 'Mensuel' : 'Monthly')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daily Options */}
                  {formData.frequency_type === 'daily' && (
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.skip_weekends}
                          onChange={(e) => setFormData({ ...formData, skip_weekends: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">
                          {language === 'fr' ? 'Exclure les week-ends' : 'Skip weekends'}
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Weekly Options */}
                  {formData.frequency_type === 'weekly' && (
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        {language === 'fr' ? 'Jours de la semaine' : 'Days of week'}
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {WEEKDAYS.map(day => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleWeekday(day.id)}
                            className={`px-2 py-2 rounded-lg border-2 transition-all text-sm ${
                              formData.weekly_days.includes(day.id)
                                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                                : 'border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}
                          >
                            {language === 'fr' ? day.labelFr : day.labelEn}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monthly Options */}
                  {formData.frequency_type === 'monthly' && (
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        {language === 'fr' ? 'Jours du mois' : 'Days of month'}
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleMonthday(day)}
                            className={`px-2 py-2 rounded-lg border-2 transition-all text-sm ${
                              formData.monthly_days.includes(day)
                                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                                : 'border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Status */}
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">
                        {language === 'fr' ? 'Routine active' : 'Active routine'}
                      </span>
                    </label>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                    >
                      {language === 'fr' ? 'Annuler' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all shadow-lg"
                    >
                      {editingRoutine
                        ? (language === 'fr' ? 'Sauvegarder' : 'Save')
                        : (language === 'fr' ? 'Créer' : 'Create')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
