import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { THEME } from '../utils';
import { API_URL, SELLER_ID } from '../config';

interface CreateProductModalProps {
  visible: boolean;
  onClose: () => void;
  onProductCreated: () => void;
}

export const CreateProductModal = ({ visible, onClose, onProductCreated }: CreateProductModalProps) => {
  const [newProductTitle, setNewProductTitle] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  
  // Variant Creation State
  const [newVariants, setNewVariants] = useState<{color: string, size: string, stock: string, imageUrl?: string}[]>([]);
  const [tempVariantColor, setTempVariantColor] = useState('');
  const [tempVariantSize, setTempVariantSize] = useState('');
  const [tempVariantStock, setTempVariantStock] = useState('');
  const [tempVariantImageUrl, setTempVariantImageUrl] = useState('');

  const [creating, setCreating] = useState(false);

  // Add Variant to List
  const handleAddVariant = () => {
    if (!tempVariantColor || !tempVariantSize || !tempVariantStock) {
        Alert.alert("Error", "Enter color, size, and stock for the variant");
        return;
    }
    setNewVariants([...newVariants, { 
      color: tempVariantColor,
      size: tempVariantSize,
      stock: tempVariantStock,
      imageUrl: tempVariantImageUrl || undefined
    }]);
    setTempVariantColor('');
    setTempVariantSize('');
    setTempVariantStock('');
    setTempVariantImageUrl(''); // Clear temp image
  };

  // Pick Variant Image for NEW product creation
  const handlePickVariantImage = async () => {
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
          name: 'variant.jpg',
          type: 'image/jpeg'
        } as any);

        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        setTempVariantImageUrl(`${API_URL}${data.url}`); // We use the returned remote URL here directly for creation
        Alert.alert("Success", "Image uploaded!");
      } catch (error) {
        Alert.alert("Error", "Failed to upload image");
      }
    }
  };

  // Create Product Logic
  const handleCreateProduct = async () => {
    if (!newProductTitle || !newProductPrice) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: SELLER_ID,
          title: newProductTitle,
          price: newProductPrice,
          variants: newVariants.length > 0 ? newVariants : undefined
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Reset State
      setNewProductTitle('');
      setNewProductPrice('');
      setNewVariants([]);
      setTempVariantColor('');
      setTempVariantSize('');
      setTempVariantStock('');
      setTempVariantImageUrl('');
      
      onProductCreated();
      onClose();
      Alert.alert("Success", "Product Created!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Product</Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                style={styles.input}
                placeholder="e.g. Green Hoodie"
                value={newProductTitle}
                onChangeText={setNewProductTitle}
                />
            </View>
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Price (EGP)</Text>
                <TextInput
                style={styles.input}
                placeholder="e.g. 250"
                value={newProductPrice}
                onChangeText={setNewProductPrice}
                keyboardType="numeric"
                />
            </View>

            {/* VARIANTS SECTION */}
            <View style={{ marginBottom: 20 }}>
                <Text style={styles.label}>Sizes / Variants</Text>
                
                {/* Inputs Row */}
                <View style={{flexDirection: 'row', gap: 10, marginBottom: 10}}>
                    <TextInput 
                        style={[styles.input, {flex: 2}]} 
                        placeholder="Color (e.g. Blue)" 
                        value={tempVariantColor}
                        onChangeText={setTempVariantColor}
                    />
                    <TextInput 
                        style={[styles.input, {flex: 2}]} 
                        placeholder="Size (e.g. M)" 
                        value={tempVariantSize}
                        onChangeText={setTempVariantSize}
                    />
                    <TextInput 
                        style={[styles.input, {flex: 1}]} 
                        placeholder="Qty" 
                        keyboardType="numeric"
                        value={tempVariantStock}
                        onChangeText={setTempVariantStock}
                    />
                </View>

                {/* Image Picker */}
                <TouchableOpacity 
                    onPress={handlePickVariantImage} 
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}
                >
                    <Text style={{ marginRight: 10 }}>📷</Text>
                    <Text>{tempVariantImageUrl ? "Image Selected (Click to change)" : "Upload Color Photo"}</Text>
                    {tempVariantImageUrl ? <Image source={{ uri: tempVariantImageUrl }} style={{ width: 40, height: 40, marginLeft: 10, borderRadius: 4 }} /> : null}
                </TouchableOpacity>

                {/* Add Button */}
                <TouchableOpacity 
                    style={{
                        backgroundColor: '#EEF2FF', 
                        padding: 12, 
                        borderRadius: 12, 
                        alignItems: 'center',
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: THEME.primary
                    }}
                    onPress={handleAddVariant}
                >
                    <Text style={{color: THEME.primary, fontWeight: '700'}}>+ Add Size to List</Text>
                </TouchableOpacity>
                
                {/* Variants List */}
                {newVariants.length > 0 && (
                    <View style={{backgroundColor: '#F9FAFB', padding: 10, borderRadius: 12}}>
                        <Text style={{fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: '600'}}>Added Sizes:</Text>
                        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                            {newVariants.map((v, i) => (
                                <View key={i} style={{backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center'}}>
                                    {v.imageUrl && <Image source={{ uri: v.imageUrl }} style={{ width: 24, height: 24, marginRight: 8, borderRadius: 4 }} />}
                                    <Text style={{color: THEME.text, fontWeight: '600', fontSize: 13}}>🔵 {v.color} / 📏 {v.size}</Text>
                                    <Text style={{color: '#6B7280', fontSize: 13, marginLeft: 4}}>({v.stock})</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>

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
                onPress={handleCreateProduct}
                disabled={creating}
              >
                <Text style={styles.saveButtonText}>
                    {creating ? "Saving..." : "Create Product"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 24,
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
