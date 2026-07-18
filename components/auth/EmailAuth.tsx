'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, Shield, Key, ArrowRight } from 'lucide-react';
import { circleClient } from '@/lib/circle';
import { useAuthStore } from '@/lib/stores/authStore';

interface EmailAuthProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailAuth({ open, onOpenChange }: EmailAuthProps) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<'client' | 'freelancer' | 'both'>('both');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [circleUserId, setCircleUserId] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await circleClient.signInWithEmail(email);
      if (circleClient.isMockMode()) {
        toast.info('⚠️ Demo Mock Mode: Using simulated OTP flow (use code 123456)');
      } else {
        toast.success('Verification code sent to your email!');
      }
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }
    setLoading(true);
    try {
      const { walletAddress: addr, circleUserId: cId } = await circleClient.verifyOtp(otp);
      setWalletAddress(addr);
      setCircleUserId(cId);

      // Call API to create/fetch user record and set HTTP-only cookie
      const res = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, walletAddress: addr, circleUserId: cId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to establish auth session');
      }

      const userData = await res.json();
      setUserId(userData.user.id);

      if (userData.isNewUser || !userData.user.role || userData.user.role === 'both') {
        // Redirect newly registered or incomplete users to role selection
        setStep(3);
      } else {
        // Complete auth for existing users
        setUser({
          id: userData.user.id,
          email: userData.user.email,
          wallet_address: userData.user.wallet_address,
          display_name: userData.user.display_name,
          role: userData.user.role,
        });
        toast.success(`Logged in as ${userData.user.email}`);
        onOpenChange(false);
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = async () => {
    if (!userId || !walletAddress) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        throw new Error('Failed to save profile role');
      }

      const updatedUser = await res.json();
      setUser({
        id: updatedUser.id,
        email: updatedUser.email,
        wallet_address: updatedUser.wallet_address || walletAddress,
        display_name: updatedUser.display_name,
        role: updatedUser.role,
      });

      toast.success('Registration complete!');
      onOpenChange(false);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to select role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-lg">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-2">
            <Shield className="h-6 w-6 text-blue-700" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-slate-900">
            {step === 1 && 'Secure Email Access'}
            {step === 2 && 'Enter Security Code'}
            {step === 3 && 'Choose Your Role'}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500">
            {step === 1 && 'Sign up or log in instantly with your email address.'}
            {step === 2 && `We've sent a 6-digit confirmation code to ${email}`}
            {step === 3 && 'Select how you want to use FreelanceGuard.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 text-slate-900 border-slate-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 rounded-md transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Code...
                </>
              ) : (
                <>
                  Send OTP Code <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-slate-700">6-Digit Code</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  className="pl-10 text-center tracking-widest text-slate-900 border-slate-200 font-mono text-lg"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 rounded-md transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                'Verify & Authenticate'
              )}
            </Button>
            <div className="text-center">
              <button
                type="button"
                className="text-xs text-blue-700 hover:underline"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Change Email Address
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                className={`flex flex-col items-center justify-center p-4 border rounded-lg text-center transition-all ${
                  role === 'freelancer'
                    ? 'border-blue-700 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setRole('freelancer')}
                disabled={loading}
              >
                <span className="text-2xl mb-1">💻</span>
                <span className="font-semibold text-xs">Freelancer</span>
              </button>
              <button
                type="button"
                className={`flex flex-col items-center justify-center p-4 border rounded-lg text-center transition-all ${
                  role === 'client'
                    ? 'border-blue-700 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setRole('client')}
                disabled={loading}
              >
                <span className="text-2xl mb-1">💼</span>
                <span className="font-semibold text-xs">Client</span>
              </button>
              <button
                type="button"
                className={`flex flex-col items-center justify-center p-4 border rounded-lg text-center transition-all ${
                  role === 'both'
                    ? 'border-blue-700 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setRole('both')}
                disabled={loading}
              >
                <span className="text-2xl mb-1">🤝</span>
                <span className="font-semibold text-xs">Both Roles</span>
              </button>
            </div>
            <Button
              onClick={handleSelectRole}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 rounded-md transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Get Started'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
