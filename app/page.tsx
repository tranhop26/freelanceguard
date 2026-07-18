'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { useAuthStore } from '@/lib/stores/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, Shield, Zap, DollarSign, Scale, Globe, Lock, CheckCircle2, 
  HelpCircle, Star, AlertCircle, Sparkles, Building2, UserCheck, Mail
} from 'lucide-react';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  );
}

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);

  // If redirected with auth=required, open auth modal
  useEffect(() => {
    if (searchParams.get('auth') === 'required') {
      setAuthOpen(true);
    }
  }, [searchParams]);

  // If already logged in, show CTA to go to dashboard
  const handlePrimaryCta = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      setAuthOpen(true);
    }
  };

  const handleDemoMode = async () => {
    toast.loading('Setting up demo sandbox...', { id: 'demo' });
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Seeding failed');
      const data = await res.json();
      if (data.success) {
        toast.success(`Demo ready! Logged in as ${data.demo_user.display_name}`, { id: 'demo' });
        router.push('/dashboard?demo=true');
      } else {
        throw new Error(data.error || 'Failed to setup demo');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to setup demo', { id: 'demo' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* 1. Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Now live on Arc Testnet</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Get paid in minutes, <br />
                <span className="text-blue-700">not weeks</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0">
                AI-powered USDC escrow for global freelancers and clients, built on Arc.
                Enjoy <strong>2% fees</strong> (vs. 15-20% on Upwork) and sub-3-second transaction settlement.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Button 
                  onClick={handlePrimaryCta}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-8 rounded-lg text-base shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {user ? 'Go to Dashboard' : 'Sign up as Freelancer'}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button 
                  onClick={handleDemoMode}
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold py-3 px-8 rounded-lg text-base shadow-sm"
                >
                  Try Demo Mode
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                No crypto experience or seed phrases needed. Sign up with email in 10 seconds.
              </p>
            </div>

            {/* Right Col (Graphic) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md p-6 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <span className="font-bold text-sm text-slate-300">FreelanceGuard Escrow</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                    Escrow Locked
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase block font-semibold">Contract Address</span>
                    <span className="text-xs text-slate-300 font-mono">0xE0a2BDd5b0b0E75a...FE7a3D9803</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500 uppercase block font-semibold">Client</span>
                      <span className="text-sm font-semibold">Global Client</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 uppercase block font-semibold">Freelancer</span>
                      <span className="text-sm font-semibold">VN Freelancer</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-500 block uppercase font-semibold">Amount Escrowed</span>
                      <span className="text-2xl font-extrabold text-emerald-400">$1,200.00 USDC</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block uppercase font-semibold">Gas Fee Sponsors</span>
                      <span className="text-xs text-blue-400 font-medium">Circle Paymaster</span>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg flex items-start gap-2.5">
                    <Scale className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-orange-400 block">AI Judge Arbitration</span>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Arbitration is pre-authorized. Disputes are automatically resolved by our AI Judge Agent using verifiable proof.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats Bar */}
      <section className="bg-slate-100 py-6 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="py-2 lg:py-0">
              <span className="text-2xl font-extrabold text-slate-900 block">⚡ Sub-3-Sec</span>
              <span className="text-xs text-slate-500 font-semibold uppercase">Escrow Settlement</span>
            </div>
            <div className="py-2 lg:py-0 pt-4 lg:pt-0">
              <span className="text-2xl font-extrabold text-slate-900 block">💰 2.0% Fee</span>
              <span className="text-xs text-slate-500 font-semibold uppercase">vs. 15%+ on Upwork</span>
            </div>
            <div className="py-2 lg:py-0 pt-4 lg:pt-0">
              <span className="text-2xl font-extrabold text-slate-900 block">🔥 $0 Gas</span>
              <span className="text-xs text-slate-500 font-semibold uppercase">Sponsored for Users</span>
            </div>
            <div className="py-2 lg:py-0 pt-4 lg:pt-0">
              <span className="text-2xl font-extrabold text-slate-900 block">🛡️ AI Judge</span>
              <span className="text-xs text-slate-500 font-semibold uppercase">Decentralized Arbitration</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Problem Section */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Freelancers lose money and time
            </h2>
            <p className="text-lg text-slate-600">
              Traditional cross-border freelance platforms charge exorbitant fees and hold your hard-earned money hostage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">15% - 20% Cut</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upwork and Fiverr take a massive chunk of your earnings, cutting deep into freelancer profit margins.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">2 - 4 Weeks Delay</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Withdrawing funds to international banks takes weeks and incurs hefty exchange spreads and wire transfer fees.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Locked Reputation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your history is locked inside the platform. If you leave, you lose all your ratings, reviews, and client trust history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section className="py-16 lg:py-24 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Seamless Escrow Flow
            </h2>
            <p className="text-lg text-slate-600">
              Security is guaranteed. Funds remain locked in smart contracts until both parties agree or the AI Judge rules.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-lg text-blue-700">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900">Post &amp; Apply</h3>
              <p className="text-sm text-slate-600 max-w-xs">
                Clients post jobs and freelancers submit applications detailing their proposed terms and budget.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-lg text-blue-700">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900">Accept &amp; Lock</h3>
              <p className="text-sm text-slate-600 max-w-xs">
                Upon accepting an application, the client approves and locks the budget in the on-chain JobEscrow contract.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-lg text-blue-700">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900">Deliver &amp; Release</h3>
              <p className="text-sm text-slate-600 max-w-xs">
                The freelancer submits work deliverables. The client approves to automatically release the escrowed USDC.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Grid */}
      <section className="py-16 lg:py-24 bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Engineered for the Agentic Economy
            </h2>
            <p className="text-lg text-slate-600">
              Modern architecture combining zero-friction onboarding with blockchain security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-8 w-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Email Sign-up</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Social and email logins powered by Circle App Kit automatically generate smart accounts behind the scenes.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-8 w-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">AI Judge Agent</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No long legal processes. Verifiable job success criteria are parsed by our AI Judge to resolve disputes in minutes.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-8 w-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">On-Chain Reputation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reputation metadata is saved in ERC-8004 registries on-chain, creating a portable profile independent of platform locks.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-8 w-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Gasless UX</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Circle Paymaster API sponsors contract deployment and interaction fees, eliminating gas token onboarding.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-8 w-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Global Accessibility</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Send payouts worldwide instantly via USDC stablecoins, bypassing costly regional wire limitations.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-8 w-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Sub-second Finality</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Powered by Arc Network, transactions complete in milliseconds with immediate cryptographic finality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Demo Mode CTA Card */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-2xl p-8 md:p-12 border border-slate-800 relative overflow-hidden shadow-xl text-center space-y-6">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Shield className="h-64 w-64" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Developer Demo Mode Active</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Try FreelanceGuard in Sandbox
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
              Explore the entire client-freelancer dashboard lifecycle on the Arc Testnet. 
              No wallet setup or test tokens required. Auth with email mock.
            </p>
            <div>
              <Button
                onClick={handleDemoMode}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-base shadow-md transition-all inline-flex items-center gap-2"
              >
                Launch App Demo
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Built On Section */}
      <section className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Built On Core Ecosystems</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:opacity-85 transition-opacity">
            <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
              <Shield className="h-5 w-5 text-blue-700" />
              <span>ARC NETWORK</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
              <UserCheck className="h-5 w-5 text-blue-700" />
              <span>CIRCLE PLATFORM</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
              <span>OPENAI GPT</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
              <span>NEXT.JS + TAILWIND</span>
            </div>
          </div>
        </div>
      </section>

      <EmailAuth open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
