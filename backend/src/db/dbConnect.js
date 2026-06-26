const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env file');
  process.exit(1);
}

// Service-role client — backend-only, full DB access (RLS bypass)
// NEVER expose this client/key to frontend
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testConnection() {
  try {
    const { error } = await supabase.from('_health_check').select('*').limit(1);
    // Table won't exist yet (Batch 2 me banegi) — ye sirf connection test hai
    if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
      throw error;
    }
    console.log('✅ Supabase connection established');
  } catch (err) {
    console.error('⚠️ Supabase connection issue:', err.message);
  }
}

module.exports = { supabase, testConnection };