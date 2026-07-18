import { NextResponse } from 'next/server';
import { createWalletClientFromPrivateKey, publicClient } from '@/lib/viem';
import { jobEscrowContract } from '@/lib/contracts';

export async function POST(request: Request) {
  try {
    const { onchainJobId, deliverableHash } = await request.json();
    if (onchainJobId === undefined || !deliverableHash) {
      return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
    }

    const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
    if (!privateKey) {
      return NextResponse.json({ message: 'Deployer keys not configured' }, { status: 500 });
    }

    const deployerWallet = createWalletClientFromPrivateKey(privateKey);
    const tx = await deployerWallet.writeContract({
      ...jobEscrowContract,
      functionName: 'submitDeliverable',
      args: [BigInt(onchainJobId), deliverableHash as `0x${string}`],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    return NextResponse.json({ txHash: tx });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Mock deliverable submission failed' }, { status: 500 });
  }
}
