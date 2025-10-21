"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  CheckSquare,
  Calendar,
  ListTodo,
  Shield,
  Zap,
  Globe,
  Sparkles,
  ChevronDown,
  Brain,
  Lock,
  Mic,
  Target,
  Clock,
  CheckCircle2,
  BarChart3,
  Lightbulb,
  Layers,
  Users,
  FileDown,
  Table,
  Eye,
  TrendingUp,
  MessageSquare,
  FolderKanban,
  Sun,
  Moon,
  Timer,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const t = {
    en: {
      // Navigation
      signIn: "Sign In",
      getStarted: "Get Started Free",

      // Hero
      aiPowered: "Powered by Artificial Intelligence",
      heroTitle1: "Master Your Tasks",
      heroTitle2: "with AI Planning",
      heroSubtitle: "The ultimate AI-powered todo app with voice commands, 24-hour day planning, intelligent dashboard, and beautiful analytics. Export to PDF, track time, and boost your productivity.",
      startFree: "Start with AI Free",
      viewDemo: "View Demo",

      // Stats
      languages: "Languages Supported",
      aiPlanning: "Powered Planning",
      unlimited: "Tasks & Categories",
      free: "Free Forever",

      // New Features Section
      newFeatures: "Latest Updates",
      newFeaturesTitle: "Powerful New Features",
      newFeaturesSubtitle: "Discover what's new in FoxWise ToDo",

      feature1Title: "24-Hour Day Planner",
      feature1Desc: "Plan your entire day from 6 AM to 5 AM the next day. Full 24-hour coverage for maximum flexibility.",

      feature2Title: "Interactive Dashboard",
      feature2Desc: "Click to complete tasks directly from dashboard. See time-based category charts and project progress at a glance.",

      feature3Title: "Table View & PDF Export",
      feature3Desc: "Switch between list and table views. Export your tasks to PDF for offline access or printing.",

      feature4Title: "Smart Status Buttons",
      feature4Desc: "Visual status indicators: Green for completed, Yellow for in progress, Red for postponed. One-click status updates.",

      feature5Title: "Project Progress Tracking",
      feature5Desc: "New dashboard chart showing completion percentage for all your projects. Stay on top of your goals.",

      feature6Title: "Time-Based Analytics",
      feature6Desc: "Category charts now show estimated hours instead of task count. Better time management insights.",

      // Coming Soon - AI Assistant
      comingSoon: "COMING SOON",
      assistantBadge: "Revolutionary Feature",
      assistantTitle: "Your Personal AI Assistant",
      assistantSubtitle: "Finally, Everyone Can Have Their Own AI Assistant!",
      assistantDesc: "Imagine having a dedicated AI assistant that knows your tasks, understands your schedule, and helps you stay on top of everything. Chat with it via text or voice, ask it to manage your day, create tasks, send emails, adjust your calendar - all hands-free!",
      assistantFeature1: "💬 Conversational AI - Chat naturally about your tasks and projects",
      assistantFeature2: "🎙️ Voice Commands - Control everything with your voice (Vapi powered)",
      assistantFeature3: "📧 Email Integration - Ask your assistant to send emails and updates",
      assistantFeature4: "📅 Calendar Management - Automatically adjust your schedule",
      assistantFeature5: "⚙️ Smart Workflows - n8n powered automations for advanced users",
      assistantCTA: "Be the First to Know",

      // AI Features
      aiFeatures: "Artificial Intelligence",
      aiFeaturesTitle: "Revolutionary AI Features",
      aiFeaturesSubtitle: "Experience the future of task management with cutting-edge AI technology",

      ai1Title: "AI-Powered Project Planning",
      ai1Desc: "Create complete project roadmaps with AI. Chat with your projects to modify plans, add steps, and adjust timelines intelligently.",
      ai1Demo: "💬 'Add 2 more steps for testing phase' → AI updates your project instantly!",

      ai2Title: "Smart Day Planner AI",
      ai2Desc: "AI analyzes your tasks and creates optimized daily schedules based on priorities, estimated time, and your preferences.",
      ai2Demo: "🤖 AI plans your entire day in seconds, respecting your work hours and breaks",

      ai3Title: "Voice-Activated Tasks",
      ai3Desc: "Create tasks hands-free with voice commands in English or French. Natural language processing understands context.",
      ai3Demo: "🎤 'Add task: finish report by Friday' → Created with due date automatically!",

      ai4Title: "Intelligent Suggestions",
      ai4Desc: "AI provides smart recommendations for task priorities, time estimates, and optimal scheduling throughout the day.",
      ai4Demo: "💡 Get AI-powered insights on task breakdown and productivity patterns",

      // Dashboard Features
      dashboardTitle: "Intelligent Dashboard",
      dashboardSubtitle: "Your productivity command center with real-time insights",

      dash1Title: "Interactive Task Cards",
      dash1Desc: "Recent tasks are now clickable! Toggle completion status with a single click directly from the dashboard.",
      dash1Screenshot: "✅ Click any task → Instantly mark as complete or pending",

      dash2Title: "Time-Based Category Charts",
      dash2Desc: "See how many hours you've allocated to each category. Better insights for time management and planning.",
      dash2Screenshot: "📊 Work: 24h | Personal: 12h | Projects: 18h",

      dash3Title: "Project Progress Charts",
      dash3Desc: "New bar chart showing completion percentage for all active projects. Track multiple projects at once.",
      dash3Screenshot: "📈 Website Redesign: 75% | Mobile App: 45% | Marketing: 90%",

      dash4Title: "Smart Filtering",
      dash4Desc: "Project tasks are automatically excluded from personal task charts for cleaner analytics.",
      dash4Screenshot: "🎯 Focused view: Only your personal tasks in category analytics",

      // Tasks Page Features
      tasksTitle: "Advanced Task Management",
      tasksSubtitle: "Multiple views and powerful export options",

      tasks1Title: "Dual View Mode",
      tasks1Desc: "Switch between beautiful card-based list view and compact table view. Choose what works best for you.",
      tasks1Screenshot: "📋 List View ⇄ 📊 Table View with one click",

      tasks2Title: "PDF Export",
      tasks2Desc: "Export all your tasks to a beautifully formatted PDF. Perfect for offline access, printing, or sharing.",
      tasks2Screenshot: "📄 Professional PDF with all task details, status, and priorities",

      tasks3Title: "Comprehensive Table View",
      tasks3Desc: "See all task details in one place: title, description, status, priority, list, hours, and due dates.",
      tasks3Screenshot: "📊 All information at a glance in sortable columns",

      tasks4Title: "Smart Status Updates",
      tasks4Desc: "Update task status with dropdown menus. Toggle completion with checkboxes. Everything in one view.",
      tasks4Screenshot: "⚡ Quick status changes: Pending → In Progress → Completed",

      // Day Planner Features
      plannerTitle: "24-Hour Day Planner",
      plannerSubtitle: "Plan your entire day, from early morning to late night",

      planner1Title: "Full 24-Hour Coverage",
      planner1Desc: "Extended from 6 AM to 5 AM the next day. Perfect for night owls and early birds. Never run out of planning space.",
      planner1Screenshot: "🕐 6 AM → 11 PM → 12 AM → 5 AM continuous planning",

      planner2Title: "Visual Status Buttons",
      planner2Desc: "Three smart buttons for each task: Complete (green), In Progress (yellow), Postpone (red). One active at a time.",
      planner2Screenshot: "🟢 Complete | 🟡 More Time | 🔴 Postpone - Visual feedback",

      planner3Title: "AI Planning Assistant",
      planner3Desc: "Let AI create your perfect day. Set work hours, preferences, and breaks. AI optimizes task placement automatically.",
      planner3Screenshot: "🤖 AI plans entire week in seconds with smart task distribution",

      planner4Title: "Print & Export",
      planner4Desc: "Print your daily schedule or export to PDF. Share your plan or keep offline copies.",
      planner4Screenshot: "🖨️ Beautiful printable schedule with all time blocks",

      // Projects Features
      projectsTitle: "AI-Powered Projects",
      projectsSubtitle: "Plan, chat, and execute complex projects with AI assistance",

      projects1Title: "AI Project Creation",
      projects1Desc: "Describe your project and let AI break it down into actionable steps with time estimates and descriptions.",
      projects1Screenshot: "💬 'Create a website redesign project' → AI generates 12 detailed steps",

      projects2Title: "Interactive AI Chat",
      projects2Desc: "Chat with your projects! Ask AI to add steps, modify timelines, or reorganize tasks. Conversations feel natural.",
      projects2Screenshot: "💬 'Add testing phase with 3 steps' → AI updates project structure",

      projects3Title: "Auto Todo List Creation",
      projects3Desc: "Each project automatically creates its own dedicated todo list. Copy project steps to tasks with one click.",
      projects3Screenshot: "📁 Project → Dedicated List → Copy to Tasks → Ready to work!",

      projects4Title: "Progress Tracking",
      projects4Desc: "Track project completion with visual progress bars. See which steps are done and what's remaining.",
      projects4Screenshot: "📊 15 steps: 10 completed, 3 in progress, 2 pending",

      // Security
      securityTitle: "Enterprise Security",
      securitySubtitle: "Your data is protected with bank-level security",

      sec1Title: "Bank-Level Encryption",
      sec1Desc: "All your data is encrypted with enterprise-grade security standards used by financial institutions worldwide.",

      sec2Title: "Clerk Authentication",
      sec2Desc: "Powered by Clerk's enterprise authentication with OAuth 2.0, multi-factor support, and secure sessions.",

      sec3Title: "Privacy First",
      sec3Desc: "Your tasks are yours. We never sell your information. GDPR & CCPA compliant with transparent data handling.",

      // Languages
      languagesTitle: "Multi-Language Support",
      languagesSubtitle: "Work in your preferred language with full support for English and French",

      langEN: "English",
      langFR: "Français",
      langVoiceEN: "Voice (EN)",
      langVoiceFR: "Voice (FR)",

      // CTA
      ctaTitle: "Ready to Supercharge Your Productivity?",
      ctaSubtitle: "Join thousands of users managing tasks smarter with AI planning, voice commands, 24-hour day planner, and beautiful analytics - all completely free",
      ctaButton: "Start Free with AI Today",
      ctaNote: "No credit card required • Start free • Upgrade anytime",

      // Footer
      features: "Features",
      copyright: "© 2025 FoxWise ToDo. All rights reserved.",
    },
    fr: {
      // Navigation
      signIn: "Connexion",
      getStarted: "Commencer Gratuitement",

      // Hero
      aiPowered: "Propulsé par Intelligence Artificielle",
      heroTitle1: "Maîtrisez Vos Tâches",
      heroTitle2: "avec Planification IA",
      heroSubtitle: "L'application de tâches ultime avec IA, commandes vocales, planification 24h, tableau de bord intelligent et analyses. Export PDF, suivi du temps, et boostez votre productivité.",
      startFree: "Démarrer Gratuitement avec IA",
      viewDemo: "Voir la Démo",

      // Stats
      languages: "Langues Supportées",
      aiPlanning: "Planification IA",
      unlimited: "Tâches & Catégories",
      free: "Gratuit Pour Toujours",

      // New Features Section
      newFeatures: "Dernières Mises à Jour",
      newFeaturesTitle: "Nouvelles Fonctionnalités Puissantes",
      newFeaturesSubtitle: "Découvrez les nouveautés de FoxWise ToDo",

      feature1Title: "Planificateur 24 Heures",
      feature1Desc: "Planifiez votre journée entière de 6h à 5h le lendemain. Couverture complète 24h pour une flexibilité maximale.",

      feature2Title: "Tableau de Bord Interactif",
      feature2Desc: "Cliquez pour compléter les tâches directement depuis le tableau de bord. Graphiques par temps et progression des projets.",

      feature3Title: "Vue Tableau & Export PDF",
      feature3Desc: "Basculez entre vue liste et tableau. Exportez vos tâches en PDF pour accès hors ligne ou impression.",

      feature4Title: "Boutons de Statut Intelligents",
      feature4Desc: "Indicateurs visuels : Vert pour complété, Jaune pour en cours, Rouge pour reporté. Mise à jour en un clic.",

      feature5Title: "Suivi de Progression Projets",
      feature5Desc: "Nouveau graphique montrant le pourcentage de complétion de tous vos projets. Restez au top de vos objectifs.",

      feature6Title: "Analyses Temporelles",
      feature6Desc: "Les graphiques par catégorie affichent maintenant les heures estimées au lieu du nombre de tâches. Meilleure gestion du temps.",

      // Coming Soon - AI Assistant
      comingSoon: "BIENTÔT DISPONIBLE",
      assistantBadge: "Fonctionnalité Révolutionnaire",
      assistantTitle: "Votre Assistant Personnel IA",
      assistantSubtitle: "Enfin, Tout le Monde Peut Avoir Son Propre Assistant IA!",
      assistantDesc: "Imaginez avoir un assistant IA dédié qui connaît vos tâches, comprend votre emploi du temps et vous aide à rester au top. Chattez avec lui par texte ou voix, demandez-lui de gérer votre journée, créer des tâches, envoyer des emails, ajuster votre calendrier - tout en mains libres!",
      assistantFeature1: "💬 IA Conversationnelle - Discutez naturellement de vos tâches et projets",
      assistantFeature2: "🎙️ Commandes Vocales - Contrôlez tout avec votre voix (propulsé par Vapi)",
      assistantFeature3: "📧 Intégration Email - Demandez à votre assistant d'envoyer des emails",
      assistantFeature4: "📅 Gestion Calendrier - Ajustement automatique de votre horaire",
      assistantFeature5: "⚙️ Workflows Intelligents - Automatisations n8n pour utilisateurs avancés",
      assistantCTA: "Soyez le Premier Informé",

      // AI Features
      aiFeatures: "Intelligence Artificielle",
      aiFeaturesTitle: "Fonctionnalités IA Révolutionnaires",
      aiFeaturesSubtitle: "Découvrez le futur de la gestion des tâches avec une technologie IA de pointe",

      ai1Title: "Planification de Projets par IA",
      ai1Desc: "Créez des feuilles de route complètes avec l'IA. Chattez avec vos projets pour modifier les plans, ajouter des étapes et ajuster les délais intelligemment.",
      ai1Demo: "💬 'Ajoute 2 étapes pour la phase de test' → L'IA met à jour votre projet instantanément !",

      ai2Title: "Planificateur Journée IA",
      ai2Desc: "L'IA analyse vos tâches et crée des horaires quotidiens optimisés basés sur les priorités, le temps estimé et vos préférences.",
      ai2Demo: "🤖 L'IA planifie votre journée entière en secondes, en respectant vos heures de travail",

      ai3Title: "Tâches Activées par Voix",
      ai3Desc: "Créez des tâches mains libres avec commandes vocales en anglais ou français. Traitement naturel du langage.",
      ai3Demo: "🎤 'Ajouter tâche : finir rapport pour vendredi' → Créée avec date limite automatiquement !",

      ai4Title: "Suggestions Intelligentes",
      ai4Desc: "L'IA fournit des recommandations intelligentes pour les priorités, estimations de temps et planification optimale.",
      ai4Demo: "💡 Obtenez des insights IA sur la décomposition des tâches et les modèles de productivité",

      // Dashboard Features
      dashboardTitle: "Tableau de Bord Intelligent",
      dashboardSubtitle: "Votre centre de commande de productivité avec insights en temps réel",

      dash1Title: "Cartes de Tâches Interactives",
      dash1Desc: "Les tâches récentes sont maintenant cliquables ! Basculez le statut de complétion d'un seul clic depuis le tableau de bord.",
      dash1Screenshot: "✅ Cliquez sur une tâche → Marquez comme complétée ou en attente instantanément",

      dash2Title: "Graphiques par Temps de Catégorie",
      dash2Desc: "Voyez combien d'heures vous avez alloué à chaque catégorie. Meilleurs insights pour la gestion du temps.",
      dash2Screenshot: "📊 Travail : 24h | Personnel : 12h | Projets : 18h",

      dash3Title: "Graphiques de Progression Projets",
      dash3Desc: "Nouveau graphique en barres montrant le pourcentage de complétion pour tous les projets actifs. Suivez plusieurs projets.",
      dash3Screenshot: "📈 Refonte Site : 75% | App Mobile : 45% | Marketing : 90%",

      dash4Title: "Filtrage Intelligent",
      dash4Desc: "Les tâches de projet sont automatiquement exclues des graphiques de tâches personnelles pour des analyses plus claires.",
      dash4Screenshot: "🎯 Vue focalisée : Seulement vos tâches personnelles dans les analyses",

      // Tasks Page Features
      tasksTitle: "Gestion Avancée des Tâches",
      tasksSubtitle: "Vues multiples et options d'export puissantes",

      tasks1Title: "Mode Double Vue",
      tasks1Desc: "Basculez entre la belle vue liste avec cartes et la vue tableau compacte. Choisissez ce qui fonctionne pour vous.",
      tasks1Screenshot: "📋 Vue Liste ⇄ 📊 Vue Tableau en un clic",

      tasks2Title: "Export PDF",
      tasks2Desc: "Exportez toutes vos tâches en PDF magnifiquement formaté. Parfait pour accès hors ligne, impression ou partage.",
      tasks2Screenshot: "📄 PDF professionnel avec tous les détails, statuts et priorités",

      tasks3Title: "Vue Tableau Complète",
      tasks3Desc: "Voyez tous les détails des tâches en un endroit : titre, description, statut, priorité, liste, heures et dates.",
      tasks3Screenshot: "📊 Toutes les informations d'un coup d'œil dans des colonnes triables",

      tasks4Title: "Mises à Jour Statut Intelligentes",
      tasks4Desc: "Mettez à jour le statut avec des menus déroulants. Basculez la complétion avec des cases. Tout dans une vue.",
      tasks4Screenshot: "⚡ Changements rapides : En attente → En cours → Complété",

      // Day Planner Features
      plannerTitle: "Planificateur 24 Heures",
      plannerSubtitle: "Planifiez votre journée entière, du petit matin à la fin de nuit",

      planner1Title: "Couverture Complète 24h",
      planner1Desc: "Étendu de 6h à 5h le lendemain. Parfait pour les noctambules et lève-tôt. Plus jamais à court d'espace de planification.",
      planner1Screenshot: "🕐 6h → 23h → 0h → 5h planification continue",

      planner2Title: "Boutons de Statut Visuels",
      planner2Desc: "Trois boutons intelligents par tâche : Terminer (vert), En Cours (jaune), Reporter (rouge). Un seul actif à la fois.",
      planner2Screenshot: "🟢 Terminer | 🟡 Plus de Temps | 🔴 Reporter - Retour visuel",

      planner3Title: "Assistant de Planification IA",
      planner3Desc: "Laissez l'IA créer votre journée parfaite. Définissez heures de travail, préférences et pauses. L'IA optimise automatiquement.",
      planner3Screenshot: "🤖 L'IA planifie la semaine entière en secondes avec distribution intelligente",

      planner4Title: "Impression & Export",
      planner4Desc: "Imprimez votre horaire quotidien ou exportez en PDF. Partagez votre plan ou gardez des copies hors ligne.",
      planner4Screenshot: "🖨️ Bel horaire imprimable avec tous les blocs de temps",

      // Projects Features
      projectsTitle: "Projets Propulsés par IA",
      projectsSubtitle: "Planifiez, chattez et exécutez des projets complexes avec assistance IA",

      projects1Title: "Création de Projet IA",
      projects1Desc: "Décrivez votre projet et laissez l'IA le décomposer en étapes actionnables avec estimations de temps et descriptions.",
      projects1Screenshot: "💬 'Créer projet refonte site web' → L'IA génère 12 étapes détaillées",

      projects2Title: "Chat IA Interactif",
      projects2Desc: "Chattez avec vos projets ! Demandez à l'IA d'ajouter des étapes, modifier les délais ou réorganiser. Naturel.",
      projects2Screenshot: "💬 'Ajoute phase de test avec 3 étapes' → L'IA met à jour la structure",

      projects3Title: "Création Auto Liste Todo",
      projects3Desc: "Chaque projet crée automatiquement sa propre liste todo dédiée. Copiez les étapes vers les tâches en un clic.",
      projects3Screenshot: "📁 Projet → Liste Dédiée → Copier vers Tâches → Prêt à travailler !",

      projects4Title: "Suivi de Progression",
      projects4Desc: "Suivez la complétion du projet avec barres de progression visuelles. Voyez quelles étapes sont faites.",
      projects4Screenshot: "📊 15 étapes : 10 complétées, 3 en cours, 2 en attente",

      // Security
      securityTitle: "Sécurité Entreprise",
      securitySubtitle: "Vos données sont protégées avec une sécurité de niveau bancaire",

      sec1Title: "Chiffrement Niveau Bancaire",
      sec1Desc: "Toutes vos données sont chiffrées avec des standards de sécurité entreprise utilisés par les institutions financières.",

      sec2Title: "Authentification Clerk",
      sec2Desc: "Propulsé par l'authentification entreprise de Clerk avec OAuth 2.0, support multi-facteurs et sessions sécurisées.",

      sec3Title: "Confidentialité d'Abord",
      sec3Desc: "Vos tâches sont à vous. Nous ne vendons jamais vos informations. Conforme RGPD & CCPA avec gestion transparente.",

      // Languages
      languagesTitle: "Support Multi-Langues",
      languagesSubtitle: "Travaillez dans votre langue préférée avec support complet pour anglais et français",

      langEN: "English",
      langFR: "Français",
      langVoiceEN: "Voix (EN)",
      langVoiceFR: "Voix (FR)",

      // CTA
      ctaTitle: "Prêt à Booster Votre Productivité ?",
      ctaSubtitle: "Rejoignez des milliers d'utilisateurs gérant leurs tâches intelligemment avec planification IA, commandes vocales, planificateur 24h et analyses - complètement gratuit",
      ctaButton: "Commencer Gratuitement avec IA",
      ctaNote: "Pas de carte de crédit requise • Commencez gratuitement • Passez à un plan supérieur quand vous voulez",

      // Footer
      features: "Fonctionnalités",
      copyright: "© 2025 FoxWise ToDo. Tous droits réservés.",
    }
  };

  const content = t[language];

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const newFeatures = [
    {
      icon: Timer,
      title: content.feature1Title,
      description: content.feature1Desc,
      gradient: "from-blue-600 to-cyan-600",
    },
    {
      icon: TrendingUp,
      title: content.feature2Title,
      description: content.feature2Desc,
      gradient: "from-purple-600 to-pink-600",
    },
    {
      icon: FileDown,
      title: content.feature3Title,
      description: content.feature3Desc,
      gradient: "from-green-600 to-emerald-600",
    },
    {
      icon: Target,
      title: content.feature4Title,
      description: content.feature4Desc,
      gradient: "from-orange-600 to-red-600",
    },
    {
      icon: BarChart3,
      title: content.feature5Title,
      description: content.feature5Desc,
      gradient: "from-indigo-600 to-purple-600",
    },
    {
      icon: Clock,
      title: content.feature6Title,
      description: content.feature6Desc,
      gradient: "from-yellow-600 to-orange-600",
    },
  ];

  const aiFeatures = [
    {
      icon: FolderKanban,
      title: content.ai1Title,
      description: content.ai1Desc,
      demo: content.ai1Demo,
      gradient: "from-purple-600 via-pink-600 to-indigo-600",
    },
    {
      icon: Calendar,
      title: content.ai2Title,
      description: content.ai2Desc,
      demo: content.ai2Demo,
      gradient: "from-blue-600 via-cyan-600 to-teal-600",
    },
    {
      icon: Mic,
      title: content.ai3Title,
      description: content.ai3Desc,
      demo: content.ai3Demo,
      gradient: "from-green-600 via-emerald-600 to-teal-600",
    },
    {
      icon: Lightbulb,
      title: content.ai4Title,
      description: content.ai4Desc,
      demo: content.ai4Demo,
      gradient: "from-orange-600 via-amber-600 to-yellow-600",
    }
  ];

  const stats = [
    { value: "2", label: content.languages, icon: Globe },
    { value: "AI", label: content.aiPlanning, icon: Brain },
    { value: "∞", label: content.unlimited, icon: ListTodo },
    { value: "100%", label: content.free, icon: CheckCircle2 }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        {mounted && (
          <>
            <motion.div
              className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
              animate={{
                x: mousePosition.x - 200,
                y: mousePosition.y - 200,
              }}
              transition={{ type: "spring", damping: 30 }}
            />
            <motion.div
              className="absolute top-20 right-20 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/logo.png"
            alt="FoxWise ToDo"
            width={180}
            height={60}
            className="object-contain"
            priority
          />
        </motion.div>
        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-gray-700">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                language === 'en'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              EN
            </button>
            <button
              onClick={() => setLanguage('fr')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                language === 'fr'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              FR
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(251, 146, 60, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/sign-in")}
            className="px-6 py-2 rounded-lg border border-orange-500/50 text-orange-300 hover:bg-orange-500/10 transition-colors"
          >
            {content.signIn}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(251, 146, 60, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/pricing")}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium shadow-lg shadow-orange-500/50"
          >
            {content.getStarted}
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-indigo-600/20 border border-purple-500/30 mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-5 h-5 text-purple-400" />
            </motion.div>
            <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              {content.aiPowered}
            </span>
            <span className="px-2 py-0.5 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full">AI</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-white via-orange-200 to-amber-200 bg-clip-text text-transparent">
              {content.heroTitle1}
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              {content.heroTitle2}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-5xl mx-auto leading-relaxed"
          >
            {content.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(147, 51, 234, 0.8)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/pricing")}
              className="group px-10 py-5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-bold text-lg shadow-2xl shadow-purple-500/50 flex items-center gap-3"
            >
              <Brain className="w-6 h-6" />
              {content.startFree}
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/dashboard")}
              className="px-10 py-5 rounded-xl border-2 border-purple-500/50 text-purple-300 font-bold text-lg hover:bg-purple-500/10 transition-colors"
            >
              {content.viewDemo}
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16"
          >
            <ChevronDown className="w-10 h-10 mx-auto text-purple-400 animate-bounce" />
          </motion.div>
        </motion.div>
      </section>

      {/* Coming Soon - AI Assistant Announcement */}
      <section className="relative z-10 container mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-pink-900/80 border-2 border-purple-500/30 p-12 md:p-16"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                <span className="text-sm font-bold text-yellow-400 uppercase tracking-wider">
                  {content.comingSoon}
                </span>
                <span className="px-3 py-1 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full">
                  {content.assistantBadge}
                </span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h2 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                {content.assistantTitle}
              </h2>
              <p className="text-2xl md:text-3xl font-semibold text-purple-300 mb-6">
                {content.assistantSubtitle}
              </p>
              <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                {content.assistantDesc}
              </p>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-2 gap-4 mb-10 max-w-4xl mx-auto"
            >
              {[
                content.assistantFeature1,
                content.assistantFeature2,
                content.assistantFeature3,
                content.assistantFeature4,
                content.assistantFeature5,
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-purple-500/20 backdrop-blur-sm"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white">{feature}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="flex justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(168, 85, 247, 0.8)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/pricing")}
                className="group px-12 py-5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-bold text-xl shadow-2xl shadow-purple-500/50 flex items-center gap-4"
              >
                <Mic className="w-6 h-6" />
                {content.assistantCTA}
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-6 h-6" />
                </motion.div>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700"
            >
              <stat.icon className="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <motion.div
                className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
              >
                {stat.value}
              </motion.div>
              <div className="text-gray-400 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* New Features Showcase */}
      <section className="relative z-10 container mx-auto px-6 py-32 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 font-semibold">{content.newFeatures}</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            {content.newFeaturesTitle}
          </h2>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
            {content.newFeaturesSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 hover:border-blue-500/50 transition-all"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} p-4 mb-6 shadow-lg`}>
                <feature.icon className="w-full h-full text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Features */}
      <section className="relative z-10 container mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-semibold">{content.aiFeatures}</span>
            <span className="px-2 py-0.5 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full">AI</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            {content.aiFeaturesTitle}
          </h2>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
            {content.aiFeaturesSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {aiFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative group p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 hover:border-purple-500/50 overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full">
                  AI
                </span>
              </div>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} p-4 mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                <feature.icon className="w-full h-full text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-white">{feature.title}</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">{feature.description}</p>
              <div className="p-4 rounded-xl bg-black/30 border border-purple-500/30">
                <p className="text-purple-300 text-sm font-mono">{feature.demo}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Dashboard Features */}
      <section className="relative z-10 container mx-auto px-6 py-32 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-semibold">{content.dashboardTitle}</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            {content.dashboardTitle}
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto">
            {content.dashboardSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-purple-500/30"
          >
            <CheckSquare className="w-16 h-16 text-green-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.dash1Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.dash1Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.dash1Screenshot}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-500/30"
          >
            <BarChart3 className="w-16 h-16 text-blue-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.dash2Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.dash2Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.dash2Screenshot}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-green-500/30"
          >
            <TrendingUp className="w-16 h-16 text-green-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.dash3Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.dash3Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.dash3Screenshot}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-orange-500/30"
          >
            <Target className="w-16 h-16 text-orange-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.dash4Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.dash4Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.dash4Screenshot}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tasks Page Features */}
      <section className="relative z-10 container mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
            <CheckSquare className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-semibold">{content.tasksTitle}</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {content.tasksTitle}
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto">
            {content.tasksSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-green-500/30"
          >
            <div className="flex items-center gap-4 mb-6">
              <ListTodo className="w-12 h-12 text-green-400" />
              <ArrowRight className="w-6 h-6 text-gray-600" />
              <Table className="w-12 h-12 text-green-400" />
            </div>
            <h3 className="text-3xl font-bold mb-4 text-white">{content.tasks1Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.tasks1Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.tasks1Screenshot}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/30"
          >
            <FileDown className="w-16 h-16 text-red-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.tasks2Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.tasks2Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.tasks2Screenshot}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-500/30"
          >
            <Eye className="w-16 h-16 text-blue-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.tasks3Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.tasks3Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.tasks3Screenshot}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-yellow-500/30"
          >
            <Zap className="w-16 h-16 text-yellow-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.tasks4Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.tasks4Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.tasks4Screenshot}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Day Planner Features */}
      <section className="relative z-10 container mx-auto px-6 py-32 bg-gradient-to-b from-transparent via-cyan-900/5 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-300 font-semibold">{content.plannerTitle}</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            {content.plannerTitle}
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto">
            {content.plannerSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-cyan-500/30"
          >
            <Timer className="w-16 h-16 text-cyan-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.planner1Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.planner1Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.planner1Screenshot}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-pink-500/30"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-green-500/30 border-2 border-green-500 flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-green-400" />
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-500/30 border-2 border-yellow-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-500/30 border-2 border-red-500 flex items-center justify-center">
                <Target className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-4 text-white">{content.planner2Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.planner2Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.planner2Screenshot}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-purple-500/30"
          >
            <Brain className="w-16 h-16 text-purple-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.planner3Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.planner3Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.planner3Screenshot}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-500/30"
          >
            <FileDown className="w-16 h-16 text-blue-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.planner4Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.planner4Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.planner4Screenshot}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects Features */}
      <section className="relative z-10 container mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/30 mb-6">
            <FolderKanban className="w-5 h-5 text-pink-400" />
            <span className="text-pink-300 font-semibold">{content.projectsTitle}</span>
            <span className="px-2 py-0.5 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full">AI</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            {content.projectsTitle}
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto">
            {content.projectsSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-pink-500/30"
          >
            <Brain className="w-16 h-16 text-pink-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.projects1Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.projects1Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.projects1Screenshot}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-purple-500/30"
          >
            <MessageSquare className="w-16 h-16 text-purple-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.projects2Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.projects2Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.projects2Screenshot}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-indigo-500/30"
          >
            <Layers className="w-16 h-16 text-indigo-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.projects3Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.projects3Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.projects3Screenshot}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-green-500/30"
          >
            <TrendingUp className="w-16 h-16 text-green-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4 text-white">{content.projects4Title}</h3>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">{content.projects4Desc}</p>
            <div className="p-4 rounded-lg bg-black/40 border border-gray-600">
              <p className="text-sm font-mono text-gray-400">{content.projects4Screenshot}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Security Section */}
      <section className="relative z-10 container mx-auto px-6 py-32 bg-gradient-to-b from-transparent via-red-900/5 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-6">
            <Lock className="w-5 h-5 text-red-400" />
            <span className="text-red-300 font-semibold">{content.securityTitle}</span>
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            {content.securityTitle}
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto">
            {content.securitySubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/30 hover:border-red-500/60 transition-all"
          >
            <Lock className="w-16 h-16 text-red-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4 text-white">{content.sec1Title}</h3>
            <p className="text-gray-300 leading-relaxed">{content.sec1Desc}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -10 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-orange-500/30 hover:border-orange-500/60 transition-all"
          >
            <Shield className="w-16 h-16 text-orange-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4 text-white">{content.sec2Title}</h3>
            <p className="text-gray-300 leading-relaxed">{content.sec2Desc}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -10 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-yellow-500/30 hover:border-yellow-500/60 transition-all"
          >
            <Users className="w-16 h-16 text-yellow-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4 text-white">{content.sec3Title}</h3>
            <p className="text-gray-300 leading-relaxed">{content.sec3Desc}</p>
          </motion.div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="relative z-10 container mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
            <Globe className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-semibold">{content.languagesTitle}</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {content.languagesTitle}
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto">
            {content.languagesSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { name: content.langEN, icon: Globe },
            { name: content.langFR, icon: Globe },
            { name: content.langVoiceEN, icon: Mic },
            { name: content.langVoiceFR, icon: Mic },
          ].map((lang, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-green-500/30 text-center"
            >
              <lang.icon className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <p className="text-white font-semibold">{lang.name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.01 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-16 text-center"
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10">
            <Brain className="w-20 h-20 mx-auto mb-6 text-white" />
            <h2 className="text-6xl font-bold mb-6 text-white">
              {content.ctaTitle}
            </h2>
            <p className="text-2xl mb-10 text-purple-100 max-w-3xl mx-auto leading-relaxed">
              {content.ctaSubtitle}
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(255, 255, 255, 0.6)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/pricing")}
              className="px-16 py-6 rounded-2xl bg-white text-purple-600 font-bold text-2xl shadow-2xl hover:shadow-white/50 transition-shadow flex items-center gap-4 mx-auto"
            >
              <Brain className="w-8 h-8" />
              {content.ctaButton}
              <ArrowRight className="w-8 h-8" />
            </motion.button>
            <p className="mt-6 text-purple-100 text-lg">
              {content.ctaNote}
            </p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-6 py-12 border-t border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer"
          >
            <Image
              src="/logo.png"
              alt="FoxWise ToDo"
              width={150}
              height={50}
              className="object-contain"
            />
          </motion.div>
          <div className="flex gap-8 text-gray-400">
            <motion.button
              onClick={() => router.push("/dashboard")}
              whileHover={{ scale: 1.1, color: "#a855f7" }}
              className="hover:text-purple-400 transition-colors"
            >
              {content.features}
            </motion.button>
            <motion.button
              onClick={() => router.push("/pricing")}
              whileHover={{ scale: 1.1, color: "#a855f7" }}
              className="hover:text-purple-400 transition-colors"
            >
              {content.getStarted}
            </motion.button>
          </div>
          <div className="text-gray-500 text-sm">
            {content.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
