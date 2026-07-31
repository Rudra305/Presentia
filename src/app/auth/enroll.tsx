import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/core/ui/atoms/Button';
import { Icon } from '@/core/ui/atoms/Icon';
import { Input } from '@/core/ui/atoms/Input';
import { Text } from '@/core/ui/atoms/Text';
import { Card } from '@/core/ui/molecules/Card';
import { checkBiometricAvailability } from '@/features/auth/biometric';
import { PIN_LENGTH } from '@/features/auth/constants';
import { useAuthStore } from '@/features/auth';

type Step = 'role' | 'name' | 'pin' | 'biometric';

export default function EnrollScreen() {
    const enroll = useAuthStore((s) => s.enroll);

    const [step, setStep] = useState<Step>('role');
    const [role, setRole] = useState<'principal' | 'teacher' | null>(null);
    const [fullName, setFullName] = useState('');
    const [pin, setPin] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);
    const [nameError, setNameError] = useState<string | null>(null);
    const [bioAvailable, setBioAvailable] = useState(false);
    const [enrollBio, setEnrollBio] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        checkBiometricAvailability().then((r) => setBioAvailable(r.available));
    }, []);

    const goNext = () => {
        if (step === 'role') setStep('name');
        else if (step === 'name') {
            if (fullName.trim().length < 2) {
                setNameError('Please enter your full name.');
                return;
            }
            setNameError(null);
            setStep('pin');
        } else if (step === 'pin') {
            if (pin.length !== PIN_LENGTH || !/^\d+$/.test(pin)) {
                setPinError(`PIN must be ${PIN_LENGTH} digits.`);
                return;
            }
            if (pin !== pinConfirm) {
                setPinError('PINs do not match.');
                return;
            }
            if (/^(\d)\1{5}$/.test(pin) || pin === '123456' || pin === '000000') {
                setPinError('Please choose a less obvious PIN.');
                return;
            }
            setPinError(null);
            setStep('biometric');
        }
    };

    const finish = async () => {
        if (!role) return;
        setSubmitting(true);
        try {
            await enroll({ role, fullName: fullName.trim(), pin, biometricEnabled: enrollBio });
            router.replace('/');
        } catch (err) {
            Alert.alert('Enrollment failed', err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-bg" testID="enroll-screen">
            <View className="flex-1 justify-center px-6 gap-6">
                <View className="items-center gap-2">
                    <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                        <Icon name="user-plus" size={32} tone="primary" />
                    </View>
                    <Text variant="h1" testID="enroll-title">
                        Welcome
                    </Text>
                    <Text variant="body" tone="muted" className="text-center">
                        Set up your account to start using Attendance.
                    </Text>
                </View>

                {step === 'role' ? (
                    <View className="gap-3" testID="enroll-role-step">
                        <Text variant="label" tone="muted">
                            I am a…
                        </Text>
                        <RoleCard
                            icon="shield"
                            label="Principal"
                            hint="Manage teachers, classes, and reports"
                            selected={role === 'principal'}
                            onPress={() => setRole('principal')}
                            testID="enroll-role-principal"
                        />
                        <RoleCard
                            icon="book-open"
                            label="Teacher"
                            hint="Take attendance for your classes"
                            selected={role === 'teacher'}
                            onPress={() => setRole('teacher')}
                            testID="enroll-role-teacher"
                        />
                        <Button
                            label="Continue"
                            rightIcon="arrow-right"
                            fullWidth
                            disabled={!role}
                            onPress={goNext}
                            testID="enroll-role-continue"
                        />
                    </View>
                ) : null}

                {step === 'name' ? (
                    <View className="gap-3" testID="enroll-name-step">
                        <Input
                            label="Full name"
                            placeholder="e.g. Ada Okafor"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                            errorText={nameError ?? undefined}
                            testID="enroll-name-input"
                        />
                        <Button
                            label="Continue"
                            rightIcon="arrow-right"
                            fullWidth
                            onPress={goNext}
                            testID="enroll-name-continue"
                        />
                    </View>
                ) : null}

                {step === 'pin' ? (
                    <View className="gap-3" testID="enroll-pin-step">
                        <Input
                            label="Set a 6-digit PIN"
                            placeholder="••••••"
                            value={pin}
                            onChangeText={setPin}
                            keyboardType="number-pad"
                            maxLength={PIN_LENGTH}
                            secureTextEntry
                            testID="enroll-pin-input"
                        />
                        <Input
                            label="Confirm PIN"
                            placeholder="••••••"
                            value={pinConfirm}
                            onChangeText={setPinConfirm}
                            keyboardType="number-pad"
                            maxLength={PIN_LENGTH}
                            secureTextEntry
                            errorText={pinError ?? undefined}
                            testID="enroll-pin-confirm"
                        />
                        <Button
                            label="Continue"
                            rightIcon="arrow-right"
                            fullWidth
                            onPress={goNext}
                            testID="enroll-pin-continue"
                        />
                    </View>
                ) : null}

                {step === 'biometric' ? (
                    <View className="gap-3" testID="enroll-biometric-step">
                        <Card padding="lg">
                            <View className="gap-2">
                                <View className="flex-row items-center gap-2">
                                    <Icon name="unlock" size={18} tone="primary" />
                                    <Text variant="h3">Biometric sign-in</Text>
                                </View>
                                <Text variant="bodySm" tone="muted">
                                    {bioAvailable
                                        ? 'Use Face ID / Fingerprint next time you sign in — faster and just as secure.'
                                        : 'Biometrics are unavailable on this device. You will sign in with your PIN.'}
                                </Text>
                            </View>
                        </Card>
                        <View className="flex-row gap-3">
                            <Button
                                label="Skip"
                                variant="secondary"
                                fullWidth
                                onPress={() => {
                                    setEnrollBio(false);
                                    void finish();
                                }}
                                loading={submitting}
                                testID="enroll-biometric-skip"
                            />
                            <Button
                                label="Enable"
                                leftIcon="check"
                                fullWidth
                                disabled={!bioAvailable}
                                loading={submitting}
                                onPress={() => {
                                    setEnrollBio(true);
                                    void finish();
                                }}
                                testID="enroll-biometric-enable"
                            />
                        </View>
                    </View>
                ) : null}
            </View>
        </SafeAreaView>
    );
}

function RoleCard({
    icon,
    label,
    hint,
    selected,
    onPress,
    testID,
}: {
    icon: 'shield' | 'book-open';
    label: string;
    hint: string;
    selected: boolean;
    onPress: () => void;
    testID: string;
}) {
    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={onPress}
            className={`flex-row items-center gap-3 rounded-lg border px-4 py-3 ${
                selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
            }`}
            testID={testID}
        >
            <Icon name={icon} size={22} tone={selected ? 'primary' : 'fgMuted'} />
            <View className="flex-1">
                <Text variant="label">{label}</Text>
                <Text variant="caption" tone="muted">
                    {hint}
                </Text>
            </View>
            <Icon
                name={selected ? 'check-circle' : 'circle'}
                size={20}
                tone={selected ? 'primary' : 'fgSubtle'}
            />
        </Pressable>
    );
}
