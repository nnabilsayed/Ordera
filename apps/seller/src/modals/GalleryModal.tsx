import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, FlatList, Pressable, Dimensions } from 'react-native';
import { getAccessibleUrl, SCREEN_WIDTH } from '../utils';

interface GalleryModalProps {
  visible: boolean;
  images: string[];
  onClose: () => void;
}

export const GalleryModal = ({ visible, images, onClose }: GalleryModalProps) => {
    return (
      <Modal visible={visible} transparent={true} onRequestClose={onClose}>
        <View style={styles.imageModalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <FlatList 
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <Pressable 
                        onPress={onClose}
                        style={{ width: SCREEN_WIDTH, height: '100%', justifyContent: 'center', alignItems: 'center' }}
                    >
                         <Image 
                            source={{ uri: getAccessibleUrl(item) }} 
                            style={{ width: SCREEN_WIDTH, height: '80%', resizeMode: 'contain' }}
                         />
                         <Text style={{ position: 'absolute', bottom: 40, color: 'white', fontWeight: 'bold' }}>
                            {index + 1} / {images.length}
                         </Text>
                    </Pressable>
                )}
            />
        </View>
      </Modal>
    );
};

const styles = StyleSheet.create({
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40, 
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999, // Force it to be on top
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  }
});
