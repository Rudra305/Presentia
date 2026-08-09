import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/core/ui/atoms/Icon';
import { Text } from '@/core/ui/atoms/Text';
import { Card } from '@/core/ui/molecules/Card';
import { useAuth } from '@/features/auth';
import {
    getReportsRepo,
    StatCard,
    TrendChart,
    ClassReportCard,
    type AttendanceOverviewStats,
    type ClassAttendanceSummary,
    type StudentAttendanceSummary,
    type WeeklyTrendPoint,
} from '@/features/reports';

type DateFilterMode = 'all' | 'week' | 'month';

export default function PrincipalReportsScreen() {
    const { session } = useAuth();
    const tenantId = 'tenant_default';

    const [filterMode, setFilterMode] = useState<DateFilterMode>('all');
    const [refreshing, setRefreshing] = useState(false);

    const [stats, setStats] = useState<AttendanceOverviewStats | null>(null);
    const [classSummaries, setClassSummaries] = useState<ClassAttendanceSummary[]>([]);
    const [studentSummaries, setStudentSummaries] = useState<StudentAttendanceSummary[]>([]);
    const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendPoint[]>([]);

    const loadData = async () => {
        try {
            const repo = await getReportsRepo();

            let startDate: string | undefined;
            if (filterMode === 'week') {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                startDate = d.toISOString().split('T')[0];
            } else if (filterMode === 'month') {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                startDate = d.toISOString().split('T')[0];
            }

            const filter = { startDate };

            const [overviewData, classesData, studentsData, trendData] = await Promise.all([
                repo.getOverviewStats(tenantId, filter),
                repo.getClassSummaries(tenantId, filter),
                repo.getStudentSummaries(tenantId, undefined, filter),
                repo.getWeeklyTrend(tenantId),
            ]);

            setStats(overviewData);
            setClassSummaries(classesData);
            setStudentSummaries(studentsData);
            setWeeklyTrend(trendData);
        } catch (err) {
            console.error('Error loading reports:', err);
        }
    };

    useEffect(() => {
        void loadData();
    }, [tenantId, filterMode]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const lowAttendanceStudents = studentSummaries.filter((s) => s.isLowAttendance);

    return (
        <SafeAreaView
            className="flex-1 bg-bg"
            edges={['left', 'right', 'bottom']}
            testID="principal-reports"
        >
            <ScrollView
                contentContainerStyle={{ padding: 20, gap: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Subtitle / Context Header */}
                <View className="gap-1">
                    <Text variant="caption" tone="muted">
                        Reports & Analytics
                    </Text>
                    <Text variant="h1">{session?.fullName ?? 'Principal'}</Text>
                </View>

                {/* Date Filter Pills */}
                <View className="flex-row gap-2">
                    {(['all', 'week', 'month'] as DateFilterMode[]).map((mode) => {
                        const active = filterMode === mode;
                        const label =
                            mode === 'all'
                                ? 'All Time'
                                : mode === 'week'
                                  ? 'Past 7 Days'
                                  : 'Past 30 Days';
                        return (
                            <Pressable
                                key={mode}
                                onPress={() => setFilterMode(mode)}
                                className={`px-3.5 py-1.5 rounded-full border ${
                                    active
                                        ? 'bg-primary border-primary'
                                        : 'bg-bg-elevated border-border'
                                }`}
                            >
                                <Text
                                    variant="caption"
                                    tone={active ? 'inverse' : 'muted'}
                                    className="font-semibold"
                                >
                                    {label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* 2x2 Overview Stat Cards Grid */}
                <View className="flex-row flex-wrap gap-3" testID="reports-overview">
                    <StatCard
                        label="Attendance %"
                        value={stats?.overallAttendancePercentage}
                        suffix="%"
                        subtitle="Overall average"
                        icon="pie-chart"
                        variant="primary"
                        className="w-[48%]"
                        testID="stat-attendance-rate"
                    />
                    <StatCard
                        label="Total Sessions"
                        value={stats?.totalSessions}
                        subtitle="Completed classes"
                        icon="calendar"
                        variant="neutral"
                        className="w-[48%]"
                        testID="stat-total-sessions"
                    />
                    <StatCard
                        label="Present Marks"
                        value={stats?.totalPresent}
                        subtitle="Students present"
                        icon="check-circle"
                        variant="success"
                        className="w-[48%]"
                        testID="stat-total-present"
                    />
                    <StatCard
                        label="Absent Marks"
                        value={stats?.totalAbsent}
                        subtitle="Students absent"
                        icon="x-circle"
                        variant="danger"
                        className="w-[48%]"
                        testID="stat-total-absent"
                    />
                </View>

                {/* Weekly Trend Chart */}
                <TrendChart data={weeklyTrend} testID="trend-chart" />

                {/* Class Summaries Section */}
                <View className="gap-3">
                    <Text variant="h3">Class Performance ({classSummaries.length})</Text>

                    {classSummaries.length === 0 ? (
                        <Card padding="lg" className="items-center justify-center">
                            <Text variant="body" tone="muted">
                                No class attendance recorded yet.
                            </Text>
                        </Card>
                    ) : (
                        classSummaries.map((summary) => (
                            <ClassReportCard key={summary.classId} summary={summary} />
                        ))
                    )}
                </View>

                {/* Low Attendance At-Risk Students (< 75%) */}
                {lowAttendanceStudents.length > 0 ? (
                    <Card className="bg-danger/10 border-danger/30 gap-3" padding="md">
                        <View className="flex-row items-center gap-2">
                            <Icon name="alert-triangle" size={18} tone="danger" />
                            <Text variant="h3" tone="danger" className="font-bold">
                                At-Risk Students (&lt; 75% Attendance)
                            </Text>
                        </View>

                        <View className="gap-2">
                            {lowAttendanceStudents.map((st) => (
                                <View
                                    key={st.studentId}
                                    className="flex-row justify-between items-center py-2 border-b border-danger/20 last:border-b-0"
                                >
                                    <View className="gap-0.5 flex-1 mr-2">
                                        <Text
                                            variant="body"
                                            tone="danger"
                                            className="font-semibold"
                                        >
                                            {st.fullName} (Roll #{st.rollNo})
                                        </Text>
                                        <Text variant="caption" tone="muted">
                                            Class: {st.className}
                                        </Text>
                                    </View>

                                    <View className="px-2.5 py-1 rounded-full bg-danger/20">
                                        <Text variant="caption" tone="danger" className="font-bold">
                                            {st.attendancePercentage}%
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </Card>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
