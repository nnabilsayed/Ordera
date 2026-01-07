import React, { useState, useMemo } from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, 
    TextInput, Switch, Alert, ActivityIndicator 
} from 'react-native';
import { Product } from '../types';
import { OrderService } from '../services/OrderService';
import { SELLER_ID } from '../config';

interface CartItem {
    variantId: string;
    productName: string;
    variantName: string;
    quantity: number;
    price: number;
    stock: number;
}

interface CreateOrderModalProps {
    visible: boolean;
    onClose: () => void;
    products: Product[];
    onOrderCreated: () => void;
}

export const CreateOrderModal = ({ visible, onClose, products, onOrderCreated }: CreateOrderModalProps) => {
    // Customer State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    
    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isPaid, setIsPaid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Product Picker State
    const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

    // Calculate total
    const total = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cart]);

    // Add item to cart
    const addToCart = (product: Product, variant: Product['variants'][0]) => {
        const existingIndex = cart.findIndex(item => item.variantId === variant.id);
        
        if (existingIndex >= 0) {
            // Check stock limit
            if (cart[existingIndex].quantity >= variant.stock) {
                Alert.alert("Stock Limit", `Only ${variant.stock} available.`);
                return;
            }
            // Increment quantity
            const newCart = [...cart];
            newCart[existingIndex].quantity += 1;
            setCart(newCart);
        } else {
            // Add new item
            setCart([...cart, {
                variantId: variant.id,
                productName: product.title,
                variantName: `${variant.color} / ${variant.size}`,
                quantity: 1,
                price: parseFloat(product.base_price),
                stock: variant.stock
            }]);
        }
    };

    // Update quantity
    const updateQuantity = (variantId: string, delta: number) => {
        const newCart = cart.map(item => {
            if (item.variantId === variantId) {
                const newQty = item.quantity + delta;
                
                // Check stock limit for increase
                if (delta > 0 && newQty > item.stock) {
                    Alert.alert("Stock Limit", `Only ${item.stock} available.`);
                    return item;
                }

                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }).filter(item => item.quantity > 0);
        setCart(newCart);
    };

    // Remove from cart
    const removeFromCart = (variantId: string) => {
        setCart(cart.filter(item => item.variantId !== variantId));
    };

    // Submit order
    const handleCreateOrder = async () => {
        if (!customerName.trim() || !customerPhone.trim()) {
            Alert.alert('Missing Info', 'Please enter customer name and phone.');
            return;
        }
        if (cart.length === 0) {
            Alert.alert('Empty Cart', 'Please add at least one item.');
            return;
        }

        setIsLoading(true);
        try {
            await OrderService.createManualOrder({
                sellerId: SELLER_ID,
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                items: cart.map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                    unitPrice: item.price
                })),
                isPaid
            });

            Alert.alert('Success', 'Order created successfully!');
            // Reset state
            setCustomerName('');
            setCustomerPhone('');
            setCart([]);
            setIsPaid(false);
            setExpandedProductId(null);
            onOrderCreated();
            onClose();
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create order');
        } finally {
            setIsLoading(false);
        }
    };

    // Reset on close
    const handleClose = () => {
        setCustomerName('');
        setCustomerPhone('');
        setCart([]);
        setIsPaid(false);
        setExpandedProductId(null);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>New Manual Order</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                        <Text style={styles.closeText}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Customer Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>👤 Customer</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Customer Name"
                            value={customerName}
                            onChangeText={setCustomerName}
                            placeholderTextColor="#9CA3AF"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            value={customerPhone}
                            onChangeText={setCustomerPhone}
                            keyboardType="phone-pad"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {/* Cart Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🛒 Cart ({cart.length} items)</Text>
                        {cart.length === 0 ? (
                            <Text style={styles.emptyText}>No items added. Pick from products below.</Text>
                        ) : (
                            <View style={styles.cartContainer}>
                                {cart.map(item => (
                                    <View key={item.variantId} style={styles.cartItem}>
                                        <View style={styles.cartItemInfo}>
                                            <Text style={styles.cartItemName}>{item.productName}</Text>
                                            <Text style={styles.cartItemVariant}>{item.variantName}</Text>
                                            <Text style={styles.cartItemPrice}>{item.price.toFixed(2)} EGP</Text>
                                        </View>
                                        <View style={styles.cartItemControls}>
                                            <TouchableOpacity 
                                                style={styles.qtyBtn}
                                                onPress={() => updateQuantity(item.variantId, -1)}
                                            >
                                                <Text style={styles.qtyBtnText}>−</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.qtyText}>{item.quantity}</Text>
                                            <TouchableOpacity 
                                                style={styles.qtyBtn}
                                                onPress={() => updateQuantity(item.variantId, 1)}
                                            >
                                                <Text style={styles.qtyBtnText}>+</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={styles.removeBtn}
                                                onPress={() => removeFromCart(item.variantId)}
                                            >
                                                <Text style={styles.removeBtnText}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalValue}>{total.toFixed(2)} EGP</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Product Picker */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📦 Add Products</Text>
                        {products.map(product => (
                            <View key={product.id} style={styles.productCard}>
                                <TouchableOpacity 
                                    style={styles.productHeader}
                                    onPress={() => setExpandedProductId(
                                        expandedProductId === product.id ? null : product.id
                                    )}
                                >
                                    <Text style={styles.productName}>{product.title}</Text>
                                    <Text style={styles.productPrice}>{parseFloat(product.base_price).toFixed(2)} EGP</Text>
                                    <Text style={styles.expandIcon}>
                                        {expandedProductId === product.id ? '▼' : '▶'}
                                    </Text>
                                </TouchableOpacity>
                                
                                {expandedProductId === product.id && product.variants && (
                                    <View style={styles.variantList}>
                                        {product.variants.map(variant => (
                                            <TouchableOpacity 
                                                key={variant.id}
                                                style={[
                                                    styles.variantRow,
                                                    variant.stock <= 0 && styles.variantSoldOut
                                                ]}
                                                onPress={() => variant.stock > 0 && addToCart(product, variant)}
                                                disabled={variant.stock <= 0}
                                            >
                                                <Text style={styles.variantName}>
                                                    {variant.color} / {variant.size}
                                                </Text>
                                                <Text style={[
                                                    styles.variantStock,
                                                    variant.stock <= 0 && styles.stockZero
                                                ]}>
                                                    {variant.stock > 0 ? `Stock: ${variant.stock}` : 'Sold Out'}
                                                </Text>
                                                {variant.stock > 0 && (
                                                    <Text style={styles.addIcon}>+ Add</Text>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Payment Toggle */}
                    <View style={styles.section}>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>💳 Mark as Paid</Text>
                            <Switch
                                value={isPaid}
                                onValueChange={setIsPaid}
                                trackColor={{ false: '#D1D5DB', true: '#34D399' }}
                                thumbColor={isPaid ? '#10B981' : '#F3F4F6'}
                            />
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Footer Button */}
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[
                            styles.createBtn,
                            (cart.length === 0 || isLoading) && styles.createBtnDisabled
                        ]}
                        onPress={handleCreateOrder}
                        disabled={cart.length === 0 || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.createBtnText}>
                                Create Order • {total.toFixed(2)} EGP
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
        fontSize: 20,
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
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        color: '#111827',
    },
    emptyText: {
        color: '#9CA3AF',
        textAlign: 'center',
        paddingVertical: 20,
    },
    cartContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cartItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    cartItemInfo: {
        flex: 1,
    },
    cartItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    cartItemVariant: {
        fontSize: 12,
        color: '#6B7280',
    },
    cartItemPrice: {
        fontSize: 13,
        color: '#059669',
        fontWeight: '600',
    },
    cartItemControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    qtyBtn: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyBtnText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
    },
    qtyText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        minWidth: 24,
        textAlign: 'center',
    },
    removeBtn: {
        marginLeft: 8,
        padding: 4,
    },
    removeBtnText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '700',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 2,
        borderTopColor: '#E5E7EB',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#059669',
    },
    productCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    productHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    productName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    productPrice: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '600',
        marginRight: 12,
    },
    expandIcon: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    variantList: {
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    variantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingLeft: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    variantSoldOut: {
        opacity: 0.5,
    },
    variantName: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
    },
    variantStock: {
        fontSize: 12,
        color: '#6B7280',
        marginRight: 12,
    },
    stockZero: {
        color: '#EF4444',
    },
    addIcon: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 13,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    paymentLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingBottom: 32,
    },
    createBtn: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    createBtnDisabled: {
        backgroundColor: '#D1D5DB',
    },
    createBtnText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
    },
});
