import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { API_URL, SELLER_ID } from './src/config';
import { Product, Order } from './src/types';
import { THEME } from './src/utils';
import { filterProducts, filterOrders } from './src/utils/filterLogic';
import { ProductService } from './src/services/ProductService';
import { OrderService } from './src/services/OrderService';
import { DashboardService } from './src/services/DashboardService';

// Components
import { ProductCard } from './src/components/ProductCard';
import { OrderCard } from './src/components/OrderCard';
import { FilterBar } from './src/components/FilterBar';
import { Dashboard } from './src/components/Dashboard';

// Modals
import { CreateProductModal } from './src/modals/CreateProductModal';
import { EditProductModal } from './src/modals/EditProductModal';
import { InventoryModal } from './src/modals/InventoryModal';
import { GalleryModal } from './src/modals/GalleryModal';
import { ReceiptModal } from './src/modals/ReceiptModal';
import { OrderDetailsModal } from './src/modals/OrderDetailsModal';
import { CreateOrderModal } from './src/modals/CreateOrderModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'dashboard'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [processing, setProcessing] = useState(false);
  
  // Modal Visibility State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  
  // Selected Items for Modals
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null); // For InventoryModal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null); // For EditProductModal
  
  // Image Viewer State
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [activeOrderFilter, setActiveOrderFilter] = useState('All');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Gallery State
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  // Create Order Modal State
  const [isCreateOrderVisible, setIsCreateOrderVisible] = useState(false);

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
      const data = await ProductService.fetchProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchOrders() {
    try {
      const data = await OrderService.fetchOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  }

  // --- Filtering Logic ---
  const filteredProducts = useMemo(() => {
    return filterProducts(products, searchQuery, activeFilter);
  }, [products, searchQuery, activeFilter]);

  const filteredOrders = useMemo(() => {
    return filterOrders(orders, orderSearchQuery, activeOrderFilter);
  }, [orders, orderSearchQuery, activeOrderFilter]);


  // --- Handlers ---

  const handleUpdateProduct = async (data: { id: string; title: string; price: string; image: string | null; variants: Product['variants'] }) => {
    try {
        setProcessing(true);
        await ProductService.updateProduct(data);
        setEditingProduct(null);
        fetchProducts(); // Refresh list
        Alert.alert("Success", "Product updated!");
    } catch (error: any) {
        Alert.alert("Error", error.message);
    } finally {
        setProcessing(false);
    }
  };

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
              await ProductService.deleteProduct(id);
              fetchProducts(); // Refresh list
            } catch (error) {
              Alert.alert("Error", "Could not delete product");
            }
          }
        }
      ]
    );
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
        await OrderService.updateOrderStatus(orderId, newStatus);
        
        // Update selectedOrder locally to reflect change immediately in Modal
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: newStatus });
        }

        fetchOrders(); // Refresh list
    } catch (error: any) {
        Alert.alert("Error", error.message);
    }
  };

  // Open Gallery Logic
  const openGallery = (product: Product) => {
    const images: string[] = [];
    if (product.image_url) images.push(product.image_url);
    if (product.variants) {
        product.variants.forEach(v => {
            if (v.image_url && !images.includes(v.image_url)) {
                images.push(v.image_url);
            }
        });
    }
    
    // If no images, check for images via placeholder logic in render
    if (images.length === 0 && product.variants && product.variants.length > 0 && product.variants[0].image_url) {
         images.push(product.variants[0].image_url);
    }

    if (images.length === 0) return; // Nothing to show?

    setGalleryImages(images);
    setIsGalleryVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ordera</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Online</Text>
        </View>
      </View>

      {/* MAIN CONTENT AREA */}
      <View style={styles.content}>
        
        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            products={products}
            orders={orders}
            onSwitchTab={(tab, filter) => {
              setActiveTab(tab);
              if (tab === 'orders' && filter) {
                setActiveOrderFilter(filter);
              }
            }}
          />
        )}

        {/* 2. PRODUCTS */}
        {activeTab === 'products' && (
          <>
            <FilterBar 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              activeFilter={activeFilter} 
              setActiveFilter={setActiveFilter}
              filterOptions={['All', 'Active', 'Out of Stock', 'Newest']}
            />
            <FlatList
              data={filteredProducts}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <ProductCard 
                  item={item}
                  onEditPress={setEditingProduct}
                  onInfoPress={setViewingProduct}
                  onDeletePress={handleDeleteProduct}
                  onOpenGallery={openGallery}
                />
              )}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
            />
            {/* FAB - Only visible in Products */}
            <TouchableOpacity 
              style={styles.fab} 
              onPress={() => setCreateModalVisible(true)}
            >
              <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
          </>
        )}

        {/* 3. ORDERS */}
        {activeTab === 'orders' && (
          <>
            <FilterBar 
              searchQuery={orderSearchQuery} 
              setSearchQuery={setOrderSearchQuery} 
              activeFilter={activeOrderFilter} 
              setActiveFilter={setActiveOrderFilter} 
              filterOptions={['All', 'Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled']}
              badgeCounts={{
                  'Pending': orders.filter(o => o.status === 'pending' || o.status === 'pending_verification').length
              }}
            />
            <FlatList
              data={filteredOrders}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <OrderCard 
                  item={item} 
                  onUpdateStatus={handleUpdateStatus} 
                  onViewReceipt={setViewingReceipt}
                  onPress={setSelectedOrder} 
                />
              )}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<Text style={styles.empty}>No orders found.</Text>}
            />

            {/* FAB for Manual Order */}
            <TouchableOpacity 
              style={[styles.fab, { backgroundColor: '#3B82F6' }]} 
              onPress={() => setIsCreateOrderVisible(true)}
            >
              <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* BOTTOM TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('products')}>
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>📦 Products</Text>
          {activeTab === 'products' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('orders')}>
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>📃 Orders</Text>
          {activeTab === 'orders' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('dashboard')}>
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>📊 Dashboard</Text>
          {activeTab === 'dashboard' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      {/* MODALS */}
      <CreateProductModal visible={createModalVisible} onClose={() => setCreateModalVisible(false)} onProductCreated={fetchProducts} />
      <EditProductModal visible={!!editingProduct} product={editingProduct} onClose={() => setEditingProduct(null)} onSave={handleUpdateProduct} />
      <InventoryModal visible={!!viewingProduct} product={viewingProduct} onClose={() => setViewingProduct(null)} />
      <GalleryModal visible={isGalleryVisible} images={galleryImages} onClose={() => setIsGalleryVisible(false)} />
      <ReceiptModal visible={!!viewingReceipt} image={viewingReceipt} onClose={() => setViewingReceipt(null)} />
      <OrderDetailsModal 
        visible={!!selectedOrder} 
        order={selectedOrder} 
        products={products}
        onClose={() => setSelectedOrder(null)} 
        onUpdateStatus={handleUpdateStatus}
      />
      <CreateOrderModal 
        visible={isCreateOrderVisible}
        onClose={() => setIsCreateOrderVisible(false)}
        products={products}
        onOrderCreated={fetchOrders}
      />
      
      {processing && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      )}
      
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    paddingTop: 30, // Status bar safe area
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
    padding: 16,
    paddingBottom: 100, // Space for FAB/Tabs
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#9CA3AF',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: THEME.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 30,
    marginTop: -4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingBottom: 25,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeTabText: {
    color: THEME.primary,
    fontWeight: 'bold',
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.primary,
    marginTop: 4,
  }
});
