// Dit script past de database migratie toe voor huurindexatie
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Lees de .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials niet gevonden in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Lees de migratie SQL
const migrationSQL = `
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS volgende_huurwijziging date,
ADD COLUMN IF NOT EXISTS nieuw_huurbedrag_na_wijziging numeric;
`;

async function applyMigration() {
  try {
    console.log('🔄 Toepassen van huurindexatie migratie...');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // Als RPC niet bestaat, probeer direct via SQL editor
      console.log('⚠️  RPC methode niet beschikbaar');
      console.log('📝 Voer handmatig uit in Supabase Dashboard → SQL Editor:');
      console.log(migrationSQL);
      return;
    }
    
    console.log('✅ Migratie succesvol toegepast!');
    console.log('✨ Database is klaar voor huurindexatie functionaliteit');
    
  } catch (err) {
    console.error('❌ Fout bij toepassen migratie:', err.message);
    console.log('\n📝 Voer handmatig uit in Supabase Dashboard → SQL Editor:');
    console.log(migrationSQL);
  }
}

applyMigration();
