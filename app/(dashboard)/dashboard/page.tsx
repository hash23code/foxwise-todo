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
  todo_lists: {
    id: string;
    name: string;
    color: string;
  };
  created_at: string;
  completed_at: string | null;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTasks();
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

  // Tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    const existing = acc.find(item => item.name === task.todo_lists.name);
    if (existing) {
      existing.value++;
    } else {
      acc.push({
        name: task.todo_lists.name,
        value: 1,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Welcome back, {user?.firstName || 'there'}!
            </h1>
            <p className="text-gray-400 mt-2">Here's your productivity overview</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Quick Add Task
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Tasks</p>
                <p className="text-3xl font-bold text-white mt-1">{totalTasks}</p>
              </div>
              <ListTodo className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-3xl font-bold text-green-500 mt-1">{completedTasks}</p>
                <p className="text-xs text-gray-500 mt-1">{completionRate.toFixed(0)}% complete</p>
              </div>
              <CheckSquare className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">In Progress</p>
                <p className="text-3xl font-bold text-yellow-500 mt-1">{inProgressTasks}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-3xl font-bold text-purple-500 mt-1">{pendingTasks}</p>
              </div>
              <Square className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Overdue</p>
                <p className="text-3xl font-bold text-red-500 mt-1">{overdueTasks}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TaskCompletionChart data={last7Days} />
          {tasksByCategory.length > 0 && <TasksByCategoryChart data={tasksByCategory} />}
        </div>

        {/* Priority Chart */}
        <div className="mb-8">
          <TasksByPriorityChart data={tasksByPriority} />
        </div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Recent Tasks</h3>
            <Link
              href="/tasks"
              className="text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks yet. Create your first task!</p>
            ) : (
              recentTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + index * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all"
                >
                  {task.status === 'completed' ? (
                    <CheckSquare className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-white font-medium truncate ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${task.todo_lists.color}20`, color: task.todo_lists.color }}
                      >
                        {task.todo_lists.name}
                      </span>
                      {task.due_date && (
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
