"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<TodoList[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  useEffect(() => {
    fetchLists();
    fetchTasks();
  }, [selectedList, filterStatus, filterPriority]);

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

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 print:text-black print:bg-none">
              My Tasks
            </h1>
            <p className="text-gray-400 mt-2 print:text-gray-700 print:mb-4">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Table View"
              >
                <TableIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Export PDF Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrintPDF}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white font-medium flex items-center gap-2 hover:bg-gray-700/50 transition-all no-print"
            >
              <FileDown className="w-5 h-5" />
              Export PDF
            </motion.button>

            {/* Add Task Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium flex items-center gap-2 shadow-lg no-print"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 no-print">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Tasks</p>
                <p className="text-3xl font-bold text-white mt-1">{taskStats.total}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-3xl font-bold text-green-500 mt-1">{taskStats.completed}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">In Progress</p>
                <p className="text-3xl font-bold text-yellow-500 mt-1">{taskStats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-3xl font-bold text-purple-500 mt-1">{taskStats.pending}</p>
              </div>
              <Square className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                {new Date(task.due_date).toLocaleDateString()}
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
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
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
