import { supabase } from '../supabase';
import { Database } from '../database.types';

type UserSettings = Database['public']['Tables']['user_settings']['Row'];
type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert'];
type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];

export async function getUserSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // If no settings exist, create default ones
    if (error.code === 'PGRST116') {
      return await createUserSettings({
        user_id: userId,
        default_currency: 'CAD',
        date_format: 'MM/DD/YYYY'
      });
    }
    throw error;
  }
  return data as UserSettings;
}

export async function createUserSettings(settings: UserSettingsInsert) {
  const { data, error } = await supabase
    .from('user_settings')
    .insert(settings)
    .select()
    .single();

  if (error) throw error;
  return data as UserSettings;
}

export async function updateUserSettings(userId: string, updates: UserSettingsUpdate) {
  const { data, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as UserSettings;
}

// Currency options with symbols
export const CURRENCIES = [
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' }
];

export function getCurrencySymbol(currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.symbol : '$';
}
