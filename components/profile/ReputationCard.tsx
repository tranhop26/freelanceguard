'use client';

import { useQuery } from '@tanstack/react-query';
import { publicClient } from '@/lib/viem';
import { agentRegistryContract } from '@/lib/contracts';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Award, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';

interface ReputationCardProps {
  address: string;
}

export function ReputationCard({ address }: ReputationCardProps) {
  const { data: reputation, isLoading, error } = useQuery({
    queryKey: ['onchainReputation', address],
    queryFn: async () => {
      if (!address) return null;
      try {
        const result = await publicClient.readContract({
          ...agentRegistryContract,
          functionName: 'getReputation',
          args: [address as `0x${string}`],
        });

        // result is returned as an array: [jobsCompleted, avgRatingScaled, disputeCount, reliabilityScore]
        const r = result as [bigint, bigint, bigint, bigint];
        return {
          jobsCompleted: Number(r[0]),
          avgRating: Number(r[1]) / 100, // e.g. 500 -> 5.00
          disputeCount: Number(r[2]),
          reliabilityScore: Number(r[3]), // 0 - 1000
        };
      } catch (err) {
        console.warn('On-chain read error (likely uninitialized registry or contract gap):', err);
        return {
          jobsCompleted: 0,
          avgRating: 0,
          disputeCount: 0,
          reliabilityScore: 0,
        };
      }
    },
    enabled: !!address,
  });

  if (isLoading) {
    return <Skeleton className="h-44 w-full bg-slate-200" />;
  }

  if (error || !reputation) {
    return (
      <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
        <CardContent className="p-6 text-center text-xs text-red-500 font-semibold">
          Error loading on-chain reputation.
        </CardContent>
      </Card>
    );
  }

  const roundedStars = Math.round(reputation.avgRating);
  const reliabilityPercent = (reputation.reliabilityScore / 10).toFixed(0);

  return (
    <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="bg-slate-50 border-b border-slate-100 p-5">
        <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <Award className="h-4.5 w-4.5 text-blue-700" />
          On-chain ERC-8004 Reputation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        {/* Reliability Score Gauge */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Reliability Index</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-800">{reputation.reliabilityScore}</span>
              <span className="text-xs text-slate-400 font-semibold">/ 1000</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              {reliabilityPercent}% Reliable
            </span>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-3 divide-x divide-slate-100">
          {/* Completed */}
          <div className="flex flex-col items-center justify-center text-center">
            <CheckCircle className="h-4 w-4 text-emerald-600 mb-1" />
            <span className="text-sm font-extrabold text-slate-800">{reputation.jobsCompleted}</span>
            <span className="text-[9px] text-slate-400 font-semibold uppercase">Done</span>
          </div>

          {/* Rating */}
          <div className="flex flex-col items-center justify-center text-center pl-2">
            <div className="flex items-center text-amber-500 gap-0.5 mb-1">
              <Star className="h-4.5 w-4.5 fill-amber-500 text-amber-500" />
            </div>
            <span className="text-sm font-extrabold text-slate-800">{reputation.avgRating.toFixed(1)}</span>
            <span className="text-[9px] text-slate-400 font-semibold uppercase">Rating</span>
          </div>

          {/* Disputes */}
          <div className="flex flex-col items-center justify-center text-center pl-2">
            <ShieldAlert className="h-4 w-4 text-red-500 mb-1" />
            <span className="text-sm font-extrabold text-slate-800">{reputation.disputeCount}</span>
            <span className="text-[9px] text-slate-400 font-semibold uppercase">Disputes</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 leading-normal border-t border-slate-100 pt-3">
          ⭐ Ratings and completed milestones are cryptographically signed on the Arc Testnet by client releases and AI Judge verdicts.
        </p>
      </CardContent>
    </Card>
  );
}
