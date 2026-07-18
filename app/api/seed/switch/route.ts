import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession, createSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    const currentEmail = session.email;
    let targetEmail = 'minh@demo.freelanceguard.app';
    if (currentEmail === 'minh@demo.freelanceguard.app') {
      targetEmail = 'sarah@demo.freelanceguard.app';
    }

    const supabase = createAdminClient();
    const { data: targetUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', targetEmail)
      .single();

    if (error || !targetUser) {
      return NextResponse.json({ error: 'Target demo user not seeded' }, { status: 404 });
    }

    const sessionToken = await createSession({
      user_id: targetUser.id,
      email: targetUser.email,
      wallet_address: targetUser.wallet_address,
    });

    const response = NextResponse.json({
      success: true,
      user: targetUser,
    });

    response.cookies.set('fg_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Switch failed' }, { status: 500 });
  }
}
