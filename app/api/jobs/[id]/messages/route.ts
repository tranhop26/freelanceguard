import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users!sender_id(*)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ message: 'Failed to fetch messages', error: error.message }, { status: 500 });
    }

    return NextResponse.json(messages);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}

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

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        job_id: jobId,
        sender_id: session.user_id,
        content,
      })
      .select('*, sender:users!sender_id(*)')
      .single();

    if (error) {
      return NextResponse.json({ message: 'Failed to send message', error: error.message }, { status: 500 });
    }

    return NextResponse.json(message);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}
