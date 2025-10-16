"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  Calendar,
  Tag,
  AlignLeft,
  FolderKanban,
  Clock,
  Bell
} from "lucide-react";

interface TodoList {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  list_id: string;
  tags: string[] | null;
  estimated_hours: number | null;
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
  editTask?: Task | null;
}

export default function AddTaskModal({ isOpen, onClose, onTaskAdded, editTask }: AddTaskModalProps) {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingText, setRecordingText] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState<"en-US" | "fr-FR">(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voiceInputLanguageTask');
      if (saved === 'fr-FR') return 'fr-FR';
    }
    return 'en-US';
  });

  const [formData, setFormData] = useState({
    list_id: "",
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    due_date: "",
    estimated_hours: "1",
    tags: [] as string[],
    email_reminder: false,
    reminder_days_before: 1,
  });

  const [tagInput, setTagInput] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLists();

      // Populate form if editing
      if (editTask) {
        setFormData({
          list_id: editTask.list_id,
          title: editTask.title,
          description: editTask.description || '',
          priority: editTask.priority,
          due_date: editTask.due_date ? new Date(editTask.due_date).toISOString().split('T')[0] : '',
          estimated_hours: editTask.estimated_hours?.toString() || '1',
          tags: editTask.tags || [],
        });
      }

      // Initialize Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = voiceLanguage;

        recognitionRef.current.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          setRecordingText(transcript);
          setIsRecording(false);
          await processVoiceInput(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          alert('Error recording audio. Please try again.');
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen, voiceLanguage, editTask]);

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/todo-lists');
      if (response.ok) {
        const data = await response.json();
        setLists(data);
        if (data.length > 0 && !formData.list_id) {
          setFormData(prev => ({ ...prev, list_id: data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setRecordingText("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const processVoiceInput = async (text: string) => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const parsedTask = await response.json();

        setFormData(prev => ({
          ...prev,
          title: parsedTask.title || '',
          description: parsedTask.description || '',
          priority: parsedTask.priority || 'medium',
          due_date: parsedTask.due_date ? new Date(parsedTask.due_date).toISOString().split('T')[0] : '',
          tags: parsedTask.tags || [],
        }));
      } else {
        alert('Failed to process voice input. Please try again.');
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      alert('Error processing voice input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.list_id) {
      alert('Please provide a task title and select a list.');
      return;
    }

    try {
      const method = editTask ? 'PATCH' : 'POST';
      const { email_reminder, reminder_days_before, ...taskData } = formData;

      const body = editTask
        ? { id: editTask.id, ...taskData, due_date: formData.due_date || null }
        : { ...taskData, due_date: formData.due_date || null };

      const response = await fetch('/api/tasks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const task = await response.json();

        // Create reminder if email_reminder is enabled and due_date is set
        if (email_reminder && formData.due_date) {
          const dueDate = new Date(formData.due_date);
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(reminderDate.getDate() - reminder_days_before);
          reminderDate.setHours(9, 0, 0, 0); // Set reminder time to 9 AM

          await fetch('/api/task-reminders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task_id: task.id,
              reminder_type: 'email',
              reminder_time: reminderDate.toISOString(),
            }),
          });
        }

        onTaskAdded();
        handleClose();
      } else {
        alert(`Failed to ${editTask ? 'update' : 'create'} task. Please try again.`);
      }
    } catch (error) {
      console.error(`Error ${editTask ? 'updating' : 'creating'} task:`, error);
      alert(`Error ${editTask ? 'updating' : 'creating'} task. Please try again.`);
    }
  };

  const handleClose = () => {
    setFormData({
      list_id: lists.length > 0 ? lists[0].id : "",
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
      estimated_hours: "1",
      tags: [],
      email_reminder: false,
      reminder_days_before: 1,
    });
    setRecordingText("");
    setTagInput("");
    onClose();
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-2xl w-full border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {editTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Voice Input Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-400 font-medium">AI Voice Input</span>

                  {/* Language Switch */}
                  <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceLanguage("en-US");
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('voiceInputLanguageTask', "en-US");
                        }
                      }}
                      disabled={isRecording || isProcessing}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${
                        voiceLanguage === "en-US"
                          ? "bg-purple-500 text-white"
                          : "text-gray-400 hover:text-white"
                      } disabled:opacity-50`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceLanguage("fr-FR");
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('voiceInputLanguageTask', "fr-FR");
                        }
                      }}
                      disabled={isRecording || isProcessing}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${
                        voiceLanguage === "fr-FR"
                          ? "bg-purple-500 text-white"
                          : "text-gray-400 hover:text-white"
                      } disabled:opacity-50`}
                    >
                      FR
                    </button>
                  </div>
                </div>

                {isProcessing && (
                  <div className="flex items-center gap-2 text-purple-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={toggleRecording}
                disabled={isProcessing}
                className={`w-full py-4 rounded-lg font-medium transition-all flex items-center justify-center gap-3 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    {voiceLanguage === "en-US" ? "Recording... Click to stop" : "Enregistrement... Cliquez pour arrêter"}
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    {voiceLanguage === "en-US" ? "Click to speak your task" : "Cliquez pour dicter votre tâche"}
                  </>
                )}
              </button>

              {recordingText && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-gray-300 text-sm italic"
                >
                  "{recordingText}"
                </motion.p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* List Selection */}
            <div>
              <label className="flex items-center gap-2 text-gray-300 text-sm font-medium mb-2">
                <FolderKanban className="w-4 h-4" />
                List
              </label>
              <select
                value={formData.list_id}
                onChange={(e) => setFormData({ ...formData, list_id: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                {lists.map(list => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="What needs to be done?"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-gray-300 text-sm font-medium mb-2">
                <AlignLeft className="w-4 h-4" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                placeholder="Add more details..."
              />
            </div>

            {/* Priority & Due Date & Estimated Hours */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-300 text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-300 text-sm font-medium mb-2">
                  <Clock className="w-4 h-4" />
                  Est. Hours
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="999"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Hours"
                />
              </div>
            </div>

            {/* Email Reminder */}
            {formData.due_date && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="email_reminder"
                    checked={formData.email_reminder}
                    onChange={(e) => setFormData({ ...formData, email_reminder: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor="email_reminder" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Bell className="w-4 h-4 text-blue-400" />
                        Send email reminder
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Receive an email reminder before the due date
                      </p>
                    </label>
                    {formData.email_reminder && (
                      <div className="mt-3">
                        <label className="block text-sm text-gray-300 mb-2">
                          Remind me:
                        </label>
                        <select
                          value={formData.reminder_days_before}
                          onChange={(e) => setFormData({ ...formData, reminder_days_before: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={0}>On the day (9:00 AM)</option>
                          <option value={1}>1 day before (9:00 AM)</option>
                          <option value={2}>2 days before (9:00 AM)</option>
                          <option value={3}>3 days before (9:00 AM)</option>
                          <option value={7}>1 week before (9:00 AM)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="flex items-center gap-2 text-gray-300 text-sm font-medium mb-2">
                <Tag className="w-4 h-4" />
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all shadow-lg"
              >
                {editTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
