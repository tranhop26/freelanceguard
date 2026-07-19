import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users, error } = await supabase.from('users').select('*');
  console.log('=== USERS IN DATABASE ===');
  console.log(users);
  if (error) console.error('Error fetching users:', error);
}

run();
