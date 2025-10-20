"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';
import {
  Plus,
  Search,
  Filter,
  CheckSquare,
  Square,
  Calendar,
  AlertCircle,
  Clock,
  Trash2,
  Edit,
  MoreVertical,
  List,
  Table as TableIcon,
  FileDown
} from "lucide-react";
import AddTaskModal from "@/components/AddTaskModal";

interface TodoList {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  list_id: string;
  tags: string[] | null;
  estimated_hours: number | null;
  todo_lists: TodoList;
}

export default function TasksPage() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<TodoList[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(() => {
    // Initialize selectedList from query parameter immediately
    return searchParams.get('list') || null;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [hideCompleted, setHideCompleted] = useState(() => {
    // Load from localStorage on initialization
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hideCompletedTasks');
      return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    fetchLists();
    fetchTasks();
  }, [selectedList, filterStatus, filterPriority]);

  // Save hideCompleted preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hideCompletedTasks', hideCompleted.toString());
    }
  }, [hideCompleted]);

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/todo-lists');
      if (response.ok) {
        const data = await response.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      let url = '/api/tasks?';
      if (selectedList) url += `list_id=${selectedList}&`;
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;
      if (filterPriority !== 'all') url += `priority=${filterPriority}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: newStatus })
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 border-red-500/20';
      case 'high': return 'bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 border-green-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const filteredTasks = tasks.filter(task => {
    // Search filter
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Hide completed filter
    const shouldShow = !hideCompleted || task.status !== 'completed';

    return matchesSearch && shouldShow;
  });

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
  };

  const handlePrintPDF = () => {
    // Add print title with date
    const printDate = new Date().toLocaleDateString();
    document.title = `My Tasks - ${printDate}`;
    window.print();
  };

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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 print:text-black print:bg-none">
              My Tasks
            </h1>
            <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base print:text-gray-700 print:mb-4">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-gray-700 w-fit">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 sm:p-2 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="flex gap-2 sm:gap-3 flex-1 sm:flex-initial">
              {/* Export PDF Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrintPDF}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:bg-gray-700/50 transition-all no-print text-sm sm:text-base"
              >
                <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">PDF</span>
              </motion.button>

              {/* Add Task Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 shadow-lg no-print text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Add Task</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 no-print">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs sm:text-sm">Total Tasks</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-0.5 sm:mt-1">{taskStats.total}</p>
              </div>
              <CheckSquare className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs sm:text-sm">Completed</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-500 mt-0.5 sm:mt-1">{taskStats.completed}</p>
              </div>
              <CheckSquare className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs sm:text-sm">In Progress</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-500 mt-0.5 sm:mt-1">{taskStats.inProgress}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-yellow-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs sm:text-sm">Pending</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-500 mt-0.5 sm:mt-1">{taskStats.pending}</p>
              </div>
              <Square className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-purple-500" />
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700 mb-6 sm:mb-8 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* List Filter */}
            <select
              value={selectedList || ''}
              onChange={(e) => setSelectedList(e.target.value || null)}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Lists</option>
              {lists.map(list => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Hide Completed Checkbox */}
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="hideCompleted"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
            />
            <label
              htmlFor="hideCompleted"
              className="text-sm text-gray-300 cursor-pointer select-none"
            >
              Hide completed tasks
            </label>
          </div>
        </div>

        {/* Tasks List or Table View */}
        {viewMode === 'list' ? (
          // LIST VIEW (Original)
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-400 py-12">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No tasks found</p>
              </div>
            ) : (
              filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border ${getPriorityBg(task.priority)} hover:bg-gray-700/50 transition-all`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className="mt-1 no-print"
                    >
                      {task.status === 'completed' ? (
                        <CheckSquare className="w-6 h-6 text-green-500" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-400 hover:text-purple-500 transition-colors" />
                      )}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-gray-400 text-sm mt-1">{task.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            {/* Status Dropdown */}
                            <select
                              value={task.status}
                              onChange={(e) => {
                                fetch('/api/tasks', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: task.id, status: e.target.value })
                                }).then(() => fetchTasks());
                              }}
                              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-purple-500 no-print"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="pending">📋 Pending</option>
                              <option value="in_progress">⏳ In Progress</option>
                              <option value="completed">✅ Completed</option>
                              <option value="cancelled">❌ Cancelled</option>
                            </select>

                            {/* List Badge */}
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${task.todo_lists.color}20`, color: task.todo_lists.color }}
                            >
                              {task.todo_lists.name}
                            </span>

                            {/* Priority Badge */}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBg(task.priority)} ${getPriorityColor(task.priority)}`}>
                              {task.priority.toUpperCase()}
                            </span>

                            {/* Estimated Hours */}
                            {task.estimated_hours && (
                              <span className="flex items-center gap-1 text-blue-400 text-sm">
                                <Clock className="w-4 h-4" />
                                {task.estimated_hours}h est.
                              </span>
                            )}

                            {/* Due Date */}
                            {task.due_date && (
                              <span className="flex items-center gap-1 text-gray-400 text-sm">
                                <Calendar className="w-4 h-4" />
                                {(() => {
                                  const dateStr = task.due_date.split('T')[0];
                                  const date = new Date(dateStr + 'T00:00:00');
                                  const hasTime = task.due_date.includes('T') && task.due_date.split('T')[1] !== '00:00:00';

                                  if (hasTime) {
                                    const timePart = task.due_date.split('T')[1].substring(0, 5);
                                    return `${date.toLocaleDateString()} à ${timePart}`;
                                  }
                                  return date.toLocaleDateString();
                                })()}
                              </span>
                            )}

                            {/* Tags */}
                            {task.tags && task.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4 no-print">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setShowAddModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          // TABLE VIEW (Compact)
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            {loading ? (
              <div className="text-center text-gray-400 py-12">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No tasks found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider no-print">
                        ✓
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        List
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider no-print">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredTasks.map((task) => (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-4 py-3 no-print">
                          <button
                            onClick={() => toggleTaskStatus(task)}
                            className="hover:scale-110 transition-transform"
                          >
                            {task.status === 'completed' ? (
                              <CheckSquare className="w-5 h-5 text-green-500" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400 hover:text-purple-500" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-gray-400 truncate max-w-xs">{task.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={task.status}
                            onChange={(e) => {
                              fetch('/api/tasks', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: task.id, status: e.target.value })
                              }).then(() => fetchTasks());
                            }}
                            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="pending">📋 Pending</option>
                            <option value="in_progress">⏳ In Progress</option>
                            <option value="completed">✅ Completed</option>
                            <option value="cancelled">❌ Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBg(task.priority)} ${getPriorityColor(task.priority)}`}>
                            {task.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ backgroundColor: `${task.todo_lists.color}20`, color: task.todo_lists.color }}
                          >
                            {task.todo_lists.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {task.estimated_hours ? `${task.estimated_hours}h` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {task.due_date ? (() => {
                            const dateStr = task.due_date.split('T')[0];
                            const date = new Date(dateStr + 'T00:00:00');
                            const hasTime = task.due_date.includes('T') && task.due_date.split('T')[1] !== '00:00:00';

                            if (hasTime) {
                              const timePart = task.due_date.split('T')[1].substring(0, 5);
                              return `${date.toLocaleDateString()} à ${timePart}`;
                            }
                            return date.toLocaleDateString();
                          })() : '-'}
                        </td>
                        <td className="px-4 py-3 no-print">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingTask(task);
                                setShowAddModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Add Task Modal */}
        <AddTaskModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingTask(null);
          }}
          onTaskAdded={fetchTasks}
          editTask={editingTask}
        />
      </motion.div>
    </div>
  );
}
