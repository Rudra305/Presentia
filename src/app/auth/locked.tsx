import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/core/ui/atoms/Button';
import { Icon } from '@/core/ui/atoms/Icon';
import { Text } from '@/core/ui/atoms/Text';

export default function LockedScreen() {
  const params = useLocalSearchParams<{ until?: string }>();
  const until = Number(params.until ?? '0');
  const [remaining, setRemaining] = useState<number>(Math.max(0, until - Date.now()));

  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => {
      const r = Math.max(0, until - Date.now());
      setRemaining(r);
      if (r === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [until]);

  const seconds = Math.ceil(remaining / 1000);

  return (
    <SafeAreaView className="flex-1 bg-bg" testID="auth-locked">
      <View className="flex-1 items-center justify-center px-6 gap-4">
        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-danger/10">
          <Icon name="lock" size={40} tone="danger" />
        </View>
        <Text variant="h1">Temporarily locked</Text>
        <Text variant="body" tone="muted" className="text-center">
          {remaining > 0
            ? `Too many failed attempts. Try again in ${seconds}s.`
            : 'You may try again now.'}
        </Text>
        <Button
          label="Back to PIN"
          leftIcon="arrow-left"
          fullWidth
          disabled={remaining > 0}
          onPress={() => router.replace('/auth/pin')}
          testID="auth-locked-back"
        />
      </View>
    </SafeAreaView>
  );
}
