// Types de badges disponibles
export type BadgeType =
  | 'perfect_day'           // Toutes les tâches de la journée terminées
  | 'flexible'              // Au moins 1 tâche non schedulée complétée
  | 'speed_task'            // Tâche terminée au moins 15min avant le temps alloué
  | 'speed_day_bronze'      // Fin de journée: 30min-1h économisé
  | 'speed_day_silver'      // Fin de journée: 1h-2h économisé
  | 'speed_day_gold'        // Fin de journée: 2h+ économisé
  | 'after_hours'           // Tâche complétée après 20h
  | 'exceptional_category'  // Baisse de 20%+ dans une catégorie vs semaine dernière
  | 'exceptional_global';   // Baisse de 20%+ globale vs semaine dernière

export type BadgeTier = 'bronze' | 'silver' | 'gold' | null;

export interface Badge {
  id: string;
  user_id: string;
  date: string; // Format: YYYY-MM-DD
  badge_type: BadgeType;
  badge_tier: BadgeTier;
  earned_at: string;
  metadata?: {
    time_saved_minutes?: number;
    category_name?: string;
    percentage_improvement?: number;
    tasks_completed?: number;
    tasks_total?: number;
    [key: string]: any;
  };
  created_at: string;
}

export interface TaskCompletionTime {
  id: string;
  task_id: string;
  user_id: string;
  date: string;
  planned_start: string | null;
  planned_duration: number | null;
  actual_completion: string;
  time_saved_minutes: number | null;
  was_in_planner: boolean;
  was_in_calendar: boolean;
  completed_after_hours: boolean;
  created_at: string;
}

// Configuration des badges
export const BADGE_CONFIG = {
  speed_day: {
    bronze: { min: 30, max: 60 },      // 30min-1h
    silver: { min: 60, max: 120 },     // 1h-2h
    gold: { min: 120, max: Infinity }  // 2h+
  },
  speed_task: {
    minimum_minutes_saved: 15  // Au moins 15 min économisées
  },
  exceptional: {
    threshold_percentage: 20  // Baisse de 20%
  },
  after_hours: {
    start_hour: 20  // Après 20h
  },
  perfect_day: {
    check_hour: 17  // Vérification à 17h
  }
} as const;

// Métadonnées des badges pour l'affichage
export const BADGE_METADATA: Record<BadgeType, {
  icon: string;
  color: string;
  name_fr: string;
  name_en: string;
  description_fr: string;
  description_en: string;
}> = {
  perfect_day: {
    icon: '🌟',
    color: 'text-yellow-400',
    name_fr: 'Journée Parfaite',
    name_en: 'Perfect Day',
    description_fr: 'Toutes les tâches complétées',
    description_en: 'All tasks completed'
  },
  flexible: {
    icon: '🎯',
    color: 'text-blue-400',
    name_fr: 'Flexible',
    name_en: 'Flexible',
    description_fr: 'Tâche bonus complétée',
    description_en: 'Bonus task completed'
  },
  speed_task: {
    icon: '⚡',
    color: 'text-purple-400',
    name_fr: 'Rapide',
    name_en: 'Speed',
    description_fr: 'Tâche terminée en avance',
    description_en: 'Task finished early'
  },
  speed_day_bronze: {
    icon: '🥉',
    color: 'text-orange-600',
    name_fr: 'Speed Bronze',
    name_en: 'Speed Bronze',
    description_fr: '30min-1h économisé',
    description_en: '30min-1h saved'
  },
  speed_day_silver: {
    icon: '🥈',
    color: 'text-gray-400',
    name_fr: 'Speed Argent',
    name_en: 'Speed Silver',
    description_fr: '1h-2h économisé',
    description_en: '1h-2h saved'
  },
  speed_day_gold: {
    icon: '🥇',
    color: 'text-yellow-500',
    name_fr: 'Speed Or',
    name_en: 'Speed Gold',
    description_fr: '2h+ économisé',
    description_en: '2h+ saved'
  },
  after_hours: {
    icon: '🌙',
    color: 'text-indigo-400',
    name_fr: 'Noctambule',
    name_en: 'Night Owl',
    description_fr: 'Tâche après 20h',
    description_en: 'Task after 8pm'
  },
  exceptional_category: {
    icon: '🏆',
    color: 'text-pink-400',
    name_fr: 'Exceptionnel',
    name_en: 'Exceptional',
    description_fr: 'Amélioration majeure',
    description_en: 'Major improvement'
  },
  exceptional_global: {
    icon: '👑',
    color: 'text-amber-400',
    name_fr: 'Légende',
    name_en: 'Legend',
    description_fr: 'Performance exceptionnelle',
    description_en: 'Exceptional performance'
  }
};

// Fonction utilitaire pour calculer le temps économisé
export function calculateTimeSaved(
  plannedStart: string,
  plannedDuration: number, // en heures
  actualCompletion: string
): number {
  const start = new Date(plannedStart);
  const plannedEnd = new Date(start.getTime() + plannedDuration * 60 * 60 * 1000);
  const actualEnd = new Date(actualCompletion);

  // Différence en minutes
  const diffMs = plannedEnd.getTime() - actualEnd.getTime();
  return Math.round(diffMs / (1000 * 60));
}

// Fonction pour déterminer le tier du speed_day badge
export function getSpeedDayTier(minutesSaved: number): BadgeTier {
  if (minutesSaved >= BADGE_CONFIG.speed_day.gold.min) return 'gold';
  if (minutesSaved >= BADGE_CONFIG.speed_day.silver.min) return 'silver';
  if (minutesSaved >= BADGE_CONFIG.speed_day.bronze.min) return 'bronze';
  return null;
}

// Fonction pour vérifier si une heure est après 20h
export function isAfterHours(timestamp: string): boolean {
  const date = new Date(timestamp);
  const hour = date.getHours();
  return hour >= BADGE_CONFIG.after_hours.start_hour;
}
