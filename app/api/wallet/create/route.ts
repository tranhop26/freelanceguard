import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const { email, walletAddress, circleUserId } = await request.json();

    if (!email || !walletAddress) {
      return NextResponse.json({ message: 'Email and wallet address are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    let user = existingUser;
    let isNewUser = false;

    if (fetchError && fetchError.code === 'PGRST116') {
      // User does not exist, create a new one
      isNewUser = true;
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase().trim(),
          wallet_address: walletAddress.toLowerCase(),
          circle_user_id: circleUserId,
          role: 'both',
          display_name: email.split('@')[0],
        })
        .select('*')
        .single();

      if (insertError) {
        return NextResponse.json({ message: 'Failed to create user', error: insertError.message }, { status: 500 });
      }
      user = newUser;
    } else if (fetchError) {
      return NextResponse.json({ message: 'Database error fetching user', error: fetchError.message }, { status: 500 });
    } else {
      // User exists, update wallet address and circle user id if not set
      if (!user.wallet_address || !user.circle_user_id) {
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            wallet_address: user.wallet_address || walletAddress.toLowerCase(),
            circle_user_id: user.circle_user_id || circleUserId,
          })
          .eq('id', user.id)
          .select('*')
          .single();
        if (!updateError) {
          user = updatedUser;
        }
      }
    }

    // Create session cookie
    await createSession({
      user_id: user.id,
      email: user.email,
      wallet_address: user.wallet_address,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        wallet_address: user.wallet_address,
        display_name: user.display_name,
        role: user.role,
      },
      isNewUser,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}
