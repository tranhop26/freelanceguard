import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const minAmount = searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : null;
    const maxAmount = searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : null;
    const sort = searchParams.get('sort') || 'latest';

    const supabase = createAdminClient();

    let query = supabase
      .from('jobs')
      .select('*, client:users!client_id(*)')
      .eq('status', 'open');

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category && category !== 'all' && category !== 'other') {
      query = query.eq('category', category);
    }

    if (minAmount !== null) {
      query = query.gte('amount_usdc', minAmount);
    }

    if (maxAmount !== null) {
      query = query.lte('amount_usdc', maxAmount);
    }

    if (sort === 'highest_paying') {
      query = query.order('amount_usdc', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: jobs, error } = await query;

    if (error) {
      return NextResponse.json({ message: 'Failed to fetch jobs', error: error.message }, { status: 500 });
    }

    return NextResponse.json(jobs);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, criteria, category, amount_usdc, deadline } = body;

    if (!title || !description || !criteria || !amount_usdc || !deadline) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        client_id: session.user_id,
        title,
        description,
        criteria,
        category: category || 'other',
        amount_usdc: parseFloat(amount_usdc),
        deadline: new Date(deadline).toISOString(),
        status: 'open',
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ message: 'Failed to create job', error: error.message }, { status: 500 });
    }

    return NextResponse.json(job);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}
