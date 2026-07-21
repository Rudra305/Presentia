import { create } from 'zustand';

import {
  acceptBiometricUnlock,
  bootstrapSession,
  enroll as apiEnroll,
  isEnrolled as apiIsEnrolled,
  refreshActivity,
  signOut as apiSignOut,
  unlockWithPin as apiUnlockWithPin,
  type EnrollInput,
  type Session,
  type UnlockErr,
  type UnlockOk,
} from './api';

export type Role = 'principal' | 'teacher';

export type AuthStatus = 'idle' | 'ready' | 'authenticated';

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  enrolled: boolean;

  hydrate: () => Promise<void>;
  enroll: (input: EnrollInput) => Promise<Session>;
  unlockWithPin: (pin: string) => Promise<UnlockOk | UnlockErr>;
  unlockWithBiometric: () => Promise<UnlockOk | UnlockErr>;
  refreshActivity: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  session: null,
  enrolled: false,

  hydrate: async () => {
    const [enrolled, session] = await Promise.all([apiIsEnrolled(), bootstrapSession()]);
    set({ status: 'ready', enrolled, session });
    if (session) set({ status: 'authenticated' });
  },

  enroll: async (input) => {
    const session = await apiEnroll(input);
    set({ enrolled: true, session, status: 'authenticated' });
    return session;
  },

  unlockWithPin: async (pin) => {
    const result = await apiUnlockWithPin(pin);
    if (result.ok) set({ session: result.session, status: 'authenticated' });
    return result;
  },

  unlockWithBiometric: async () => {
    const result = await acceptBiometricUnlock();
    if (result.ok) set({ session: result.session, status: 'authenticated' });
    return result;
  },

  refreshActivity: async () => {
    await refreshActivity();
  },

  signOut: async () => {
    await apiSignOut();
    set({ session: null, status: 'ready', enrolled: false });
  },
}));

/**
 * Selector façade used by screens/layouts. Guards read from here — never
 * from `useAuthStore` directly — so refactoring the store shape is
 * contained.
 */
export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const enrolled = useAuthStore((s) => s.enrolled);
  return {
    isReady: status !== 'idle',
    isAuthenticated: status === 'authenticated',
    enrolled,
    session,
    role: session?.role,
  };
}
