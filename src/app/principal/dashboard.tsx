import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDb } from '@/core/storage/sqlite';
import { Button } from '@/core/ui/atoms/Button';
import { Icon, type IconName } from '@/core/ui/atoms/Icon';
import { Text } from '@/core/ui/atoms/Text';
import { Card } from '@/core/ui/molecules/Card';
import { useAuth, useAuthStore } from '@/features/auth';
import { ensureSeedTenant } from '@/features/teachers';

type Stats = {
    teachers: number;
    classes: number;
    students: number;
    todayAttendance: number | null;
};

export default function PrincipalDashboardScreen() {
    const { session } = useAuth();
    const signOut = useAuthStore((s) => s.signOut);
    const [stats, setStats] = useState<Stats | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        const tenantId = await ensureSeedTenant();
        const db = await getDb();
        const [teachers, classes, students] = await Promise.all([
            db.getFirstAsync<{ c: number }>(
                "SELECT COUNT(*) AS c FROM users WHERE tenant_id = ? AND role = 'teacher' AND deleted_at IS NULL",
                [tenantId],
            ),
            db.getFirstAsync<{ c: number }>(
                'SELECT COUNT(*) AS c FROM classes WHERE tenant_id = ? AND deleted_at IS NULL',
                [tenantId],
            ),
            db.getFirstAsync<{ c: number }>(
                'SELECT COUNT(*) AS c FROM students WHERE tenant_id = ? AND deleted_at IS NULL',
                [tenantId],
            ),
        ]);
        setStats({
            teachers: teachers?.c ?? 0,
            classes: classes?.c ?? 0,
            students: students?.c ?? 0,
            todayAttendance: null, // Populated in Milestone 8 (attendance capture).
        });
    }, []);

    useEffect(() => {
        let mounted = true;
        void (async () => {
            if (mounted) {
                await load();
            }
        })();
        return () => {
            mounted = false;
        };
    }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await load();
        } finally {
            setRefreshing(false);
        }
    }, [load]);

    return (
        <SafeAreaView
            className="flex-1 bg-bg"
            edges={['left', 'right', 'bottom']}
            testID="principal-dashboard"
        >
            <ScrollView
                contentContainerStyle={{ padding: 20, gap: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View className="gap-1">
                    <Text variant="caption" tone="muted">
                        Welcome back
                    </Text>
                    <Text variant="h1" testID="dashboard-greeting">
                        {session?.fullName ?? 'Principal'}
                    </Text>
                </View>

                {/* Overview cards — responsive: 2 columns on wider screens via flex-wrap */}
                <View className="flex-row flex-wrap gap-3" testID="dashboard-overview">
                    <StatCard
                        icon="users"
                        label="Teachers"
                        value={stats?.teachers}
                        testID="stat-teachers"
                        onPress={() => router.push('/principal/teachers')}
                    />
                    <StatCard
                        icon="grid"
                        label="Classes"
                        value={stats?.classes}
                        testID="stat-classes"
                        onPress={() => router.push('/principal/classes')}
                    />
                    <StatCard
                        icon="user"
                        label="Students"
                        value={stats?.students}
                        testID="stat-students"
                        onPress={() => router.push('/principal/students')}
                    />
                    <StatCard
                        icon="trending-up"
                        label="Today"
                        value={stats?.todayAttendance}
                        suffix="%"
                        hint="Attendance rate (coming)"
                        testID="stat-today"
                    />
                </View>

                {/* Quick actions */}
                <View className="gap-3">
                    <Text variant="h3">Quick actions</Text>
                    <View className="gap-2">
                        <QuickAction
                            icon="user-plus"
                            label="Add teacher"
                            hint="Invite a new staff member"
                            onPress={() => router.push('/principal/teachers/new')}
                            testID="quick-add-teacher"
                        />
                        <QuickAction
                            icon="plus-square"
                            label="Add class"
                            hint="Create a new class"
                            onPress={() => router.push('/principal/classes/new')}
                            testID="quick-add-class"
                        />
                        <QuickAction
                            icon="users"
                            label="Student Roster & Enrollment"
                            hint="Manage students and face scans"
                            onPress={() => router.push('/principal/students')}
                            testID="quick-student-roster"
                        />
                        <QuickAction
                            icon="camera"
                            label="Take Attendance (My Classes)"
                            hint="Start live face attendance for your assigned classes"
                            onPress={() => router.push('/teacher/sessions')}
                            testID="quick-take-attendance"
                        />
                        <QuickAction
                            icon="bar-chart-2"
                            label="View reports"
                            hint="Attendance trends and insights"
                            onPress={() => router.push('/principal/reports')}
                            testID="quick-view-reports"
                        />
                        <QuickAction
                            icon="settings"
                            label="Settings & Preferences"
                            hint="Theme toggle and account actions"
                            onPress={() => router.push('/principal/settings')}
                            testID="quick-settings"
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function StatCard({
    icon,
    label,
    value,
    suffix = '',
    hint,
    onPress,
    testID,
}: {
    icon: IconName;
    label: string;
    value: number | null | undefined;
    suffix?: string;
    hint?: string;
    onPress?: () => void;
    testID: string;
}) {
    const shared = (
        <View className="gap-2">
            <View className="flex-row items-center justify-between">
                <Text variant="label" tone="muted">
                    {label}
                </Text>
                <Icon name={icon} size={18} tone="primary" />
            </View>
            <Text variant="display" testID={`${testID}-value`}>
                {value == null ? '—' : `${value}${suffix}`}
            </Text>
            {hint ? (
                <Text variant="caption" tone="subtle">
                    {hint}
                </Text>
            ) : null}
        </View>
    );

    const className = 'w-[48%]';

    if (onPress) {
        return (
            <Card pressable onPress={onPress} className={className} testID={testID}>
                {shared}
            </Card>
        );
    }
    return (
        <Card className={className} testID={testID}>
            {shared}
        </Card>
    );
}

function QuickAction({
    icon,
    label,
    hint,
    onPress,
    testID,
}: {
    icon: IconName;
    label: string;
    hint: string;
    onPress: () => void;
    testID: string;
}) {
    return (
        <Card pressable onPress={onPress} padding="md" testID={testID}>
            <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon name={icon} size={20} tone="primary" />
                </View>
                <View className="flex-1">
                    <Text variant="label">{label}</Text>
                    <Text variant="caption" tone="muted">
                        {hint}
                    </Text>
                </View>
                <Icon name="chevron-right" size={18} tone="fgSubtle" />
            </View>
        </Card>
    );
}
