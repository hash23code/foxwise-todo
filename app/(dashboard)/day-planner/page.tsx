"use client";

import { useState, useEffect } from "react";
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
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plannedTasks, setPlannedTasks] = useState<PlannedTask[]>([]);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showAIPlanner, setShowAIPlanner] = useState(false);

  // Generate hours from 6 AM to 11 PM
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  useEffect(() => {
    fetchTasks();
    fetchPlannedTasks();
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
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/api/day-planner?date=${dateStr}`);
      if (response.ok) {
        const data = await response.json();
        setPlannedTasks(data);
      }
    } catch (error) {
      console.error('Error fetching planned tasks:', error);
    }
  };

  const addTaskToTimeSlot = async (taskId: string, duration: number) => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
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

  const removePlannedTask = async (plannedTaskId: string) => {
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

  const getTasksForHour = (hour: number) => {
    // Return all tasks that START within this hour (e.g., for hour 17, include 17:00, 17:15, 17:30, 17:45)
    return plannedTasks.filter(pt => {
      const taskHour = parseInt(pt.start_time.split(':')[0]);
      return taskHour === hour;
    });
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
      const dateStr = selectedDate.toISOString().split('T')[0];
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              {t.dayPlanner.title}
            </h1>
            <p className="text-gray-400 mt-2">{t.dayPlanner.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAIPlanner(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all shadow-lg flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {t.dayPlanner.aiAssistant}
            </button>

            <button
              onClick={handleExportPrint}
              className="px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 font-medium transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {t.dayPlanner.exportPrint}
            </button>

            <button
              onClick={clearDay}
              className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 font-medium transition-all flex items-center gap-2"
              disabled={plannedTasks.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              {t.dayPlanner.clearDay}
            </button>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{getTotalPlannedHours()}h</span>
                <span className="text-gray-500">{t.dayPlanner.planned}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <p className="text-gray-400 mt-1">
                  {selectedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {!isToday && (
                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
                >
                  {t.dayPlanner.today}
                </button>
              )}
            </div>

            <button
              onClick={() => changeDate(1)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="space-y-2">
            {hours.map((hour) => {
              const tasksAtHour = getTasksForHour(hour);
              const hourStr = `${hour.toString().padStart(2, '0')}:00`;

              return (
                <div key={hour} className="flex gap-4">
                  {/* Time Label */}
                  <div className="w-24 flex-shrink-0 text-right pr-4 border-r border-gray-700">
                    <span className="text-gray-400 font-medium">{formatHour(hour)}</span>
                  </div>

                  {/* Time Slot */}
                  <div className="flex-1 min-h-[80px] relative">
                    {tasksAtHour.length === 0 ? (
                      <button
                        onClick={() => {
                          setSelectedTimeSlot(hourStr);
                          setShowTaskSelector(true);
                        }}
                        className="w-full h-full border-2 border-dashed border-gray-700 rounded-lg hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center justify-center group"
                      >
                        <Plus className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {tasksAtHour.map((plannedTask) => {
                          return (
                            <motion.div
                              key={plannedTask.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`p-4 rounded-lg border-2 ${getPriorityColor(plannedTask.task.priority)} flex items-start justify-between gap-3 relative z-10`}
                            >
                              {/* Task Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckSquare className="w-4 h-4 flex-shrink-0" />
                                  <h4 className="font-semibold truncate">{plannedTask.task.title}</h4>
                                </div>
                                {plannedTask.task.description && (
                                  <p className="text-sm opacity-80 mb-2 line-clamp-2">{plannedTask.task.description}</p>
                                )}
                                <div className="flex items-center gap-3 text-xs flex-wrap">
                                  <span
                                    className="px-2 py-1 rounded-full"
                                    style={{
                                      backgroundColor: `${plannedTask.task.todo_lists.color}20`,
                                      color: plannedTask.task.todo_lists.color
                                    }}
                                  >
                                    {plannedTask.task.todo_lists.name}
                                  </span>
                                  <span className="flex items-center gap-1 opacity-80">
                                    <Clock className="w-3 h-3" />
                                    {plannedTask.duration_hours}h
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col gap-2 flex-shrink-0">
                                <button
                                  onClick={() => updateTaskStatus(plannedTask.task.id, 'completed')}
                                  className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap"
                                  title={t.dayPlanner.markAsCompleted}
                                >
                                  <CheckSquare className="w-3 h-3" />
                                  {t.dayPlanner.complete}
                                </button>
                                <button
                                  onClick={() => updateTaskStatus(plannedTask.task.id, 'in_progress')}
                                  className="px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-yellow-400 text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap"
                                  title={t.dayPlanner.needMoreTime}
                                >
                                  <Clock className="w-3 h-3" />
                                  {t.dayPlanner.moreTime}
                                </button>
                                <button
                                  onClick={() => plannedTask.id && removePlannedTask(plannedTask.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                  title={t.dayPlanner.removeFromPlanner}
                                >
                                  <X className="w-4 h-4" />
                                </button>
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
