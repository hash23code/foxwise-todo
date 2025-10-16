"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  Coffee,
  CheckCircle,
  Loader2,
  Mic,
  MicOff,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AIPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanApplied: () => void;
  selectedDate: Date;
}

interface DayPlan {
  date: string;
  tasks: Array<{
    taskId: string;
    startTime: string;
    durationHours: number;
    reasoning: string;
    task?: any;
  }>;
}

export default function AIPlannerModal({
  isOpen,
  onClose,
  onPlanApplied,
  selectedDate,
}: AIPlannerModalProps) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1); // 1: choose type, 2: configure, 3: generating, 4: review
  const [planType, setPlanType] = useState<"day" | "week">("day");

  // Load AI response language from localStorage or default to app language
  const [aiLanguage, setAiLanguage] = useState<"en" | "fr">(() => {
    if (typeof window === 'undefined') return language;
    const saved = localStorage.getItem('aiLanguage') as "en" | "fr";
    return (saved === 'en' || saved === 'fr') ? saved : language;
  });

  // Save AI language preference
  const handleSetAiLanguage = (lang: "en" | "fr") => {
    setAiLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aiLanguage', lang);
    }
  };

  // Set default work start hour based on current time if planning today
  const getDefaultStartHour = () => {
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    if (isToday) {
      const currentHour = new Date().getHours();
      // Round up to next hour
      return currentHour + 1;
    }
    return 9;
  };

  const [workStartHour, setWorkStartHour] = useState(getDefaultStartHour());
  const [workEndHour, setWorkEndHour] = useState(17);
  const [includeBreaks, setIncludeBreaks] = useState(false);
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [editingPlan, setEditingPlan] = useState<DayPlan[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Load voice language from localStorage or default to app language
  const [voiceLanguage, setVoiceLanguage] = useState<"en" | "fr">(() => {
    if (typeof window === 'undefined') return language;
    const saved = localStorage.getItem('voiceLanguage') as "en" | "fr";
    return (saved === 'en' || saved === 'fr') ? saved : language;
  });

  // Save voice language preference
  const handleSetVoiceLanguage = (lang: "en" | "fr") => {
    setVoiceLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('voiceLanguage', lang);
    }
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(language === "en"
        ? "Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari."
        : "La reconnaissance vocale n'est pas prise en charge par votre navigateur. Veuillez utiliser Chrome, Edge ou Safari.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = voiceLanguage === "fr" ? "fr-FR" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPreferences((prev) => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error !== 'aborted') {
        alert(language === "en"
          ? `Voice recognition error: ${event.error}`
          : `Erreur de reconnaissance vocale: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopVoiceRecognition = () => {
    setIsListening(false);
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    setStep(3);

    try {
      const startDate = selectedDate.toISOString().split("T")[0];
      const endDate =
        planType === "week"
          ? new Date(selectedDate.getTime() + 6 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
          : startDate;

      const breakTimes = includeBreaks
        ? [{ start: "12:00", duration: 1 }]
        : [];

      const response = await fetch("/api/ai-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          startDate,
          endDate: planType === "week" ? endDate : null,
          workStartHour,
          workEndHour,
          breakTimes,
          preferences,
          language: aiLanguage,
        }),
      });

      if (response.ok) {
        const plan = await response.json();
        setGeneratedPlan(plan);
        setEditingPlan(plan.plan);
        setStep(4);
      } else {
        alert(t.aiPlanner.failedToGenerate);
        setStep(2);
      }
    } catch (error) {
      console.error("Error generating plan:", error);
      alert(t.aiPlanner.errorGenerating);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPlan = async () => {
    setLoading(true);

    try {
      // Filter out tasks without taskId (breaks/pauses) before applying
      const filteredPlan = editingPlan.map(dayPlan => ({
        ...dayPlan,
        tasks: dayPlan.tasks.filter(task => task.taskId && task.taskId !== null)
      })).filter(dayPlan => dayPlan.tasks.length > 0); // Remove days with no tasks

      console.log('Original plan:', editingPlan);
      console.log('Filtered plan:', filteredPlan);
      console.log('Total tasks to apply:', filteredPlan.reduce((sum, day) => sum + day.tasks.length, 0));

      const response = await fetch("/api/ai-planner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: filteredPlan }),
      });

      if (response.ok) {
        onPlanApplied();
        handleClose();
        alert(t.aiPlanner.planAppliedSuccess);
      } else {
        alert(t.aiPlanner.failedToApply);
      }
    } catch (error) {
      console.error("Error applying plan:", error);
      alert(t.aiPlanner.errorApplying);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setPlanType("day");
    setWorkStartHour(9);
    setWorkEndHour(17);
    setIncludeBreaks(false);
    setPreferences("");
    setGeneratedPlan(null);
    setEditingPlan([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-4xl w-full border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {t.aiPlanner.title}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Step 1: Choose Plan Type */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-gray-300 text-lg">
                  {t.aiPlanner.greeting}
                </p>

                {/* Compact Language Selection - EN/FR Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {language === "en" ? "AI Language:" : "Langue IA:"}
                  </span>
                  <div className="flex bg-gray-700 rounded-lg p-0.5">
                    <button
                      onClick={() => handleSetAiLanguage("en")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        aiLanguage === "en"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => handleSetAiLanguage("fr")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        aiLanguage === "fr"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      FR
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setPlanType("day");
                    setStep(2);
                  }}
                  className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 rounded-xl hover:border-blue-400 transition-all text-left group"
                >
                  <Calendar className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-white mb-2">{t.aiPlanner.singleDay}</h3>
                  <p className="text-gray-400 text-sm">
                    {t.aiPlanner.singleDayDesc}
                  </p>
                </button>

                <button
                  onClick={() => {
                    setPlanType("week");
                    setStep(2);
                  }}
                  className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-xl hover:border-purple-400 transition-all text-left group"
                >
                  <Calendar className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-white mb-2">{t.aiPlanner.entireWeek}</h3>
                  <p className="text-gray-400 text-sm">
                    {t.aiPlanner.entireWeekDesc}
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Configure Preferences */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <p className="text-gray-300 text-lg">
                {t.aiPlanner.preferences} {planType === "day" ? t.aiPlanner.thisDay : t.aiPlanner.thisWeek}:
              </p>

              <div className="space-y-4">
                {/* Work Hours */}
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <label className="flex items-center gap-2 text-white font-medium mb-3">
                    <Clock className="w-5 h-5 text-blue-400" />
                    {t.aiPlanner.workHours}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">{t.aiPlanner.startTime}</label>
                      <select
                        value={workStartHour}
                        onChange={(e) => setWorkStartHour(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i.toString().padStart(2, "0")}:00
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">{t.aiPlanner.endTime}</label>
                      <select
                        value={workEndHour}
                        onChange={(e) => setWorkEndHour(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i.toString().padStart(2, "0")}:00
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Break Times */}
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <label className="flex items-center gap-2 text-white font-medium">
                    <input
                      type="checkbox"
                      checked={includeBreaks}
                      onChange={(e) => setIncludeBreaks(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                    <Coffee className="w-5 h-5 text-yellow-400" />
                    {t.aiPlanner.includeBreak}
                  </label>
                </div>

                {/* Additional Preferences */}
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white font-medium">
                      {t.aiPlanner.additionalPreferences}
                    </label>
                    <div className="flex items-center gap-2">
                      {/* Voice Language Switcher - EN/FR Toggle */}
                      <div className="flex bg-gray-700 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleSetVoiceLanguage("en")}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            voiceLanguage === "en"
                              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetVoiceLanguage("fr")}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            voiceLanguage === "fr"
                              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          FR
                        </button>
                      </div>

                      {/* Round Voice Button with Mic Icon */}
                      <button
                        type="button"
                        onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                        className={`w-10 h-10 rounded-full transition-all flex items-center justify-center shadow-lg relative ${
                          isListening
                            ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                            : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        }`}
                        title={isListening
                          ? (language === "en" ? "Stop Recording" : "Arrêter l'enregistrement")
                          : (language === "en" ? "Voice Input" : "Entrée vocale")
                        }
                      >
                        {isListening ? (
                          <MicOff className="w-5 h-5" />
                        ) : (
                          <>
                            <Mic className="w-5 h-5" />
                            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder={t.aiPlanner.preferencesPlaceholder}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                >
                  {t.aiPlanner.back}
                </button>
                <button
                  onClick={handleGeneratePlan}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {t.aiPlanner.generatePlan}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Generating */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {t.aiPlanner.analyzing}
              </h3>
              <p className="text-gray-400">
                {t.aiPlanner.analyzingDesc}
              </p>
            </motion.div>
          )}

          {/* Step 4: Review Plan */}
          {step === 4 && generatedPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-lg font-bold text-green-400 mb-2">
                  {t.aiPlanner.planSummary}
                </h3>
                <p className="text-gray-300 text-sm">{generatedPlan.summary}</p>
              </div>

              {/* Recommendations */}
              {generatedPlan.recommendations && generatedPlan.recommendations.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-400 mb-2">
                    💡 {t.aiPlanner.recommendations}
                  </h3>
                  <ul className="space-y-1">
                    {generatedPlan.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Plan Details */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {t.aiPlanner.proposedSchedule}
                  <span className="text-sm text-gray-400 font-normal">
                    ({language === "en" ? "Edit times if needed" : "Modifiez les heures si nécessaire"})
                  </span>
                </h3>
                {editingPlan.map((dayPlan, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
                  >
                    <h4 className="font-bold text-white mb-3">
                      {new Date(dayPlan.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </h4>
                    <div className="space-y-2">
                      {dayPlan.tasks.map((task, taskIndex) => (
                        <div
                          key={taskIndex}
                          className="bg-gray-700/50 p-3 rounded-lg"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {/* Editable Start Time */}
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-400">
                                {language === "en" ? "Start:" : "Début:"}
                              </label>
                              <input
                                type="time"
                                value={task.startTime}
                                onChange={(e) => {
                                  const newPlan = [...editingPlan];
                                  newPlan[dayIndex].tasks[taskIndex].startTime = e.target.value;
                                  setEditingPlan(newPlan);
                                }}
                                className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>

                            {/* Editable Duration */}
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-400">
                                {language === "en" ? "Duration:" : "Durée:"}
                              </label>
                              <input
                                type="number"
                                min="0.25"
                                max="12"
                                step="0.25"
                                value={task.durationHours}
                                onChange={(e) => {
                                  const newPlan = [...editingPlan];
                                  newPlan[dayIndex].tasks[taskIndex].durationHours = parseFloat(e.target.value);
                                  setEditingPlan(newPlan);
                                }}
                                className="w-16 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <span className="text-gray-400 text-sm">h</span>
                            </div>

                            <span className="text-gray-400">→</span>
                            <span className="text-white font-medium flex-1">
                              {task.task?.title || "Unknown Task"}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs italic">
                            {task.reasoning}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                >
                  {t.aiPlanner.regenerate}
                </button>
                <button
                  onClick={handleApplyPlan}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg text-white font-medium transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {t.aiPlanner.applyPlan}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
