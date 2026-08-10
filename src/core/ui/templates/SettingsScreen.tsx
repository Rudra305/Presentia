import React from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Constants from 'expo-constants';

import { useTranslation } from '@/core/i18n';
import { Button, Card, Icon, Text, useTheme } from '@/core/ui';
import type { ThemeMode } from '@/core/ui/theme';
import { useAuth, useAuthStore } from '@/features/auth';
import { SyncStatusBadge } from '@/features/reports/SyncStatusBadge';

export function SettingsScreen() {
    const { session, role } = useAuth();
    const signOut = useAuthStore((s) => s.signOut);
    const { mode, setMode } = useTheme();
    const { lang, setLang, t } = useTranslation();

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to log out of your account?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: () => {
                    void signOut();
                },
            },
        ]);
    };

    const themeOptions: { label: string; value: ThemeMode; icon: 'sun' | 'moon' | 'monitor' }[] = [
        { label: 'Light', value: 'light', icon: 'sun' },
        { label: 'Dark', value: 'dark', icon: 'moon' },
        { label: 'System', value: 'system', icon: 'monitor' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-bg" edges={['left', 'right', 'bottom']}>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
                {/* Profile Header Card */}
                <Card className="p-5 flex-row items-center space-x-4">
                    <View className="h-14 w-14 rounded-full bg-primary/10 items-center justify-center border border-primary/20 mr-3">
                        <Text className="text-xl font-bold text-primary">
                            {session?.fullName ? session.fullName.charAt(0).toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <View className="flex-1">
                        <Text variant="h3">{session?.fullName ?? 'Authenticated User'}</Text>
                        <View className="flex-row items-center mt-1 space-x-2">
                            <View className="bg-primary/10 px-2.5 py-0.5 rounded-full">
                                <Text className="text-xs font-semibold text-primary capitalize">
                                    {role ?? 'Staff'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Theme Preferences */}
                <View className="gap-3">
                    <Text variant="h3">Appearance</Text>
                    <Card className="p-4 gap-3">
                        <Text variant="caption" tone="muted">
                            Choose your preferred color theme:
                        </Text>
                        <View className="flex-row gap-2">
                            {themeOptions.map((opt) => {
                                const isSelected = mode === opt.value;
                                return (
                                    <Pressable
                                        key={opt.value}
                                        onPress={() => setMode(opt.value)}
                                        className={`flex-1 py-3 px-2 rounded-xl border items-center justify-center flex-row gap-1.5 ${
                                            isSelected
                                                ? 'bg-primary border-primary'
                                                : 'bg-bg-elevated border-border'
                                        }`}
                                    >
                                        <Icon
                                            name={opt.icon}
                                            size={16}
                                            color={isSelected ? '#ffffff' : undefined}
                                            tone={isSelected ? undefined : 'fgMuted'}
                                        />
                                        <Text
                                            className={`text-xs font-semibold ${
                                                isSelected ? 'text-white' : 'text-fg'
                                            }`}
                                        >
                                            {opt.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </Card>
                </View>

                {/* Language Selection */}
                <View className="gap-3">
                    <Text variant="h3">{t('settings.language')}</Text>
                    <Card className="p-4 gap-3">
                        <Text variant="caption" tone="muted">
                            {t('settings.chooseLanguage')}
                        </Text>
                        <View className="flex-row gap-2">
                            {(
                                [
                                    { label: 'English', value: 'en' },
                                    { label: 'हिंदी', value: 'hi' },
                                    { label: 'Español', value: 'es' },
                                ] as const
                            ).map((opt) => {
                                const isSelected = lang === opt.value;
                                return (
                                    <Pressable
                                        key={opt.value}
                                        onPress={() => setLang(opt.value)}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: isSelected }}
                                        accessibilityLabel={`Set language to ${opt.label}`}
                                        className={`flex-1 py-3 px-2 rounded-xl border items-center justify-center ${
                                            isSelected
                                                ? 'bg-primary border-primary'
                                                : 'bg-bg-elevated border-border'
                                        }`}
                                    >
                                        <Text
                                            className={`text-xs font-semibold ${
                                                isSelected ? 'text-white' : 'text-fg'
                                            }`}
                                        >
                                            {opt.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </Card>
                </View>

                {/* Sync & Data Engine */}
                <View className="gap-3">
                    <Text variant="h3">{t('settings.syncEngine')}</Text>
                    <Card className="p-4 gap-3">
                        <View className="flex-row items-center justify-between">
                            <View className="gap-0.5 flex-1 pr-2">
                                <Text variant="bodySm" className="font-semibold">
                                    {t('settings.offlineSyncQueue')}
                                </Text>
                                <Text variant="caption" tone="muted">
                                    Queues local changes and reconciles deltas automatically.
                                </Text>
                            </View>
                            <SyncStatusBadge />
                        </View>
                    </Card>
                </View>

                {/* System & Storage Info */}
                <View className="gap-3">
                    <Text variant="h3">System Info</Text>
                    <Card className="p-4 gap-2">
                        <View className="flex-row justify-between py-1.5 border-b border-border">
                            <Text variant="caption" tone="muted">
                                App Version
                            </Text>
                            <Text variant="caption">
                                Presentia {Constants.expoConfig?.version ?? '1.0.0'} (Build{' '}
                                {Constants.expoConfig?.android?.versionCode ?? 1})
                            </Text>
                        </View>
                        <View className="flex-row justify-between py-1.5 border-b border-border">
                            <Text variant="caption" tone="muted">
                                Storage Engine
                            </Text>
                            <Text variant="caption">Offline SQLite + MMKV</Text>
                        </View>
                        <View className="flex-row justify-between py-1.5">
                            <Text variant="caption" tone="muted">
                                Auth Status
                            </Text>
                            <Text variant="caption" tone="success">
                                Enrolled & Session Active
                            </Text>
                        </View>
                    </Card>
                </View>

                {/* Account Actions / Logout */}
                <View className="mt-4 gap-3">
                    <Button
                        variant="danger"
                        label="Sign Out"
                        leftIcon="log-out"
                        onPress={handleSignOut}
                        testID="settings-signout-btn"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
