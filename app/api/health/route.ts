import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  let databaseAvailable = false;
  try {
    const { error } = await createAdminClient()
      .from('users')
      .select('id')
      .limit(1)
      .abortSignal(AbortSignal.timeout(5000));
    databaseAvailable = !error;
  } catch {
    // Health checks must fail when configuration or the database is unavailable.
  }
  return NextResponse.json({
    status: databaseAvailable ? 'ok' : 'degraded',
    database: databaseAvailable ? 'available' : 'unavailable',
    timestamp: new Date().toISOString(),
    contracts: {
      JobEscrow: process.env.NEXT_PUBLIC_JOB_ESCROW_ADDRESS,
      AgentRegistry: process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS,
    },
    version: '1.0.0',
  }, { status: databaseAvailable ? 200 : 503 });
}
