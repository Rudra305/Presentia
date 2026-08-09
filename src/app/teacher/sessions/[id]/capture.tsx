import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, CameraViewfinder, Card, Icon, Text } from '@/core/ui';
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
        if (isCapturing || enrolledVectors.length === 0) return;
        try {
            setIsCapturing(true);

            // 1. Detect & Embed
            const detectedFaces = await faceDetector.detectFaces(photoUri || 'live-frame');
            if (detectedFaces.length === 0) {
                setLastNotification({
                    text: 'No face detected in camera frame. Position student in circle.',
                    type: 'candidate',
                });
                return;
            }

            const embeddingResult = await faceEmbedder.generateEmbedding(photoUri || 'live-frame');
            const matchResult = matchFace(embeddingResult.vector, enrolledVectors, 0.85, 0.72);

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
                    text: `✅ ${matchResult.fullName} (Roll #${matchResult.rollNo}) — Marked Present (${Math.round(
                        matchResult.confidence * 100,
                    )}% match)`,
                    type: 'success',
                });

                // Refresh list
                const updatedList = await sessionRepo.listClassAttendance(sessionId!);
                setAttendanceList(updatedList);
            } else if (matchResult.status === 'candidate' && matchResult.studentId) {
                // Candidate match -> Suggestion Prompt
                setLastNotification({
                    text: `❓ Candidate: ${matchResult.fullName} (${Math.round(
                        matchResult.confidence * 100,
                    )}% match)`,
                    type: 'candidate',
                    studentId: matchResult.studentId,
                });
            } else {
                setLastNotification({
                    text: '❌ Unrecognized face. Make sure student is enrolled.',
                    type: 'candidate',
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
            Alert.alert('Error', e.message || 'Failed to mark candidate.');
        }
    };

    const presentCount = attendanceList.filter((s) => s.status === 'present').length;
    const totalStudents = attendanceList.length;

    return (
        <SafeAreaView className="flex-1 bg-bg" edges={['left', 'right', 'bottom']}>
            <ScrollView
                contentContainerStyle={{ padding: 20, gap: 16 }}
                testID="live-capture-screen"
            >
                {/* Top Class & Counter Pill */}
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-2">
                        <Text variant="h2" numberOfLines={1}>
                            {sessionInfo?.className || 'Attendance Capture'}
                        </Text>
                        <Text variant="caption" tone="muted">
                            {sessionInfo?.periodLabel || 'Live Camera Recognition'}
                        </Text>
                    </View>

                    <View className="px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800">
                        <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {presentCount} / {totalStudents} Present
                        </Text>
                    </View>
                </View>

                {/* Viewfinder: Real Camera or Dev Stub */}
                <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                        <Text variant="label" tone="muted">
                            Camera Viewfinder
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
                        className={`p-3 rounded-xl border flex-row items-center justify-between ${
                            lastNotification.type === 'success'
                                ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                                : 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800'
                        }`}
                    >
                        <Text
                            className={`text-xs font-semibold flex-1 ${
                                lastNotification.type === 'success'
                                    ? 'text-emerald-800 dark:text-emerald-200'
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
                <View className="gap-2">
                    <Text variant="h3">Roster Status ({attendanceList.length})</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                    >
                        {attendanceList.map((st) => {
                            const isPresent = st.status === 'present';
                            return (
                                <Card
                                    key={st.studentId}
                                    padding="sm"
                                    className={`w-28 h-20 items-center justify-center border ${
                                        isPresent
                                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                                            : 'border-border bg-card'
                                    }`}
                                >
                                    <Text
                                        variant="label"
                                        numberOfLines={1}
                                        className="text-center text-xs"
                                    >
                                        {st.fullName}
                                    </Text>
                                    <Text variant="caption" tone="muted" numberOfLines={1}>
                                        Roll #{st.rollNo}
                                    </Text>
                                    <View
                                        className={`mt-1 px-2 py-0.5 rounded-full ${
                                            isPresent
                                                ? 'bg-emerald-500'
                                                : 'bg-gray-300 dark:bg-gray-700'
                                        }`}
                                    >
                                        <Text className="text-[10px] font-bold text-white uppercase">
                                            {isPresent ? 'Present' : 'Absent'}
                                        </Text>
                                    </View>
                                </Card>
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
