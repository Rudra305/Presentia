import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/core/ui/atoms/Button';
import { Icon } from '@/core/ui/atoms/Icon';
import { Input } from '@/core/ui/atoms/Input';
import { Text } from '@/core/ui/atoms/Text';
import { PIN_LENGTH } from '@/features/auth/constants';
import { useAuthStore } from '@/features/auth';

export default function PinScreen() {
    const unlockWithPin = useAuthStore((s) => s.unlockWithPin);
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        setError(null);
        if (pin.length !== PIN_LENGTH) {
            setError(`PIN must be ${PIN_LENGTH} digits.`);
            return;
        }
        setBusy(true);
        const result = await unlockWithPin(pin);
        setBusy(false);
        if (result.ok) return; // guarded route will redirect

        if (result.reason === 'no_account') {
            router.replace('/auth/enroll');
            return;
        }
        if (result.reason === 'locked') {
            router.replace({
                pathname: '/auth/locked',
                params: { until: String(result.unlockAt) },
            });
            return;
        }
        if (result.reason === 'bad_pin') {
            setError(`Wrong PIN. ${result.remaining} attempts remaining.`);
            setPin('');
            return;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-bg" testID="auth-pin">
            <View className="flex-1 items-center justify-center px-6 gap-6">
                <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
                    <Icon name="hash" size={40} tone="primary" />
                </View>
                <Text variant="h1">Enter your PIN</Text>
                <View className="self-stretch">
                    <Input
                        label={`${PIN_LENGTH}-digit PIN`}
                        placeholder="••••••"
                        value={pin}
                        onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, PIN_LENGTH))}
                        keyboardType="number-pad"
                        maxLength={PIN_LENGTH}
                        secureTextEntry
                        errorText={error ?? undefined}
                        testID="auth-pin-input"
                    />
                </View>
                <Button
                    label="Unlock"
                    leftIcon="unlock"
                    fullWidth
                    loading={busy}
                    onPress={submit}
                    testID="auth-pin-submit"
                />
            </View>
        </SafeAreaView>
    );
}
