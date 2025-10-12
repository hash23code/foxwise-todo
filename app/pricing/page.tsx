"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, Smartphone, Sparkles, TrendingUp } from "lucide-react";

export default function PricingPage() {
  const router = useRouter();

  const plans = [
    {
      name: "Basic",
      price: "Free",
      period: "forever",
      description: "Perfect for getting started with personal finance",
      icon: TrendingUp,
      features: [
        "Unlimited transactions",
        "5 transaction types",
        "Budget tracking",
        "Basic analytics & charts",
        "Multi-currency support (10+)",
        "Web access",
        "Community support"
      ],
      gradient: "from-gray-600 to-gray-800",
      buttonText: "Get Started Free",
      popular: false
    },
    {
      name: "Medium",
      price: "$1.99",
      period: "per month",
      description: "Best for individuals who want mobile access",
      icon: Smartphone,
      features: [
        "Everything in Basic",
        "📱 Mobile app (iOS & Android)",
        "Real-time sync across devices",
        "Advanced charts & insights",
        "Export data (CSV, PDF)",
        "Priority email support",
        "Custom categories",
        "Recurring transactions"
      ],
      gradient: "from-purple-600 to-pink-600",
      buttonText: "Start 14-Day Free Trial",
      popular: true
    },
    {
      name: "Expert",
      price: "$4.99",
      period: "per month",
      description: "For power users who want AI-powered insights",
      icon: Sparkles,
      features: [
        "Everything in Medium",
        "🤖 AI-powered insights & predictions",
        "AI spending analysis",
        "Smart budget recommendations",
        "Investment tracking with AI",
        "Automated categorization",
        "Custom reports",
        "24/7 priority support",
        "API access"
      ],
      gradient: "from-indigo-600 to-purple-600",
      buttonText: "Start 14-Day Free Trial",
      popular: false
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
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Choose the perfect plan for your financial journey. All plans include a 14-day free trial.
          </p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className={`relative p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border ${
                plan.popular ? 'border-purple-500 shadow-2xl shadow-purple-500/50' : 'border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${plan.gradient} p-3 mb-6`}>
                <plan.icon className="w-full h-full text-white" />
              </div>

              <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-400 mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-gray-400 ml-2">{plan.period}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/sign-up")}
                className={`w-full px-6 py-3 rounded-lg font-semibold mb-8 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                {plan.buttonText}
              </motion.button>

              <div className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I switch plans anytime?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards (Visa, MasterCard, American Express) and PayPal."
              },
              {
                q: "Is there a free trial?",
                a: "Yes! All paid plans come with a 14-day free trial. No credit card required to start."
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. You can cancel your subscription at any time. No questions asked."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl bg-gray-900/50 border border-gray-700"
              >
                <h3 className="text-xl font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
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
              Ready to Start?
            </h2>
            <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto">
              Join FoxWise Finance today and take control of your financial future
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/sign-up")}
              className="px-12 py-4 rounded-xl bg-white text-purple-600 font-bold text-lg shadow-2xl hover:shadow-white/50 transition-shadow"
            >
              Start Free Trial
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
