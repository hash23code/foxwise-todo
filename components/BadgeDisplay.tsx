"use client";

import { motion } from "framer-motion";
import { Badge, BADGE_METADATA } from "@/lib/badges";
import { useLanguage } from "@/contexts/LanguageContext";

interface BadgeDisplayProps {
  badges: Badge[];
  date?: string;
  compact?: boolean;
}

// Helper functions pour les couleurs des badges trophées
function getBadgeColors(badgeType: string): { bg: string; border: string; ribbon: string } {
  const colors: Record<string, { bg: string; border: string; ribbon: string }> = {
    perfect_day: {
      bg: 'from-amber-400/80 to-yellow-500/80',
      border: 'border-amber-300',
      ribbon: 'bg-gradient-to-b from-amber-600 to-amber-700'
    },
    flexible: {
      bg: 'from-blue-400/80 to-blue-500/80',
      border: 'border-blue-300',
      ribbon: 'bg-gradient-to-b from-blue-600 to-blue-700'
    },
    speed_task: {
      bg: 'from-purple-400/80 to-purple-500/80',
      border: 'border-purple-300',
      ribbon: 'bg-gradient-to-b from-purple-600 to-purple-700'
    },
    speed_day_bronze: {
      bg: 'from-orange-500/80 to-orange-600/80',
      border: 'border-orange-400',
      ribbon: 'bg-gradient-to-b from-orange-700 to-orange-800'
    },
    speed_day_silver: {
      bg: 'from-slate-300/80 to-slate-400/80',
      border: 'border-slate-200',
      ribbon: 'bg-gradient-to-b from-slate-500 to-slate-600'
    },
    speed_day_gold: {
      bg: 'from-yellow-400/80 to-yellow-500/80',
      border: 'border-yellow-300',
      ribbon: 'bg-gradient-to-b from-yellow-600 to-yellow-700'
    },
    after_hours: {
      bg: 'from-indigo-400/80 to-indigo-500/80',
      border: 'border-indigo-300',
      ribbon: 'bg-gradient-to-b from-indigo-600 to-indigo-700'
    },
    exceptional_day_bronze: {
      bg: 'from-orange-500/80 to-orange-600/80',
      border: 'border-orange-400',
      ribbon: 'bg-gradient-to-b from-orange-700 to-orange-800'
    },
    exceptional_day_silver: {
      bg: 'from-slate-300/80 to-slate-400/80',
      border: 'border-slate-200',
      ribbon: 'bg-gradient-to-b from-slate-500 to-slate-600'
    },
    exceptional_day_gold: {
      bg: 'from-yellow-400/80 to-yellow-500/80',
      border: 'border-yellow-300',
      ribbon: 'bg-gradient-to-b from-yellow-600 to-yellow-700'
    },
    exceptional_category: {
      bg: 'from-pink-400/80 to-pink-500/80',
      border: 'border-pink-300',
      ribbon: 'bg-gradient-to-b from-pink-600 to-pink-700'
    },
    exceptional_global: {
      bg: 'from-amber-400/80 to-amber-500/80',
      border: 'border-amber-300',
      ribbon: 'bg-gradient-to-b from-amber-600 to-amber-700'
    }
  };
  return colors[badgeType] || {
    bg: 'from-gray-400/80 to-gray-500/80',
    border: 'border-gray-300',
    ribbon: 'bg-gradient-to-b from-gray-600 to-gray-700'
  };
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

        const colors = getBadgeColors(badge.badge_type);

        return (
          <motion.div
            key={`${badge.badge_type}-${badge.badge_tier || ''}-${index}`}
            initial={{ scale: 0, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: index * 0.1
            }}
            className="relative group"
          >
            {/* Badge Trophée - Style médaille avec ruban */}
            <div className="flex flex-col items-center cursor-help">
              {/* Ruban supérieur */}
              <div className={`w-6 h-2.5 ${colors.ribbon} rounded-t-sm shadow-md`}></div>

              {/* Médaille principale */}
              <motion.div
                className={`
                  relative flex items-center justify-center
                  w-11 h-11 rounded-full
                  bg-gradient-to-br ${colors.bg}
                  border-2 ${colors.border}
                  shadow-xl
                `}
                animate={{
                  y: [0, -2, 0],
                  boxShadow: [
                    '0 10px 20px -5px rgba(0, 0, 0, 0.3)',
                    '0 15px 25px -5px rgba(0, 0, 0, 0.4)',
                    '0 10px 20px -5px rgba(0, 0, 0, 0.3)'
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Cercle intérieur pour effet de profondeur */}
                <div className="absolute inset-1 rounded-full bg-white/20"></div>

                {/* Icône du badge */}
                <span className="text-2xl relative z-10 filter drop-shadow-lg">
                  {metadata.icon}
                </span>
              </motion.div>
            </div>

            {/* Tooltip avec nom du badge */}
            {!compact && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-700/50">
                {language === 'fr' ? metadata.name_fr : metadata.name_en}
                {/* Triangle pointer */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900/95"></div>
              </div>
            )}
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
