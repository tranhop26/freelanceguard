import { publicClient } from '../viem';
import { jobEscrowContract, usdcContract } from './index';
import { parseUnits, decodeEventLog } from 'viem';
import { CONTRACT_ADDRESSES } from '../constants';
import { circleClient } from '../circle';

export interface AcceptParams {
  freelancerWalletAddress: string;
  amount: number; // in normal USDC unit (e.g. 100)
  deadline: number; // unix timestamp
  criteriaHash: string; // keccak256 hash string "0x..."
  walletClient?: any; // viem wallet client from Circle in real mode
}

export async function acceptApplicationOnChain(params: AcceptParams): Promise<{ jobId: number; txHash: string }> {
  const { freelancerWalletAddress, amount, deadline, criteriaHash, walletClient } = params;

  // Smallest USDC units (6 decimals)
  const amountBig = parseUnits(amount.toString(), 6);

  // If in mock mode, route through our secure server-side API to sign with the deployer account
  if (circleClient.isMockMode()) {
    console.log('⚠️ Mock mode active: Routing transaction through server-side deployer wallet...');
    const res = await fetch('/api/contracts/mock-accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        freelancerWalletAddress,
        amount,
        deadline,
        criteriaHash,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Server-side mock transaction failed');
    }

    return await res.json();
  }

  // Real Mode: Execute client-side via Circle WalletClient
  if (!walletClient) {
    throw new Error('Circle wallet client is required for real mode transaction signing');
  }

  const clientAddress = walletClient.account.address;

  // Step A: Check USDC allowance
  console.log('Checking USDC allowance...');
  const allowance = await publicClient.readContract({
    ...usdcContract,
    functionName: 'allowance',
    args: [clientAddress, CONTRACT_ADDRESSES.JobEscrow],
  });

  let txHash = '';

  // Step B: Approve if allowance is insufficient
  if ((allowance as bigint) < amountBig) {
    console.log('Approving USDC...');
    const approveTx = await walletClient.writeContract({
      ...usdcContract,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.JobEscrow, amountBig],
    });
    console.log('Waiting for approval receipt...');
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
  }

  // Step D: Call createJob
  console.log('Creating Escrow Job...');
  const createTx = await walletClient.writeContract({
    ...jobEscrowContract,
    functionName: 'createJob',
    args: [
      freelancerWalletAddress as `0x${string}`,
      amountBig,
      BigInt(deadline),
      criteriaHash as `0x${string}`
    ],
  });

  console.log('Waiting for escrow creation receipt...');
  const receipt = await publicClient.waitForTransactionReceipt({ hash: createTx });
  txHash = receipt.transactionHash;

  // Step E: Extract jobId from JobCreated event logs using viem decodeEventLog
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
      // Ignore logs that don't match the ABI events
    }
  }

  return { jobId, txHash };
}

export async function submitDeliverableOnChain(
  onchainJobId: number,
  deliverableHash: string,
  walletClient?: any
): Promise<string> {
  if (circleClient.isMockMode()) {
    console.log('[MOCK TX] Submitting deliverable on-chain via deployer...');
    const res = await fetch('/api/contracts/mock-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onchainJobId, deliverableHash }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Mock deliverable submission failed');
    }
    const data = await res.json();
    return data.txHash;
  }

  if (!walletClient) throw new Error('Wallet client required');
  const tx = await walletClient.writeContract({
    ...jobEscrowContract,
    functionName: 'submitDeliverable',
    args: [BigInt(onchainJobId), deliverableHash as `0x${string}`],
  });
  await publicClient.waitForTransactionReceipt({ hash: tx });
  return tx;
}

export async function approveJobOnChain(
  onchainJobId: number,
  walletClient?: any
): Promise<string> {
  if (circleClient.isMockMode()) {
    console.log('[MOCK TX] Approving job on-chain via deployer...');
    const res = await fetch('/api/contracts/mock-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onchainJobId }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Mock job approval failed');
    }
    const data = await res.json();
    return data.txHash;
  }

  if (!walletClient) throw new Error('Wallet client required');
  const tx = await walletClient.writeContract({
    ...jobEscrowContract,
    functionName: 'approveJob',
    args: [BigInt(onchainJobId)],
  });
  await publicClient.waitForTransactionReceipt({ hash: tx });
  return tx;
}

export async function disputeJobOnChain(
  onchainJobId: number,
  reason: string,
  walletClient?: any
): Promise<string> {
  if (circleClient.isMockMode()) {
    console.log('[MOCK TX] Disputing job on-chain via deployer...');
    const res = await fetch('/api/contracts/mock-dispute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onchainJobId, reason }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Mock job dispute failed');
    }
    const data = await res.json();
    return data.txHash;
  }

  if (!walletClient) throw new Error('Wallet client required');
  const tx = await walletClient.writeContract({
    ...jobEscrowContract,
    functionName: 'disputeJob',
    args: [BigInt(onchainJobId), reason],
  });
  await publicClient.waitForTransactionReceipt({ hash: tx });
  return tx;
}

