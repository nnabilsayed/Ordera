import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
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

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempEditVariant, setTempEditVariant] = useState<{color: string, size: string, stock: string, imageUrl?: string} | null>(null);

  const [creating, setCreating] = useState(false);

  // Add Variant (Top Form)
  const handleAddVariant = () => {
    if (!tempVariantColor || !tempVariantSize || !tempVariantStock) {
        Alert.alert("Error", "Enter color, size, and stock for the variant");
        return;
    }

    const variantData = { 
      color: tempVariantColor,
      size: tempVariantSize,
      stock: tempVariantStock,
      imageUrl: tempVariantImageUrl || undefined
    };

    setNewVariants([...newVariants, variantData]);

    // Reset Form
    setTempVariantColor('');
    setTempVariantSize('');
    setTempVariantStock('');
    setTempVariantImageUrl(''); 
  };

  // Row Editing Logic
  const startEditingRow = (index: number) => {
      setEditingIndex(index);
      setTempEditVariant({ ...newVariants[index] });
  };

  const saveEditingRow = () => {
      if (editingIndex !== null && tempEditVariant) {
          const updated = [...newVariants];
          updated[editingIndex] = tempEditVariant;
          setNewVariants(updated);
          setEditingIndex(null);
          setTempEditVariant(null);
      }
  };

  const cancelEditingRow = () => {
      setEditingIndex(null);
      setTempEditVariant(null);
  };

  // Pick Image for EDITING ROW
  const handleEditRowImage = async () => {
    if (!tempEditVariant) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      try {
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
        setTempEditVariant({ ...tempEditVariant, imageUrl: `${API_URL}${data.url}` });
        
      } catch (error) {
        Alert.alert("Error", "Failed to upload image");
      }
    }
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


  const handleDeleteVariant = (index: number) => {
    Alert.alert(
        "Delete Variant",
        "Are you sure you want to remove this variant?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive",
                onPress: () => {
                    const updated = [...newVariants];
                    updated.splice(index, 1);
                    setNewVariants(updated);
                }
            }
        ]
    );
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

    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <View style={styles.modalContent}>
          <ScrollView
            style={{ backgroundColor: 'white' }} 
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100, padding: 24 }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
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

        {/* Add Button (Add Only) */}
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
                            {newVariants.map((v, i) => {
                                const isEditing = editingIndex === i;
                                return (
                                <View key={i} style={{backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: isEditing ? THEME.primary : '#E5E7EB', flexDirection: isEditing ? 'column' : 'row', alignItems: isEditing ? 'stretch' : 'center', justifyContent: isEditing ? 'flex-start' : 'space-between', marginBottom: 8, width: '100%'}}>
                                    
                                    {isEditing && tempEditVariant ? (
                                        // EDIT MODE
                                        <>
                                        {/* Row 1: Inputs */}
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                            {/* Image Edit Trigger */}
                                            <TouchableOpacity onPress={handleEditRowImage} style={{borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4, borderStyle: 'dashed'}}>
                                                {tempEditVariant.imageUrl ? (
                                                    <Image source={{ uri: tempEditVariant.imageUrl }} style={{ width: 40, height: 40, borderRadius: 4 }} />
                                                ) : (
                                                    <View style={{width: 40, height: 40, backgroundColor: '#F9FAFB', borderRadius: 4, alignItems: 'center', justifyContent: 'center'}}>
                                                        <Text style={{fontSize: 10}}>📷</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>

                                            <View style={{flexDirection: 'row', gap: 8, flex: 1}}>
                                                <View style={{flex: 2}}>
                                                    <Text style={{fontSize: 10, color: '#6B7280', marginBottom: 2, fontWeight: '600'}}>Color</Text>
                                                    <TextInput 
                                                        value={tempEditVariant.color}
                                                        onChangeText={(txt) => setTempEditVariant({...tempEditVariant, color: txt})}
                                                        placeholder="Color"
                                                        style={[styles.input, {padding: 8, fontSize: 13, height: 36}]}
                                                    />
                                                </View>
                                                <View style={{flex: 2}}>
                                                    <Text style={{fontSize: 10, color: '#6B7280', marginBottom: 2, fontWeight: '600'}}>Size</Text>
                                                    <TextInput 
                                                        value={tempEditVariant.size}
                                                        onChangeText={(txt) => setTempEditVariant({...tempEditVariant, size: txt})}
                                                        placeholder="Size"
                                                        style={[styles.input, {padding: 8, fontSize: 13, height: 36}]}
                                                    />
                                                </View>
                                                <View style={{flex: 1}}>
                                                    <Text style={{fontSize: 10, color: '#6B7280', marginBottom: 2, fontWeight: '600'}}>Qty</Text>
                                                    <TextInput 
                                                        value={tempEditVariant.stock}
                                                        onChangeText={(txt) => setTempEditVariant({...tempEditVariant, stock: txt})}
                                                        placeholder="Qty"
                                                        keyboardType="numeric"
                                                        style={[styles.input, {padding: 8, fontSize: 13, height: 36}]}
                                                    />
                                                </View>
                                            </View>
                                        </View>

                                        {/* Row 2: Actions */}
                                        <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 8}}>
                                            <TouchableOpacity 
                                                onPress={saveEditingRow}
                                                style={{padding: 8, backgroundColor: '#ECFDF5', borderRadius: 6, borderWidth: 1, borderColor: '#D1FAE5'}}
                                            >
                                                <Text style={{fontSize: 14, fontWeight: '700', color: '#059669'}}>Save Changes</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                onPress={cancelEditingRow}
                                                style={{padding: 8, backgroundColor: '#F3F4F6', borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB'}}
                                            >
                                                <Text style={{fontSize: 14, fontWeight: '600', color: '#4B5563'}}>Cancel</Text>
                                            </TouchableOpacity>
                                        </View>
                                        </>
                                    ) : (
                                        // VIEW MODE (Unchanged)
                                        <>
                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            {v.imageUrl && <Image source={{ uri: v.imageUrl }} style={{ width: 32, height: 32, marginRight: 8, borderRadius: 4 }} />}
                                            <View>
                                                <Text style={{color: THEME.text, fontWeight: '600', fontSize: 13}}>🔵 {v.color} / 📏 {v.size}</Text>
                                                <Text style={{color: '#6B7280', fontSize: 13}}>Qty: {v.stock}</Text>
                                            </View>
                                        </View>

                                        <View style={{flexDirection: 'row', gap: 8}}>
                                            <TouchableOpacity 
                                                onPress={() => startEditingRow(i)}
                                                style={{padding: 10, backgroundColor: '#EFF6FF', borderRadius: 6}}
                                            >
                                                <Text style={{fontSize: 16}}>✏️</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                onPress={() => handleDeleteVariant(i)} 
                                                style={{padding: 10, backgroundColor: '#FEF2F2', borderRadius: 6}}
                                            >
                                                <Text style={{fontSize: 16}}>🗑️</Text>
                                            </TouchableOpacity>
                                        </View>
                                        </>
                                    )}
                                </View>
                                );
                            })}
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
          </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>


      </>
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
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 24,
    // padding handled by ScrollView
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
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
