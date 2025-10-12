"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send to a backend
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

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
            Get in Touch
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
          </p>
        </motion.div>
      </section>

      {/* Contact Content */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
              <p className="text-gray-400 mb-8">
                Fill out the form and our team will get back to you within 24 hours.
              </p>
            </div>

            <motion.div
              whileHover={{ x: 10 }}
              className="flex items-start gap-4 p-6 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
            >
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Mail className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Email Us</h3>
                <a
                  href="mailto:info@foxwisefinance.com"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  info@foxwisefinance.com
                </a>
                <p className="text-gray-400 text-sm mt-2">
                  We&apos;ll respond within 24 hours
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ x: 10 }}
              className="flex items-start gap-4 p-6 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
            >
              <div className="p-3 bg-pink-500/20 rounded-lg">
                <MessageSquare className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Live Chat</h3>
                <p className="text-gray-400">
                  Available Monday to Friday
                </p>
                <p className="text-gray-400 text-sm">
                  9:00 AM - 5:00 PM EST
                </p>
              </div>
            </motion.div>

            <div className="p-6 rounded-xl bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/30">
              <h3 className="text-xl font-bold mb-2">Follow Us</h3>
              <p className="text-gray-400 mb-4">Stay connected on social media</p>
              <div className="flex gap-4">
                {['Twitter', 'LinkedIn', 'Facebook'].map((social) => (
                  <motion.button
                    key={social}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
                  >
                    {social}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
          >
            {submitted ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center h-full py-12"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                  <Send className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                <p className="text-gray-400 text-center">
                  Thank you for contacting us. We&apos;ll get back to you soon.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="How can we help?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    placeholder="Tell us more about your inquiry..."
                    required
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/50 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 mt-20 border-t border-gray-800">
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
