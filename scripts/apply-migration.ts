import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
const projectRef = url.hostname.split('.')[0];

const sql = postgres({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD!,
  ssl: 'require',
});

async function main() {
  const migrationPath = path.join('supabase', 'migrations', '001_initial_schema.sql');
  const migration = fs.readFileSync(migrationPath, 'utf-8');
  console.log('Applying migration...');
  await sql.unsafe(migration);
  console.log('✅ Migration applied successfully');

  // Verify tables
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  console.log('Tables:', tables.map(t => t.table_name));

  await sql.end();
}

main().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
