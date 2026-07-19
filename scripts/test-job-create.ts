import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: sarah } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'sarah@demo.freelanceguard.app')
    .single();

  if (!sarah) {
    console.error('Sarah Chen not found in DB!');
    return;
  }

  console.log('Sarah Chen ID:', sarah.id);

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      client_id: sarah.id,
      title: 'Diagnostic Test Job Title',
      description: 'This is a test job description for checking database inserting capabilities.',
      criteria: '• Test criteria must pass.',
      category: 'development',
      amount_usdc: 100.00,
      deadline: new Date(Date.now() + 86400000).toISOString(),
      status: 'open',
    })
    .select('*')
    .single();

  if (error) {
    console.error('❌ Insert failed! Error:', error);
  } else {
    console.log('✅ Insert succeeded! Job created:', job);
    
    // Clean it up
    await supabase.from('jobs').delete().eq('id', job.id);
    console.log('🧹 Cleaned up test job.');
  }
}

run();
