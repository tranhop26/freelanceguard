import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const supabase = createAdminClient();

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user_id)
    .single();

  if (!profile) {
    redirect('/');
  }

  // Fetch client jobs
  const { data: clientJobs } = await supabase
    .from('jobs')
    .select('*, client:users!client_id(*), freelancer:users!freelancer_id(*)')
    .eq('client_id', session.user_id)
    .order('created_at', { ascending: false });

  // Fetch freelancer jobs
  const { data: freelancerJobs } = await supabase
    .from('jobs')
    .select('*, client:users!client_id(*), freelancer:users!freelancer_id(*)')
    .eq('freelancer_id', session.user_id)
    .order('created_at', { ascending: false });

  return (
    <DashboardClient
      profile={profile}
      initialClientJobs={clientJobs || []}
      initialFreelancerJobs={freelancerJobs || []}
    />
  );
}
