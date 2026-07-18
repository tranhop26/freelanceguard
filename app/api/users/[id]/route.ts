import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const supabase = createAdminClient();

    const { data: user, error } = await supabase
      .from('users')
      .update(body)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ message: 'Failed to update user', error: error.message }, { status: 500 });
    }

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}
