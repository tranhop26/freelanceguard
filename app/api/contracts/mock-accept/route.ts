import { NextResponse } from 'next/server';
import { createWalletClientFromPrivateKey, publicClient } from '@/lib/viem';
import { jobEscrowContract, usdcContract } from '@/lib/contracts';
import { parseUnits, decodeEventLog } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { freelancerWalletAddress, amount, deadline, criteriaHash } = await request.json();

    if (!freelancerWalletAddress || !amount || !deadline || !criteriaHash) {
      return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
    }

    const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
    if (!privateKey) {
      return NextResponse.json({ message: 'DEPLOYER_PRIVATE_KEY not configured on server' }, { status: 500 });
    }

    // Initialize deployer wallet client
    const deployerWallet = createWalletClientFromPrivateKey(privateKey);
    const deployerAddress = deployerWallet.account.address;

    const amountBig = parseUnits(amount.toString(), 6);

    // Step A: Check allowance
    const allowance = await publicClient.readContract({
      ...usdcContract,
      functionName: 'allowance',
      args: [deployerAddress, CONTRACT_ADDRESSES.JobEscrow],
    });

    // Step B: Approve if allowance is insufficient
    if ((allowance as bigint) < amountBig) {
      console.log('[MOCK TX] Approving USDC for deployer...');
      const approveTx = await deployerWallet.writeContract({
        ...usdcContract,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.JobEscrow, amountBig],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });
    }

    // Step C: Call createJob
    console.log('[MOCK TX] Creating Escrow Job on-chain...');
    const createTx = await deployerWallet.writeContract({
      ...jobEscrowContract,
      functionName: 'createJob',
      args: [
        freelancerWalletAddress as `0x${string}`,
        amountBig,
        BigInt(deadline),
        criteriaHash as `0x${string}`
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: createTx });
    const txHash = receipt.transactionHash;

    // Step D: Decode jobId
    let jobId = 0;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: jobEscrowContract.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'JobCreated') {
          jobId = Number((decoded.args as any).jobId);
          break;
        }
      } catch (e) {
        // Ignore other logs
      }
    }

    console.log(`[MOCK TX] Escrow created. Job ID: ${jobId}, Tx: ${txHash}`);
    return NextResponse.json({ jobId, txHash });
  } catch (err: any) {
    console.error('[MOCK TX] Escrow creation failed:', err);
    return NextResponse.json({ message: err.message || 'Mock transaction execution failed' }, { status: 500 });
  }
}
