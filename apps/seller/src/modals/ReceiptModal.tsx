import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';

interface ReceiptModalProps {
  visible: boolean;
  image: string | null;
  onClose: () => void;
}

export const ReceiptModal = ({ visible, image, onClose, onConfirm, onReject }: ReceiptModalProps & { onConfirm?: () => void, onReject?: () => void }) => {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.imageModalContainer}>
            <TouchableOpacity 
                style={styles.imageModalCloseArea}
                onPress={onClose}
            >
             <View />
            </TouchableOpacity>
            
            <View style={styles.imageModalContent}>
                <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={onClose}
                >
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>

                {image ? (
                    <Image 
                        source={{ uri: image }} 
                        style={styles.fullImage} 
                        resizeMode="contain"
                    />
                ) : null}
            </View>

            {/* Decision Bar (Only if onConfirm is present) */}
            {onConfirm && (
                <View style={styles.decisionBar}>
                    <TouchableOpacity 
                        style={[styles.decisionBtn, { backgroundColor: '#EF4444' }]}
                        onPress={onReject}
                    >
                        <Text style={styles.decisionText}>Reject ✕</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.decisionBtn, { backgroundColor: '#10B981', flex: 2 }]}
                        onPress={onConfirm}
                    >
                        <Text style={styles.decisionText}>✓ Confirm Payment</Text>
                    </TouchableOpacity>
                </View>
            )}
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
  imageModalCloseArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  imageModalContent: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: -50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40, 
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: -2,
  },
  decisionBar: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  decisionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  decisionText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
  }
});
