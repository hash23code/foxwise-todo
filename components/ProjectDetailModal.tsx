"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Plus,
  Trash2,
  Edit2,
  MessageSquare,
  Copy,
  ChevronDown,
  ChevronRight,
  Loader2,
  Send,
  Calendar,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProjectStep {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  order: number;
  effort: string | null;
  dependencies: string[] | null;
  tips: string | null;
  todo_list_id: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  start_date: string | null;
  target_end_date: string | null;
  color: string;
  ai_plan: any;
  created_at: string;
  project_steps: ProjectStep[];
}

interface ProjectDetailModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProjectDetailModal({
  project: initialProject,
  isOpen,
  onClose,
  onUpdate,
}: ProjectDetailModalProps) {
  const { language } = useLanguage();
  const [project, setProject] = useState<Project>(initialProject);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0]));
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [addingStep, setAddingStep] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDescription, setNewStepDescription] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const getProgress = () => {
    const total = project.project_steps?.length || 0;
    const completed = project.project_steps?.filter(s => s.status === 'completed').length || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'on_hold': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleStatusChange = async (newStatus: Project['status']) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: project.id,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setProject({ ...project, status: newStatus });
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const handleStepStatusChange = async (stepId: string, newStatus: ProjectStep['status']) => {
    try {
      const response = await fetch('/api/project-steps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: stepId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        const updatedSteps = project.project_steps.map(step =>
          step.id === stepId ? { ...step, status: newStatus } : step
        );
        setProject({ ...project, project_steps: updatedSteps });
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating step status:', error);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm(language === 'fr' ? 'Supprimer cette étape?' : 'Delete this step?')) {
      return;
    }

    try {
      const response = await fetch('/api/project-steps', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: stepId }),
      });

      if (response.ok) {
        const updatedSteps = project.project_steps.filter(step => step.id !== stepId);
        setProject({ ...project, project_steps: updatedSteps });
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting step:', error);
    }
  };

  const handleEditStep = async (stepId: string) => {
    if (!editTitle.trim()) return;

    try {
      const response = await fetch('/api/project-steps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: stepId,
          title: editTitle,
          description: editDescription,
        }),
      });

      if (response.ok) {
        const updatedSteps = project.project_steps.map(step =>
          step.id === stepId
            ? { ...step, title: editTitle, description: editDescription }
            : step
        );
        setProject({ ...project, project_steps: updatedSteps });
        setEditingStep(null);
        onUpdate();
      }
    } catch (error) {
      console.error('Error editing step:', error);
    }
  };

  const handleAddStep = async () => {
    if (!newStepTitle.trim()) return;

    try {
      const maxOrder = Math.max(...project.project_steps.map(s => s.order), 0);

      const response = await fetch('/api/project-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          title: newStepTitle,
          description: newStepDescription,
          order: maxOrder + 1,
          status: 'pending',
          effort: 'medium',
        }),
      });

      if (response.ok) {
        const newStep = await response.json();
        setProject({
          ...project,
          project_steps: [...project.project_steps, newStep],
        });
        setNewStepTitle("");
        setNewStepDescription("");
        setAddingStep(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Error adding step:', error);
    }
  };

  const handleCopyToTasks = async (stepId: string) => {
    try {
      const response = await fetch(`/api/project-steps/${stepId}/copy-to-tasks`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          language === 'fr'
            ? `Tâche créée avec succès dans "${data.todoListTitle}"!`
            : `Task successfully created in "${data.todoListTitle}"!`
        );

        // Update the step with the todo_list_id
        const updatedSteps = project.project_steps.map(step =>
          step.id === stepId ? { ...step, todo_list_id: data.todoListId } : step
        );
        setProject({ ...project, project_steps: updatedSteps });
        onUpdate();
      } else {
        const error = await response.json();
        alert(
          language === 'fr'
            ? `Erreur: ${error.error}`
            : `Error: ${error.error}`
        );
      }
    } catch (error) {
      console.error('Error copying to tasks:', error);
      alert(
        language === 'fr'
          ? 'Erreur lors de la copie de la tâche'
          : 'Error copying task'
      );
    }
  };

  const handleDeleteProject = async () => {
    const confirmMessage = language === 'fr'
      ? `Êtes-vous sûr de vouloir supprimer le projet "${project.title}" ?\n\nToutes les étapes seront également supprimées. Cette action est IRRÉVERSIBLE.`
      : `Are you sure you want to delete the project "${project.title}"?\n\nAll steps will also be deleted. This action is IRREVERSIBLE.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: project.id }),
      });

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        alert(
          language === 'fr'
            ? 'Erreur lors de la suppression du projet'
            : 'Error deleting project'
        );
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(
        language === 'fr'
          ? 'Erreur lors de la suppression du projet'
          : 'Error deleting project'
      );
    }
  };

  const handleChatSubmit = async () => {
    if (!chatMessage.trim() || chatLoading) return;

    setChatLoading(true);
    const userMessage = chatMessage;
    setChatMessage("");

    try {
      const response = await fetch('/api/ai-project-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          currentPlan: project.ai_plan,
          language,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update the project with the new plan
        const updatedProject = { ...project, ai_plan: data.plan };
        setProject(updatedProject);

        // Also update the project in the database
        await fetch('/api/projects', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: project.id,
            ai_plan: data.plan,
          }),
        });

        onUpdate();
      } else {
        alert(
          language === 'fr'
            ? 'Erreur lors de la modification du plan'
            : 'Error modifying plan'
        );
      }
    } catch (error) {
      console.error('Error in chat:', error);
      alert(
        language === 'fr'
          ? 'Erreur lors de la communication avec l\'IA'
          : 'Error communicating with AI'
      );
    } finally {
      setChatLoading(false);
    }
  };

  const togglePhase = (index: number) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPhases(newExpanded);
  };

  if (!isOpen) return null;

  const progress = getProgress();
  const completedSteps = project.project_steps?.filter(s => s.status === 'completed').length || 0;
  const totalSteps = project.project_steps?.length || 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-800"
          style={{ borderTopWidth: '4px', borderTopColor: project.color }}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{project.title}</h2>
                {project.description && (
                  <p className="text-gray-400 text-sm">{project.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={handleDeleteProject}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                  title={language === 'fr' ? 'Supprimer le projet' : 'Delete project'}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Status and Progress */}
            <div className="flex items-center gap-4 flex-wrap">
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value as Project['status'])}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)} bg-gray-800/50 cursor-pointer`}
              >
                <option value="planning">{language === 'fr' ? 'Planification' : 'Planning'}</option>
                <option value="in_progress">{language === 'fr' ? 'En cours' : 'In Progress'}</option>
                <option value="completed">{language === 'fr' ? 'Terminé' : 'Completed'}</option>
                <option value="on_hold">{language === 'fr' ? 'En pause' : 'On Hold'}</option>
                <option value="cancelled">{language === 'fr' ? 'Annulé' : 'Cancelled'}</option>
              </select>

              {totalSteps > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400">
                    {completedSteps}/{totalSteps} {language === 'fr' ? 'étapes' : 'steps'}
                  </span>
                </div>
              )}

              {project.target_end_date && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {new Date(project.target_end_date).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-US')}
                </div>
              )}

              <button
                onClick={() => setShowChat(!showChat)}
                className={`ml-auto px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  showChat
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                {language === 'fr' ? 'Chat IA' : 'AI Chat'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 flex gap-6">
            {/* Steps List */}
            <div className={`${showChat ? 'w-1/2' : 'w-full'} transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  {language === 'fr' ? 'Étapes du projet' : 'Project Steps'}
                </h3>
                <button
                  onClick={() => setAddingStep(true)}
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'fr' ? 'Ajouter' : 'Add'}
                </button>
              </div>

              {/* Add Step Form */}
              {addingStep && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <input
                    type="text"
                    value={newStepTitle}
                    onChange={(e) => setNewStepTitle(e.target.value)}
                    placeholder={language === 'fr' ? 'Titre de l\'étape' : 'Step title'}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 mb-2"
                  />
                  <textarea
                    value={newStepDescription}
                    onChange={(e) => setNewStepDescription(e.target.value)}
                    placeholder={language === 'fr' ? 'Description (optionnelle)' : 'Description (optional)'}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none mb-2"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddStep}
                      className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 rounded-lg text-white text-sm font-medium transition-all"
                    >
                      {language === 'fr' ? 'Ajouter' : 'Add'}
                    </button>
                    <button
                      onClick={() => {
                        setAddingStep(false);
                        setNewStepTitle("");
                        setNewStepDescription("");
                      }}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium transition-all"
                    >
                      {language === 'fr' ? 'Annuler' : 'Cancel'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Steps */}
              {project.project_steps.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {language === 'fr'
                    ? 'Aucune étape pour le moment'
                    : 'No steps yet'}
                </div>
              ) : (
                <div className="space-y-2">
                  {project.project_steps
                    .sort((a, b) => a.order - b.order)
                    .map((step) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                      >
                        {editingStep === step.id ? (
                          <div>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white mb-2"
                            />
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white resize-none mb-2"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditStep(step.id)}
                                className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 rounded-lg text-white text-sm font-medium transition-all"
                              >
                                {language === 'fr' ? 'Enregistrer' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingStep(null)}
                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium transition-all"
                              >
                                {language === 'fr' ? 'Annuler' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => {
                                  const newStatus =
                                    step.status === 'completed'
                                      ? 'pending'
                                      : step.status === 'pending'
                                      ? 'in_progress'
                                      : 'completed';
                                  handleStepStatusChange(step.id, newStatus);
                                }}
                                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  step.status === 'completed'
                                    ? 'bg-teal-500 border-teal-500'
                                    : step.status === 'in_progress'
                                    ? 'bg-yellow-500/20 border-yellow-500'
                                    : 'border-gray-600 hover:border-teal-500'
                                }`}
                              >
                                {step.status === 'completed' && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </button>

                              <div className="flex-1">
                                <h4
                                  className={`font-medium mb-1 ${
                                    step.status === 'completed'
                                      ? 'text-gray-500 line-through'
                                      : 'text-white'
                                  }`}
                                >
                                  {step.title}
                                </h4>
                                {step.description && (
                                  <p className="text-sm text-gray-400 mb-2">
                                    {step.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {step.effort && (
                                    <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                                      {step.effort}
                                    </span>
                                  )}
                                  {step.todo_list_id && (
                                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 text-xs rounded">
                                      {language === 'fr' ? 'Dans les tâches' : 'In tasks'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {!step.todo_list_id && (
                                  <button
                                    onClick={() => handleCopyToTasks(step.id)}
                                    className="p-1.5 text-gray-400 hover:text-teal-400 hover:bg-gray-700 rounded transition-all"
                                    title={language === 'fr' ? 'Copier vers les tâches' : 'Copy to tasks'}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingStep(step.id);
                                    setEditTitle(step.title);
                                    setEditDescription(step.description || "");
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-all"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStep(step.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {step.tips && (
                              <div className="mt-2 pl-8 text-xs text-gray-500 italic">
                                💡 {step.tips}
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    ))}
                </div>
              )}
            </div>

            {/* AI Chat Panel */}
            {showChat && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-1/2 flex flex-col bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-bold text-white">
                    {language === 'fr' ? 'Modifier le projet avec l\'IA' : 'Modify project with AI'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {language === 'fr'
                      ? 'Demandez à l\'IA d\'ajouter, modifier ou supprimer des étapes'
                      : 'Ask AI to add, modify, or remove steps'}
                  </p>
                </div>

                {/* AI Plan Overview */}
                {project.ai_plan && (
                  <div className="flex-1 overflow-y-auto p-4">
                    {project.ai_plan.overview && (
                      <div className="mb-4 p-3 bg-gray-900 rounded-lg">
                        <p className="text-sm text-gray-300">{project.ai_plan.overview}</p>
                      </div>
                    )}

                    {project.ai_plan.phases && project.ai_plan.phases.length > 0 && (
                      <div className="space-y-2">
                        {project.ai_plan.phases.map((phase: any, index: number) => (
                          <div key={index} className="bg-gray-900 rounded-lg overflow-hidden">
                            <button
                              onClick={() => togglePhase(index)}
                              className="w-full p-3 flex items-center justify-between hover:bg-gray-800 transition-all"
                            >
                              <span className="font-medium text-white text-left">{phase.name}</span>
                              {expandedPhases.has(index) ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </button>

                            {expandedPhases.has(index) && (
                              <div className="p-3 border-t border-gray-800">
                                {phase.description && (
                                  <p className="text-sm text-gray-400 mb-2">{phase.description}</p>
                                )}
                                {phase.tasks && phase.tasks.length > 0 && (
                                  <div className="space-y-2 mt-2">
                                    {phase.tasks.map((task: any, taskIndex: number) => (
                                      <div key={taskIndex} className="text-sm">
                                        <div className="font-medium text-teal-400">{task.title}</div>
                                        {task.description && (
                                          <div className="text-gray-500 text-xs mt-1">{task.description}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {project.ai_plan.estimatedDuration && (
                      <div className="mt-4 p-3 bg-gray-900 rounded-lg flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-teal-400" />
                        <span className="text-sm text-gray-300">
                          {language === 'fr' ? 'Durée estimée: ' : 'Estimated duration: '}
                          {project.ai_plan.estimatedDuration}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                      placeholder={
                        language === 'fr'
                          ? 'Ex: Ajoute une phase de tests...'
                          : 'Ex: Add a testing phase...'
                      }
                      className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                      disabled={chatLoading}
                    />
                    <button
                      onClick={handleChatSubmit}
                      disabled={chatLoading || !chatMessage.trim()}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white transition-all flex items-center gap-2"
                    >
                      {chatLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
