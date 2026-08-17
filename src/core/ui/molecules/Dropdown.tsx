import React, { useState } from 'react';
import { View, Pressable, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import { Text } from '../atoms/Text';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';

export interface DropdownOption {
    label: string;
    value: string;
}

interface DropdownProps {
    label?: string;
    placeholder?: string;
    options: DropdownOption[];
    selectedValue?: string;
    onSelect: (value: string) => void;
    testID?: string;
}

export function Dropdown({
    label,
    placeholder = 'Select an option...',
    options,
    selectedValue,
    onSelect,
    testID,
}: DropdownProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedOption = options.find((o) => o.value === selectedValue);

    const filteredOptions = searchQuery.trim()
        ? options.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    return (
        <View className="gap-1.5" testID={testID}>
            {label ? (
                <Text variant="caption" tone="muted" className="font-semibold">
                    {label}
                </Text>
            ) : null}

            <Pressable
                onPress={() => {
                    setSearchQuery('');
                    setOpen(true);
                }}
                className="flex-row items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-bg-elevated"
                testID={testID ? `${testID}-trigger` : undefined}
            >
                <Text
                    variant="body"
                    className={`font-semibold flex-1 mr-2 ${
                        selectedOption ? 'text-fg' : 'text-fgSubtle'
                    }`}
                    numberOfLines={1}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </Text>
                <Icon name="chevron-down" size={18} tone="fgSubtle" />
            </Pressable>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable
                    className="flex-1 bg-black/50 justify-center p-5"
                    onPress={() => setOpen(false)}
                >
                    <Pressable
                        className="bg-bg rounded-2xl p-5 border border-border max-h-[80%] gap-3"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View className="flex-row items-center justify-between border-b border-border pb-3">
                            <Text variant="h3">{label || 'Select Option'}</Text>
                            <Pressable onPress={() => setOpen(false)} className="p-1">
                                <Icon name="x" size={20} tone="fgSubtle" />
                            </Pressable>
                        </View>

                        {options.length > 5 ? (
                            <Input
                                placeholder="Search options..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                        ) : null}

                        <ScrollView className="max-h-64" showsVerticalScrollIndicator={false}>
                            {filteredOptions.length === 0 ? (
                                <Text variant="body" tone="muted" className="text-center py-4">
                                    No matching options found.
                                </Text>
                            ) : (
                                filteredOptions.map((opt) => {
                                    const active = opt.value === selectedValue;
                                    return (
                                        <Pressable
                                            key={opt.value}
                                            onPress={() => {
                                                onSelect(opt.value);
                                                setOpen(false);
                                            }}
                                            className={`flex-row items-center justify-between p-3.5 rounded-xl border mb-2 ${
                                                active
                                                    ? 'bg-primary/10 border-primary'
                                                    : 'bg-bg-elevated border-border'
                                            }`}
                                        >
                                            <Text
                                                variant="body"
                                                className={`font-semibold flex-1 mr-2 ${
                                                    active ? 'text-primary' : 'text-fg'
                                                }`}
                                            >
                                                {opt.label}
                                            </Text>
                                            {active ? (
                                                <Icon name="check" size={18} tone="primary" />
                                            ) : null}
                                        </Pressable>
                                    );
                                })
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
