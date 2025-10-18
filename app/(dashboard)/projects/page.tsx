"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Folder,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import CreateProjectModal from "@/components/CreateProjectModal";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import { useLanguage } from "@/contexts/LanguageContext";

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
  project_steps: Array<{
    id: string;
    status: string;
  }>;
}

export default function ProjectsPage() {
  const { t, language } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (filter === 'active') return project.status === 'in_progress' || project.status === 'planning';
    if (filter === 'completed') return project.status === 'completed';
    return true;
  });

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

  const getProgress = (project: Project) => {
    const total = project.project_steps?.length || 0;
    const completed = project.project_steps?.filter(s => s.status === 'completed').length || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Folder className="w-8 h-8 text-teal-500" />
              {language === 'fr' ? 'Projets' : 'Projects'}
            </h1>
            <p className="text-gray-400 mt-1">
              {language === 'fr'
                ? 'Gérez vos projets complexes avec l\'aide de l\'IA'
                : 'Manage your complex projects with AI assistance'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {language === 'fr' ? 'Nouveau Projet' : 'New Project'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f === 'all' && (language === 'fr' ? 'Tous' : 'All')}
              {f === 'active' && (language === 'fr' ? 'Actifs' : 'Active')}
              {f === 'completed' && (language === 'fr' ? 'Terminés' : 'Completed')}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Folder className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">
              {language === 'fr'
                ? 'Aucun projet pour le moment'
                : 'No projects yet'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {language === 'fr'
                ? 'Créez votre premier projet avec l\'IA!'
                : 'Create your first project with AI!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const progress = getProgress(project);
              const totalSteps = project.project_steps?.length || 0;
              const completedSteps = project.project_steps?.filter(s => s.status === 'completed').length || 0;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedProject(project)}
                  className="bg-gray-800 rounded-xl border border-gray-700 p-6 cursor-pointer hover:border-teal-500/50 transition-all"
                  style={{
                    borderTopWidth: '4px',
                    borderTopColor: project.color,
                  }}
                >
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                    {project.title}
                  </h3>

                  {/* Description */}
                  {project.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                      {project.status === 'planning' && (language === 'fr' ? 'Planification' : 'Planning')}
                      {project.status === 'in_progress' && (language === 'fr' ? 'En cours' : 'In Progress')}
                      {project.status === 'completed' && (language === 'fr' ? 'Terminé' : 'Completed')}
                      {project.status === 'on_hold' && (language === 'fr' ? 'En pause' : 'On Hold')}
                      {project.status === 'cancelled' && (language === 'fr' ? 'Annulé' : 'Cancelled')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {totalSteps > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">
                          {language === 'fr' ? 'Progression' : 'Progress'}
                        </span>
                        <span className="text-teal-400 font-medium">
                          {completedSteps}/{totalSteps} {language === 'fr' ? 'étapes' : 'steps'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {project.target_end_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.target_end_date).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-US')}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchProjects();
        }}
      />

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdate={fetchProjects}
        />
      )}
    </div>
  );
}
