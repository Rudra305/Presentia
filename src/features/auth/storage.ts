import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { AUTH_STORAGE_KEY } from './constants';

/**
 * SecureStore isn't available on web (Metro serves the app as a static
 * bundle in the preview iframe). We fall back to localStorage there so
 * the same code path works — obviously not secure on web, only used for
 * the dev preview / storybook-like walkthrough.
 */

const webStore = {
    async getItem(key: string): Promise<string | null> {
        if (typeof globalThis.localStorage === 'undefined') return null;
        return globalThis.localStorage.getItem(key);
    },
    async setItem(key: string, value: string): Promise<void> {
        globalThis.localStorage?.setItem(key, value);
    },
    async removeItem(key: string): Promise<void> {
        globalThis.localStorage?.removeItem(key);
    },
};

const nativeStore = {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const store = Platform.OS === 'web' ? webStore : nativeStore;

export interface StoredAuthRecord {
    role: 'principal' | 'teacher';
    userId: string;
    fullName: string;
    pinSalt: string;
    pinHash: string;
    biometricEnabled: boolean;
    sessionToken: string;
    sessionIssuedAt: number;
    lastActiveAt: number;
    hardExpiresAt: number;
    failedPinCount: number;
    lockoutUntil: number | null;
    lockoutStreak: number;
    signedOutAt?: number | null;
}

export async function readAuth(): Promise<StoredAuthRecord | null> {
    const raw = await store.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as StoredAuthRecord;
    } catch {
        return null;
    }
}

export async function writeAuth(record: StoredAuthRecord): Promise<void> {
    await store.setItem(AUTH_STORAGE_KEY, JSON.stringify(record));
}

export async function clearAuth(): Promise<void> {
    await store.removeItem(AUTH_STORAGE_KEY);
}
