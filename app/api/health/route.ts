import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    contracts: {
      JobEscrow: process.env.NEXT_PUBLIC_JOB_ESCROW_ADDRESS,
      AgentRegistry: process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS,
    },
    version: '1.0.0',
  });
}
