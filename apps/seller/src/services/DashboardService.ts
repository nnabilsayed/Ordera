import { Product, Order } from '../types';

export interface LowStockItem {
    id: string;
    productName: string;
    variantColor: string;
    variantSize: string;
    stock: number;
    image?: string;
}

export interface TopSeller {
    id: string; // Variant ID or Product ID
    name: string;
    description: string; // e.g., "Red / L"
    count: number;
    revenue: number;
    image?: string;
}

export interface DashboardAnalytics {
    totalRevenue: number;
    revenueTrend: number;
    totalOrders: number;
    topSellers: TopSeller[];
}

export interface DashboardOperations {
    pendingCount: number;
    lowStockItems: LowStockItem[];
}

export interface DashboardStats {
    analytics: DashboardAnalytics;
    operations: DashboardOperations;
}

export const DashboardService = {
    calculateStats(products: Product[], orders: Order[], timeRange: '1D' | '7D' | '30D' | 'All' = 'All'): DashboardStats {
        // --- OPERATIONS (Global / Real-time) ---
        
        // 1. Pending Orders Count (Always Global)
        const pendingCount = orders.filter(o => 
            o.status === 'pending_verification' || o.status === 'pending'
        ).length;

        // 2. Low Stock Items (Always Global)
        const lowStockItems: LowStockItem[] = [];
        products.forEach(p => {
            if (p.variants) {
                p.variants.forEach(v => {
                    if (v.stock < 5) {
                        lowStockItems.push({
                            id: v.id,
                            productName: p.title,
                            variantColor: v.color,
                            variantSize: v.size,
                            stock: v.stock,
                            image: v.image_url || p.image_url || undefined
                        });
                    }
                });
            }
        });

        // --- ANALYTICS (Time Filtered) ---

        // 1. Filter Orders by Time Range
        const now = new Date();
        const filteredOrders = orders.filter(o => {
            if (timeRange === 'All') return true;
            if (!o.created_at) return false;
            
            const orderDate = new Date(o.created_at);
            const diffTime = Math.abs(now.getTime() - orderDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (timeRange === '1D') return diffDays <= 1;
            if (timeRange === '7D') return diffDays <= 7;
            if (timeRange === '30D') return diffDays <= 30;
            return true;
        });

        // Revenue Logic: Include ALL orders except Cancelled/Rejected (Gross Sales)
        // Previously restricted to Paid/Shipped/Delivered. Now includes Pending.
        const validOrdersForRevenue = filteredOrders.filter(o => 
            o.status !== 'cancelled' && o.status !== 'rejected'
        );

        // 3. Total Revenue (Filtered)
        const totalRevenue = validOrdersForRevenue.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);

        // 4. Revenue Trend 
        let revenueTrend = 0;
        
        if (timeRange !== 'All') {
             const days = timeRange === '1D' ? 1 : timeRange === '7D' ? 7 : 30;
             const rangeStart = new Date();
             rangeStart.setDate(rangeStart.getDate() - days);
             
             const prevRangeStart = new Date(rangeStart);
             prevRangeStart.setDate(prevRangeStart.getDate() - days);

             // Previous Period Revenue (Same logic: non-cancelled)
             const prevOrders = orders.filter(o => {
                 if (!o.created_at) return false;
                 const d = new Date(o.created_at);
                 return d >= prevRangeStart && d < rangeStart && 
                        (o.status !== 'cancelled' && o.status !== 'rejected');
             });
             
             const prevRevenue = prevOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);
             
             if (prevRevenue > 0) {
                 revenueTrend = Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);
             } else if (totalRevenue > 0) {
                 revenueTrend = 100;
             }
        }

        // 5. Top Sellers Logic (Time Bound, based on Valid Revenue Orders)
        const salesMap = new Map<string, TopSeller>();

        validOrdersForRevenue.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    const key = item.variant_id || item.product_id;
                    if (!salesMap.has(key)) {
                        // Find product info for image/name
                        let productName = "Unknown Product";
                        let variantDesc = "";
                        let imageUrl = undefined;

                        const product = products.find(p => p.id === item.product_id);
                        if (product) {
                            productName = product.title;
                            if (item.variant_id && product.variants) {
                                const variant = product.variants.find(v => v.id === item.variant_id);
                                if (variant) {
                                    variantDesc = `${variant.color} / ${variant.size}`;
                                    imageUrl = variant.image_url;
                                }
                            }
                            if (!imageUrl) imageUrl = product.image_url || undefined;
                        }

                        salesMap.set(key, {
                            id: key,
                            name: productName,
                            description: variantDesc,
                            count: 0,
                            revenue: 0,
                            image: imageUrl
                        });
                    }

                    const entry = salesMap.get(key)!;
                    entry.count += item.quantity;
                    entry.revenue += item.quantity * parseFloat(item.unit_price as any || '0');
                });
            }
        });

        const topSellers = Array.from(salesMap.values())
            .sort((a, b) => b.count - a.count) // Sort by Quantity Sold ? Or Revenue? Usually Top Sellers implies Quantity.
            .slice(0, 3); 

        return {
            analytics: {
                totalRevenue,
                revenueTrend,
                totalOrders: filteredOrders.length,
                topSellers
            },
            operations: {
                pendingCount,
                lowStockItems
            }
        };
    }
};
