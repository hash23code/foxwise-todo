-- Create routines table
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'family', 'leisure', 'work', 'sport', 'wellness'
  frequency_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  start_time TIME NOT NULL,
  duration_hours DECIMAL(4,2) NOT NULL DEFAULT 1.0,

  -- Weekly frequency options (JSON array of day numbers: 0=Sunday, 1=Monday, etc.)
  weekly_days INTEGER[] DEFAULT NULL,

  -- Monthly frequency options (JSON array of day numbers: 1-31)
  monthly_days INTEGER[] DEFAULT NULL,

  -- Skip weekends option for daily frequency
  skip_weekends BOOLEAN DEFAULT FALSE,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_routines_user_id ON public.routines(user_id);
CREATE INDEX idx_routines_frequency_type ON public.routines(frequency_type);
CREATE INDEX idx_routines_is_active ON public.routines(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_routines_updated_at
  BEFORE UPDATE ON public.routines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
