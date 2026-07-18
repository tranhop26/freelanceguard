import { NextResponse } from 'next/server';
import { createWalletClientFromPrivateKey, publicClient } from '@/lib/viem';
import { jobEscrowContract } from '@/lib/contracts';
import { getSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const { onchainJobId, reason } = await request.json();
    if (onchainJobId === undefined || !reason) {
      return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
    }

    const session = await getSession();
    const isDemo = !!session?.email?.endsWith('@demo.freelanceguard.app');

    if (isDemo) {
      console.log('[DEMO] Bypassing disputeJob write contract call');
      await new Promise((resolve) => setTimeout(resolve, 800)); // simulate delay
      const mockTx = `0xdemo_dispute_${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`;
      return NextResponse.json({ txHash: mockTx });
    }

    const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
    if (!privateKey) {
      return NextResponse.json({ message: 'Deployer keys not configured' }, { status: 500 });
    }

    const deployerWallet = createWalletClientFromPrivateKey(privateKey);
    const tx = await deployerWallet.writeContract({
      ...jobEscrowContract,
      functionName: 'disputeJob',
      args: [BigInt(onchainJobId), reason],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    return NextResponse.json({ txHash: tx });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Mock job dispute failed' }, { status: 500 });
  }
}
