"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  TrendingUp,
  PieChart,
  Wallet,
  LineChart,
  Bell,
  Shield,
  Smartphone,
  Zap,
  Target,
  Calendar,
  DollarSign,
  BarChart3
} from "lucide-react";

export default function FeaturesPage() {
  const router = useRouter();

  const features = [
    {
      icon: TrendingUp,
      title: "Smart Dashboard",
      description: "Get a complete overview of your finances at a glance with interactive charts and real-time analytics",
      gradient: "from-purple-500 to-pink-500",
      details: [
        "Real-time financial overview",
        "Interactive charts and graphs",
        "Monthly income vs expenses tracking",
        "Top spending categories visualization"
      ]
    },
    {
      icon: Wallet,
      title: "Transaction Management",
      description: "Track every dollar with ease. Categorize, search, and analyze all your transactions in one place",
      gradient: "from-blue-500 to-cyan-500",
      details: [
        "Unlimited transaction tracking",
        "Custom categories and tags",
        "Quick search and filters",
        "Bulk import/export capabilities"
      ]
    },
    {
      icon: Target,
      title: "Budget Planning",
      description: "Set smart budgets for different categories and get alerts when you're approaching limits",
      gradient: "from-green-500 to-emerald-500",
      details: [
        "Category-based budgeting",
        "Visual progress indicators",
        "Budget vs actual comparisons",
        "Smart budget recommendations"
      ]
    },
    {
      icon: LineChart,
      title: "Investment Tracking",
      description: "Monitor your investment portfolio with real-time tracking and performance analytics",
      gradient: "from-yellow-500 to-orange-500",
      details: [
        "Multi-asset portfolio tracking",
        "Performance metrics",
        "Growth visualization",
        "ROI calculations"
      ]
    },
    {
      icon: Calendar,
      title: "Bills & Recurring Payments",
      description: "Never miss a payment. Track all your bills and recurring expenses automatically",
      gradient: "from-red-500 to-pink-500",
      details: [
        "Recurring payment tracking",
        "Payment reminders",
        "Bill due date calendar",
        "Automatic categorization"
      ]
    },
    {
      icon: DollarSign,
      title: "Debt Management",
      description: "Track and manage your debts with payment schedules and payoff projections",
      gradient: "from-indigo-500 to-purple-500",
      details: [
        "Multiple debt tracking",
        "Interest calculations",
        "Payment schedules",
        "Payoff projections"
      ]
    },
    {
      icon: PieChart,
      title: "Advanced Analytics",
      description: "Deep insights into your spending patterns with detailed reports and visualizations",
      gradient: "from-pink-500 to-rose-500",
      details: [
        "Spending trend analysis",
        "Category breakdowns",
        "Custom date ranges",
        "Exportable reports"
      ]
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Stay informed with intelligent alerts about your financial activities and goals",
      gradient: "from-cyan-500 to-blue-500",
      details: [
        "Budget limit alerts",
        "Bill payment reminders",
        "Unusual spending notifications",
        "Goal achievement updates"
      ]
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your financial data is protected with industry-standard encryption and security protocols",
      gradient: "from-emerald-500 to-green-500",
      details: [
        "256-bit encryption",
        "Secure authentication",
        "Privacy-first approach",
        "Regular security audits"
      ]
    },
    {
      icon: Smartphone,
      title: "Mobile App",
      description: "Access your finances on the go with our beautiful and intuitive mobile apps",
      gradient: "from-orange-500 to-red-500",
      details: [
        "iOS & Android apps",
        "Real-time sync",
        "Offline access",
        "Touch ID / Face ID support"
      ]
    },
    {
      icon: Zap,
      title: "AI-Powered Insights",
      description: "Get intelligent recommendations and predictions powered by advanced AI algorithms",
      gradient: "from-violet-500 to-purple-500",
      details: [
        "Spending predictions",
        "Budget optimization tips",
        "Investment suggestions",
        "Anomaly detection"
      ]
    },
    {
      icon: BarChart3,
      title: "Multi-Currency Support",
      description: "Track finances in multiple currencies with real-time exchange rates",
      gradient: "from-teal-500 to-cyan-500",
      details: [
        "10+ currencies supported",
        "Automatic conversion",
        "Real-time exchange rates",
        "Multi-currency reporting"
      ]
    }
  ];

  const screenshots = [
    {
      title: "Comprehensive Dashboard",
      description: "View all your financial data at a glance with beautiful, interactive charts",
      color: "purple"
    },
    {
      title: "Transaction Management",
      description: "Easily track and categorize every transaction with powerful filtering",
      color: "blue"
    },
    {
      title: "Budget Tracking",
      description: "Set and monitor budgets for different categories with visual progress bars",
      color: "green"
    },
    {
      title: "Investment Portfolio",
      description: "Monitor your investments and track portfolio performance over time",
      color: "pink"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/sign-in")}
            className="px-6 py-2 rounded-lg border border-purple-500/50 text-purple-300 hover:bg-purple-500/10 transition-colors"
          >
            Sign In
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/sign-up")}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg shadow-purple-500/50"
          >
            Get Started
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Powerful Features for Complete Financial Control
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Everything you need to manage your money, track investments, and achieve your financial goals—all in one beautiful platform.
          </p>
        </motion.div>
      </section>

      {/* Screenshots Section */}
      <section className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-4">See It In Action</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Beautiful, intuitive interface designed for effortless financial management
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20">
          {screenshots.map((screenshot, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
            >
              <div className={`h-64 bg-gradient-to-br ${
                screenshot.color === 'purple' ? 'from-purple-900/50 to-purple-800/30' :
                screenshot.color === 'blue' ? 'from-blue-900/50 to-blue-800/30' :
                screenshot.color === 'green' ? 'from-green-900/50 to-green-800/30' :
                'from-pink-900/50 to-pink-800/30'
              } flex items-center justify-center`}>
                <div className="text-gray-600 text-center p-8">
                  <BarChart3 className="w-20 h-20 mx-auto mb-4 opacity-30" />
                  <p className="text-sm opacity-50">Screenshot: {screenshot.title}</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">{screenshot.title}</h3>
                <p className="text-gray-400">{screenshot.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-4">Complete Feature Set</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Every tool you need to take control of your financial life
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (index % 3) * 0.1 }}
              whileHover={{ y: -10 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} p-3 mb-4`}>
                <feature.icon className="w-full h-full text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 mb-4">{feature.description}</p>
              <ul className="space-y-2">
                {feature.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                    <span className="text-purple-400 mt-1">•</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/50 p-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Take FoxWise Anywhere</h2>
              <p className="text-xl text-gray-300 mb-8">
                Access your finances on the go with our beautiful mobile apps for iOS and Android. Real-time sync keeps everything up to date across all your devices.
              </p>
              <div className="space-y-4">
                {[
                  "Real-time synchronization",
                  "Offline access",
                  "Push notifications",
                  "Biometric authentication"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-64 h-96 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center opacity-50">
                <Smartphone className="w-32 h-32 text-white/30" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Security Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-6">Bank-Level Security</h2>
          <p className="text-xl text-gray-400 mb-8">
            Your financial data is protected with the same encryption standards used by major financial institutions. We take your privacy and security seriously.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {[
              { value: "256-bit", label: "Encryption" },
              { value: "100%", label: "Privacy" },
              { value: "24/7", label: "Monitoring" },
              { value: "SOC 2", label: "Certified" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-gray-900/50 border border-gray-700"
              >
                <div className="text-3xl font-bold text-purple-400 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-12 text-center"
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <h2 className="text-5xl font-bold mb-6 text-white">
              Ready to Transform Your Finances?
            </h2>
            <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto">
              Join thousands of users who are already managing their money smarter with FoxWise Finance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/sign-up")}
                className="px-12 py-4 rounded-xl bg-white text-purple-600 font-bold text-lg shadow-2xl hover:shadow-white/50 transition-shadow"
              >
                Start Free Trial
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/demo")}
                className="px-12 py-4 rounded-xl bg-transparent border-2 border-white text-white font-bold text-lg hover:bg-white/10 transition-colors"
              >
                Try Demo
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div whileHover={{ scale: 1.05 }} className="cursor-pointer" onClick={() => router.push("/")}>
            <Image src="/logo.png" alt="FoxWise Finance" width={150} height={50} className="object-contain" />
          </motion.div>
          <div className="flex gap-8 text-gray-400">
            <motion.button onClick={() => router.push("/features")} whileHover={{ scale: 1.1, color: "#a855f7" }} className="hover:text-purple-400 transition-colors">Features</motion.button>
            <motion.button onClick={() => router.push("/pricing")} whileHover={{ scale: 1.1, color: "#a855f7" }} className="hover:text-purple-400 transition-colors">Pricing</motion.button>
            <motion.button onClick={() => router.push("/about")} whileHover={{ scale: 1.1, color: "#a855f7" }} className="hover:text-purple-400 transition-colors">About</motion.button>
            <motion.button onClick={() => router.push("/contact")} whileHover={{ scale: 1.1, color: "#a855f7" }} className="hover:text-purple-400 transition-colors">Contact</motion.button>
          </div>
          <div className="text-gray-500 text-sm">© 2025 FoxWise Finance. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
