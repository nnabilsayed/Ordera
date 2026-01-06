import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Product } from '../types';
import { THEME } from '../utils';

interface InventoryModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
}

export const InventoryModal = ({ visible, product, onClose }: InventoryModalProps) => {
    return (
      <Modal visible={visible} transparent={true} animationType="slide">
        <Pressable 
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
            onPress={onClose}
        >
            <Pressable 
                style={{ width: '85%', backgroundColor: 'white', borderRadius: 12, padding: 20 }}
                onPress={(e) => e.stopPropagation()}
            >
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{product?.title} - Variants</Text>
                
                {product?.variants && product.variants.length > 0 ? (
                    product.variants.map((v, i) => (
                        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                            <Text style={{ fontWeight: '600' }}>{v.name}</Text>
                            <Text style={{ color: v.stock > 0 ? 'green' : 'red' }}>Stock: {v.stock}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={{ color: 'gray', fontStyle: 'italic' }}>No variants defined.</Text>
                )}

                <TouchableOpacity 
                    style={{ marginTop: 20, alignSelf: 'center', padding: 10 }}
                    onPress={onClose}
                >
                    <Text style={{ color: THEME.primary, fontWeight: 'bold' }}>Close</Text>
                </TouchableOpacity>
            </Pressable>
        </Pressable>
      </Modal>
    );
};
