import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { JobWorkroomClient } from '@/components/job/JobWorkroomClient';

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const session = await getSession(); // session can be null for public browsing

  const { id: jobId } = await params;
  const supabase = createAdminClient();

  // Fetch job details with clients, freelancers, applications, and messages
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      client:users!client_id(*),
      freelancer:users!freelancer_id(*),
      applications(*, freelancer:users!freelancer_id(*)),
      messages(*, sender:users!sender_id(*))
    `)
    .eq('id', jobId)
    .order('created_at', { foreignTable: 'messages', ascending: true })
    .single();

  if (!job) {
    redirect('/jobs/browse');
  }

  const isClient = session?.user_id === job.client_id;
  const isFreelancer = session?.user_id === job.freelancer_id;

  return (
    <JobWorkroomClient
      job={job}
      currentUserSession={session}
      isClient={isClient}
      isFreelancer={isFreelancer}
    />
  );
}
