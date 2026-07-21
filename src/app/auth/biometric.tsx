import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/core/ui/atoms/Button';
import { Icon } from '@/core/ui/atoms/Icon';
import { Text } from '@/core/ui/atoms/Text';
import { promptBiometric, checkBiometricAvailability } from '@/features/auth/biometric';
import { useAuthStore } from '@/features/auth';

export default function BiometricScreen() {
  const unlockWithBiometric = useAuthStore((s) => s.unlockWithBiometric);
  const [state, setState] = useState<'checking' | 'ready' | 'prompting' | 'unavailable' | 'error'>(
    'checking',
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const avail = await checkBiometricAvailability();
      if (cancelled) return;
      if (!avail.available) {
        router.replace('/auth/pin');
        return;
      }
      setState('ready');
      // Auto-prompt once on mount.
      void handlePrompt();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrompt = async () => {
    setState('prompting');
    setMessage(null);
    const result = await promptBiometric('Unlock Attendance');
    if (result.success) {
      const unlock = await unlockWithBiometric();
      if (unlock.ok) return; // navigator effect will redirect via boot
      setMessage('Session could not be resumed. Please sign in with your PIN.');
      router.replace('/auth/pin');
      return;
    }
    if (result.reason === 'cancelled') {
      setState('ready');
      setMessage('Prompt cancelled.');
      return;
    }
    if (result.reason === 'lockout') {
      setState('unavailable');
      setMessage('Biometrics locked. Use your PIN.');
      router.replace('/auth/pin');
      return;
    }
    setState('error');
    setMessage('Biometric authentication failed. Try again or use your PIN.');
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" testID="auth-biometric">
      <View className="flex-1 items-center justify-center px-6 gap-6">
        <View className="h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
          <Icon name="unlock" size={48} tone="primary" />
        </View>
        <Text variant="h1">Welcome back</Text>
        <Text variant="body" tone="muted" className="text-center">
          {message ?? 'Use Face ID / Fingerprint to unlock.'}
        </Text>
        <View className="flex-row gap-3 self-stretch">
          <Button
            label="Use PIN"
            variant="secondary"
            fullWidth
            onPress={() => router.replace('/auth/pin')}
            testID="auth-biometric-use-pin"
          />
          <Button
            label="Try again"
            leftIcon="unlock"
            fullWidth
            loading={state === 'prompting' || state === 'checking'}
            onPress={handlePrompt}
            testID="auth-biometric-retry"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
