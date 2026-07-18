import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { coverLetter, proposedAmount } = await request.json();

    const supabase = createAdminClient();

    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        freelancer_id: session.user_id,
        cover_letter: coverLetter,
        proposed_amount: proposedAmount ? parseFloat(proposedAmount) : null,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'You have already applied for this job' }, { status: 400 });
      }
      return NextResponse.json({ message: 'Failed to submit application', error: error.message }, { status: 500 });
    }

    return NextResponse.json(application);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}
