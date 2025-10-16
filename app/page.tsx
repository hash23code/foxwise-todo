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
  FileText,
  Clock,
  CheckCircle2,
  Smartphone,
  Bell,
  BarChart3,
  Lightbulb,
  Layers,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  const aiFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Task Planning",
      description: "Speak or type naturally - our AI understands and creates your tasks automatically with smart scheduling",
      demo: "Just say: 'Remind me to buy groceries tomorrow at 3pm' - AI handles everything!",
      gradient: "from-purple-600 via-pink-600 to-indigo-600",
      badge: "AI"
    },
    {
      icon: Calendar,
      title: "Smart Day Planner",
      description: "AI analyzes your tasks and creates an optimized daily schedule based on priorities and estimated time",
      demo: "AI automatically plans your day with time blocks for each task",
      gradient: "from-blue-600 via-cyan-600 to-teal-600",
      badge: "AI"
    },
    {
      icon: Mic,
      title: "Voice-Activated Task Creation",
      description: "Create tasks and calendar notes hands-free with voice commands in English or French",
      demo: "🎤 'Ajouter une tâche: finir le rapport pour vendredi' → Auto-created!",
      gradient: "from-green-600 via-emerald-600 to-teal-600",
      badge: "VOICE"
    },
    {
      icon: Lightbulb,
      title: "Intelligent Suggestions",
      description: "AI provides smart recommendations for task priorities, time estimates, and optimal scheduling",
      demo: "Get suggestions on task breakdown and time management",
      gradient: "from-orange-600 via-amber-600 to-yellow-600",
      badge: "AI"
    }
  ];

  const securityFeatures = [
    {
      icon: Lock,
      title: "Bank-Level Data Protection",
      description: "Your tasks and personal data are encrypted with enterprise-grade security standards used by financial institutions",
      details: [
        "End-to-end encryption",
        "Secure cloud storage",
        "Protected user sessions",
        "Zero data leakage"
      ]
    },
    {
      icon: Shield,
      title: "Clerk Authentication",
      description: "Enterprise-grade authentication with multi-factor support and secure session management",
      details: [
        "OAuth 2.0 & OpenID Connect",
        "Multi-factor authentication",
        "Secure session management",
        "Automatic token rotation"
      ]
    },
    {
      icon: Users,
      title: "Privacy First",
      description: "Your tasks are yours. We never sell your information or share it with third parties",
      details: [
        "No data selling policy",
        "GDPR & CCPA compliant",
        "Local data encryption",
        "Transparent data handling"
      ]
    }
  ];

  const monitoringFeatures = [
    {
      icon: CheckSquare,
      title: "Smart Task Management",
      description: "Organize tasks by categories, set priorities, due dates, and track progress with beautiful visuals",
      screenshot: "✅ Completed: 12 | ⏳ In Progress: 5 | 📝 Pending: 8",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Calendar,
      title: "Integrated Calendar View",
      description: "See all your tasks and events in one beautiful calendar interface with notes and reminders",
      screenshot: "📅 Oct 16: 3 tasks due | 📝 2 notes | 🔔 1 reminder",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Clock,
      title: "Day Planner with Time Blocks",
      description: "Plan your day with time-blocked tasks and AI-generated schedules for maximum productivity",
      screenshot: "🕐 9:00-10:30: Project work | 🕑 10:30-11:00: Meeting | 🕒 11:00-12:00: Emails",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Layers,
      title: "Category Organization",
      description: "Create unlimited categories with custom icons and colors to organize your tasks efficiently",
      screenshot: "🏠 Home: 12 tasks | 💼 Work: 8 tasks | 🎯 Personal: 5 tasks",
      color: "from-orange-500 to-amber-500"
    },
    {
      icon: Bell,
      title: "Email Reminders",
      description: "Never miss a deadline with customizable email reminders sent before your task due dates",
      screenshot: "🔔 Reminder: Task due in 1 day | 📧 Email sent at 9:00 AM",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: BarChart3,
      title: "Productivity Analytics",
      description: "Beautiful charts and insights to track your productivity, completion rates, and task patterns",
      screenshot: "📈 Completion Rate: 85% | 📊 Tasks by Priority | 💪 Weekly Progress",
      color: "from-red-500 to-pink-500"
    }
  ];

  const languageFeatures = [
    { name: "English", supported: true },
    { name: "Français", supported: true },
    { name: "Voice (EN)", supported: true },
    { name: "Voice (FR)", supported: true },
  ];

  const stats = [
    { value: "2", label: "Languages Supported", icon: Globe },
    { value: "AI", label: "Powered Planning", icon: Brain },
    { value: "∞", label: "Tasks & Categories", icon: ListTodo },
    { value: "100%", label: "Free Forever", icon: CheckCircle2 }
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
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(251, 146, 60, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/sign-in")}
            className="px-6 py-2 rounded-lg border border-orange-500/50 text-orange-300 hover:bg-orange-500/10 transition-colors"
          >
            Sign In
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(251, 146, 60, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/sign-up")}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium shadow-lg shadow-orange-500/50"
          >
            Get Started Free
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section - AI-Powered */}
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
              Powered by Artificial Intelligence
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
              Master Your Tasks
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              with AI Planning
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed"
          >
            The ultimate <span className="text-purple-400 font-semibold">AI-powered</span> todo app with{" "}
            <span className="text-green-400 font-semibold">voice commands</span>,{" "}
            <span className="text-blue-400 font-semibold">smart day planning</span>,{" "}
            <span className="text-orange-400 font-semibold">email reminders</span>, and{" "}
            <span className="text-pink-400 font-semibold">beautiful calendar integration</span>.
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
              onClick={() => router.push("/sign-up")}
              className="group px-10 py-5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-bold text-lg shadow-2xl shadow-purple-500/50 flex items-center gap-3"
            >
              <Brain className="w-6 h-6" />
              Start with AI Free
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
              View Demo
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

      {/* AI Features Showcase */}
      <section className="relative z-10 container mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-semibold">Artificial Intelligence</span>
            <span className="px-2 py-0.5 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full">AI</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            Revolutionary AI Features
          </h2>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
            Experience the future of task management with cutting-edge AI technology
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
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
                  {feature.badge}
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
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
            </motion.div>
          ))}
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
            <span className="text-red-300 font-semibold">Enterprise Security</span>
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Your Data is Secure
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Your tasks and personal information deserve <span className="text-red-400 font-bold">maximum protection</span>.
            We use enterprise-grade security trusted by organizations worldwide.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/30 hover:border-red-500/60 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 p-4 mb-6 shadow-lg shadow-red-500/50">
                <feature.icon className="w-full h-full text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">{feature.description}</p>
              <ul className="space-y-3">
                {feature.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-400">{detail}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Complete Task Management */}
      <section className="relative z-10 container mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 font-semibold">Complete Productivity Suite</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Everything You Need to Stay Productive
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            From daily tasks to long-term projects - manage, schedule, and track everything in one beautiful dashboard
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {monitoringFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 hover:border-blue-500/50 transition-all"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} p-3 mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                <feature.icon className="w-full h-full text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-gray-300 mb-4 leading-relaxed">{feature.description}</p>
              <div className="p-3 rounded-lg bg-black/40 border border-gray-600">
                <p className="text-sm font-mono text-gray-400">{feature.screenshot}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Multi-Language Support */}
      <section className="relative z-10 container mx-auto px-6 py-32 bg-gradient-to-b from-transparent via-green-900/5 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
            <Globe className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-semibold">Multi-Language Support</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Work in Your Language
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Full support for English and French with voice commands in both languages
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {languageFeatures.map((lang, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-green-500/30 text-center"
              >
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <p className="text-white font-semibold">{lang.name}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10 border border-green-500/30"
          >
            <h3 className="text-3xl font-bold mb-4 text-center text-white">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 rounded-full bg-green-500 text-white font-bold flex items-center justify-center mx-auto mb-3">1</div>
                <p className="text-gray-300">Choose your language (EN/FR)</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-green-500 text-white font-bold flex items-center justify-center mx-auto mb-3">2</div>
                <p className="text-gray-300">Use voice or text input</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-green-500 text-white font-bold flex items-center justify-center mx-auto mb-3">3</div>
                <p className="text-gray-300">AI understands and creates tasks</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
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
              Ready to Supercharge Your Productivity?
            </h2>
            <p className="text-2xl mb-10 text-purple-100 max-w-3xl mx-auto leading-relaxed">
              Join thousands of users managing their tasks smarter with AI planning,
              voice commands, and beautiful calendar integration - all completely free
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(255, 255, 255, 0.6)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/sign-up")}
              className="px-16 py-6 rounded-2xl bg-white text-purple-600 font-bold text-2xl shadow-2xl hover:shadow-white/50 transition-shadow flex items-center gap-4 mx-auto"
            >
              <Brain className="w-8 h-8" />
              Start Free with AI Today
              <ArrowRight className="w-8 h-8" />
            </motion.button>
            <p className="mt-6 text-purple-100 text-lg">
              No credit card required • Free forever • AI-powered features included
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
              Features
            </motion.button>
            <motion.button
              onClick={() => router.push("/sign-up")}
              whileHover={{ scale: 1.1, color: "#a855f7" }}
              className="hover:text-purple-400 transition-colors"
            >
              Get Started
            </motion.button>
          </div>
          <div className="text-gray-500 text-sm">
            © 2025 FoxWise ToDo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
