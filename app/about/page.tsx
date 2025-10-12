"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Target, Users, Zap, Shield, Heart, TrendingUp } from "lucide-react";

export default function AboutPage() {
  const router = useRouter();

  const values = [
    {
      icon: Target,
      title: "Mission Driven",
      description: "Empowering individuals to achieve financial freedom through smart technology",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Users,
      title: "User First",
      description: "Every feature is designed with our users' needs and feedback in mind",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Security Focused",
      description: "Bank-level encryption and security to protect your financial data",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Continuously evolving with cutting-edge AI and financial technology",
      gradient: "from-yellow-500 to-orange-500"
    }
  ];

  const team = [
    {
      name: "The FoxWise Team",
      role: "Passionate Developers & Financial Experts",
      description: "A dedicated team committed to revolutionizing personal finance management"
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "$50M+", label: "Managed Assets" },
    { value: "150+", label: "Countries" },
    { value: "4.9/5", label: "User Rating" }
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
            About FoxWise Finance
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            We&apos;re on a mission to make personal finance management simple, intelligent, and accessible to everyone.
          </p>
        </motion.div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Heart className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-3xl font-bold">Our Story</h2>
            </div>
            <div className="space-y-4 text-gray-300 text-lg">
              <p>
                FoxWise Finance was born from a simple observation: managing personal finances shouldn&apos;t be complicated. We saw people struggling with spreadsheets, multiple apps, and confusing financial jargon.
              </p>
              <p>
                Our team of developers and financial experts came together with one goal: create a platform that combines powerful features with beautiful design and intuitive user experience.
              </p>
              <p>
                Today, FoxWise Finance helps thousands of users across the globe track their expenses, manage budgets, monitor investments, and achieve their financial goals—all in one place.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Values Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-4">Our Values</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            The principles that guide everything we do
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${value.gradient} p-4 mb-6`}>
                <value.icon className="w-full h-full text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{value.title}</h3>
              <p className="text-gray-400">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-4">Meet the Team</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Passionate individuals working to make your financial life easier
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-gradient-to-br from-purple-900/30 to-gray-900 border border-purple-700/50 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
              <p className="text-purple-400 mb-4">{member.role}</p>
              <p className="text-gray-400">{member.description}</p>
            </motion.div>
          ))}
        </div>
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
              Join Our Journey
            </h2>
            <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto">
              Be part of the financial revolution. Start managing your money smarter today.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/sign-up")}
              className="px-12 py-4 rounded-xl bg-white text-purple-600 font-bold text-lg shadow-2xl hover:shadow-white/50 transition-shadow"
            >
              Get Started Free
            </motion.button>
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
