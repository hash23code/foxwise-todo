"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, FolderKanban, Home, Briefcase, Users, Heart } from "lucide-react";

interface TodoList {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  position: number;
}

const ICON_OPTIONS = [
  { name: 'folder', icon: FolderKanban },
  { name: 'home', icon: Home },
  { name: 'briefcase', icon: Briefcase },
  { name: 'users', icon: Users },
  { name: 'heart', icon: Heart },
];

const COLOR_OPTIONS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
];

export default function ListsPage() {
  const router = useRouter();
  const [lists, setLists] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingList, setEditingList] = useState<TodoList | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    icon: 'folder',
  });

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/todo-lists');
      if (response.ok) {
        const data = await response.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/todo-lists';
      const method = editingList ? 'PATCH' : 'POST';
      const body = editingList
        ? { ...formData, id: editingList.id }
        : { ...formData, position: lists.length };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchLists();
        setShowModal(false);
        setEditingList(null);
        setFormData({ name: '', color: '#3b82f6', icon: 'folder' });
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(`Failed to save list: ${errorData.error || 'Unknown error'}.\n\nPlease make sure you have run the supabase_schema.sql file in your Supabase database!`);
      }
    } catch (error) {
      console.error('Error saving list:', error);
      alert(`Failed to save list: ${error}\n\nPlease make sure you have run the supabase_schema.sql file in your Supabase database!`);
    }
  };

  const handleEdit = (list: TodoList) => {
    setEditingList(list);
    setFormData({
      name: list.name,
      color: list.color,
      icon: list.icon,
    });
    setShowModal(true);
  };

  const handleDelete = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list? All tasks in this list will also be deleted.')) return;

    try {
      const response = await fetch(`/api/todo-lists?id=${listId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLists();
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
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
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              Lists
            </h1>
            <p className="text-gray-400 mt-2">Organize your tasks into different lists</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingList(null);
              setFormData({ name: '', color: '#3b82f6', icon: 'folder' });
              setShowModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white font-medium flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New List
          </motion.button>
        </div>

        {/* Lists Grid */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading lists...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list, index) => {
              const IconComponent = ICON_OPTIONS.find(i => i.name === list.icon)?.icon || FolderKanban;

              return (
                <motion.div
                  key={list.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/tasks?list=${list.id}`)}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: `${list.color}20` }}
                      >
                        <IconComponent className="w-8 h-8" style={{ color: list.color }} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{list.name}</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {list.is_default ? 'Default List' : 'Custom List'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(list);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(list.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingList ? 'Edit List' : 'New List'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    List Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Work, Personal, Home"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Icon
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {ICON_OPTIONS.map(({ name, icon: Icon }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: name })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.icon === name
                            ? 'border-green-500 bg-green-500/20'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <Icon className="w-6 h-6 text-white mx-auto" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.color === color
                            ? 'border-white scale-110'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingList(null);
                      setFormData({ name: '', color: '#3b82f6', icon: 'folder' });
                    }}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg text-white font-medium transition-all"
                  >
                    {editingList ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
