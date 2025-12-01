// Simple script to create the routines table via Supabase SQL
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const sql = `
-- Create routines table
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  frequency_type TEXT NOT NULL,
  start_time TIME NOT NULL,
  duration_hours DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  weekly_days INTEGER[] DEFAULT NULL,
  monthly_days INTEGER[] DEFAULT NULL,
  skip_weekends BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routines_user_id ON public.routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_frequency_type ON public.routines(frequency_type);
CREATE INDEX IF NOT EXISTS idx_routines_is_active ON public.routines(is_active);
`;

const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
};

const data = JSON.stringify({ query: sql });

console.log('Creating routines table in Supabase...');
console.log('URL:', SUPABASE_URL);

const req = https.request(url, options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Table created successfully!');
    } else {
      console.error('❌ Error:', res.statusCode, body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(data);
req.end();
