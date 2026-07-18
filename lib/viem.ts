import { createPublicClient, createWalletClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ARC_TESTNET } from './constants';

export const arcTestnet = defineChain(ARC_TESTNET);

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export function createWalletClientFromPrivateKey(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(),
  });
}
