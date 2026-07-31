import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';

import { Button, Input, Modal, Text, Icon, CameraViewfinder } from '@/core/ui';
import { getFacePipeline } from '@/core/ml';
import type { FaceEmbedding } from '@/core/ml';
import type { ClassEntity } from '@/features/classes/repo';
import type { CreateStudentPayload, StudentWithDetails } from './types';
import { getStudentRepo } from './repo';

interface EnrollmentWizardProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: (student: StudentWithDetails) => void;
    tenantId: string;
    classes: ClassEntity[];
    initialClassId?: string;
}

export const EnrollmentWizard: React.FC<EnrollmentWizardProps> = ({
    visible,
    onClose,
    onSuccess,
    tenantId,
    classes,
    initialClassId,
}) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [fullName, setFullName] = useState('');
    const [rollNo, setRollNo] = useState('');
    const [selectedClassId, setSelectedClassId] = useState(initialClassId || classes[0]?.id || '');
    const [errors, setErrors] = useState<{ fullName?: string; rollNo?: string; classId?: string }>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 2: Samples
    const [samples, setSamples] = useState<FaceEmbedding[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [mlMode, setMlMode] = useState<'real' | 'stub'>('real');

    const { detector: faceDetector, embedder: faceEmbedder } = getFacePipeline(mlMode);

    useEffect(() => {
        if (visible && selectedClassId && tenantId) {
            void (async () => {
                try {
                    const repo = await getStudentRepo();
                    const next = await repo.getNextRollNo(tenantId, selectedClassId);
                    setRollNo(next);
                } catch {
                    /* no-op */
                }
            })();
        }
    }, [visible, selectedClassId, tenantId]);

    const resetForm = () => {
        setStep(1);
        setFullName('');
        setRollNo('');
        setSelectedClassId(initialClassId || classes[0]?.id || '');
        setErrors({});
        setSamples([]);
        setIsCapturing(false);
        setIsSubmitting(false);
        setMlMode('real');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validateStep1 = async () => {
        const errs: { fullName?: string; classId?: string } = {};

        if (!fullName.trim() || fullName.trim().length < 2) {
            errs.fullName = 'Full name must be at least 2 characters';
        }
        if (!selectedClassId) {
            errs.classId = 'Please select a class';
        }

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return false;
        }

        // Auto-decide next roll number for the selected class
        try {
            const repo = await getStudentRepo();
            const autoRoll = await repo.getNextRollNo(tenantId, selectedClassId);
            setRollNo(autoRoll);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to determine next roll number.');
            return false;
        }

        setErrors({});
        setStep(2);
        return true;
    };

    const handleCaptureSample = async (capturedUri?: string) => {
        if (samples.length >= 3 || isCapturing) return;

        setIsCapturing(true);
        try {
            const sampleIndex = samples.length + 1;
            const imageUri = capturedUri || `file:///sample_${rollNo}_${sampleIndex}.jpg`;

            // Face detection & embedding using active pipeline
            const detections = await faceDetector.detectFaces(imageUri);
            if (detections.length === 0) {
                Alert.alert(
                    'Face Detection Failed',
                    'No face detected in frame. Please adjust lighting and try again.',
                );
                setIsCapturing(false);
                return;
            }

            const embedding = await faceEmbedder.generateEmbedding(
                imageUri,
                `${tenantId}_${selectedClassId}_${rollNo}_sample_${sampleIndex}`,
            );

            setSamples((prev) => [...prev, embedding]);
        } catch (err: any) {
            Alert.alert('Capture Error', err.message || 'Failed to capture face embedding');
        } finally {
            setIsCapturing(false);
        }
    };

    const handleRemoveSample = (index: number) => {
        setSamples((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSaveStudent = async () => {
        if (samples.length < 3) {
            Alert.alert('Incomplete Samples', 'Please capture 3 face samples before saving.');
            return;
        }

        setIsSubmitting(true);
        try {
            const repo = await getStudentRepo();
            const payload: CreateStudentPayload = {
                tenantId,
                classId: selectedClassId,
                rollNo: rollNo.trim(),
                fullName: fullName.trim(),
                photoUri: `file:///students/avatar_${rollNo}.jpg`,
                embeddings: samples.map((s) => ({
                    vector: s.vector,
                    dim: s.dim,
                    modelVersion: s.modelVersion,
                    quality: s.quality,
                    capturedAt: s.capturedAt,
                })),
            };

            const created = await repo.createWithEmbeddings(payload);
            onSuccess(created);
            handleClose();
        } catch (err: any) {
            Alert.alert('Registration Error', err.message || 'Failed to enroll student');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedClass = classes.find((c) => c.id === selectedClassId);

    return (
        <Modal visible={visible} onClose={handleClose} title="Enroll Student" size="lg">
            <ScrollView className="max-h-[640px]">
                {/* Step Indicator */}
                <View className="mb-6 px-2">
                    <View className="flex-row items-center relative">
                        {/* Connector line passing behind circle centers (top-4 = 16px center of 32px circle) */}
                        <View className="absolute left-10 right-10 top-4 h-0.5 bg-gray-200 dark:bg-gray-800 -translate-y-0.5" />

                        {/* Step Items */}
                        {[
                            { num: 1, label: 'Details' },
                            { num: 2, label: 'Face Scan' },
                            { num: 3, label: 'Confirm' },
                        ].map((s) => {
                            const isActive = step >= s.num;
                            const isCurrent = step === s.num;
                            return (
                                <View key={s.num} className="flex-1 items-center z-10">
                                    <View
                                        className={`h-8 w-8 rounded-full items-center justify-center border-2 ${
                                            isActive
                                                ? 'bg-indigo-600 border-indigo-600'
                                                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                                        }`}
                                    >
                                        <Text
                                            className={`font-bold text-xs ${
                                                isActive
                                                    ? 'text-white'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                        >
                                            {s.num}
                                        </Text>
                                    </View>
                                    <Text
                                        numberOfLines={1}
                                        className={`text-[11px] mt-1.5 text-center ${
                                            isCurrent
                                                ? 'font-bold text-indigo-600 dark:text-indigo-400'
                                                : isActive
                                                  ? 'font-semibold text-gray-700 dark:text-gray-300'
                                                  : 'font-normal text-gray-400 dark:text-gray-500'
                                        }`}
                                    >
                                        {s.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* STEP 1: Basic Info */}
                {step === 1 && (
                    <View className="space-y-4">
                        <Text className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                            Student Details
                        </Text>

                        <Input
                            label="Full Name *"
                            placeholder="e.g. Ananya Rao"
                            value={fullName}
                            onChangeText={(text) => {
                                setFullName(text);
                                if (errors.fullName)
                                    setErrors((prev) => ({ ...prev, fullName: undefined }));
                            }}
                            errorText={errors.fullName}
                        />

                        <View className="flex-row items-center justify-between p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 my-1">
                            <Text className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                                Auto-assigned Roll Number:
                            </Text>
                            <Text className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                #{rollNo || '1'} (Auto)
                            </Text>
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Class Assignment *
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="flex-row py-1"
                            >
                                {classes.map((cls) => {
                                    const isSelected = cls.id === selectedClassId;
                                    return (
                                        <Pressable
                                            key={cls.id}
                                            onPress={() => setSelectedClassId(cls.id)}
                                            className={`mr-2 px-3 py-2 rounded-xl border ${
                                                isSelected
                                                    ? 'bg-indigo-50 border-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-500'
                                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                            }`}
                                        >
                                            <Text
                                                className={`text-sm font-semibold ${
                                                    isSelected
                                                        ? 'text-indigo-700 dark:text-indigo-300'
                                                        : 'text-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                {cls.name}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                            {errors.classId ? (
                                <Text className="text-xs text-rose-500 mt-1">{errors.classId}</Text>
                            ) : null}
                        </View>

                        <Button label="Next: Face Scan" onPress={validateStep1} className="mt-4" />
                    </View>
                )}

                {/* STEP 2: Face Sample Capture */}
                {step === 2 && (
                    <View className="space-y-4">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                Face Samples ({samples.length}/3)
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

                        {/* Viewfinder: Real Camera or Dev Stub */}
                        {mlMode === 'real' ? (
                            <CameraViewfinder
                                onCapture={(uri) => void handleCaptureSample(uri)}
                                isCapturing={isCapturing}
                                onFallbackToStub={() => setMlMode('stub')}
                            />
                        ) : (
                            <View className="h-56 bg-slate-950 rounded-2xl items-center justify-center relative overflow-hidden border-2 border-indigo-500/40">
                                <View className="h-36 w-36 rounded-full border-2 border-dashed border-indigo-400/70 items-center justify-center">
                                    <Icon name="user" size={48} color="#a5b4fc" />
                                </View>

                                {/* Quality overlay */}
                                {samples.length > 0 && (
                                    <View className="absolute top-3 left-3 bg-black/60 px-2.5 py-1 rounded-full flex-row items-center">
                                        <View className="h-2 w-2 rounded-full bg-emerald-400 mr-1.5" />
                                        <Text className="text-xs text-white font-medium">
                                            Quality:{' '}
                                            {Math.round(
                                                (samples[samples.length - 1]?.quality ?? 0.9) * 100,
                                            )}
                                            %
                                        </Text>
                                    </View>
                                )}

                                <Text className="absolute bottom-3 text-xs text-gray-300 font-medium px-4 text-center">
                                    Dev ML Stub Active — click Capture Sample below
                                </Text>
                            </View>
                        )}

                        {/* Sample Chips with distinct gap */}
                        <View className="flex-row gap-3 my-3">
                            {[0, 1, 2].map((idx) => {
                                const sample = samples[idx];
                                return (
                                    <View
                                        key={idx}
                                        className={`flex-1 p-3 rounded-xl border items-center justify-between ${
                                            sample
                                                ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                                                : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                        }`}
                                    >
                                        <Text className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                                            Sample #{idx + 1}
                                        </Text>
                                        {sample ? (
                                            <View className="items-center">
                                                <Icon
                                                    name="check-circle"
                                                    size={20}
                                                    color="#059669"
                                                />
                                                <Text className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                                                    {Math.round(sample.quality * 100)}% Quality
                                                </Text>
                                                <Pressable
                                                    onPress={() => handleRemoveSample(idx)}
                                                    className="mt-1"
                                                    hitSlop={8}
                                                >
                                                    <Text className="text-[10px] text-rose-500 underline">
                                                        Retake
                                                    </Text>
                                                </Pressable>
                                            </View>
                                        ) : (
                                            <View className="items-center py-1">
                                                <Icon name="camera" size={20} color="#9ca3af" />
                                                <Text className="text-[10px] text-gray-400 mt-1">
                                                    Pending
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>

                        {/* Action buttons with distinct spacing */}
                        <View className="flex-row gap-3 mt-5">
                            <Button
                                variant="secondary"
                                label="Back"
                                onPress={() => setStep(1)}
                                className="flex-1"
                            />
                            {samples.length < 3 ? (
                                <Button
                                    label={
                                        isCapturing
                                            ? 'Capturing...'
                                            : `Capture (${samples.length + 1}/3)`
                                    }
                                    onPress={() => void handleCaptureSample()}
                                    loading={isCapturing}
                                    className="flex-1"
                                />
                            ) : (
                                <Button
                                    label="Next: Review"
                                    onPress={() => setStep(3)}
                                    className="flex-1"
                                />
                            )}
                        </View>
                    </View>
                )}

                {/* STEP 3: Review & Submit */}
                {step === 3 && (
                    <View className="space-y-4">
                        <Text className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                            Review Registration
                        </Text>

                        <View className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-2 border border-gray-200 dark:border-gray-700">
                            <View className="flex-row justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                                <Text className="text-sm text-gray-500">Student Name:</Text>
                                <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {fullName}
                                </Text>
                            </View>

                            <View className="flex-row justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                                <Text className="text-sm text-gray-500">Roll Number:</Text>
                                <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {rollNo}
                                </Text>
                            </View>

                            <View className="flex-row justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                                <Text className="text-sm text-gray-500">Class:</Text>
                                <Text className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                    {selectedClass?.name || 'Class'}
                                </Text>
                            </View>

                            <View className="flex-row justify-between py-1">
                                <Text className="text-sm text-gray-500">Face Vector Samples:</Text>
                                <Text className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                    3 / 3 Captured
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row space-x-3 mt-6">
                            <Button
                                variant="secondary"
                                label="Back"
                                onPress={() => setStep(2)}
                                className="flex-1"
                            />
                            <Button
                                label="Save & Enroll"
                                onPress={handleSaveStudent}
                                loading={isSubmitting}
                                className="flex-1"
                            />
                        </View>
                    </View>
                )}
            </ScrollView>
        </Modal>
    );
};
