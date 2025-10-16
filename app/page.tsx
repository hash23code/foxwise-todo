"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  TrendingUp,
  Wallet,
  PieChart,
  Shield,
  Zap,
  Globe,
  Sparkles,
  ChevronDown,
  Brain,
  Lock,
  Mic,
  Upload,
  BarChart3,
  DollarSign,
  Eye,
  Target,
  FileText,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  TrendingDown,
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
      title: "AI-Powered Transaction Analysis",
      description: "Speak or type naturally - our AI understands and categorizes your transactions automatically",
      demo: "Just say: 'I just bought $50 of groceries' - AI handles the rest!",
      gradient: "from-purple-600 via-pink-600 to-indigo-600",
      badge: "AI"
    },
    {
      icon: Upload,
      title: "Smart Bank Statement Import",
      description: "Upload CSV, OFX, or QFX files and AI automatically detects duplicates and categorizes everything",
      demo: "Drag & drop your bank statement - AI compares with existing data",
      gradient: "from-blue-600 via-cyan-600 to-teal-600",
      badge: "AI"
    },
    {
      icon: Mic,
      title: "Voice-Activated Transactions",
      description: "Record transactions hands-free with voice commands in any language",
      demo: "🎤 'Je viens d'acheter 100$ de Bitcoin' → Auto-translated & added!",
      gradient: "from-green-600 via-emerald-600 to-teal-600",
      badge: "VOICE"
    },
    {
      icon: BarChart3,
      title: "Intelligent Budget Insights",
      description: "AI analyzes your spending patterns and provides personalized recommendations",
      demo: "Get alerts before you exceed budgets with smart predictions",
      gradient: "from-orange-600 via-amber-600 to-yellow-600",
      badge: "AI"
    }
  ];

  const securityFeatures = [
    {
      icon: Lock,
      title: "Military-Grade Encryption (AES-256-GCM)",
      description: "Your exchange API keys and sensitive data are encrypted with the same technology used by governments and military organizations worldwide",
      details: [
        "AES-256-GCM encryption standard",
        "Unique encryption keys per user",
        "Secure key storage with auth tags",
        "Zero-knowledge architecture"
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
      icon: Eye,
      title: "Privacy First",
      description: "Your data is yours. We never sell your information or share it with third parties",
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
      icon: TrendingUp,
      title: "Real-Time Investment Tracking",
      description: "Monitor stocks, crypto, and traditional investments with live price updates",
      screenshot: "📊 Bitcoin: $45,234.56 (+2.3%) | Portfolio: +$1,234.56",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: PieChart,
      title: "Complete Budget Management",
      description: "Set budgets by category and track spending with beautiful visual analytics",
      screenshot: "🍔 Food: $234 / $500 (47%) | 📱 Bills: $156 / $200 (78%)",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: CreditCard,
      title: "Multi-Category Transactions",
      description: "Track Income, Expenses, Bills, Debt Payments, and Savings - all in one place",
      screenshot: "💰 Income: $5,234 | 💸 Expenses: $3,456 | 💳 Bills: $890",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Wallet,
      title: "Multi-Wallet System",
      description: "Manage unlimited wallets with different currencies and track consolidated net worth",
      screenshot: "🏦 Bank: $12,345 | 💵 Cash: $234 | 💳 Credit: -$890",
      color: "from-orange-500 to-amber-500"
    },
    {
      icon: DollarSign,
      title: "Multi-Currency Support",
      description: "Support for 10+ currencies including USD, CAD, EUR, GBP, JPY, and more",
      screenshot: "💵 USD | 🍁 CAD | 💶 EUR | 💷 GBP | 💴 JPY | 🇨🇭 CHF",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Beautiful charts, trend analysis, and insights to understand your financial health",
      screenshot: "📈 Net Worth Trend | 📊 Spending by Category | 💹 ROI Analysis",
      color: "from-red-500 to-pink-500"
    }
  ];

  const exchangeFeatures = [
    { name: "Binance", supported: true },
    { name: "Coinbase", supported: true },
    { name: "Kraken", supported: true },
    { name: "Bybit", supported: true },
    { name: "OKX", supported: true },
    { name: "KuCoin", supported: true },
    { name: "Alpaca (Stocks)", supported: true },
    { name: "+ More Coming", supported: true },
  ];

  const stats = [
    { value: "10+", label: "Currencies Supported", icon: Globe },
    { value: "7+", label: "Exchange Integrations", icon: TrendingUp },
    { value: "∞", label: "Transactions Tracked", icon: FileText },
    { value: "100%", label: "AI-Powered", icon: Brain }
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
            alt="FoxWise Finance"
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
              Master Your Money
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              with AI Intelligence
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed"
          >
            The world's first <span className="text-purple-400 font-semibold">AI-powered</span> budget tracker with{" "}
            <span className="text-green-400 font-semibold">voice commands</span>,{" "}
            <span className="text-blue-400 font-semibold">automatic bank sync</span>,{" "}
            <span className="text-orange-400 font-semibold">military-grade encryption</span>, and{" "}
            <span className="text-pink-400 font-semibold">real-time investment tracking</span>.
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
              onClick={() => router.push("/demo")}
              className="px-10 py-5 rounded-xl border-2 border-purple-500/50 text-purple-300 font-bold text-lg hover:bg-purple-500/10 transition-colors"
            >
              Watch Demo
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
            Experience the future of finance management with cutting-edge AI technology
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

      {/* Military-Grade Security Section */}
      <section className="relative z-10 container mx-auto px-6 py-32 bg-gradient-to-b from-transparent via-red-900/5 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-6">
            <Lock className="w-5 h-5 text-red-400" />
            <span className="text-red-300 font-semibold">Bank-Level Security</span>
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Military-Grade Encryption
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Your financial data deserves <span className="text-red-400 font-bold">maximum protection</span>.
            We use the same encryption technology trusted by governments and military organizations worldwide.
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

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-8 rounded-3xl bg-gradient-to-r from-red-600/10 via-orange-600/10 to-yellow-600/10 border border-red-500/30 text-center"
        >
          <Lock className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-3xl font-bold mb-4 text-white">AES-256-GCM Encryption Standard</h3>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            All exchange API keys and sensitive data are encrypted with <span className="text-red-400 font-bold">AES-256-GCM</span>,
            the gold standard in encryption technology. Your data remains secure even if our servers are compromised.
          </p>
        </motion.div>
      </section>

      {/* Complete Financial Monitoring */}
      <section className="relative z-10 container mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
            <Eye className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 font-semibold">360° Financial View</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Monitor Every Aspect of Your Financial Life
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            From daily expenses to cryptocurrency investments - track, analyze, and optimize everything in one beautiful dashboard
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

      {/* Exchange Integrations */}
      <section className="relative z-10 container mx-auto px-6 py-32 bg-gradient-to-b from-transparent via-green-900/5 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
            <RefreshCw className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-semibold">Auto-Sync Exchanges</span>
          </div>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Connect Your Favorite Exchanges
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Seamlessly integrate with major cryptocurrency and stock exchanges. Your portfolio updates automatically with real-time prices.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {exchangeFeatures.map((exchange, index) => (
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
                <p className="text-white font-semibold">{exchange.name}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10 border border-green-500/30"
          >
            <h3 className="text-3xl font-bold mb-4 text-center text-white">How Auto-Sync Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 rounded-full bg-green-500 text-white font-bold flex items-center justify-center mx-auto mb-3">1</div>
                <p className="text-gray-300">Connect exchange with API keys</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-green-500 text-white font-bold flex items-center justify-center mx-auto mb-3">2</div>
                <p className="text-gray-300">Auto-creates dedicated portfolio</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-green-500 text-white font-bold flex items-center justify-center mx-auto mb-3">3</div>
                <p className="text-gray-300">Syncs holdings & prices automatically</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Bank Statement Sync Demo */}
      <section className="relative z-10 container mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-6">
              <Upload className="w-5 h-5 text-indigo-400" />
              <span className="text-indigo-300 font-semibold">Smart Import</span>
              <span className="px-2 py-0.5 bg-yellow-400 text-indigo-900 text-xs font-bold rounded-full">AI</span>
            </div>
            <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Bank & Credit Card Auto-Sync
            </h2>
            <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Upload your bank statements and let AI handle the rest. Automatically detects duplicates, categorizes transactions, and adds only new entries.
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-10 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-indigo-500/30 shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
                  <Upload className="w-8 h-8 text-indigo-400" />
                  Step 1: Upload Files
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    <span className="text-gray-300">Drag & drop bank statements</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    <span className="text-gray-300">Supports CSV, OFX, QFX formats</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    <span className="text-gray-300">Multiple files at once</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    <span className="text-gray-300">Secure upload with encryption</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
                  <Brain className="w-8 h-8 text-purple-400" />
                  Step 2: AI Analysis
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-purple-400" />
                    <span className="text-gray-300">AI parses transactions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-purple-400" />
                    <span className="text-gray-300">Detects duplicates (±2 days, fuzzy match)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-purple-400" />
                    <span className="text-gray-300">Auto-categorizes (Income, Expense, Bills...)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-purple-400" />
                    <span className="text-gray-300">Adds only new entries</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30">
              <p className="text-center text-xl text-white font-semibold mb-4">
                ✨ AI Processing Result Example
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <p className="text-3xl font-bold text-green-400 mb-1">245</p>
                  <p className="text-gray-300">New Transactions Added</p>
                </div>
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-3xl font-bold text-yellow-400 mb-1">18</p>
                  <p className="text-gray-300">Duplicates Skipped</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <p className="text-3xl font-bold text-blue-400 mb-1">98%</p>
                  <p className="text-gray-300">Accuracy Rate</p>
                </div>
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
              Ready to Experience AI-Powered Finance?
            </h2>
            <p className="text-2xl mb-10 text-purple-100 max-w-3xl mx-auto leading-relaxed">
              Join thousands of users managing their finances smarter with military-grade encryption,
              AI intelligence, and complete financial monitoring - all in one place
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
              No credit card required • Free forever plan available • Cancel anytime
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
              alt="FoxWise Finance"
              width={150}
              height={50}
              className="object-contain"
            />
          </motion.div>
          <div className="flex gap-8 text-gray-400">
            <motion.button
              onClick={() => router.push("/features")}
              whileHover={{ scale: 1.1, color: "#a855f7" }}
              className="hover:text-purple-400 transition-colors"
            >
              Features
            </motion.button>
            <motion.button
              onClick={() => router.push("/pricing")}
              whileHover={{ scale: 1.1, color: "#a855f7" }}
              className="hover:text-purple-400 transition-colors"
            >
              Pricing
            </motion.button>
            <motion.button
              onClick={() => router.push("/about")}
              whileHover={{ scale: 1.1, color: "#a855f7" }}
              className="hover:text-purple-400 transition-colors"
            >
              About
            </motion.button>
            <motion.button
              onClick={() => router.push("/contact")}
              whileHover={{ scale: 1.1, color: "#a855f7" }}
              className="hover:text-purple-400 transition-colors"
            >
              Contact
            </motion.button>
          </div>
          <div className="text-gray-500 text-sm">
            © 2025 FoxWise Finance. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
