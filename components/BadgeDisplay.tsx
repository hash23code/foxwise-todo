"use client";

import { motion } from "framer-motion";
import { Badge, BADGE_METADATA } from "@/lib/badges";
import { useLanguage } from "@/contexts/LanguageContext";

interface BadgeDisplayProps {
  badges: Badge[];
  date?: string;
  compact?: boolean;
}

// Helper functions pour les couleurs et gradients des badges
function getBadgeGradient(badgeType: string): string {
  const gradients: Record<string, string> = {
    perfect_day: 'from-yellow-400 via-yellow-500 to-amber-600',
    flexible: 'from-blue-400 via-blue-500 to-cyan-600',
    speed_task: 'from-purple-400 via-purple-500 to-pink-600',
    speed_day_bronze: 'from-orange-400 via-orange-500 to-orange-700',
    speed_day_silver: 'from-gray-300 via-gray-400 to-gray-500',
    speed_day_gold: 'from-yellow-300 via-yellow-400 to-yellow-600',
    after_hours: 'from-indigo-400 via-purple-500 to-indigo-600',
    exceptional_category: 'from-pink-400 via-pink-500 to-rose-600',
    exceptional_global: 'from-amber-300 via-amber-400 to-yellow-500'
  };
  return gradients[badgeType] || 'from-gray-400 to-gray-600';
}

function getBadgeBorder(badgeType: string): string {
  const borders: Record<string, string> = {
    perfect_day: 'border-yellow-300',
    flexible: 'border-blue-300',
    speed_task: 'border-purple-300',
    speed_day_bronze: 'border-orange-300',
    speed_day_silver: 'border-gray-200',
    speed_day_gold: 'border-yellow-200',
    after_hours: 'border-indigo-300',
    exceptional_category: 'border-pink-300',
    exceptional_global: 'border-amber-200'
  };
  return borders[badgeType] || 'border-gray-400';
}

function getGlowColor(badgeType: string): string {
  const glows: Record<string, string> = {
    perfect_day: '#fbbf24',
    flexible: '#60a5fa',
    speed_task: '#a78bfa',
    speed_day_bronze: '#fb923c',
    speed_day_silver: '#d1d5db',
    speed_day_gold: '#fbbf24',
    after_hours: '#818cf8',
    exceptional_category: '#f472b6',
    exceptional_global: '#fbbf24'
  };
  return glows[badgeType] || '#9ca3af';
}

export default function BadgeDisplay({ badges, date, compact = false }: BadgeDisplayProps) {
  const { language } = useLanguage();

  if (!badges || badges.length === 0) {
    return null;
  }

  // Grouper les badges par type pour éviter les doublons visuels
  const uniqueBadges = badges.filter((badge, index, self) =>
    index === self.findIndex((b) => b.badge_type === badge.badge_type && b.badge_tier === badge.badge_tier)
  );

  return (
    <div className={`flex flex-wrap gap-3 ${compact ? 'items-center' : 'items-start'}`}>
      {uniqueBadges.map((badge, index) => {
        const metadata = BADGE_METADATA[badge.badge_type];

        return (
          <motion.div
            key={`${badge.badge_type}-${badge.badge_tier || ''}-${index}`}
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 15,
              delay: index * 0.15
            }}
            className="relative group"
          >
            {/* Badge Container avec glow effect */}
            <div className="relative">
              {/* Glow background animé */}
              <motion.div
                className="absolute inset-0 rounded-full blur-md opacity-60"
                style={{
                  background: `radial-gradient(circle, ${getGlowColor(badge.badge_type)} 0%, transparent 70%)`
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Badge principal */}
              <div
                className={`
                  relative flex items-center justify-center
                  w-14 h-14 rounded-full
                  bg-gradient-to-br ${getBadgeGradient(badge.badge_type)}
                  border-2 ${getBadgeBorder(badge.badge_type)}
                  shadow-lg cursor-help
                  transition-all duration-300
                  group-hover:shadow-2xl group-hover:scale-110
                `}
              >
                {/* Sparkle animation */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 50%)'
                  }}
                  animate={{
                    opacity: [0, 0.6, 0],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                <span className="text-2xl relative z-10 drop-shadow-lg">{metadata.icon}</span>
              </div>

              {/* Tooltip simple avec le nom du badge */}
              {!compact && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {language === 'fr' ? metadata.name_fr : metadata.name_en}
                  {/* Triangle pointer */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Composant pour afficher un badge avec un compteur (pour les rapports)
interface BadgeCountDisplayProps {
  badgeType: keyof typeof BADGE_METADATA;
  count: number;
}

export function BadgeCountDisplay({ badgeType, count }: BadgeCountDisplayProps) {
  const { language } = useLanguage();
  const metadata = BADGE_METADATA[badgeType];

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700">
      <span className="text-2xl">{metadata.icon}</span>
      <div className="flex-1">
        <div className={`font-semibold text-sm ${metadata.color}`}>
          {language === 'fr' ? metadata.name_fr : metadata.name_en}
        </div>
        <div className="text-xs text-gray-400">
          {language === 'fr' ? metadata.description_fr : metadata.description_en}
        </div>
      </div>
      <div className="text-2xl font-bold text-white">
        {count}
      </div>
    </div>
  );
}

// Composant pour afficher tous les badges d'une période avec statistiques
interface BadgeStatsProps {
  badges: Badge[];
  title?: string;
}

export function BadgeStats({ badges, title }: BadgeStatsProps) {
  const { language } = useLanguage();

  // Compter les badges par type
  const badgeCounts: Record<string, number> = {};
  badges.forEach(badge => {
    const key = badge.badge_tier ? `${badge.badge_type}_${badge.badge_tier}` : badge.badge_type;
    badgeCounts[key] = (badgeCounts[key] || 0) + 1;
  });

  // Calculer les statistiques
  const totalBadges = badges.length;
  const totalTimeSaved = badges.reduce((sum, badge) =>
    sum + (badge.metadata?.time_saved_minutes || 0), 0
  );

  return (
    <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
      {title && (
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      )}

      <div className="grid gap-3">
        {/* Statistiques globales */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-700/30">
          <div>
            <div className="text-sm text-gray-400">
              {language === 'fr' ? 'Total de badges' : 'Total badges'}
            </div>
            <div className="text-3xl font-bold text-white">{totalBadges}</div>
          </div>
          {totalTimeSaved > 0 && (
            <div className="text-right">
              <div className="text-sm text-gray-400">
                {language === 'fr' ? 'Temps économisé' : 'Time saved'}
              </div>
              <div className="text-2xl font-bold text-green-400">
                {Math.floor(totalTimeSaved / 60)}h {totalTimeSaved % 60}min
              </div>
            </div>
          )}
        </div>

        {/* Liste des badges par type */}
        {Object.entries(badgeCounts).map(([key, count]) => {
          const [type, tier] = key.split('_') as [keyof typeof BADGE_METADATA, string?];
          return (
            <BadgeCountDisplay
              key={key}
              badgeType={type}
              count={count}
            />
          );
        })}
      </div>
    </div>
  );
}
