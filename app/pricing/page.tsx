'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/LanguageContext';

interface PricingTier {
  name: string;
  nameEn: string;
  price: number;
  period: string;
  periodEn: string;
  description: string;
  descriptionEn: string;
  features: string[];
  featuresEn: string[];
  highlighted?: boolean;
  cta: string;
  ctaEn: string;
  plan: 'free' | 'pro' | 'premium';
  trial?: string;
  trialEn?: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Gratuit',
    nameEn: 'Free',
    price: 0,
    period: 'gratuit',
    periodEn: 'free',
    description: 'Pour débuter avec les bases',
    descriptionEn: 'Get started with the basics',
    features: [
      '✅ Tâches illimitées',
      '✅ Day Planner basique',
      '✅ Badges de récompense',
      '✅ Multi-listes',
      '✅ Synchronisation cloud',
    ],
    featuresEn: [
      '✅ Unlimited tasks',
      '✅ Basic Day Planner',
      '✅ Achievement badges',
      '✅ Multiple lists',
      '✅ Cloud sync',
    ],
    cta: 'Commencer gratuitement',
    ctaEn: 'Start Free',
    plan: 'free',
  },
  {
    name: 'Pro',
    nameEn: 'Pro',
    price: 4.99,
    period: '/ mois',
    periodEn: '/ month',
    description: 'Pour les productifs sérieux',
    descriptionEn: 'For serious productivity',
    trial: '14 jours gratuits',
    trialEn: '14 days free trial',
    features: [
      '✨ Tout de Gratuit +',
      '🤖 Suggestions AI pour planification',
      '⚡ Auto-priorisation intelligente',
      '🏆 Tous les badges débloqués',
      '📊 Analytics avancés',
      '📈 Rapports de productivité',
    ],
    featuresEn: [
      '✨ Everything in Free +',
      '🤖 AI planning suggestions',
      '⚡ Smart auto-prioritization',
      '🏆 All badges unlocked',
      '📊 Advanced analytics',
      '📈 Productivity reports',
    ],
    highlighted: true,
    cta: 'Essayer Pro gratuitement',
    ctaEn: 'Try Pro Free',
    plan: 'pro',
  },
  {
    name: 'Premium',
    nameEn: 'Premium',
    price: 14.99,
    period: '/ mois',
    periodEn: '/ month',
    description: 'Le summum de la productivité',
    descriptionEn: 'The ultimate productivity',
    features: [
      '👑 Tout de Pro +',
      '🤖 Agent conversationnel AI',
      '🎙️ Assistant vocal (Vapi)',
      '⚙️ Workflows n8n (emails, intégrations)',
      '📧 Automatisations avancées',
      '📊 Rapports personnalisés',
      '🎯 Support prioritaire',
      '🎁 Bonus après 3 mois de Pro',
    ],
    featuresEn: [
      '👑 Everything in Pro +',
      '🤖 AI Conversational Agent',
      '🎙️ Voice Assistant (Vapi)',
      '⚙️ n8n Workflows (emails, integrations)',
      '📧 Advanced automations',
      '📊 Custom reports',
      '🎯 Priority support',
      '🎁 Bonus after 3 months of Pro',
    ],
    cta: 'Passer à Premium',
    ctaEn: 'Upgrade to Premium',
    plan: 'premium',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { language } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSelectPlan = async (plan: 'free' | 'pro' | 'premium') => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (plan === 'free') {
      router.push('/dashboard');
      return;
    }

    setLoading(plan);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Mouse Spotlight Effect */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(168, 85, 247, 0.15), transparent 40%)`,
        }}
      />

      {/* Header */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            {language === 'fr' ? 'Choisissez votre plan' : 'Choose Your Plan'}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {language === 'fr'
              ? 'Déverrouillez tout le potentiel de votre productivité avec FoxWise'
              : 'Unlock your full productivity potential with FoxWise'}
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.plan}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`
                relative rounded-2xl p-8 flex flex-col
                ${tier.highlighted
                  ? 'bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-2 border-purple-500 shadow-2xl shadow-purple-500/20 scale-105'
                  : 'bg-gray-800/50 border border-gray-700'
                }
                backdrop-blur-sm
              `}
            >
              {/* Badge "Most Popular" */}
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  {language === 'fr' ? '⭐ Plus populaire' : '⭐ Most Popular'}
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {language === 'fr' ? tier.name : tier.nameEn}
                </h3>
                <p className="text-gray-400 text-sm">
                  {language === 'fr' ? tier.description : tier.descriptionEn}
                </p>
              </div>

              {/* Prix */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-white">
                    ${tier.price}
                  </span>
                  <span className="text-gray-400">
                    {language === 'fr' ? tier.period : tier.periodEn}
                  </span>
                </div>
                {tier.trial && (
                  <p className="text-green-400 text-sm mt-2 font-semibold">
                    🎁 {language === 'fr' ? tier.trial : tier.trialEn}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-grow">
                {(language === 'fr' ? tier.features : tier.featuresEn).map((feature, i) => (
                  <li key={i} className="text-gray-300 text-sm flex items-start">
                    <span className="mr-2 flex-shrink-0">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPlan(tier.plan)}
                disabled={loading === tier.plan}
                className={`
                  w-full py-3 px-6 rounded-lg font-semibold text-white
                  transition-all duration-200
                  ${tier.highlighted
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/50'
                    : 'bg-gray-700 hover:bg-gray-600'
                  }
                  ${loading === tier.plan ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {loading === tier.plan ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {language === 'fr' ? 'Chargement...' : 'Loading...'}
                  </span>
                ) : (
                  language === 'fr' ? tier.cta : tier.ctaEn
                )}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-24 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            {language === 'fr' ? 'Questions fréquentes' : 'Frequently Asked Questions'}
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                {language === 'fr' ? 'Puis-je changer de plan à tout moment?' : 'Can I change plans anytime?'}
              </h3>
              <p className="text-gray-400">
                {language === 'fr'
                  ? 'Oui! Vous pouvez upgrader, downgrader ou annuler votre abonnement à tout moment depuis votre tableau de bord.'
                  : 'Yes! You can upgrade, downgrade, or cancel your subscription anytime from your dashboard.'}
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                {language === 'fr' ? "Qu'arrive-t-il après l'essai gratuit?" : 'What happens after the free trial?'}
              </h3>
              <p className="text-gray-400">
                {language === 'fr'
                  ? 'Après 14 jours, votre carte sera facturée automatiquement. Vous recevrez un rappel 3 jours avant la fin de votre essai.'
                  : 'After 14 days, your card will be charged automatically. You\'ll receive a reminder 3 days before your trial ends.'}
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                {language === 'fr' ? 'Comment obtenir le bonus Premium gratuit?' : 'How do I get the free Premium bonus?'}
              </h3>
              <p className="text-gray-400">
                {language === 'fr'
                  ? "Restez abonné au plan Pro pendant 3 mois consécutifs et vous recevrez 1 mois gratuit de Premium! C'est notre façon de vous remercier pour votre fidélité. 🎁"
                  : 'Stay subscribed to the Pro plan for 3 consecutive months and you\'ll receive 1 month of Premium free! It\'s our way of thanking you for your loyalty. 🎁'}
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                {language === 'fr' ? 'Mes données sont-elles sécurisées?' : 'Is my data secure?'}
              </h3>
              <p className="text-gray-400">
                {language === 'fr'
                  ? 'Absolument! Toutes vos données sont chiffrées et stockées de manière sécurisée. Nous utilisons les mêmes standards de sécurité que les banques.'
                  : 'Absolutely! All your data is encrypted and securely stored. We use the same security standards as banks.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-gray-400 mb-4">
            {language === 'fr'
              ? 'Besoin d\'aide pour choisir? Contactez-nous!'
              : 'Need help choosing? Contact us!'}
          </p>
          <a
            href="mailto:support@foxwise.app"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            support@foxwise.app
          </a>
        </motion.div>
      </div>
    </div>
  );
}
