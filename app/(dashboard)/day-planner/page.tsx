"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  CheckSquare,
  Sparkles,
  Printer,
  Trash2,
} from "lucide-react";
import AIPlannerModal from "@/components/AIPlannerModal";
import WeatherWidget from "@/components/WeatherWidget";
import BadgeDisplay from "@/components/BadgeDisplay";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/lib/badges";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  list_id: string;
  tags: string[] | null;
  todo_lists: {
    name: string;
    color: string;
  };
}

interface PlannedTask {
  id?: string;
  task_id: string;
  date: string;
  start_time: string;
  duration_hours: number;
  task: Task;
}

export default function DayPlannerPage() {
  const { t, language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plannedTasks, setPlannedTasks] = useState<PlannedTask[]>([]);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showAIPlanner, setShowAIPlanner] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>([]);

  // Generate hours from 6 AM to 5 AM (next day)
  // 6,7,8...23 (18 hours), then 0,1,2,3,4,5 (6 hours) = 24 hours total
  const hours = [
    ...Array.from({ length: 18 }, (_, i) => i + 6), // 6 AM to 11 PM (23:00)
    ...Array.from({ length: 6 }, (_, i) => i)        // 12 AM to 5 AM (0:00 to 5:00)
  ];

  useEffect(() => {
    fetchTasks();
    fetchPlannedTasks();
    fetchBadges();
  }, [selectedDate]);

  const fetchTasks = async () => {
    try {
      // Fetch all tasks (regardless of due date) - we'll filter out completed/cancelled in the display
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        // Filter to only show tasks that are not completed or cancelled
        const availableTasks = data.filter((task: Task) =>
          task.status !== 'completed' && task.status !== 'cancelled'
        );
        setTasks(availableTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlannedTasks = async () => {
    try {
      // Utiliser la date locale au lieu de UTC pour éviter les problèmes de timezone
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Fetch planned tasks
      const response = await fetch(`/api/day-planner?date=${dateStr}`);
      let plannedTasksData = [];
      if (response.ok) {
        plannedTasksData = await response.json();
      }

      // Fetch routines for this date
      const routinesResponse = await fetch(`/api/routines/for-date?date=${dateStr}`);
      let routinesData = [];
      if (routinesResponse.ok) {
        routinesData = await routinesResponse.json();
      }

      // Convert routines to planned task format
      const routinesAsPlannedTasks = routinesData.map((routine: any) => ({
        id: `routine-${routine.id}`,
        task_id: null,
        date: dateStr,
        start_time: routine.start_time,
        duration_hours: routine.duration_hours,
        task: {
          id: `routine-${routine.id}`,
          title: routine.title,
          description: routine.description,
          priority: 'medium' as const,
          status: 'pending' as const,
          due_date: null,
          list_id: 'routine',
          tags: [routine.category],
          todo_lists: {
            name: language === 'fr' ? 'Routine' : 'Routine',
            color: getCategoryColor(routine.category),
          },
        },
        isRoutine: true,
      }));

      // Combine planned tasks and routines, then sort by start_time
      const combinedTasks = [...plannedTasksData, ...routinesAsPlannedTasks];
      combinedTasks.sort((a, b) => {
        const timeA = a.start_time || '';
        const timeB = b.start_time || '';
        return timeA.localeCompare(timeB);
      });
      setPlannedTasks(combinedTasks);
    } catch (error) {
      console.error('Error fetching planned tasks:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      family: '#3b82f6',
      leisure: '#8b5cf6',
      work: '#f59e0b',
      sport: '#ef4444',
      wellness: '#10b981',
    };
    return colors[category] || '#6b7280';
  };

  const fetchBadges = async () => {
    try {
      // Utiliser la date locale au lieu de UTC pour éviter les problèmes de timezone
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const response = await fetch(`/api/badges?date=${dateStr}`);
      if (response.ok) {
        const data = await response.json();
        setBadges(data);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const addTaskToTimeSlot = async (taskId: string, duration: number) => {
    try {
      // Utiliser la date locale au lieu de UTC pour éviter les problèmes de timezone
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const response = await fetch('/api/day-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          date: dateStr,
          start_time: selectedTimeSlot,
          duration_hours: duration,
        }),
      });

      if (response.ok) {
        fetchPlannedTasks();
        setShowTaskSelector(false);
        setSelectedTimeSlot("");
      } else {
        alert('Failed to add task to planner.');
      }
    } catch (error) {
      console.error('Error adding planned task:', error);
      alert('Error adding task to planner.');
    }
  };

  const getTasksForHour = (hour: number) => {
    // Return all tasks that START within this hour (e.g., for hour 17, include 17:00, 17:15, 17:30, 17:45)
    const tasksInHour = plannedTasks.filter(pt => {
      const taskHour = parseInt(pt.start_time.split(':')[0]);
      return taskHour === hour;
    });

    // Sort by start_time to ensure correct order (16:00 before 16:30)
    tasksInHour.sort((a, b) => {
      return a.start_time.localeCompare(b.start_time);
    });

    return tasksInHour;
  };

  // Check if an hour slot is occupied by a task that started earlier
  const isHourOccupied = (hour: number) => {
    for (const task of plannedTasks) {
      const taskStartHour = parseInt(task.start_time.split(':')[0]);
      const taskEndHour = taskStartHour + task.duration_hours;
      if (hour > taskStartHour && hour < taskEndHour) {
        return true;
      }
    }
    return false;
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status }),
      });

      if (response.ok) {
        fetchTasks();
        fetchPlannedTasks();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const removePlannedTask = async (plannedTaskId: string, isRoutine?: boolean) => {
    if (isRoutine) {
      alert(language === 'fr' ? 'Les routines ne peuvent pas être retirées du planning. Allez dans la section Routines pour les désactiver.' : 'Routines cannot be removed from the planner. Go to the Routines section to deactivate them.');
      return;
    }

    if (!confirm(language === 'fr' ? 'Retirer cette tâche du planning ?' : 'Remove this task from day planner?')) {
      return;
    }

    try {
      const response = await fetch(`/api/day-planner?id=${plannedTaskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPlannedTasks();
      }
    } catch (error) {
      console.error('Error removing planned task:', error);
    }
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'high': return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 'low': return 'bg-green-500/20 border-green-500/50 text-green-400';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  const getTotalPlannedHours = () => {
    return plannedTasks.reduce((sum, pt) => sum + pt.duration_hours, 0);
  };

  const clearDay = async () => {
    if (!window.confirm(t.dayPlanner.clearDayConfirm)) {
      return;
    }

    try {
      // Remove all planned tasks for the selected date
      // Utiliser la date locale au lieu de UTC pour éviter les problèmes de timezone
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const tasksToRemove = plannedTasks.filter(pt => pt.date === dateStr);

      for (const task of tasksToRemove) {
        if (task.id) {
          await fetch(`/api/day-planner?id=${task.id}`, { method: 'DELETE' });
        }
      }

      fetchPlannedTasks();
    } catch (error) {
      console.error('Error clearing day:', error);
      alert('Error clearing day. Please try again.');
    }
  };

  const handleExportPrint = () => {
    window.print();
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              {t.dayPlanner.title}
            </h1>
            <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">{t.dayPlanner.subtitle}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowAIPlanner(true)}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Sparkles className="w-4 h-4" />
              {t.dayPlanner.aiAssistant}
            </button>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleExportPrint}
                className="flex-1 sm:flex-initial px-3 sm:px-5 py-2 sm:py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">{t.dayPlanner.exportPrint}</span>
                <span className="sm:hidden">Print</span>
              </button>

              <button
                onClick={clearDay}
                className="flex-1 sm:flex-initial px-3 sm:px-5 py-2 sm:py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                disabled={plannedTasks.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t.dayPlanner.clearDay}</span>
                <span className="sm:hidden">Clear</span>
              </button>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-700">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-300">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="font-medium">{getTotalPlannedHours()}h</span>
                  <span className="text-gray-500 hidden sm:inline">{t.dayPlanner.planned}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700 mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeDate(-1)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 relative w-full">
              {/* Contenu centré */}
              <div className="flex-1 flex flex-col items-center">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                  <p className="text-gray-400 mt-0.5 sm:mt-1 text-xs sm:text-sm lg:text-base">
                    {selectedDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>

                  {/* Badges en dessous sur mobile/tablette */}
                  {badges.length > 0 && (
                    <div className="lg:hidden mt-2 flex justify-center">
                      <BadgeDisplay badges={badges} compact={true} />
                    </div>
                  )}
                </div>

                {!isToday && (
                  <button
                    onClick={goToToday}
                    className="mt-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
                  >
                    {t.dayPlanner.today}
                  </button>
                )}
              </div>

              {/* Badges à droite (cachés sur mobile pour garder centré) */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block">
                {badges.length > 0 && (
                  <BadgeDisplay badges={badges} compact={true} />
                )}
              </div>
            </div>

            <button
              onClick={() => changeDate(1)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Weather Widget */}
        <div className="mb-6 sm:mb-8">
          <WeatherWidget
            date={selectedDate.toISOString().split('T')[0]}
            onWeatherLoad={setWeatherData}
          />
        </div>

        {/* Timeline */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-700">
          <div className="space-y-1.5 sm:space-y-2">
            {hours.map((hour) => {
              const tasksAtHour = getTasksForHour(hour);
              const hourStr = `${hour.toString().padStart(2, '0')}:00`;

              return (
                <div key={hour} className="flex gap-2 sm:gap-3 lg:gap-4">
                  {/* Time Label */}
                  <div className="w-14 sm:w-20 lg:w-24 flex-shrink-0 text-right pr-2 sm:pr-3 lg:pr-4 border-r border-gray-700">
                    <span className="text-gray-400 font-medium text-xs sm:text-sm lg:text-base">{formatHour(hour)}</span>
                  </div>

                  {/* Time Slot */}
                  <div className="flex-1 min-h-[60px] sm:min-h-[70px] lg:min-h-[80px] relative overflow-hidden">
                    {tasksAtHour.length === 0 ? (
                      <button
                        onClick={() => {
                          setSelectedTimeSlot(hourStr);
                          setShowTaskSelector(true);
                        }}
                        className="w-full h-full border-2 border-dashed border-gray-700 rounded-md sm:rounded-lg hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center justify-center group"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                      </button>
                    ) : (
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        {tasksAtHour.map((plannedTask) => {
                          return (
                            <motion.div
                              key={plannedTask.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`w-full max-w-full p-2 sm:p-3 lg:p-4 rounded-md sm:rounded-lg border-2 ${getPriorityColor(plannedTask.task.priority)} flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3 relative z-10`}
                            >
                              {/* Task Content */}
                              <div className="flex-1 min-w-0 w-full sm:w-auto">
                                <div className="flex items-start gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                                  <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                                  <h4 className="font-semibold line-clamp-2 text-sm sm:text-base break-words">{plannedTask.task.title}</h4>
                                </div>
                                {plannedTask.task.description && (
                                  <p className="text-xs sm:text-sm opacity-80 mb-1 sm:mb-2 line-clamp-2">{plannedTask.task.description}</p>
                                )}
                                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs flex-wrap">
                                  <span
                                    className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                                    style={{
                                      backgroundColor: `${plannedTask.task.todo_lists.color}20`,
                                      color: plannedTask.task.todo_lists.color
                                    }}
                                  >
                                    {plannedTask.task.todo_lists.name}
                                  </span>
                                  <span className="flex items-center gap-0.5 sm:gap-1 opacity-80">
                                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    {plannedTask.duration_hours}h
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex sm:flex-col gap-1.5 sm:gap-2 flex-shrink-0 w-full sm:w-auto">
                                {!(plannedTask as any).isRoutine ? (
                                  <>
                                    {/* Complete Button */}
                                    <button
                                      onClick={() => updateTaskStatus(plannedTask.task.id, 'completed')}
                                      className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1.5 sm:py-2 border rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium transition-all flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap ${
                                        plannedTask.task.status === 'completed'
                                          ? 'bg-green-500/30 border-green-500 text-green-400'
                                          : 'bg-gray-600/20 border-gray-600/50 text-gray-400 hover:bg-gray-600/30'
                                      }`}
                                      title={t.dayPlanner.markAsCompleted}
                                    >
                                      <CheckSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                      <span className="hidden xs:inline">{t.dayPlanner.complete}</span>
                                    </button>

                                    {/* In Progress Button */}
                                    <button
                                      onClick={() => updateTaskStatus(plannedTask.task.id, 'in_progress')}
                                      className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1.5 sm:py-2 border rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium transition-all flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap ${
                                        plannedTask.task.status === 'in_progress'
                                          ? 'bg-yellow-500/30 border-yellow-500 text-yellow-400'
                                          : 'bg-gray-600/20 border-gray-600/50 text-gray-400 hover:bg-gray-600/30'
                                      }`}
                                      title={t.dayPlanner.needMoreTime}
                                    >
                                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                      <span className="hidden xs:inline">{t.dayPlanner.moreTime}</span>
                                    </button>

                                    {/* Postpone Button */}
                                    <button
                                      onClick={() => updateTaskStatus(plannedTask.task.id, 'pending')}
                                      className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1.5 sm:py-2 border rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium transition-all flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap ${
                                        plannedTask.task.status === 'pending'
                                          ? 'bg-red-500/30 border-red-500 text-red-400'
                                          : 'bg-gray-600/20 border-gray-600/50 text-gray-400 hover:bg-gray-600/30'
                                      }`}
                                      title={t.dayPlanner.postponeTask}
                                    >
                                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                      <span className="hidden xs:inline">{t.dayPlanner.postpone}</span>
                                    </button>

                                    {/* Remove from Planner Button */}
                                    <button
                                      onClick={() => {
                                        if (plannedTask.id) {
                                          removePlannedTask(plannedTask.id, (plannedTask as any).isRoutine);
                                        }
                                      }}
                                      disabled={!plannedTask.id}
                                      className="flex-1 sm:flex-initial px-2 sm:px-3 py-1.5 sm:py-2 border rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium transition-all flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap bg-red-600/20 border-red-600/50 text-red-400 hover:bg-red-600/30 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={language === 'fr' ? 'Retirer du planning' : 'Remove from planner'}
                                    >
                                      <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                      <span className="hidden xs:inline">{language === 'fr' ? 'Retirer' : 'Remove'}</span>
                                    </button>
                                  </>
                                ) : (
                                  <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-500/20 border border-blue-500/50 rounded-md sm:rounded-lg text-[10px] sm:text-xs text-blue-400 text-center">
                                    {language === 'fr' ? 'Routine quotidienne' : 'Daily routine'}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Selector Modal */}
        {showTaskSelector && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl p-8 max-w-2xl w-full mx-4 border border-gray-700 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{t.dayPlanner.selectTaskFor} {selectedTimeSlot}</h2>
                <button
                  onClick={() => {
                    setShowTaskSelector(false);
                    setSelectedTimeSlot("");
                  }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>{t.dayPlanner.noTasksAvailable}</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <TaskSelectorItem
                      key={task.id}
                      task={task}
                      onSelect={(duration) => addTaskToTimeSlot(task.id, duration)}
                      getPriorityColor={getPriorityColor}
                      t={t}
                    />
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* AI Planner Modal */}
        <AIPlannerModal
          isOpen={showAIPlanner}
          onClose={() => setShowAIPlanner(false)}
          onPlanApplied={() => {
            fetchPlannedTasks();
            setShowAIPlanner(false);
          }}
          selectedDate={selectedDate}
          weatherData={weatherData}
        />
      </motion.div>
    </div>
  );
}

// Separate component for task selection item with duration input
function TaskSelectorItem({
  task,
  onSelect,
  getPriorityColor,
  t
}: {
  task: Task;
  onSelect: (duration: number) => void;
  getPriorityColor: (priority: string) => string;
  t: any;
}) {
  const [duration, setDuration] = useState(1);

  return (
    <div className={`p-4 rounded-lg border-2 ${getPriorityColor(task.priority)}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-gray-400 mb-2">{task.description}</p>
          )}
          <span
            className="inline-block px-2 py-1 rounded-full text-xs"
            style={{
              backgroundColor: `${task.todo_lists.color}20`,
              color: task.todo_lists.color
            }}
          >
            {task.todo_lists.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <label className="text-xs text-gray-400">{t.dayPlanner.hours}</label>
            <input
              type="number"
              min="0.5"
              max="12"
              step="0.5"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => onSelect(duration)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
          >
            {t.dayPlanner.add}
          </button>
        </div>
      </div>
    </div>
  );
}
