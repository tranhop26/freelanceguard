import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ReputationCard } from '@/components/profile/ReputationCard';
import { JobCard } from '@/components/job/JobCard';
import { shortenAddress } from '@/lib/utils/format';
import { MapPin, Globe, Sparkles, UserCheck } from 'lucide-react';

interface ProfilePageProps {
  params: Promise<{ address: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { address } = await params;
  const lowercaseAddress = address.toLowerCase();

  const supabase = createAdminClient();

  // Fetch user profile from DB based on wallet address
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', lowercaseAddress)
    .maybeSingle();

  // Fetch recent jobs related to this wallet/profile
  let recentJobs: any[] = [];
  
  if (userProfile) {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*, client:users!client_id(*), freelancer:users!freelancer_id(*)')
      .or(`client_id.eq.${userProfile.id},freelancer_id.eq.${userProfile.id}`)
      .order('created_at', { ascending: false })
      .limit(6);
    recentJobs = jobs || [];
  }

  // Fallback profile if address is valid but no user record exists in Supabase
  const displayName = userProfile?.display_name || `User ${shortenAddress(lowercaseAddress)}`;
  const email = userProfile?.email || 'mock.user@freelanceguard.xyz';
  const role = userProfile?.role || 'both';
  const bio = userProfile?.bio || 'Professional developer working in the Web3 space.';
  const country = userProfile?.country || 'Vietnam';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header Card */}
      <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="h-32 bg-slate-900 flex items-end px-6 pb-4 relative">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/95 text-xs font-semibold backdrop-blur-sm border border-white/15">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Reputation Verified</span>
          </div>
        </div>
        <CardContent className="p-6 relative pt-12">
          {/* Avatar floating */}
          <div className="absolute -top-12 left-6">
            <Avatar className="h-20 w-20 border-4 border-white bg-slate-100 rounded-full shadow-md">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                {displayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* User Info details */}
            <div className="md:col-span-2 space-y-3">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  {displayName}
                  <Sparkles className="h-4.5 w-4.5 text-blue-700 animate-pulse" />
                </h2>
                <span className="text-xs text-slate-500 font-mono font-medium block">
                  {lowercaseAddress}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {country}
                </span>
                <span className="flex items-center gap-1 capitalize">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  Role: {role}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                {bio}
              </p>
            </div>

            {/* On-chain reputation widget */}
            <div>
              <ReputationCard address={lowercaseAddress} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity / Jobs */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Recent Projects Activity</h3>
        
        {recentJobs.length === 0 ? (
          <Card className="bg-white border border-slate-200 shadow-sm rounded-xl py-12 text-center text-xs text-slate-400 italic">
            No public project work records available for this account.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
