export interface CalendarNote {
  id: string;
  user_id: string;
  date: string;
  note: string;
  color: string;
  title?: string;
  description?: string;
  time?: string;
  email_reminder?: boolean;
  reminder_sent?: boolean;
  completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getCalendarNotesByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<CalendarNote[]> {
  try {
    const response = await fetch(
      `/api/calendar-notes?startDate=${startDate}&endDate=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar notes');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching calendar notes:', error);
    throw error;
  }
}

export async function createCalendarNote(note: {
  title: string;
  description?: string;
  date: string;
  time?: string;
  email_reminder?: boolean;
  color?: string;
}): Promise<CalendarNote> {
  try {
    const response = await fetch('/api/calendar-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    });

    if (!response.ok) {
      throw new Error('Failed to create calendar note');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating calendar note:', error);
    throw error;
  }
}

export async function updateCalendarNote(
  id: string,
  updates: Partial<CalendarNote>
): Promise<CalendarNote> {
  try {
    const response = await fetch(`/api/calendar-notes/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update calendar note');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating calendar note:', error);
    throw error;
  }
}

export async function deleteCalendarNote(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/calendar-notes/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete calendar note');
    }
  } catch (error) {
    console.error('Error deleting calendar note:', error);
    throw error;
  }
}
