import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { runAIJudge } from '@/lib/ai/judge';
import { publicClient, createWalletClientFromPrivateKey } from '@/lib/viem';
import { jobEscrowContract } from '@/lib/contracts';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();
    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch job + messages
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*, client:users!client_id(*), freelancer:users!freelancer_id(*)')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'disputed') {
      return NextResponse.json({ error: `Job status must be 'disputed', got '${job.status}'` }, { status: 400 });
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    // Run AI Judge (may take 5-15 seconds)
    console.log('🤖 Running AI Judge for job', jobId);
    const verdict = await runAIJudge(job, messages || []);
    console.log('✅ AI verdict:', verdict.verdict, `(${verdict.freelancer_percentage}%)`);

    // Convert percentage to basis points (0-10000)
    const freelancerBps = verdict.freelancer_percentage * 100;

    // Call resolveDispute on-chain using deployer wallet (AI Judge role)
    let txHash: string | null = null;
    try {
      if (!job.onchain_job_id && job.onchain_job_id !== 0) {
        console.warn('⚠️ Job has no onchain_job_id — skipping on-chain resolution (mock mode)');
      } else {
        const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
        if (!privateKey) {
          throw new Error('DEPLOYER_PRIVATE_KEY not configured');
        }
        const walletClient = createWalletClientFromPrivateKey(privateKey);

        const hash = await walletClient.writeContract({
          ...jobEscrowContract,
          functionName: 'resolveDispute',
          args: [BigInt(job.onchain_job_id), BigInt(freelancerBps), verdict.reasoning],
        });

        console.log('⛓️ Dispute resolution tx submitted:', hash);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        txHash = receipt.transactionHash;
        console.log('✅ On-chain confirmed:', txHash);
      }
    } catch (chainError: any) {
      console.error('⚠️ On-chain call failed, saving verdict off-chain only:', chainError.message);
    }

    // Save verdict to Supabase
    const fullVerdict = {
      ...verdict,
      resolved_at: new Date().toISOString(),
      tx_hash: txHash,
    };

    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'resolved',
        ai_verdict: fullVerdict,
        resolve_tx_hash: txHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Failed to update job with verdict:', updateError);
    }

    return NextResponse.json({ success: true, verdict: fullVerdict });
  } catch (error: any) {
    console.error('❌ AI Judge error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
