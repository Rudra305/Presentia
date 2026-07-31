import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/**
 * Thin wrapper around expo-local-authentication so the rest of the app
 * doesn't touch the vendor API directly. Also returns `available: false`
 * uniformly on web — where the module has no-op stubs — so the UI can
 * skip straight to the PIN entry.
 */

export type BiometricAvailability = {
    available: boolean;
    reason?: 'no_hardware' | 'not_enrolled' | 'unsupported_platform';
};

export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
    if (Platform.OS === 'web') return { available: false, reason: 'unsupported_platform' };
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return { available: false, reason: 'no_hardware' };
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return { available: false, reason: 'not_enrolled' };
    return { available: true };
}

export type BiometricResult =
    | { success: true }
    | { success: false; reason: 'cancelled' | 'lockout' | 'unavailable' | 'unknown' };

export async function promptBiometric(
    promptMessage = 'Unlock Attendance',
): Promise<BiometricResult> {
    const avail = await checkBiometricAvailability();
    if (!avail.available) return { success: false, reason: 'unavailable' };

    const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        disableDeviceFallback: true, // we own the PIN fallback in-app
        cancelLabel: 'Use PIN',
    });

    if (result.success) return { success: true };
    const err = result.error ?? '';
    if (err === 'user_cancel' || err === 'system_cancel' || err === 'app_cancel') {
        return { success: false, reason: 'cancelled' };
    }
    if (err === 'lockout' || err.startsWith('lockout'))
        return { success: false, reason: 'lockout' };
    if (err === 'not_enrolled' || err === 'not_available' || err === 'passcode_not_set') {
        return { success: false, reason: 'unavailable' };
    }
    return { success: false, reason: 'unknown' };
}
