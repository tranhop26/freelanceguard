import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const DEMO_USERS = [
  {
    email: 'sarah@demo.freelanceguard.app',
    display_name: 'Sarah Chen',
    country: 'United States',
    role: 'client',
    bio: 'Startup founder in NYC looking for talented freelancers',
    wallet_address: '0xDEMO0000000000000000000000000000000Sarah',
  },
  {
    email: 'minh@demo.freelanceguard.app',
    display_name: 'Minh Nguyen',
    country: 'Vietnam',
    role: 'freelancer',
    bio: 'Senior brand designer, 5 years experience with international clients',
    wallet_address: '0xDEMO000000000000000000000000000000000Minh',
  },
  {
    email: 'alex@demo.freelanceguard.app',
    display_name: 'Alex Reyes',
    country: 'Philippines',
    role: 'freelancer',
    bio: 'Full-stack developer specializing in Next.js and Web3',
    wallet_address: '0xDEMO000000000000000000000000000000000Alex',
  },
];

const DEMO_JOBS = [
  {
    title: 'Modern logo design for AI startup',
    description: 'We are launching an AI SaaS product for freelancers and need a clean, modern logo that conveys trust and technology. Should work in both light and dark modes.',
    criteria: '• Vector format (SVG + AI files)\n• 3 color variations (primary, monochrome, inverted)\n• Includes wordmark + icon versions\n• Delivered within 5 days',
    category: 'design',
    amount_usdc: 500,
    days_deadline: 7,
    status: 'open',
  },
  {
    title: 'Landing page development in Next.js',
    description: 'Build a high-converting landing page for a fintech product. Need responsive design, animations, and integration with Stripe.',
    criteria: '• Next.js 14 App Router\n• Tailwind CSS\n• 6 sections (hero, features, pricing, testimonials, FAQ, CTA)\n• Lighthouse score 90+',
    category: 'development',
    amount_usdc: 1200,
    days_deadline: 14,
    status: 'in_progress',
  },
  {
    title: 'Brand identity package for coffee shop',
    description: 'Full brand identity for a specialty coffee shop opening in Ho Chi Minh City.',
    criteria: '• Logo + wordmark\n• Color palette + typography guide\n• Menu template\n• Business card design',
    category: 'design',
    amount_usdc: 800,
    days_deadline: 10,
    status: 'approved', // Already completed for reputation demo
  },
];

const DEMO_CHAT = [
  { from: 'freelancer', content: "Hi Sarah! I've reviewed your brief. I love the direction of clean & modern. When do you need the initial concepts?" },
  { from: 'client', content: "Great to hear from you! Would love to see 2-3 concepts by day 3 if possible." },
  { from: 'freelancer', content: "Perfect, I'll have concepts ready by day 3. Quick question — any specific colors you want to avoid?" },
  { from: 'client', content: "No red or pink please. Blues and greens preferred but open to suggestions." },
];

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reset = searchParams.get('reset') === 'true';

  const result: any = { users: [], jobs: [], errors: [] };

  try {
    const supabase = createAdminClient();
    // 1. Optional Reset Mode (performs robust cascading deletes to avoid foreign key errors)
    if (reset) {
      console.log('🔄 Resetting demo data...');
      
      const { data: demoUsers } = await supabase
        .from('users')
        .select('id')
        .like('email', '%@demo.freelanceguard.app');

      if (demoUsers && demoUsers.length > 0) {
        const userIds = demoUsers.map((u: any) => u.id);

        // Delete dependencies first
        await supabase.from('messages').delete().in('sender_id', userIds);
        await supabase.from('applications').delete().in('freelancer_id', userIds);
        
        // Fetch jobs owned by demo users to delete their applications/messages first
        const { data: clientJobs } = await supabase
          .from('jobs')
          .select('id')
          .in('client_id', userIds);

        if (clientJobs && clientJobs.length > 0) {
          const jobIds = clientJobs.map((j: any) => j.id);
          await supabase.from('messages').delete().in('job_id', jobIds);
          await supabase.from('applications').delete().in('job_id', jobIds);
          await supabase.from('jobs').delete().in('id', jobIds);
        }

        // Clean up remaining user roles
        await supabase.from('users').delete().in('id', userIds);
        console.log('✅ Demo reset completed.');
      }
    }

    // 2. Seed Users
    for (const user of DEMO_USERS) {
      const { data, error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'email' })
        .select()
        .single();
      if (error) {
        result.errors.push(`User ${user.email}: ${error.message}`);
      } else {
        result.users.push(data);
      }
    }

    const sarah = result.users.find((u: any) => u.email === 'sarah@demo.freelanceguard.app');
    const minh = result.users.find((u: any) => u.email === 'minh@demo.freelanceguard.app');

    if (!sarah || !minh) {
      throw new Error(`Failed to create demo users: ${result.errors.join('; ')}`);
    }

    // 3. Seed Jobs
    for (const jobData of DEMO_JOBS) {
      const { days_deadline, ...jobFields } = jobData;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + days_deadline);

      const jobInsert: any = {
        ...jobFields,
        client_id: sarah.id,
        deadline: deadline.toISOString(),
      };

      // Assign freelancer for in_progress and approved jobs
      if (jobData.status === 'in_progress' || jobData.status === 'approved') {
        jobInsert.freelancer_id = minh.id;
      }
      if (jobData.status === 'approved') {
        jobInsert.deliverable_url = 'https://demo.freelanceguard.app/coffee-brand-final.zip';
        jobInsert.deliverable_notes = 'All deliverables completed as agreed. Final files attached.';
      }

      const { data, error } = await supabase
        .from('jobs')
        .insert(jobInsert)
        .select()
        .single();

      if (error) {
        result.errors.push(`Job ${jobData.title}: ${error.message}`);
      } else {
        result.jobs.push(data);

        // Add chat messages to the in_progress job
        if (jobData.status === 'in_progress') {
          for (const msg of DEMO_CHAT) {
            const { error: messageError } = await supabase.from('messages').insert({
              job_id: data.id,
              sender_id: msg.from === 'client' ? sarah.id : minh.id,
              content: msg.content,
            });
            if (messageError) result.errors.push(`Demo chat: ${messageError.message}`);
          }
        }
      }
    }

    if (result.users.length !== DEMO_USERS.length || result.jobs.length !== DEMO_JOBS.length || result.errors.length > 0) {
      throw new Error(`Demo initialization incomplete: ${result.errors.join('; ')}`);
    }

    // 4. Create and set Cookie Session only after the complete sandbox is ready.
    const sessionToken = await createSession({
      user_id: sarah.id,
      email: sarah.email,
      wallet_address: sarah.wallet_address,
    });

    const response = NextResponse.json({
      success: true,
      demo_user: {
        id: sarah.id,
        email: sarah.email,
        wallet_address: sarah.wallet_address,
        display_name: sarah.display_name,
        role: sarah.role
      },
      users_created: result.users.length,
      jobs_created: result.jobs.length,
      errors: result.errors,
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
    console.error('Demo seeding failed:', err);
    return NextResponse.json({
      code: 'DEMO_UNAVAILABLE',
      error: 'Demo is temporarily unavailable because the demo database could not be initialized. Please try again shortly.',
    }, { status: 503 });
  }
}
