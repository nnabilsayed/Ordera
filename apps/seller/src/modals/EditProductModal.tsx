import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Image, FlatList, KeyboardAvoidingView, Platform, Pressable, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Product } from '../types';
import { THEME, getAccessibleUrl } from '../utils';

interface EditProductModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (data: {
      id: string;
      title: string;
      price: string;
      image: string | null;
      variants: Product['variants'];
  }) => void;
}

export const EditProductModal = ({ visible, product, onClose, onSave }: EditProductModalProps) => {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState<string | null>('');
    const [variants, setVariants] = useState<Product['variants']>([]);

    // Initialize state when product changes
    useEffect(() => {
        if (product) {
            setTitle(product.title);
            setPrice(product.base_price);
            setImage(product.image_url || null);
            setVariants(product.variants || []);
        }
    }, [product]);

    // Image Picker Logic
    const pickImage = async (variantIndex: number = -1) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            if (variantIndex === -1) {
                // Main Product Image
                setImage(uri);
            } else {
                // Variant Image
                const newVariants = [...variants];
                newVariants[variantIndex].image_url = uri;
                setVariants(newVariants);
            }
        }
    };

    const handleSave = () => {
        if (product) {
            onSave({
                id: product.id,
                title,
                price,
                image,
                variants
            });
        }
    };

    return (
      <Modal visible={visible} transparent={true} animationType="slide">
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{flex:1}}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
            <ScrollView 
                contentContainerStyle={{flexGrow: 1}}
                keyboardShouldPersistTaps="handled"
            >
                <Pressable 
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}
                    onPress={onClose}
                >
                    <Pressable 
                        style={{ width: '85%', backgroundColor: 'white', borderRadius: 12, padding: 20 }}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Edit Product</Text>
                        
                        <Text style={styles.label}>Product Name</Text>
                        <TextInput 
                            style={styles.input} 
                            value={title} 
                            onChangeText={setTitle} 
                            placeholder="e.g. Blue Hoodie"
                        />

                        <Text style={[styles.label, {marginTop: 12}]}>Price (EGP)</Text>
                        <TextInput 
                            style={styles.input} 
                            value={price} 
                            onChangeText={setPrice} 
                            keyboardType="numeric"
                            placeholder="e.g. 250"
                        />

{/* 
                        <Text style={[styles.label, {marginTop: 12}]}>Product Image</Text>
                        <TouchableOpacity onPress={() => pickImage(-1)} style={{ alignItems: 'center', marginVertical: 10, borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 8, padding: 10 }}>
                            {image ? (
                                <Image source={{ uri: getAccessibleUrl(image) || undefined }} style={{ width: 100, height: 100, borderRadius: 8 }} />
                            ) : (
                                <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9' }}>
                                    <Text>Select Image</Text>
                                </View>
                            )}
                        </TouchableOpacity>
*/}

                        {/* Inventory Breakdown in Edit Mode */}
                        <Text style={[styles.label, {marginTop: 16, marginBottom: 8}]}>Inventory Breakdown (Editable)</Text>
                        <View>
                            {variants.map((item, index) => (
                                <View key={item.id || index} style={{ marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 }}>
                                    {/* Top Row: Details */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                                        {/* Color */}
                                        <View style={{flex: 2}}>
                                            <TextInput 
                                                style={[styles.input, {padding: 8, fontSize: 13}]} 
                                                value={item.color} 
                                                placeholder="Color"
                                                onChangeText={(text) => {
                                                    const newVariants = [...variants];
                                                    newVariants[index].color = text;
                                                    setVariants(newVariants);
                                                }}
                                            />
                                        </View>

                                        {/* Size */}
                                        <View style={{flex: 1}}>
                                            <TextInput 
                                                style={[styles.input, {padding: 8, fontSize: 13}]} 
                                                value={item.size} 
                                                placeholder="Size"
                                                onChangeText={(text) => {
                                                    const newVariants = [...variants];
                                                    newVariants[index].size = text;
                                                    setVariants(newVariants);
                                                }}
                                            />
                                        </View>

                                        {/* Stock */}
                                        <View style={{flex: 1}}>
                                            <TextInput 
                                                style={[styles.input, {padding: 8, fontSize: 13}]} 
                                                value={item.stock.toString()} 
                                                placeholder="Qty"
                                                keyboardType="numeric"
                                                onChangeText={(text) => {
                                                    const newVariants = [...variants];
                                                    newVariants[index].stock = parseInt(text) || 0;
                                                    setVariants(newVariants);
                                                }}
                                            />
                                        </View>
                                    </View>

                                    {/* Bottom Row: VARIANT SPECIFIC IMAGE */}
                                    <TouchableOpacity onPress={() => pickImage(index)} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                                        {/* Show the Variant Image (or a placeholder if empty) */}
                                        <Image 
                                            source={{ uri: getAccessibleUrl(item.image_url) || 'https://via.placeholder.com/50' }} 
                                            style={{ width: 60, height: 60, borderRadius: 8, marginRight: 10, backgroundColor: '#f0f0f0' }} 
                                        />
                                        <Text style={{ color: THEME.primary, fontWeight: '600' }}>
                                            {item.image_url ? 'Change Photo 📸' : 'Upload Photo 📸'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onClose}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
};

const styles = StyleSheet.create({
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
    backgroundColor: THEME.text, // Black/Dark for Save
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
