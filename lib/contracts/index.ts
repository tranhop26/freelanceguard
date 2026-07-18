import JobEscrowABI from './abi/JobEscrow.json';
import AgentRegistryABI from './abi/AgentRegistry.json';
import { CONTRACT_ADDRESSES } from '../constants';

export const jobEscrowContract = {
  address: CONTRACT_ADDRESSES.JobEscrow,
  abi: JobEscrowABI.abi,
} as const;

export const agentRegistryContract = {
  address: CONTRACT_ADDRESSES.AgentRegistry,
  abi: AgentRegistryABI.abi,
} as const;

export const usdcContract = {
  address: CONTRACT_ADDRESSES.USDC,
  abi: [
    { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
    { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
    { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
    { type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
    { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  ] as const,
};
