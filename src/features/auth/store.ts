import { create } from 'zustand';

/**
 * Placeholder auth store.
 *
 * Real biometric + PIN authentication lands in Milestone 4 and persistence
 * (SecureStore) lands in Milestone 3 (Storage). Until then, this store keeps
 * auth state in-memory and exposes an API surface that later milestones can
 * swap for the real implementation without breaking navigation guards.
 */

export type Role = 'principal' | 'teacher';

export type AuthState = {
  /** True once the store has finished any async hydration. */
  isReady: boolean;
  /** True when a user session is active. */
  isAuthenticated: boolean;
  /** Active role — undefined when unauthenticated. */
  role: Role | undefined;

  /** Simulates async storage read on cold start. */
  hydrate: () => void;
  /** Placeholder sign-in — Milestone 4 replaces with biometric flow. */
  signIn: (role: Role) => void;
  /** Placeholder sign-out. */
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isReady: false,
  isAuthenticated: false,
  role: undefined,

  hydrate: () => {
    // Simulate a fast async read; real hydration wires SecureStore + SQLite.
    setTimeout(() => set({ isReady: true }), 0);
  },

  signIn: (role) => set({ isAuthenticated: true, role }),

  signOut: () => set({ isAuthenticated: false, role: undefined }),
}));

/**
 * Convenience selector hook. Exposed so screens/layouts don't reach into
 * store internals; feature code should always call `useAuth()`.
 */
export function useAuth() {
  return useAuthStore((s) => ({
    isReady: s.isReady,
    isAuthenticated: s.isAuthenticated,
    role: s.role,
    signIn: s.signIn,
    signOut: s.signOut,
  }));
}
