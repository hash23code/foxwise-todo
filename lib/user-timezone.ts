import { createClient } from '@/lib/supabase';

// Liste des timezones communes (IANA format)
export const TIMEZONES = [
  { value: 'America/Toronto', label: 'Eastern Time (Toronto, Montréal, New York)' },
  { value: 'America/Vancouver', label: 'Pacific Time (Vancouver, Los Angeles)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago, Dallas)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver, Calgary)' },
  { value: 'America/Halifax', label: 'Atlantic Time (Halifax)' },
  { value: 'America/St_Johns', label: 'Newfoundland Time (St. John\'s)' },
  { value: 'Europe/Paris', label: 'Central European Time (Paris, Berlin)' },
  { value: 'Europe/London', label: 'British Time (London)' },
  { value: 'Asia/Tokyo', label: 'Japan Time (Tokyo)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (Sydney)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
] as const;

/**
 * Récupère la timezone de l'utilisateur depuis la base de données
 * @param userId - ID de l'utilisateur
 * @returns La timezone IANA (ex: 'America/Toronto') ou 'America/Toronto' par défaut
 */
export async function getUserTimezone(userId: string): Promise<string> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_memory')
      .select('timezone')
      .eq('user_id', userId)
      .single();

    if (error || !data?.timezone) {
      // Retourner la timezone par défaut (Québec)
      return 'America/Toronto';
    }

    return data.timezone;
  } catch (error) {
    console.error('Error fetching user timezone:', error);
    return 'America/Toronto'; // Défaut en cas d'erreur
  }
}

/**
 * Met à jour la timezone de l'utilisateur
 * @param userId - ID de l'utilisateur
 * @param timezone - Timezone IANA à sauvegarder
 */
export async function updateUserTimezone(userId: string, timezone: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Vérifier si l'entrée user_memory existe
    const { data: existing } = await supabase
      .from('user_memory')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('user_memory')
        .update({ timezone })
        .eq('user_id', userId);

      return !error;
    } else {
      // Insert new
      const { error } = await supabase
        .from('user_memory')
        .insert({ user_id: userId, timezone });

      return !error;
    }
  } catch (error) {
    console.error('Error updating user timezone:', error);
    return false;
  }
}

/**
 * Obtient la date actuelle dans la timezone de l'utilisateur au format YYYY-MM-DD
 * @param userId - ID de l'utilisateur
 * @returns Date au format YYYY-MM-DD dans la timezone de l'utilisateur
 */
export async function getTodayInUserTimezone(userId: string): Promise<string> {
  const timezone = await getUserTimezone(userId);
  const now = new Date();

  const dateStr = now.toLocaleString('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const [year, month, day] = dateStr.split(', ')[0].split('-');
  return `${year}-${month}-${day}`;
}

/**
 * Obtient l'heure actuelle dans la timezone de l'utilisateur
 * @param userId - ID de l'utilisateur
 * @param timestamp - Timestamp à convertir (par défaut: maintenant)
 * @returns Heure en format 24h (0-23)
 */
export async function getHourInUserTimezone(userId: string, timestamp?: string | Date): Promise<number> {
  const timezone = await getUserTimezone(userId);
  const date = timestamp ? new Date(timestamp) : new Date();

  return parseInt(
    date.toLocaleString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false
    })
  );
}
