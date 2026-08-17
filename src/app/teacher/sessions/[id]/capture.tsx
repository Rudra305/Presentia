import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, CameraViewfinder, Card, Icon, Loader, Text } from '@/core/ui';
import { getFacePipeline, matchFace, type StudentEmbeddingVector } from '@/core/ml';
import { useAuth } from '@/features/auth';
import type { SessionWithDetails, StudentAttendanceItem } from '@/features/sessions';
import { getSessionRepo } from '@/features/sessions';
import { getStudentRepo } from '@/features/students';

export default function LiveAttendanceCaptureScreen() {
    const router = useRouter();
    const { id: sessionId } = useLocalSearchParams<{ id: string }>();
    const { session: authSession } = useAuth();
    const teacherId = authSession?.userId ?? '';

    const [sessionInfo, setSessionInfo] = useState<SessionWithDetails | null>(null);
    const [attendanceList, setAttendanceList] = useState<StudentAttendanceItem[]>([]);
    const [enrolledVectors, setEnrolledVectors] = useState<StudentEmbeddingVector[]>([]);
    const [loading, setLoading] = useState(true);

    // Capture & Recognition State
    const [isCapturing, setIsCapturing] = useState(false);
    const [mlMode, setMlMode] = useState<'real' | 'stub'>('real');
    const [lastNotification, setLastNotification] = useState<{
        text: string;
        type: 'success' | 'candidate';
        studentId?: string;
    } | null>(null);

    const { detector: faceDetector, embedder: faceEmbedder } = getFacePipeline(mlMode);

    const loadSessionData = useCallback(async () => {
        if (!sessionId) return;
        try {
            setLoading(true);
            const sessionRepo = await getSessionRepo();
            const studentRepo = await getStudentRepo();

            const [info, list] = await Promise.all([
                sessionRepo.getSessionWithDetails(sessionId),
                sessionRepo.listClassAttendance(sessionId),
            ]);

            setSessionInfo(info);
            setAttendanceList(list);

            // Load enrolled face embeddings for all class students
            const vectors: StudentEmbeddingVector[] = [];
            for (const st of list) {
                if (st.hasEmbedding) {
                    const studentEmbs = await studentRepo.getEmbeddingsForStudent(st.studentId);
                    for (const emb of studentEmbs) {
                        vectors.push({
                            studentId: st.studentId,
                            rollNo: st.rollNo,
                            fullName: st.fullName,
                            vector: emb.vector,
                        });
                    }
                }
            }
            setEnrolledVectors(vectors);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to load session capture data.');
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        void loadSessionData();
    }, [loadSessionData]);

    // Frame Capture & Recognition Handler
    const handleFrameCaptured = async (photoUri?: string) => {
        if (isCapturing) return;
        if (enrolledVectors.length === 0) {
            setLastNotification({
                text: '⚠️ No face embeddings enrolled for this class. Please enroll students with face scans first.',
                type: 'candidate',
            });
            return;
        }
        try {
            setIsCapturing(true);

            // 1. Detect & Embed
            const detectedFaces = await faceDetector.detectFaces(photoUri || 'live-frame');
            if (detectedFaces.length === 0) {
                setLastNotification({
                    text: '⚠️ No face detected in camera frame. Position student in circle.',
                    type: 'candidate',
                });
                return;
            }

            // In Dev ML Stub mode, cycle seed through un-marked enrolled students for realistic demo
            let seedHint: string | undefined;
            if (mlMode === 'stub' && enrolledVectors.length > 0) {
                const pendingStudent = attendanceList.find((a) => a.status !== 'present');
                const targetStudentId = pendingStudent?.studentId || enrolledVectors[0]?.studentId;
                const matchVec = enrolledVectors.find((v) => v.studentId === targetStudentId);
                if (matchVec) {
                    seedHint = `${matchVec.rollNo}_sample_1`;
                }
            }

            const embeddingResult = await faceEmbedder.generateEmbedding(
                photoUri || 'live-frame',
                seedHint,
            );
            const matchResult = matchFace(embeddingResult.vector, enrolledVectors, 0.75, 0.60);
            const matchPct = Math.round(matchResult.confidence * 100);

            if (matchResult.status === 'matched' && matchResult.studentId) {
                // High confidence match -> Auto Mark Present
                const sessionRepo = await getSessionRepo();
                await sessionRepo.markAttendance({
                    sessionId: sessionId!,
                    studentId: matchResult.studentId,
                    status: 'present',
                    markedBy: teacherId,
                    method: 'face',
                    confidence: matchResult.confidence,
                });

                setLastNotification({
                    text: `✅ ${matchResult.fullName} (Roll #${matchResult.rollNo}) — Marked Present (${matchPct}% match)`,
                    type: 'success',
                });

                // Refresh list
                const updatedList = await sessionRepo.listClassAttendance(sessionId!);
                setAttendanceList(updatedList);
            } else if (matchResult.status === 'candidate' && matchResult.studentId) {
                // Candidate match -> Suggestion Prompt
                setLastNotification({
                    text: `❓ Candidate Match: ${matchResult.fullName} (Roll #${matchResult.rollNo}) — ${matchPct}% match`,
                    type: 'candidate',
                    studentId: matchResult.studentId,
                });
            } else {
                const topMatchInfo = matchResult.fullName
                    ? ` (Top match: ${matchResult.fullName} @ ${matchPct}%)`
                    : ` (${matchPct}% similarity)`;
                setLastNotification({
                    text: `❌ Unrecognized Face${topMatchInfo}. Ensure student face is enrolled in Roster.`,
                    type: 'unmatched',
                });
            }
        } catch (e: any) {
            setLastNotification({
                text: e.message || 'Frame processing error.',
                type: 'candidate',
            });
        } finally {
            setIsCapturing(false);
        }
    };

    const handleConfirmCandidate = async (studentId: string) => {
        try {
            const sessionRepo = await getSessionRepo();
            await sessionRepo.markAttendance({
                sessionId: sessionId!,
                studentId,
                status: 'present',
                markedBy: teacherId,
                method: 'face',
                confidence: 0.8,
            });

            const updatedList = await sessionRepo.listClassAttendance(sessionId!);
            setAttendanceList(updatedList);
            setLastNotification({
                text: `✅ Marked candidate present!`,
                type: 'success',
            });
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to update attendance status');
        }
    };

    const presentCount = attendanceList.filter((a) => a.status === 'present').length;

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-bg items-center justify-center">
                <Loader size="lg" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            className="flex-1 bg-bg"
            edges={['left', 'right', 'bottom']}
            testID="live-capture-screen"
        >
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
                {/* Header */}
                <View className="flex-row items-center justify-between">
                    <View className="gap-1 flex-1">
                        <Text variant="h2">Live Attendance</Text>
                        <Text variant="caption" tone="muted">
                            {sessionInfo?.className ?? 'Class'} · {sessionInfo?.subject ?? 'General'}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                        <View className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <Text variant="caption" tone="primary" className="font-semibold">
                            ACTIVE
                        </Text>
                    </View>
                </View>

                {/* Viewfinder Container */}
                <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                        <Text variant="label" tone="muted">
                            Camera Feed ({enrolledVectors.length} vectors loaded)
                        </Text>
                        <Pressable
                            onPress={() => setMlMode((m) => (m === 'real' ? 'stub' : 'real'))}
                            className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-800"
                        >
                            <Text className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                                {mlMode === 'real' ? '📷 Live Camera' : '🧪 Dev ML Stub'}
                            </Text>
                        </Pressable>
                    </View>

                    {mlMode === 'real' ? (
                        <CameraViewfinder
                            onCapture={(uri) => void handleFrameCaptured(uri)}
                            isCapturing={isCapturing}
                            onFallbackToStub={() => setMlMode('stub')}
                        />
                    ) : (
                        <View className="h-64 bg-slate-950 rounded-2xl items-center justify-center relative overflow-hidden border-2 border-indigo-500/40 gap-3">
                            <View className="h-36 w-36 rounded-full border-2 border-dashed border-indigo-400/70 items-center justify-center">
                                <Icon name="user" size={48} color="#a5b4fc" />
                            </View>

                            <Button
                                label={isCapturing ? 'Scanning Frame...' : 'Scan Frame (Dev Stub)'}
                                size="sm"
                                loading={isCapturing}
                                onPress={() => void handleFrameCaptured()}
                            />
                        </View>
                    )}
                </View>

                {/* Live Notification Banner */}
                {lastNotification ? (
                    <View
                        className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                            lastNotification.type === 'success'
                                ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800'
                                : lastNotification.type === 'unmatched'
                                  ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/50 dark:border-rose-800'
                                  : 'bg-amber-50 border-amber-300 dark:bg-amber-950/50 dark:border-amber-800'
                        }`}
                    >
                        <Text
                            className={`text-xs font-semibold flex-1 ${
                                lastNotification.type === 'success'
                                    ? 'text-emerald-800 dark:text-emerald-200'
                                    : lastNotification.type === 'unmatched'
                                      ? 'text-rose-800 dark:text-rose-200'
                                      : 'text-amber-800 dark:text-amber-200'
                            }`}
                        >
                            {lastNotification.text}
                        </Text>

                        {lastNotification.studentId ? (
                            <Button
                                label="Confirm"
                                size="sm"
                                onPress={() =>
                                    void handleConfirmCandidate(lastNotification.studentId!)
                                }
                            />
                        ) : null}
                    </View>
                ) : null}

                {/* Live Marked Roster Preview */}
                <View className="gap-2.5">
                    <View className="flex-row items-center justify-between">
                        <Text variant="h3">Class Roster ({presentCount}/{attendanceList.length} Present)</Text>
                    </View>
                    <Text variant="caption" tone="muted">
                        Students start as Absent when session begins. Live face scans update them to Present.
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
                    >
                        {attendanceList.map((st) => {
                            const isPresent = st.status === 'present';
                            const nameParts = st.fullName.trim().split(/\s+/);
                            const initialsStr = (
                                (nameParts[0]?.[0] ?? '') + (nameParts[nameParts.length - 1]?.[0] ?? '')
                            ).toUpperCase();

                            return (
                                <View
                                    key={st.studentId}
                                    className={`w-36 p-3.5 rounded-2xl border items-center justify-between gap-2 ${
                                        isPresent
                                            ? 'bg-emerald-50/70 border-emerald-500/80 dark:bg-emerald-950/40 dark:border-emerald-500/60'
                                            : 'bg-card border-border'
                                    }`}
                                >
                                    {/* Avatar / Status Circle */}
                                    <View
                                        className={`h-10 w-10 rounded-full items-center justify-center ${
                                            isPresent
                                                ? 'bg-emerald-500/20'
                                                : 'bg-gray-100 dark:bg-gray-800'
                                        }`}
                                    >
                                        {isPresent ? (
                                            <Icon name="check" size={20} color="#059669" />
                                        ) : (
                                            <Text className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                {initialsStr}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Student Info */}
                                    <View className="items-center w-full">
                                        <Text
                                            variant="label"
                                            numberOfLines={1}
                                            className="text-center text-xs font-bold w-full"
                                        >
                                            {st.fullName}
                                        </Text>
                                        <Text variant="caption" tone="muted" numberOfLines={1} className="text-[11px] mt-0.5">
                                            Roll #{st.rollNo}
                                        </Text>
                                    </View>

                                    {/* Status Badge */}
                                    <View
                                        className={`px-3 py-0.5 rounded-full border ${
                                            isPresent
                                                ? 'bg-emerald-500/20 border-emerald-500/40'
                                                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        <Text
                                            className={`text-[10px] font-bold uppercase tracking-wider ${
                                                isPresent
                                                    ? 'text-emerald-700 dark:text-emerald-300'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                        >
                                            {isPresent ? 'Present' : 'Absent'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Action Button: Finish & Review */}
                <View className="mt-2">
                    <Button
                        label="Review & Finish Session"
                        leftIcon="check"
                        onPress={() => router.push(`/teacher/sessions/${sessionId}/review` as any)}
                        testID="review-and-finish-btn"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
