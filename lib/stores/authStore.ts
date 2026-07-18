import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  email: string;
  wallet_address: string;
  display_name: string | null;
  role: 'client' | 'freelancer' | 'both';
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
          console.error('Failed to log out on server:', e);
        }
        set({ user: null });
        window.location.href = '/';
      },
    }),
    { name: 'freelanceguard-auth' }
  )
);
