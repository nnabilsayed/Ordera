import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Share, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, SafeAreaView, Image } from 'react-native';
import { useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { API_URL, SELLER_ID, WEB_URL } from './src/config';

// --- THEME ---
const THEME = {
  primary: "#4F46E5", // Indigo/Blurple
  background: "#F3F4F6", // Soft Gray
  card: "#FFFFFF",
  text: "#1F2937", // Dark Gray
  textSecondary: "#6B7280",
  success: "#10B981",
  border: "#E5E7EB"
};

// Types
interface Product {
  id: string;
  title: string;
  base_price: string;
  variants: { id: string; name: string; stock: number }[];
}

interface Order {
  id: string;
  human_id: number;
  total_amount: string;
  status: string;
  created_at: string;
  payment_proof_url?: string | null;
  customer: {
    full_name: string;
    phone: string;
    address: string;
  };
  link_ref: {
    ref_tag: string;
    product: { title: string }; // Needed for title
  };
  variant?: {
    name: string;
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newProductTitle, setNewProductTitle] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  
  // Variant Creation State
  const [newVariants, setNewVariants] = useState<{name: string, stock: string}[]>([]);
  const [tempVariantName, setTempVariantName] = useState('');
  const [tempVariantStock, setTempVariantStock] = useState('');

  const [creating, setCreating] = useState(false);
  
  // Image Viewer State
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchProducts();
    fetchOrders(); 
  }, []);

  // Poll for new orders
  useEffect(() => {
    if (activeTab === 'orders') {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000); 
        return () => clearInterval(interval);
    }
  }, [activeTab]);

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_URL}/products/${SELLER_ID}`);
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch(`${API_URL}/orders/${SELLER_ID}`);
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  }

  // Add Variant to List
  const handleAddVariant = () => {
    if (!tempVariantName || !tempVariantStock) {
        Alert.alert("Error", "Enter name and stock for the size/variant");
        return;
    }
    setNewVariants([...newVariants, { name: tempVariantName, stock: tempVariantStock }]);
    setTempVariantName('');
    setTempVariantStock('');
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

      setModalVisible(false);
      
      // Reset State
      setNewProductTitle('');
      setNewProductPrice('');
      setNewVariants([]);
      setTempVariantName('');
      setTempVariantStock('');
      
      fetchProducts();
      Alert.alert("Success", "Product Created!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setCreating(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = (id: string) => {
    Alert.alert(
      "Delete Product?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
              if (!res.ok) throw new Error("Failed to delete");
              fetchProducts(); // Refresh list
            } catch (error) {
              Alert.alert("Error", "Could not delete product");
            }
          }
        }
      ]
    );
  };

  // Update Status Logic
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error("Failed to update");
        fetchOrders(); // Refresh immediately
    } catch (error: any) {
        Alert.alert("Error", error.message);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch(status) {
        case 'confirmed': return { bg: '#D1FAE5', text: '#065F46', label: 'Confirmed' };
        case 'shipped': return { bg: '#DBEAFE', text: '#1E40AF', label: 'Shipped' };
        case 'rejected': return { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' };
        default: return { bg: '#FEF3C7', text: '#92400E', label: 'Pending' };
    }
  };

  // Share Logic
  const handleShare = async (product: Product) => {
    try {
      const generateRes = await fetch(`${API_URL}/links/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: SELLER_ID,
          productId: product.id,
          isPriceLocked: false
        }),
      });

      const data = await generateRes.json();
      if (data.error) throw new Error(data.error);

      const { refTag } = data;
      const url = `${WEB_URL}/pay/${refTag}`;
      const message = `Check out this look! ${url} (Ref: ${refTag})`;

      await Share.share({ message, url, title: `Buy ${product.title}` });
    } catch (error: any) {
      Alert.alert("Share Error", error.message);
    }
  };

  // Copy Confirmation
  const handleCopyConfirmation = async (order: Order) => {
    const text = `Thanks ${order.customer.full_name}! Order #${order.human_id} is confirmed. We will ship it soon! 🚀`;
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied!", "You can now paste it in the chat.");
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{flex: 1}}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardPrice}>{item.base_price} EGP</Text>
            {item.variants && item.variants.length > 0 && (
                <Text style={styles.variantList}>
                    Sizes: {item.variants.map(v => v.name).join(', ')}
                </Text>
            )}
        </View>
        <View style={styles.actionButtons}>
            <TouchableOpacity 
                style={styles.shareButton} 
                activeOpacity={0.8}
                onPress={() => handleShare(item)}
            >
                <Text style={styles.shareButtonText}>Share 🔗</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={styles.deleteButton} 
                activeOpacity={0.8}
                onPress={() => handleDeleteProduct(item.id)}
            >
                <Text style={styles.deleteButtonText}>🗑</Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderOrder = ({ item }: { item: Order }) => {
    const badge = getStatusBadge(item.status);
    
    return (
    <View style={styles.card}>
      <View style={styles.orderHeader}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <Text style={styles.orderId}>#{item.human_id}</Text>
            <View style={{backgroundColor: badge.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6}}>
                <Text style={{color: badge.text, fontSize: 10, fontWeight: '700'}}>{badge.label}</Text>
            </View>
        </View>
        <Text style={styles.orderPrice}>{item.total_amount} EGP</Text>
      </View>
      
      {item.link_ref?.product?.title && (
          <Text style={styles.orderProductTitle}>
              {item.link_ref.product.title} 
              <Text style={{color: THEME.primary, fontWeight: '800'}}>
                 {item.variant ? ` (Size: ${item.variant.name})` : ' (No Size)'}
              </Text>
          </Text>
      )}
      
      <View style={styles.separator} />

      <View style={styles.orderBody}>
        <Text style={styles.customerRow}>👤 {item.customer.full_name}</Text>
        <Text style={styles.customerRow}>📞 {item.customer.phone}</Text>
        <Text style={styles.customerRow}>📍 {item.customer.address}</Text>
        <Text style={styles.refTag}>Via Link: {item.link_ref?.ref_tag || 'N/A'}</Text>
      </View>
      
      {/* ACTION BUTTONS */}
      <View style={styles.statusActions}>
        {/* Pending Actions */}
        {(item.status === 'pending_verification') && (
            <>
                <TouchableOpacity 
                    style={[styles.statusBtn, {backgroundColor: '#EF4444'}]} 
                    onPress={() => handleUpdateStatus(item.id, 'rejected')}
                >
                    <Text style={styles.statusBtnText}>❌ Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.statusBtn, {backgroundColor: '#10B981'}]} 
                    onPress={() => handleUpdateStatus(item.id, 'confirmed')}
                >
                    <Text style={styles.statusBtnText}>✅ Confirm</Text>
                </TouchableOpacity>
            </>
        )}

        {/* Confirmed Actions */}
        {item.status === 'confirmed' && (
            <TouchableOpacity 
                style={[styles.statusBtn, {backgroundColor: '#3B82F6', flex: 1}]} 
                onPress={() => handleUpdateStatus(item.id, 'shipped')}
            >
                <Text style={styles.statusBtnText}>🚚 Ship Order</Text>
            </TouchableOpacity>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
            style={styles.buttonOutline} 
            activeOpacity={0.8}
            onPress={() => handleCopyConfirmation(item)}
        >
            <Text style={styles.buttonOutlineText}>Copy Text 📋</Text>
        </TouchableOpacity>

        {item.payment_proof_url && (
            <TouchableOpacity 
                style={styles.buttonGhost} 
                activeOpacity={0.8}
                onPress={() => setViewingReceipt(item.payment_proof_url || null)}
            >
                <Text style={styles.buttonGhostText}>View Receipt 🖼</Text>
            </TouchableOpacity>
        )}
      </View>
    </View>
  );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ... (main render remains) */}
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ordera</Text>
        <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Online</Text>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === 'products' ? (
           <FlatList
             data={products}
             keyExtractor={item => item.id}
             renderItem={renderProduct}
             contentContainerStyle={styles.list}
             ListEmptyComponent={<Text style={styles.empty}>No products yet.</Text>}
           />
        ) : (
           <FlatList
             data={orders}
             keyExtractor={item => item.id}
             renderItem={renderOrder}
             contentContainerStyle={styles.list}
             ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
           />
        )}
      </View>

      {/* FAB */}
      {activeTab === 'products' && (
        <TouchableOpacity 
            style={styles.fab} 
            activeOpacity={0.8}
            onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
            style={styles.tab} 
            activeOpacity={0.8}
            onPress={() => setActiveTab('products')}
        >
            <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
                📦 Products
            </Text>
            {activeTab === 'products' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity 
            style={styles.tab} 
            activeOpacity={0.8}
            onPress={() => setActiveTab('orders')}
        >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
                📃 Orders
            </Text>
            {activeTab === 'orders' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Create Product Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
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
                        placeholder="Size (e.g. Medium)" 
                        value={tempVariantName}
                        onChangeText={setTempVariantName}
                    />
                    <TextInput 
                        style={[styles.input, {flex: 1}]} 
                        placeholder="Qty" 
                        keyboardType="numeric"
                        value={tempVariantStock}
                        onChangeText={setTempVariantStock}
                    />
                </View>

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
                                    <Text style={{color: THEME.text, fontWeight: '600', fontSize: 13}}>{v.name}</Text>
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
                onPress={() => setModalVisible(false)}
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

      {/* Image Viewer Modal */}
      <Modal
        visible={!!viewingReceipt}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewingReceipt(null)}
      >
        <View style={styles.imageModalContainer}>
            <TouchableOpacity 
                style={styles.imageModalCloseArea}
                onPress={() => setViewingReceipt(null)}
            />
            
            <View style={styles.imageModalContent}>
                <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => setViewingReceipt(null)}
                >
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>

                {viewingReceipt && (
                    <Image 
                        source={{ uri: viewingReceipt }} 
                        style={styles.fullImage} 
                        resizeMode="contain"
                    />
                )}
            </View>
        </View>
      </Modal>
      
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: -0.5,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for FAB
  },
  empty: {
    textAlign: 'center',
    marginTop: 60,
    color: THEME.textSecondary,
    fontSize: 16,
  },

  // CARDS
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  variantList: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 16,
    color: THEME.primary,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },

  // ORDER STYLES
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.primary,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  customerRow: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 6,
  },
  refTag: {
    marginTop: 8,
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  
  // Status Actions
  statusActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },

  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  buttonOutline: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#9CA3AF', // Lighter border for secondary action
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: THEME.text,
    fontWeight: '700',
    fontSize: 14,
  },
  buttonGhost: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonGhostText: {
    color: THEME.primary,
    fontWeight: '700',
    fontSize: 14,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 90, // Above tabs
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 32,
    marginTop: -4,
  },
  
  // TABS
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  activeTabText: {
    color: THEME.primary,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.primary,
  },

  // MODAL
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

  // MODAL - Image Viewer
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
  
  // NEW MISSING STYLES
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteButtonText: {
    fontSize: 14,
  },
  // Duplicates removed (statusActions, etc. are already at lines 702+)
});
