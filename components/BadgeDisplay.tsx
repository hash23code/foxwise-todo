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
function getBadgeColor(badgeType: string): string {
  const colors: Record<string, string> = {
    perfect_day: 'bg-amber-500/20 border-amber-500/40',
    flexible: 'bg-blue-500/20 border-blue-500/40',
    speed_task: 'bg-purple-500/20 border-purple-500/40',
    speed_day_bronze: 'bg-orange-600/20 border-orange-600/40',
    speed_day_silver: 'bg-slate-400/20 border-slate-400/40',
    speed_day_gold: 'bg-yellow-500/20 border-yellow-500/40',
    after_hours: 'bg-indigo-500/20 border-indigo-500/40',
    exceptional_day_bronze: 'bg-orange-600/20 border-orange-600/40',
    exceptional_day_silver: 'bg-slate-400/20 border-slate-400/40',
    exceptional_day_gold: 'bg-yellow-500/20 border-yellow-500/40',
    exceptional_category: 'bg-pink-500/20 border-pink-500/40',
    exceptional_global: 'bg-amber-500/20 border-amber-500/40'
  };
  return colors[badgeType] || 'bg-gray-500/20 border-gray-500/40';
}

function getBadgeGlow(badgeType: string): string {
  const glows: Record<string, string> = {
    perfect_day: 'shadow-amber-500/20',
    flexible: 'shadow-blue-500/20',
    speed_task: 'shadow-purple-500/20',
    speed_day_bronze: 'shadow-orange-600/20',
    speed_day_silver: 'shadow-slate-400/20',
    speed_day_gold: 'shadow-yellow-500/20',
    after_hours: 'shadow-indigo-500/20',
    exceptional_day_bronze: 'shadow-orange-600/20',
    exceptional_day_silver: 'shadow-slate-400/20',
    exceptional_day_gold: 'shadow-yellow-500/20',
    exceptional_category: 'shadow-pink-500/20',
    exceptional_global: 'shadow-amber-500/20'
  };
  return glows[badgeType] || 'shadow-gray-500/20';
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
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: index * 0.1
            }}
            className="relative group"
          >
            {/* Badge Container - Style moderne et sobre */}
            <motion.div
              className={`
                relative flex items-center justify-center
                w-12 h-12 rounded-full
                ${getBadgeColor(badge.badge_type)}
                border backdrop-blur-sm
                shadow-lg ${getBadgeGlow(badge.badge_type)}
                cursor-help
              `}
              animate={{
                boxShadow: [
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                ]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <span className="text-2xl relative z-10 filter drop-shadow-sm">{metadata.icon}</span>
            </motion.div>

            {/* Tooltip simple avec le nom du badge */}
            {!compact && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-gray-700/50">
                {language === 'fr' ? metadata.name_fr : metadata.name_en}
                {/* Triangle pointer */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/90"></div>
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
