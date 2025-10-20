"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Mic,
  MicOff,
  MessageCircle,
  Send,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProjectStep {
  title: string;
  description: string;
  effort: string;
  order: number;
  dependencies?: string[];
  tips?: string;
}

interface ProjectPhase {
  name: string;
  description: string;
  tasks: ProjectStep[];
}

interface AIPlan {
  overview: string;
  phases: ProjectPhase[];
  bestPractices: string[];
  estimatedDuration: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const { language } = useLanguage();
  const [step, setStep] = useState<'input' | 'generating' | 'chat' | 'confirm'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetEndDate, setTargetEndDate] = useState("");
  const [color, setColor] = useState("#667eea");
  const [complexity, setComplexity] = useState<'low' | 'medium' | 'high'>('medium');
  const [autoComplexity, setAutoComplexity] = useState(true);

  // Voice recognition states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingText, setRecordingText] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState<"en-US" | "fr-FR">(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voiceInputLanguageProject');
      if (saved === 'fr-FR') return 'fr-FR';
    }
    return 'en-US';
  });

  // AI Generated Plan
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<number[]>([]);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const recognitionRef = useRef<any>(null);

  const colors = [
    "#667eea", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16"
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    if (isOpen) {
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
          if (event.error !== 'network' && event.error !== 'aborted') {
            alert(language === 'fr'
              ? `Erreur de reconnaissance vocale: ${event.error}`
              : `Voice recognition error: ${event.error}`);
          }
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
  }, [isOpen, voiceLanguage]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert(language === 'fr'
        ? 'La reconnaissance vocale n\'est pas supportée dans votre navigateur.'
        : 'Speech recognition is not supported in your browser.');
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
    setError(null);

    try {
      const response = await fetch('/api/parse-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const parsedProject = await response.json();

      setTitle(parsedProject.title || '');
      setDescription(parsedProject.description || '');
      if (parsedProject.target_end_date && parsedProject.target_end_date !== null) {
        setTargetEndDate(new Date(parsedProject.target_end_date).toISOString().split('T')[0]);
      }

      if (!response.ok && parsedProject.error) {
        setError(language === 'fr'
          ? `Erreur d'analyse IA: ${parsedProject.error}. Veuillez vérifier les champs.`
          : `AI parsing issue: ${parsedProject.error}. Please review the fields.`);
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      setError(language === 'fr'
        ? 'Erreur lors du traitement de la voix. Veuillez remplir les champs manuellement.'
        : 'Error processing voice input. Please fill fields manually.');
      setTitle(text.substring(0, 50));
      setDescription(text);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!title.trim()) {
      setError(language === 'fr' ? "Veuillez entrer un titre de projet" : "Please enter a project title");
      return;
    }

    setLoading(true);
    setError(null);
    setStep('generating');

    try {
      const response = await fetch('/api/ai-project-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          targetEndDate,
          language: language === 'fr' ? 'fr' : 'en',
          complexity: autoComplexity ? 'auto' : complexity,
        }),
      });

      const data = await response.json();

      if (data.plan) {
        setAiPlan(data.plan);
        setStep('chat');
        setExpandedPhases([0]); // Expand first phase by default

        // Add initial assistant message
        setChatMessages([{
          role: 'assistant',
          content: language === 'fr'
            ? `J'ai généré un plan détaillé pour votre projet "${title}". Vous pouvez me demander de le modifier, d'ajouter des détails, ou de retirer des étapes. Que souhaitez-vous changer?`
            : `I've generated a detailed plan for your project "${title}". You can ask me to modify it, add more details, or remove steps. What would you like to change?`
        }]);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Failed to generate project plan');
      }
    } catch (err: any) {
      console.error('Error generating plan:', err);
      setError(err.message || (language === 'fr'
        ? 'Échec de la génération du plan. Vous pouvez toujours créer le projet manuellement.'
        : 'Failed to generate plan. You can still create the project manually.'));
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleChatMessage = async () => {
    if (!chatInput.trim() || !aiPlan) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    // Add user message
    const newMessages = [...chatMessages, { role: 'user' as const, content: userMessage }];
    setChatMessages(newMessages);

    try {
      const response = await fetch('/api/ai-project-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          currentPlan: aiPlan,
          language: language === 'fr' ? 'fr' : 'en',
        }),
      });

      const data = await response.json();

      if (data.plan) {
        setAiPlan(data.plan);
        setChatMessages([...newMessages, {
          role: 'assistant',
          content: data.message || (language === 'fr' ? 'Plan mis à jour!' : 'Plan updated!')
        }]);
      } else {
        setChatMessages([...newMessages, {
          role: 'assistant',
          content: language === 'fr'
            ? 'Désolé, je n\'ai pas pu modifier le plan. Pouvez-vous reformuler?'
            : 'Sorry, I couldn\'t modify the plan. Could you rephrase?'
        }]);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setChatMessages([...newMessages, {
        role: 'assistant',
        content: language === 'fr'
          ? 'Une erreur s\'est produite. Veuillez réessayer.'
          : 'An error occurred. Please try again.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCreateProject = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create the project
      const projectData = {
        title,
        description,
        status: 'planning',
        start_date: new Date().toISOString().split('T')[0],
        target_end_date: targetEndDate || null,
        color,
        ai_plan: aiPlan,
      };

      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to create project');
      }

      const project = await projectResponse.json();

      // Create project steps from AI plan
      if (aiPlan) {
        let orderIndex = 0;
        for (const phase of aiPlan.phases) {
          for (const task of phase.tasks) {
            await fetch('/api/project-steps', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_id: project.id,
                title: task.title,
                description: task.description,
                order_index: orderIndex++,
                status: 'pending',
                estimated_hours: task.effort === 'large' ? 8 : task.effort === 'medium' ? 4 : 2,
              }),
            });
          }
        }
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || (language === 'fr'
        ? 'Échec de la création du projet. Veuillez réessayer.'
        : 'Failed to create project. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setTitle("");
    setDescription("");
    setTargetEndDate("");
    setColor("#667eea");
    setComplexity('medium');
    setAutoComplexity(true);
    setAiPlan(null);
    setChatMessages([]);
    setChatInput("");
    setError(null);
    setRecordingText("");
    onClose();
  };

  const togglePhase = (index: number) => {
    setExpandedPhases(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-800 rounded-xl max-w-6xl w-full border border-gray-700 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {language === 'fr' ? 'Créer un nouveau projet' : 'Create New Project'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {step === 'input' && (language === 'fr' ? 'Décrivez votre projet' : 'Describe your project')}
              {step === 'generating' && (language === 'fr' ? 'Génération du plan...' : 'Generating plan...')}
              {step === 'chat' && (language === 'fr' ? 'Affinez votre plan' : 'Refine your plan')}
              {step === 'confirm' && (language === 'fr' ? 'Confirmez et créez' : 'Confirm and create')}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700">
          <div className="flex items-center gap-4">
            {['input', 'chat', 'confirm'].map((s, idx) => (
              <div key={s} className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step === s || (s === 'chat' && aiPlan)
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {s === 'chat' && aiPlan ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-sm ${step === s ? 'text-white' : 'text-gray-400'}`}>
                    {s === 'input' && (language === 'fr' ? 'Détails' : 'Details')}
                    {s === 'chat' && (language === 'fr' ? 'Plan IA' : 'AI Plan')}
                    {s === 'confirm' && (language === 'fr' ? 'Confirmer' : 'Confirm')}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`h-0.5 w-full ${aiPlan && idx === 0 ? 'bg-teal-500' : 'bg-gray-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Input */}
          {step === 'input' && (
            <div className="space-y-6">
              {/* Voice Input */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-purple-400 font-medium">
                      {language === 'fr' ? 'Entrée vocale IA' : 'AI Voice Input'}
                    </span>

                    {/* Language Switch */}
                    <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceLanguage("en-US");
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('voiceInputLanguageProject', "en-US");
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
                            localStorage.setItem('voiceInputLanguageProject', "fr-FR");
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
                      <span className="text-sm">
                        {language === 'fr' ? 'Traitement...' : 'Processing...'}
                      </span>
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
                      {language === 'fr' ? "Enregistrement... Cliquez pour arrêter" : "Recording... Click to stop"}
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      {language === 'fr' ? "Cliquez pour décrire votre projet" : "Click to describe your project"}
                    </>
                  )}
                </button>

                {recordingText && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-gray-300 text-sm italic"
                  >
                    &quot;{recordingText}&quot;
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {language === 'fr' ? 'Titre du projet *' : 'Project Title *'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={language === 'fr' ? 'ex: Lancer une boutique en ligne' : 'e.g., Launch an online store'}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {language === 'fr' ? 'Description' : 'Description'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === 'fr' ? 'Décrivez vos objectifs...' : 'Describe your goals...'}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {language === 'fr' ? 'Date cible (optionnel)' : 'Target Date (optional)'}
                </label>
                <input
                  type="date"
                  value={targetEndDate}
                  onChange={(e) => setTargetEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {language === 'fr' ? 'Couleur du projet' : 'Project Color'}
                </label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Project Complexity */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {language === 'fr' ? 'Complexité du projet' : 'Project Complexity'}
                </label>

                {/* Auto-detect checkbox */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="autoComplexity"
                    checked={autoComplexity}
                    onChange={(e) => setAutoComplexity(e.target.checked)}
                    className="w-4 h-4 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500 focus:ring-2"
                  />
                  <label htmlFor="autoComplexity" className="text-sm text-gray-300 cursor-pointer">
                    {language === 'fr' ? 'Laisser l\'IA décider de la complexité' : 'Let AI decide complexity'}
                  </label>
                </div>

                {/* Complexity selector */}
                <select
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value as 'low' | 'medium' | 'high')}
                  disabled={autoComplexity}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="low">
                    {language === 'fr' ? 'Faible (3-5 étapes)' : 'Low (3-5 steps)'}
                  </option>
                  <option value="medium">
                    {language === 'fr' ? 'Moyenne (~10 étapes)' : 'Medium (~10 steps)'}
                  </option>
                  <option value="high">
                    {language === 'fr' ? 'Élevée (~20 étapes)' : 'High (~20 steps)'}
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Generating */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-16 h-16 text-teal-500 animate-spin mb-6" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {language === 'fr' ? 'Génération de votre plan de projet...' : 'Generating your project plan...'}
              </h3>
              <p className="text-gray-400 text-center max-w-md">
                {language === 'fr'
                  ? 'L\'IA analyse votre projet et crée un plan détaillé avec des étapes actionnables.'
                  : 'AI is analyzing your project and creating a detailed plan with actionable steps.'}
              </p>
            </div>
          )}

          {/* Step 3: Chat & Review */}
          {step === 'chat' && aiPlan && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Plan Preview */}
              <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 300px)' }}>
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-teal-400 mb-2">
                    {language === 'fr' ? 'Vue d\'ensemble' : 'Overview'}
                  </h3>
                  <p className="text-gray-300 text-sm">{aiPlan.overview}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {language === 'fr' ? 'Phases du projet' : 'Project Phases'}
                  </h3>
                  <div className="space-y-3">
                    {aiPlan.phases.map((phase, phaseIdx) => (
                      <div
                        key={phaseIdx}
                        className="bg-gray-700/50 border border-gray-600 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => togglePhase(phaseIdx)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-700/70 transition-colors"
                        >
                          <div>
                            <h4 className="font-semibold text-white">{phase.name}</h4>
                            <p className="text-gray-400 text-sm mt-1">{phase.description}</p>
                            <p className="text-teal-400 text-xs mt-2">
                              {phase.tasks.length} {language === 'fr' ? 'tâches' : 'tasks'}
                            </p>
                          </div>
                          {expandedPhases.includes(phaseIdx) ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {expandedPhases.includes(phaseIdx) && (
                          <div className="px-4 pb-4 space-y-2">
                            {phase.tasks.map((task, taskIdx) => (
                              <div
                                key={taskIdx}
                                className="bg-gray-800 rounded-lg p-3 border border-gray-600"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-white text-sm">{task.title}</h5>
                                    <p className="text-gray-400 text-xs mt-1">{task.description}</p>
                                    {task.tips && (
                                      <p className="text-teal-400 text-xs mt-2 italic">💡 {task.tips}</p>
                                    )}
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      task.effort === 'small'
                                        ? 'bg-green-500/20 text-green-400'
                                        : task.effort === 'medium'
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}
                                  >
                                    {task.effort}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex flex-col bg-gray-700/30 rounded-lg border border-gray-600 overflow-hidden">
                <div className="p-4 border-b border-gray-600 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-teal-400" />
                  <h3 className="font-semibold text-white">
                    {language === 'fr' ? 'Affiner le plan' : 'Refine Plan'}
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '400px' }}>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-teal-500 text-white'
                            : 'bg-gray-600 text-gray-100'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-600 text-gray-100 rounded-lg p-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-gray-600">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !chatLoading && handleChatMessage()}
                      placeholder={language === 'fr'
                        ? 'ex: Ajoute une phase de tests...'
                        : 'e.g., Add a testing phase...'}
                      className="flex-1 px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      disabled={chatLoading}
                    />
                    <button
                      onClick={handleChatMessage}
                      disabled={chatLoading || !chatInput.trim()}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex items-center justify-between gap-4">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            {language === 'fr' ? 'Annuler' : 'Cancel'}
          </button>

          <div className="flex items-center gap-3">
            {step === 'input' && (
              <button
                onClick={handleGeneratePlan}
                disabled={loading || !title.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 rounded-lg text-white font-medium transition-all shadow-lg flex items-center gap-2 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {language === 'fr' ? 'Génération...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {language === 'fr' ? 'Générer le plan IA' : 'Generate AI Plan'}
                  </>
                )}
              </button>
            )}

            {step === 'chat' && (
              <button
                onClick={handleCreateProject}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-600 rounded-lg text-white font-medium transition-all shadow-lg flex items-center gap-2 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {language === 'fr' ? 'Création...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {language === 'fr' ? 'Créer le projet' : 'Create Project'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
