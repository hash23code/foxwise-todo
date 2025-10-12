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
} from "lucide-react";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
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

  const features = [
    {
      icon: Wallet,
      title: "Multi-Wallet System",
      description: "Manage multiple wallets with different currencies and track all your finances in one place",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: TrendingUp,
      title: "Investment Tracking",
      description: "Real-time crypto & stock prices with automatic portfolio calculations and gains tracking",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: PieChart,
      title: "Smart Analytics",
      description: "Beautiful charts and insights to understand your spending patterns and financial health",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Bank-level security with encrypted data storage and secure authentication",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Built with Next.js 14 and optimized for speed. Your data loads instantly",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Globe,
      title: "Multi-Currency",
      description: "Support for 10+ currencies including USD, EUR, GBP, JPY, and more",
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  const stats = [
    { value: "10+", label: "Currencies Supported" },
    { value: "5", label: "Transaction Types" },
    { value: "∞", label: "Unlimited Tracking" },
    { value: "24/7", label: "Support Available" }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
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
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl"
          animate={{
            x: ["-50%", "-45%", "-50%"],
            y: ["-50%", "-55%", "-50%"],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
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
            Get Started
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-orange-400" />
            </motion.div>
            <span className="text-sm text-orange-300">Your Financial Freedom Starts Here</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-orange-200 to-amber-200 bg-clip-text text-transparent"
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="inline-block"
            >
              Master
            </motion.span>{" "}
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="inline-block"
            >
              Your
            </motion.span>{" "}
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
              className="inline-block bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent"
            >
              Money
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto"
          >
            Track expenses, manage budgets, monitor investments, and achieve your financial goals with the most beautiful budget tracker ever built.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(251, 146, 60, 0.8)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/sign-up")}
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-lg shadow-2xl shadow-orange-500/50 flex items-center gap-2"
            >
              Start Free Today
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/demo")}
              className="px-8 py-4 rounded-xl border border-purple-500/50 text-purple-300 font-semibold text-lg hover:bg-purple-500/10 transition-colors"
            >
              Try Demo
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-20"
          >
            <ChevronDown className="w-8 h-8 mx-auto text-purple-400 animate-bounce" />
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
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent mb-2"
              >
                {stat.value}
              </motion.div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Powerful features designed to give you complete control over your finances
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              whileHover={{ y: -10 }}
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 hover:border-purple-500/50 transition-all"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} p-3 mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-full h-full text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get started in minutes, no credit card required
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {[
            "Create your free account - Sign up with email in seconds",
            "Connect your wallets - Add your bank accounts, credit cards, or crypto wallets",
            "Track automatically - Start logging transactions and watch your insights grow",
            "Achieve your goals - Set budgets, monitor investments, and reach financial freedom"
          ].map((step, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              whileHover={{ x: 10, borderColor: "rgba(251, 146, 60, 0.5)" }}
              className="flex items-start gap-4 p-6 rounded-xl bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 transition-colors"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.5 }}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center font-bold shadow-lg shadow-orange-500/50"
              >
                {index + 1}
              </motion.div>
              <p className="text-lg text-gray-300">{step}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.02 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-12 text-center"
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <h2 className="text-5xl font-bold mb-6 text-white">
              Ready to Take Control?
            </h2>
            <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto">
              Join thousands of users who are already managing their finances smarter with FoxWise Finance
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255, 255, 255, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/sign-up")}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="px-12 py-4 rounded-xl bg-white text-purple-600 font-bold text-lg shadow-2xl hover:shadow-white/50 transition-shadow"
            >
              Start Your Journey Free
            </motion.button>
          </div>
          {/* Animated orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
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
