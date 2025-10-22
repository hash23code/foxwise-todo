export interface UserSettings {
  id: string;
  user_id: string;
  default_list_id?: string;
  email_reminders_enabled: boolean;
  push_reminders_enabled: boolean;
  default_reminder_time: number; // Minutes before due date
  theme: 'light' | 'dark';
  language: 'en' | 'fr';
  timezone: string;
  created_at?: string;
  updated_at?: string;
}

// For compatibility with Finance app (not used in ToDo)
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const response = await fetch(`/api/user-settings?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error('Failed to fetch user settings, status:', response.status);
      return null; // Return null instead of throwing
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return null; // Return null instead of throwing
  }
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  try {
    const response = await fetch('/api/user-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, ...settings }),
    });

    if (!response.ok) {
      throw new Error('Failed to update user settings');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}

export async function createUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  return updateUserSettings(userId, settings);
}
