import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        *,
        client:users!client_id(*),
        freelancer:users!freelancer_id(*),
        applications(*, freelancer:users!freelancer_id(*)),
        messages(*, sender:users!sender_id(*))
      `)
      .eq('id', id)
      .order('created_at', { foreignTable: 'messages', ascending: true })
      .single();

    if (error) {
      return NextResponse.json({ message: 'Job not found', error: error.message }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}
