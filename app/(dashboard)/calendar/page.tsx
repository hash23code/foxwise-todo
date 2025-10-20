"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, StickyNote, Plus, X, Bell, Clock, CheckCircle, Circle, Mic, MicOff, Loader2, Sparkles, CheckSquare } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { getCalendarNotesByDateRange, createCalendarNote, updateCalendarNote, deleteCalendarNote, CalendarNote } from "@/lib/api/calendar-notes";
import { useLanguage } from "@/contexts/LanguageContext";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  todo_lists: {
    name: string;
    color: string;
  };
}

export default function CalendarPage() {
  const { user } = useUser();
  const { language, t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [noteFormData, setNoteFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    email_reminder: false,
    color: "#f59e0b",
  });

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState<"en-US" | "fr-FR">(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voiceInputLanguage');
      if (saved === 'fr-FR') return 'fr-FR';
    }
    return 'en-US';
  });
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
      const end = format(endOfMonth(currentDate), "yyyy-MM-dd");

      // Load calendar notes
      const notesData = await getCalendarNotesByDateRange(user!.id, start, end);
      setNotes(notesData);

      // Load tasks with due dates
      const tasksResponse = await fetch('/api/tasks');
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();

        // Filter tasks that have due dates (keep completed visible, exclude cancelled)
        const activeTasks = tasksData.filter((task: Task) => {
          // Check if task has due date
          if (!task.due_date) return false;

          // Check if task is not cancelled (keep completed tasks visible but crossed out)
          if (task.status === 'cancelled') return false;

          // Validate the date format
          try {
            const testDate = new Date(task.due_date);
            if (isNaN(testDate.getTime())) {
              return false;
            }
            return true;
          } catch (error) {
            return false;
          }
        });

        setTasks(activeTasks);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Pad the start with empty days
  const startDay = startOfMonth(currentDate).getDay();
  const paddingDays = Array(startDay).fill(null);

  const getNotesForDate = (date: Date) => {
    return notes.filter(n => {
      // Parse the date - check if it already has time or not
      const noteDate = n.date.includes('T')
        ? new Date(n.date)
        : new Date(n.date + 'T00:00:00');
      return isSameDay(noteDate, date);
    });
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(t => {
      if (!t.due_date) return false;

      try {
        // Parse the date - handle both date-only and datetime formats
        let taskDate: Date;

        if (t.due_date.includes('T')) {
          // Full datetime format (e.g., "2025-01-15T12:00:00Z")
          taskDate = new Date(t.due_date);
        } else {
          // Date-only format (e.g., "2025-01-15")
          // Add T00:00:00 to force local timezone interpretation
          taskDate = new Date(t.due_date + 'T00:00:00');
        }

        // Check if the date is valid
        if (isNaN(taskDate.getTime())) {
          console.warn('Invalid task date:', t.due_date, 'for task:', t.title);
          return false;
        }

        // Compare just the date parts (year, month, day)
        return (
          taskDate.getFullYear() === date.getFullYear() &&
          taskDate.getMonth() === date.getMonth() &&
          taskDate.getDate() === date.getDate()
        );
      } catch (error) {
        console.error('Error parsing task date:', t.due_date, error);
        return false;
      }
    });
  };

  const handleAddNote = async () => {
    try {
      if (!noteFormData.title || !noteFormData.date) {
        alert("Please provide a title and date");
        return;
      }

      await createCalendarNote({
        title: noteFormData.title,
        description: noteFormData.description || undefined,
        date: noteFormData.date,
        time: noteFormData.time || undefined,
        email_reminder: noteFormData.email_reminder,
        color: noteFormData.color,
      });

      // Reset form and reload
      setNoteFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        email_reminder: false,
        color: "#f59e0b",
      });
      setIsAddNoteModalOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note");
    }
  };

  const handleToggleNoteComplete = async (note: CalendarNote) => {
    try {
      await updateCalendarNote(note.id, {
        completed: !note.completed,
      });
      await loadData();
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      if (confirm("Are you sure you want to delete this note?")) {
        await deleteCalendarNote(noteId);
        await loadData();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const openAddNoteModal = (date?: Date) => {
    if (date) {
      setNoteFormData({
        ...noteFormData,
        date: format(date, "yyyy-MM-dd"),
      });
    }
    setTranscript("");
    setInterimTranscript("");
    setVoiceError("");
    setIsAddNoteModalOpen(true);
  };

  // Voice input functions
  const startListening = async () => {
    try {
      setTranscript("");
      setInterimTranscript("");
      setVoiceError("");
      setIsListening(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob, mimeType);
      };

      mediaRecorderRef.current.start();
      setInterimTranscript('Recording...');
    } catch (err: any) {
      setIsListening(false);
      setVoiceError("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const transcribeAudio = async (audioBlob: Blob, mimeType: string) => {
    setIsProcessingVoice(true);
    setInterimTranscript('Transcribing with AI...');

    try {
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData: base64Audio, mimeType, language: voiceLanguage }),
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      if (result.success && result.transcription) {
        setTranscript(result.transcription);
        setInterimTranscript('');
      }
    } catch (err: any) {
      setVoiceError(`Transcription failed: ${err.message}`);
      setInterimTranscript('');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const processVoiceNote = async () => {
    if (transcript) {
      setIsProcessingVoice(true);
      try {
        // Use AI to intelligently parse the transcript
        const response = await fetch('/api/parse-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, language: voiceLanguage }),
        });

        if (!response.ok) {
          throw new Error('Failed to parse note');
        }

        const result = await response.json();

        if (result.success) {
          setNoteFormData({
            ...noteFormData,
            title: result.title,
            description: result.description,
            date: result.date,
            time: result.time || noteFormData.time,
          });
          setTranscript("");
        } else {
          throw new Error(result.error || 'Failed to parse note');
        }
      } catch (error: any) {
        console.error('Error processing voice note:', error);
        setVoiceError(`Failed to process note: ${error.message}`);

        // Fallback to simple parsing
        const words = transcript.trim().split(' ');
        let title = "";
        let description = "";

        if (words.length <= 5) {
          title = transcript;
        } else {
          title = words.slice(0, 5).join(' ');
          description = words.slice(5).join(' ');
        }

        const dateToUse = noteFormData.date || format(new Date(), "yyyy-MM-dd");

        setNoteFormData({
          ...noteFormData,
          title,
          description,
          date: dateToUse
        });
        setTranscript("");
      } finally {
        setIsProcessingVoice(false);
      }
    }
  };

  const selectedDateNotes = selectedDate ? getNotesForDate(selectedDate) : [];
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const updateTaskStatus = async (taskId: string, status: 'completed' | 'in_progress') => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status }),
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">{t.common.loading}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            {t.calendar.title}
          </h1>
          <p className="text-gray-400 mt-2">{t.calendar.subtitle}</p>
        </div>
        <button
          onClick={() => openAddNoteModal()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          {t.calendar.addNote}
        </button>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
      >
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-300 text-sm">Notes & Reminders</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300 text-sm">Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-gray-300 text-sm">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">Pending</span>
          </div>
        </div>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
      >
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-400" />
          </button>
          <h2 className="text-2xl font-bold text-white">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-gray-400 text-sm font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} className="aspect-square" />
          ))}
          {daysInMonth.map((day) => {
            const dayNotes = getNotesForDate(day);
            const dayTasks = getTasksForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);

            return (
              <motion.button
                key={day.toISOString()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square p-2 rounded-lg border transition-all
                  ${isSelected
                    ? "bg-yellow-500/20 border-yellow-500"
                    : isCurrentDay
                    ? "bg-blue-500/20 border-blue-500"
                    : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  }
                `}
              >
                <div className="flex flex-col h-full overflow-hidden">
                  <span
                    className={`text-sm font-medium mb-1 ${
                      isSelected || isCurrentDay ? "text-white" : "text-gray-300"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                    {/* Show note titles */}
                    {dayNotes.map((note, idx) => (
                      <div
                        key={`n-${idx}`}
                        className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] leading-tight truncate"
                        style={{
                          backgroundColor: note.color + '20',
                          borderLeft: `2px solid ${note.color}`
                        }}
                        title={note.title}
                      >
                        <StickyNote
                          className="w-2 h-2 flex-shrink-0"
                          style={{ color: note.color }}
                        />
                        <span className="text-white truncate">{note.title}</span>
                      </div>
                    ))}
                    {/* Show task titles */}
                    {dayTasks.map((task, idx) => (
                      <div
                        key={`t-${idx}`}
                        className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] leading-tight truncate"
                        style={{
                          backgroundColor: getPriorityColor(task.priority) + '20',
                          borderLeft: `2px solid ${getPriorityColor(task.priority)}`
                        }}
                        title={task.title}
                      >
                        <CheckSquare
                          className="w-2 h-2 flex-shrink-0"
                          style={{ color: getPriorityColor(task.priority) }}
                        />
                        <span className="text-white truncate">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected Date Details */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">
              {format(selectedDate, "MMMM dd, yyyy")}
            </h3>
            <button
              onClick={() => openAddNoteModal(selectedDate)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Note
            </button>
          </div>

          {/* Tasks Section */}
          {selectedDateTasks.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Tasks Due
              </h4>
              <div className="space-y-2">
                {selectedDateTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg border-l-4"
                    style={{ borderLeftColor: getPriorityColor(task.priority) }}
                  >
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${task.status === 'completed' ? "text-gray-500 line-through" : "text-white"}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span
                              className="px-2 py-1 rounded-full text-xs"
                              style={{
                                backgroundColor: `${task.todo_lists.color}20`,
                                color: task.todo_lists.color
                              }}
                            >
                              {task.todo_lists.name}
                            </span>
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{ color: getPriorityColor(task.priority) }}
                            >
                              {task.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {selectedDateNotes.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <StickyNote className="w-4 h-4" />
                Notes & Reminders
              </h4>
              <div className="space-y-2">
                {selectedDateNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg border-l-4"
                    style={{ borderLeftColor: note.color }}
                  >
                    <button
                      onClick={() => handleToggleNoteComplete(note)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {note.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${note.completed ? "text-gray-500 line-through" : "text-white"}`}>
                            {note.title}
                          </p>
                          {note.description && (
                            <p className="text-sm text-gray-400 mt-1">{note.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {note.time && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {note.time}
                              </span>
                            )}
                            {note.email_reminder && (
                              <span className="flex items-center gap-1 text-xs text-blue-400">
                                <Bell className="w-3 h-3" />
                                Email reminder
                                {note.reminder_sent && " (sent)"}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {selectedDateNotes.length === 0 && selectedDateTasks.length === 0 && (
            <p className="text-gray-400 text-center py-8">No tasks or notes on this date</p>
          )}
        </motion.div>
      )}

      {/* Add Note Modal */}
      <AnimatePresence>
        {isAddNoteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsAddNoteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <StickyNote className="w-6 h-6 text-yellow-400" />
                  Add Note
                </h3>
                <button
                  onClick={() => {
                    setIsAddNoteModalOpen(false);
                    if (isListening) stopListening();
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* AI Voice Input Section */}
              <div className="mb-6 p-4 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        AI Voice Input
                        <span className="text-xs bg-yellow-400 text-purple-900 px-2 py-0.5 rounded-full font-bold">AI</span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">Speak to create your note</p>
                    </div>
                    {/* Language selector */}
                    <div className="flex gap-1 bg-gray-700 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceLanguage("en-US");
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('voiceInputLanguage', "en-US");
                          }
                        }}
                        disabled={isListening || isProcessingVoice}
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
                            localStorage.setItem('voiceInputLanguage', "fr-FR");
                          }
                        }}
                        disabled={isListening || isProcessingVoice}
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
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={isProcessingVoice}
                    className={`relative p-4 rounded-full transition-all shadow-2xl group ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {!isListening && (
                      <span className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></span>
                    )}
                    {isListening ? (
                      <MicOff className="w-6 h-6 text-white relative z-10" />
                    ) : (
                      <div className="relative z-10">
                        <Mic className="w-6 h-6 text-white" />
                        <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-pulse" />
                        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[8px] bg-yellow-400 text-purple-900 rounded-full font-bold">AI</span>
                      </div>
                    )}
                  </button>
                </div>

                {(transcript || interimTranscript) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-gray-900/50 rounded-lg mb-3"
                  >
                    <p className={`text-xs mb-1 ${isListening ? 'text-green-400' : 'text-gray-400'}`}>
                      {isListening ? 'Listening...' : 'Recorded:'}
                    </p>
                    <p className="text-white text-sm">
                      {transcript}
                      {transcript && interimTranscript && ' '}
                      {interimTranscript && <span className="text-gray-400 italic">{interimTranscript}</span>}
                      {!transcript && !interimTranscript && "Start speaking..."}
                    </p>
                  </motion.div>
                )}

                {transcript && !isListening && !isProcessingVoice && (
                  <button
                    type="button"
                    onClick={processVoiceNote}
                    className="relative w-full px-4 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white text-sm rounded-lg transition-all shadow-lg hover:shadow-2xl font-semibold overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity"></span>
                    <span className="relative flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Use This Note
                      <span className="text-xs bg-yellow-400 text-purple-900 px-1.5 py-0.5 rounded-full font-bold">AI</span>
                    </span>
                  </button>
                )}

                {isProcessingVoice && (
                  <div className="flex items-center gap-2 text-purple-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing with AI...</span>
                  </div>
                )}

                {voiceError && (
                  <div className="p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-xs">
                    {voiceError}
                  </div>
                )}

                <p className="text-gray-400 text-xs mt-3">
                  {voiceLanguage === "en-US"
                    ? 'Click the microphone and say something like: "Remind me to pay the electric bill on the 15th"'
                    : 'Cliquez sur le microphone et dites quelque chose comme: "Me rappeler de payer la facture d\'électricité le 15"'
                  }
                </p>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={noteFormData.title}
                    onChange={(e) => setNoteFormData({ ...noteFormData, title: e.target.value })}
                    placeholder="Pay electric bill..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={noteFormData.description}
                    onChange={(e) => setNoteFormData({ ...noteFormData, description: e.target.value })}
                    placeholder="Additional details..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={noteFormData.date}
                      onChange={(e) => setNoteFormData({ ...noteFormData, date: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={noteFormData.time}
                      onChange={(e) => setNoteFormData({ ...noteFormData, time: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setNoteFormData({ ...noteFormData, color })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          noteFormData.color === color ? "border-white scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Email Reminder */}
                <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <input
                    type="checkbox"
                    id="email_reminder"
                    checked={noteFormData.email_reminder}
                    onChange={(e) => setNoteFormData({ ...noteFormData, email_reminder: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <label htmlFor="email_reminder" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <Bell className="w-4 h-4 text-blue-400" />
                      Send email reminder
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Receive an email 1 day before this date
                    </p>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  Add Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
