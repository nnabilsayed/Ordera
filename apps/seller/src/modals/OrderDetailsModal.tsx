import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Linking, Share, Alert } from 'react-native';
import { Order, Product } from '../types';
import { THEME, getAccessibleUrl } from '../utils';
import { getActionState } from '../utils/statusLogic';
import { ReceiptModal } from './ReceiptModal';

interface OrderDetailsModalProps {
    visible: boolean;
    order: Order | null;
    products: Product[];
    onClose: () => void;
    onUpdateStatus: (orderId: string, status: string) => void;
}

export const OrderDetailsModal = ({ visible, order, products, onClose, onUpdateStatus }: OrderDetailsModalProps) => {
    if (!order) return null;

    // Packing List Checkbox State (Local to this modal instance)
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
    
    // Receipt Review State
    const [reviewReceipt, setReviewReceipt] = useState<string | null>(null);

    const toggleItem = (itemId: string) => {
        const newSet = new Set(checkedItems);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        setCheckedItems(newSet);
    };

    const handleCall = () => {
        if (order.customer.phone) {
            Linking.openURL(`tel:${order.customer.phone}`);
        }
    };

    const handleShareReceipt = async () => {
        // Build receipt message
        let itemsList = '';
        if (order.items && order.items.length > 0) {
            itemsList = order.items.map(item => {
                const productName = getProductName(item.product_id, item.variant_id);
                return `${item.quantity}x ${productName}`;
            }).join('\n');
        } else if (order.link_ref) {
            // Fallback for legacy single-item orders
            itemsList = `1x ${order.link_ref.product.title}`;
            if (order.variant) itemsList += ` (${order.variant.name})`;
        }

        const message = 
            `Hello ${order.customer.full_name}! 👋\n\n` +
            `📦 *Order #${order.human_id}*\n` +
            `────────────\n` +
            `${itemsList}\n` +
            `────────────\n` +
            `💰 Total: ${Number(order.total_amount).toFixed(2)} EGP\n` +
            `📋 Status: ${getActionState(order.status).label}\n\n` +
            `Thank you for your order! 🙏`;

        // Try WhatsApp first if phone exists
        const phone = order.customer.phone?.replace(/\D/g, ''); // Remove non-digits
        if (phone) {
            const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
            const canOpen = await Linking.canOpenURL(whatsappUrl);
            if (canOpen) {
                await Linking.openURL(whatsappUrl);
                return;
            }
        }

        // Fallback to native share sheet
        try {
            await Share.share({ message });
        } catch (error) {
            Alert.alert('Error', 'Could not share receipt');
        }
    };

    const getProductName = (productId: string, variantId?: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return "Unknown Product";
        
        let name = product.title;
        if (variantId && product.variants) {
             const variant = product.variants.find(v => v.id === variantId);
             if (variant) {
                 name += ` (${variant.color}/${variant.size})`;
             }
        }
        return name;
    };

    // const badge = getStatusBadge(order.status); // Removed in favor of getActionState

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Order #{order.human_id}</Text>
                        <View style={{flexDirection: 'row', marginTop: 4}}>
                            <View style={[styles.badge, { backgroundColor: getActionState(order.status).bg }]}>
                                <Text style={[styles.badgeText, { color: getActionState(order.status).color }]}>{getActionState(order.status).label}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                        <TouchableOpacity onPress={handleShareReceipt} style={styles.shareBtn}>
                            <Text style={styles.shareBtnText}>📤 Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={styles.content}>
                    
                    {/* Customer Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Customer Details 👤</Text>
                        <View style={styles.card}>
                            <Text style={styles.rowLabel}>Name</Text>
                            <Text style={styles.rowValue}>{order.customer.full_name}</Text>
                            
                            <View style={styles.separator} />
                            
                            <Text style={styles.rowLabel}>Address</Text>
                            <Text style={styles.rowValue}>{order.customer.address}</Text>

                            <View style={styles.separator} />

                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                <View>
                                    <Text style={styles.rowLabel}>Phone</Text>
                                    <Text style={styles.rowValue}>{order.customer.phone}</Text>
                                </View>
                                <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                                    <Text style={styles.callBtnText}>📞 Call User</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Packing List Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Packing List 📦</Text>
                        <Text style={styles.helperText}>Tap items to mark as packed</Text>
                        <View style={styles.card}>
                            {order.items && order.items.length > 0 ? (
                                order.items.map((item, index) => {
                                    const isChecked = checkedItems.has(item.id);
                                    return (
                                        <TouchableOpacity 
                                            key={item.id || index} 
                                            style={[styles.itemRow, index !== order.items!.length - 1 && styles.borderBottom]}
                                            onPress={() => toggleItem(item.id)}
                                        >
                                            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                                                {isChecked && <Text style={{color: 'white', fontSize: 12}}>✓</Text>}
                                            </View>
                                            <Text style={[styles.itemText, isChecked && styles.itemTextChecked]}>
                                                {item.quantity}x {getProductName(item.product_id, item.variant_id)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <Text style={{color: '#6B7280'}}>No items found.</Text>
                            )}
                        </View>
                    </View>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        {(() => {
                            const actionState = getActionState(order.status);
                            if (!actionState.action) return null;

                            return (
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: actionState.action === 'verify' ? '#10B981' : actionState.color }]}
                                    onPress={() => {
                                        if (actionState.action === 'verify') {
                                             if (order.payment_proof_url) {
                                                 setReviewReceipt(getAccessibleUrl(order.payment_proof_url));
                                             } else {
                                                 onUpdateStatus(order.id, 'confirmed');
                                                 onClose();
                                             }
                                        } else if (actionState.action === 'ship') {
                                            onUpdateStatus(order.id, 'shipped');
                                            onClose();
                                        } else if (actionState.action === 'deliver') {
                                            onUpdateStatus(order.id, 'delivered');
                                            onClose();
                                        }
                                    }}
                                >
                                    <Text style={styles.actionBtnText}>{actionState.label}</Text>
                                </TouchableOpacity>
                            );
                        })()}
                    </View>

                    <View style={{height: 40}} />
                </ScrollView>
            </View>

            {/* Review Receipt Modal */}
            <ReceiptModal 
                visible={!!reviewReceipt}
                image={reviewReceipt}
                onClose={() => setReviewReceipt(null)}
                onConfirm={() => {
                    if (order) {
                        onUpdateStatus(order.id, 'confirmed');
                        setReviewReceipt(null);
                        onClose(); // Close both Modals
                    }
                }}
                onReject={() => {
                     // In a real app, maybe ask for reason
                     if (order) {
                        // For now just reject
                        onUpdateStatus(order.id, 'rejected'); 
                        setReviewReceipt(null);
                        onClose(); 
                     }
                }}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
    },
    closeBtn: {
        padding: 8,
    },
    closeText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    helperText: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    rowLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
        marginBottom: 2,
    },
    rowValue: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    callBtn: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    callBtnText: {
        color: '#4F46E5',
        fontWeight: '600',
        fontSize: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#10B981', // Green
        borderColor: '#10B981',
    },
    itemText: {
        fontSize: 15,
        color: '#374151',
        flex: 1,
    },
    itemTextChecked: {
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
    },
    footer: {
        marginTop: 10,
    },
    actionBtn: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    actionBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    shareBtn: {
        backgroundColor: '#25D366', // WhatsApp green
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    shareBtnText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    }
});
