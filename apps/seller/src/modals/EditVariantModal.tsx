import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { THEME } from '../utils';
import { API_URL } from '../config';

interface Variant {
    color: string;
    size: string;
    stock: string;
    imageUrl?: string;
}

interface EditVariantModalProps {
    visible: boolean;
    initialVariant: Variant | null;
    onClose: () => void;
    onUpdate: (updatedVariant: Variant) => void;
}

export const EditVariantModal = ({ visible, initialVariant, onClose, onUpdate }: EditVariantModalProps) => {
    const [color, setColor] = useState('');
    const [size, setSize] = useState('');
    const [stock, setStock] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        if (visible && initialVariant) {
            setColor(initialVariant.color);
            setSize(initialVariant.size);
            setStock(initialVariant.stock);
            setImageUrl(initialVariant.imageUrl || '');
        }
    }, [visible, initialVariant]);

    const handleUpdate = () => {
        if (!color || !size || !stock) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }
        onUpdate({
            color,
            size,
            stock,
            imageUrl: imageUrl || undefined
        });
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0].uri) {
            try {
                // Upload to API
                const formData = new FormData();
                formData.append('file', {
                    uri: result.assets[0].uri,
                    name: 'variant_edit.jpg',
                    type: 'image/jpeg'
                } as any);

                const response = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();
                setImageUrl(`${API_URL}${data.url}`);
                Alert.alert("Success", "Image updated!");
            } catch (error) {
                Alert.alert("Error", "Failed to upload image");
            }
        }
    };

    if (!visible) return null;

    return (
        <View style={styles.absoluteContainer}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Edit Variant</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Color</Text>
                        <TextInput
                            style={styles.input}
                            value={color}
                            onChangeText={setColor}
                            placeholder="e.g. Blue"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Size</Text>
                        <TextInput
                            style={styles.input}
                            value={size}
                            onChangeText={setSize}
                            placeholder="e.g. M"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Quantity</Text>
                        <TextInput
                            style={styles.input}
                            value={stock}
                            onChangeText={setStock}
                            keyboardType="numeric"
                            placeholder="Qty"
                        />
                    </View>

                    {/* Image Picker */}
                    <TouchableOpacity 
                        onPress={handlePickImage} 
                        style={styles.imagePicker}
                    >
                        <Text style={{ marginRight: 10 }}>📷</Text>
                        <Text style={{flex: 1}}>{imageUrl ? "Image Selected (Click to change)" : "Upload Color Photo"}</Text>
                        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.thumbnail} /> : null}
                    </TouchableOpacity>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            activeOpacity={0.8}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.saveButton]}
                            activeOpacity={0.8}
                            onPress={handleUpdate}
                        >
                            <Text style={styles.saveButtonText}>Update</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    absoluteContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        elevation: 50,
        backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: THEME.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: THEME.text,
    },
    imagePicker: {
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 20, 
        padding: 16, 
        backgroundColor: '#F9FAFB', 
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed'
    },
    thumbnail: {
        width: 40,
        height: 40,
        marginLeft: 10,
        borderRadius: 4,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
    },
    saveButton: {
        backgroundColor: THEME.text,
    },
    cancelButtonText: {
        fontWeight: '700',
        color: '#4B5563',
    },
    saveButtonText: {
        fontWeight: '700',
        color: 'white',
    },
});
