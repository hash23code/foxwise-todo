const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setupRoutines() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Setting up routines table...');

  // Read SQL file
  const sqlPath = path.join(__dirname, 'create-routines-table.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      if (error) {
        console.error('Error executing statement:', error);
      } else {
        console.log('Executed successfully');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  console.log('Setup complete!');
}

setupRoutines().catch(console.error);
