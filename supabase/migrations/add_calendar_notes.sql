-- Create calendar_notes table for notes/reminders
CREATE TABLE IF NOT EXISTS calendar_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  email_reminder BOOLEAN DEFAULT FALSE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#f59e0b', -- Default orange color
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date CHECK (date >= CURRENT_DATE)
);

-- Enable RLS
ALTER TABLE calendar_notes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own calendar notes"
  ON calendar_notes FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own calendar notes"
  ON calendar_notes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own calendar notes"
  ON calendar_notes FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own calendar notes"
  ON calendar_notes FOR DELETE
  USING (auth.uid()::text = user_id);

-- Create index for faster queries
CREATE INDEX idx_calendar_notes_user_id ON calendar_notes(user_id);
CREATE INDEX idx_calendar_notes_date ON calendar_notes(date);
CREATE INDEX idx_calendar_notes_email_reminder ON calendar_notes(email_reminder, reminder_sent, date)
  WHERE email_reminder = true AND reminder_sent = false;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_calendar_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_notes_updated_at
  BEFORE UPDATE ON calendar_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_notes_updated_at();

COMMENT ON TABLE calendar_notes IS 'Calendar notes and reminders with optional email notifications';
COMMENT ON COLUMN calendar_notes.email_reminder IS 'If true, send email reminder 1 day before the date';
COMMENT ON COLUMN calendar_notes.reminder_sent IS 'Tracks if reminder email has been sent';
