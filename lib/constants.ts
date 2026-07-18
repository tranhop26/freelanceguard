export const ARC_TESTNET = {
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'] },
    public: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'Arcscan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
};

export const CONTRACT_ADDRESSES = {
  JobEscrow: (process.env.NEXT_PUBLIC_JOB_ESCROW_ADDRESS || '0xE0a2BDd5b0b0E75aFfAEcf331bEE13FE7a3D9803') as `0x${string}`,
  AgentRegistry: (process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || '0xb8b2e7D1c46D5BdC49BBb4ab2fE72e6a21FD9C21') as `0x${string}`,
  USDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x3600000000000000000000000000000000000000') as `0x${string}`,
};

export const PLATFORM_FEE_BPS = 200; // 2%
export const USDC_DECIMALS = 6;

export const JOB_CATEGORIES = [
  { value: 'design', label: 'Design & Creative' },
  { value: 'development', label: 'Software Development' },
  { value: 'writing', label: 'Writing & Translation' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'video', label: 'Video & Animation' },
  { value: 'data', label: 'Data & AI' },
  { value: 'other', label: 'Other' },
];
