"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Square,
  Clock,
  AlertCircle,
  Plus,
  TrendingUp,
  Calendar as CalendarIcon,
  ListTodo
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { format, startOfWeek, endOfWeek, subDays } from "date-fns";
import TaskCompletionChart from "@/components/charts/TaskCompletionChart";
import TasksByCategoryChart from "@/components/charts/TasksByCategoryChart";
import TasksByPriorityChart from "@/components/charts/TasksByPriorityChart";
import ProjectsProgressChart from "@/components/charts/ProjectsProgressChart";
import AddTaskModal from "@/components/AddTaskModal";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  list_id: string;
  estimated_hours: number | null;
  tags: string[] | null;
  todo_lists: {
    id: string;
    name: string;
    color: string;
  };
  created_at: string;
  completed_at: string | null;
}

interface Project {
  id: string;
  title: string;
  color: string;
  project_steps: Array<{
    status: string;
  }>;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchProjects();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        }),
      });

      if (response.ok) {
        fetchTasks(); // Refresh tasks
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const overdueTasks = tasks.filter(t =>
    t.status !== 'completed' &&
    t.due_date &&
    new Date(t.due_date) < new Date()
  ).length;

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Prepare chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'MM/dd');

    const completed = tasks.filter(t =>
      t.completed_at && format(new Date(t.completed_at), 'MM/dd') === dateStr
    ).length;

    const created = tasks.filter(t =>
      format(new Date(t.created_at), 'MM/dd') === dateStr
    ).length;

    return { date: dateStr, completed, created };
  });

  // Tasks by category (using estimated hours, excluding projects)
  const tasksByCategory = tasks
    .filter(task => !task.tags?.some(tag => tag.startsWith('project:'))) // Exclude project tasks
    .reduce((acc, task) => {
      const existing = acc.find(item => item.name === task.todo_lists.name);
      const hours = task.estimated_hours || 0;
      if (existing) {
        existing.value += hours;
      } else {
        acc.push({
          name: task.todo_lists.name,
          value: hours,
          color: task.todo_lists.color
        });
      }
      return acc;
    }, [] as Array<{ name: string; value: number; color: string }>);

  // Tasks by priority
  const tasksByPriority = ['low', 'medium', 'high', 'urgent'].map(priority => ({
    priority,
    count: tasks.filter(t => t.priority === priority && t.status !== 'completed').length
  }));

  // Projects progress
  const projectsProgress = projects.map(project => {
    const totalSteps = project.project_steps.length;
    const completedSteps = project.project_steps.filter(s => s.status === 'completed').length;
    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      name: project.title.length > 15 ? project.title.substring(0, 15) + '...' : project.title,
      progress,
      color: project.color
    };
  });

  // Recent tasks
  const recentTasks = tasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Welcome back, {user?.firstName || 'there'}!
            </h1>
            <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">Here&apos;s your productivity overview</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Quick Add Task</span>
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Link href="/tasks">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Total Tasks</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-0.5 sm:mt-1">{totalTasks}</p>
                </div>
                <ListTodo className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-500" />
              </div>
            </motion.div>
          </Link>

          <Link href="/tasks?status=completed">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Completed</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-500 mt-0.5 sm:mt-1">{completedTasks}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{completionRate.toFixed(0)}% complete</p>
                </div>
                <CheckSquare className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-500" />
              </div>
            </motion.div>
          </Link>

          <Link href="/tasks?status=in_progress">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">In Progress</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-500 mt-0.5 sm:mt-1">{inProgressTasks}</p>
                </div>
                <Clock className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-yellow-500" />
              </div>
            </motion.div>
          </Link>

          <Link href="/tasks?status=pending">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Pending</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-500 mt-0.5 sm:mt-1">{pendingTasks}</p>
                </div>
                <Square className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-purple-500" />
              </div>
            </motion.div>
          </Link>

          <Link href="/tasks?filter=overdue">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Overdue</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-500 mt-0.5 sm:mt-1">{overdueTasks}</p>
                </div>
                <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-500" />
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <TaskCompletionChart data={last7Days} />
          {tasksByCategory.length > 0 && <TasksByCategoryChart data={tasksByCategory} />}
        </div>

        {/* Projects and Priority Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <ProjectsProgressChart data={projectsProgress} />
          <TasksByPriorityChart data={tasksByPriority} />
        </div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white">Recent Tasks</h3>
            <Link
              href="/tasks"
              className="text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">No tasks yet. Create your first task!</p>
            ) : (
              recentTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + index * 0.05 }}
                  className="flex items-center gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all"
                >
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className="flex-shrink-0 hover:scale-110 transition-transform"
                  >
                    {task.status === 'completed' ? (
                      <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    ) : (
                      <Square className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-green-400" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm sm:text-base text-white font-medium truncate ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                      <span
                        className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium"
                        style={{ backgroundColor: `${task.todo_lists.color}20`, color: task.todo_lists.color }}
                      >
                        {task.todo_lists.name}
                      </span>
                      {task.due_date && (
                        <span className="text-gray-400 text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1">
                          <CalendarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                    task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                    task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {task.priority}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Add Task Modal */}
        <AddTaskModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onTaskAdded={fetchTasks}
        />
      </motion.div>
    </div>
  );
}
