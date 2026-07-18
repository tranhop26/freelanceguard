'use client';

import { useQuery } from '@tanstack/react-query';
import { publicClient } from '@/lib/viem';
import { usdcContract } from '@/lib/contracts';
import { formatUsdc, shortenAddress } from '@/lib/utils/format';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Wallet, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';

interface WalletBalanceProps {
  address: string;
}

export function WalletBalance({ address }: WalletBalanceProps) {
  const [copied, setCopied] = useState(false);
  const { user } = useAuthStore();

  const isDemoMode = !!user?.email?.endsWith('@demo.freelanceguard.app');
  const demoRole = user?.email === 'sarah@demo.freelanceguard.app' ? 'client' : 'freelancer';

  const { data: balance, isLoading } = useQuery({
    queryKey: ['usdcBalance', address],
    queryFn: async () => {
      if (!address) return BigInt(0);
      try {
        const res = await publicClient.readContract({
          ...usdcContract,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });
        return res as bigint;
      } catch (err) {
        console.warn('Silent balance query failure:', err);
        return BigInt(0);
      }
    },
    refetchInterval: 15000, // Refetch every 15 seconds
    enabled: !!address && !isDemoMode,
  });

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Wallet address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading && !isDemoMode) {
    return <Skeleton className="h-9 w-32 bg-slate-200" />;
  }

  if (isDemoMode) {
    const mockBalance = demoRole === 'client' ? '5,000.00' : '784.00';
    return (
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm text-left group"
        title={`Copy Address: ${address}`}
      >
        <Wallet className="h-4 w-4 text-blue-700" />
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 font-mono leading-none mb-0.5">
            {shortenAddress(address)}
          </span>
          <span className="text-sm font-bold text-slate-800 leading-none">
            ${mockBalance} USDC
          </span>
        </div>
        <div className="ml-1 text-slate-400 group-hover:text-slate-600 transition-colors">
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        </div>
      </button>
    );
  }

  const displayBalance = balance ?? BigInt(0);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm text-left group"
      title={`Copy Address: ${address}`}
    >
      <Wallet className="h-4 w-4 text-blue-700" />
      <div className="flex flex-col">
        <span className="text-xs text-slate-500 font-mono leading-none mb-0.5">
          {shortenAddress(address)}
        </span>
        <span className="text-sm font-bold text-slate-800 leading-none">
          ${formatUsdc(displayBalance)} USDC
        </span>
      </div>
      <div className="ml-1 text-slate-400 group-hover:text-slate-600 transition-colors">
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      </div>
    </button>
  );
}
