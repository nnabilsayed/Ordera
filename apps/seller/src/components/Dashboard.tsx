import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { DashboardStats, DashboardService } from '../services/DashboardService';
import { THEME, getAccessibleUrl } from '../utils';
import { Product, Order } from '../types';

interface DashboardProps {
    products: Product[];
    orders: Order[];
    onSwitchTab: (tab: 'orders' | 'products') => void;
}

export const Dashboard = ({ products, orders, onSwitchTab }: DashboardProps) => {
    const [timeRange, setTimeRange] = useState<'1D' | '7D' | '30D' | 'All'>('7D');

    // Calculate Stats locally on range change
    const stats = useMemo(() => {
        return DashboardService.calculateStats(products, orders, timeRange);
    }, [products, orders, timeRange]);

    // Currency Formatter
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
    };

    const ranges: ('1D' | '7D' | '30D' | 'All')[] = ['1D', '7D', '30D', 'All'];

    const { analytics, operations } = stats;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                <Text style={styles.sectionTitle}>Overview</Text>
            </View>

            {/* Time Range Filter */}
            <View style={styles.rangeContainer}>
                {ranges.map(r => (
                    <TouchableOpacity 
                        key={r} 
                        style={[styles.rangeButton, timeRange === r && styles.rangeButtonActive]}
                        onPress={() => setTimeRange(r)}
                    >
                        <Text style={[styles.rangeText, timeRange === r && styles.rangeTextActive]}>{r}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            
            {/* Revenue Card (ANALYTICS) */}
            <View style={[styles.card, styles.revenueCard]}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <View>
                        <Text style={styles.cardLabelWhite}>Total Revenue</Text>
                        <Text style={styles.cardValueWhite}>{formatCurrency(analytics.totalRevenue)}</Text>
                    </View>
                    
                    {/* Trend Badge */}
                    <View style={[
                        styles.trendBadge, 
                        { backgroundColor: analytics.revenueTrend >= 0 ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.2)' } // White-ish or Red-ish
                    ]}>
                        <Text style={styles.trendText}>
                            {analytics.revenueTrend >= 0 ? '↗' : '↘'} {Math.abs(analytics.revenueTrend)}%
                        </Text>
                    </View>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.grid}>
                {/* Pending Orders (OPERATIONS - Real Time) */}
                <TouchableOpacity 
                    style={[styles.card, styles.pendingCard, { flex: 1 }]}
                    onPress={() => onSwitchTab('orders')}
                >
                    <Text style={styles.cardLabel}>Pending Orders</Text>
                    <Text style={[styles.cardValue, { color: '#B45309' }]}>{operations.pendingCount}</Text>
                    <Text style={styles.cardAction}>View Orders →</Text>
                </TouchableOpacity>

                {/* Total Orders (ANALYTICS - Filtered) */}
                <View style={[styles.card, styles.blueCard, { flex: 1 }]}>
                    <Text style={styles.cardLabel}>Total Orders</Text>
                    <Text style={[styles.cardValue, { color: '#1E40AF' }]}>{analytics.totalOrders}</Text>
                </View>
            </View>

            {/* Top Sellers Section (ANALYTICS) */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>🏆 Best Sellers</Text>
            {analytics.topSellers.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={{ color: '#6B7280' }}>No sales data yet.</Text>
                </View>
            ) : (
                <View style={styles.list}>
                    {analytics.topSellers.map((item, index) => (
                        <View key={item.id} style={styles.listItem}>
                             <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                {/* Rank */}
                                <View style={[
                                    styles.rankBadge, 
                                    index === 0 ? { backgroundColor: '#FEF3C7' } : // Gold
                                    index === 1 ? { backgroundColor: '#F3F4F6' } : // Silver (Grey)
                                                  { backgroundColor: '#FFF7ED' }   // Bronze (Orange-ish)
                                ]}>
                                    <Text style={[
                                        styles.rankText,
                                        index === 0 ? { color: '#D97706' } : 
                                        index === 1 ? { color: '#4B5563' } : 
                                                      { color: '#EA580C' }
                                    ]}>
                                        #{index + 1}
                                    </Text>
                                </View>

                                <Image 
                                    source={{ uri: getAccessibleUrl(item.image) || 'https://via.placeholder.com/40' }} 
                                    style={{ width: 40, height: 40, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' }}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                                    {!!item.description && (
                                        <Text style={styles.itemSubtitle}>{item.description}</Text>
                                    )}
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.stockText}>{item.count} sold</Text>
                                <Text style={[styles.itemSubtitle, {fontSize: 10}]}>{formatCurrency(item.revenue)}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* Low Stock Section (OPERATIONS) */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>⚠️ Low Stock Alerts</Text>
            {operations.lowStockItems.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={{ color: 'green', fontWeight: 'bold' }}>All stock levels are healthy! ✅</Text>
                </View>
            ) : (
                <View style={styles.list}>
                    {operations.lowStockItems.map((item, index) => (
                        <View key={index} style={styles.listItem}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Image 
                                    source={{ uri: getAccessibleUrl(item.image) || 'https://via.placeholder.com/40' }} 
                                    style={{ width: 40, height: 40, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' }}
                                />
                                <View>
                                    <Text style={styles.itemTitle}>{item.productName}</Text>
                                    <Text style={styles.itemSubtitle}>{item.variantColor} / {item.variantSize}</Text>
                                </View>
                            </View>
                            <View style={styles.stockBadge}>
                                <Text style={[styles.stockText, { color: '#991B1B' }]}>{item.stock} left</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: THEME.text,
        marginBottom: 0,
    },
    rangeContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 4,
        marginBottom: 16,
        marginTop: 8,
    },
    rangeButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: 6,
    },
    rangeButtonActive: {
        backgroundColor: THEME.card, // or a slight grey
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#eee',
    },
    rangeText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    rangeTextActive: {
        color: THEME.primary,
        fontWeight: 'bold',
    },
    card: {
        borderRadius: 16,
        padding: 20,
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    revenueCard: {
        backgroundColor: '#10B981', // Green
        marginBottom: 16,
    },
    cardLabelWhite: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '600',
    },
    cardValueWhite: {
        color: 'white',
        fontSize: 32,
        fontWeight: '800',
        marginTop: 4,
    },
    grid: {
        flexDirection: 'row',
        gap: 16,
    },
    pendingCard: {
        backgroundColor: '#FEF3C7', // Yellow
    },
    blueCard: {
        backgroundColor: '#DBEAFE', // Blue
    },
    cardLabel: {
        color: '#4B5563',
        fontSize: 14,
        fontWeight: '600',
    },
    cardValue: {
        fontSize: 28,
        fontWeight: '800',
        marginTop: 4,
    },
    cardAction: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4B5563',
    },
    list: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 10,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    itemTitle: {
        fontWeight: '600',
        color: THEME.text,
        fontSize: 14,
    },
    itemSubtitle: {
        color: '#6B7280',
        fontSize: 12,
    },
    stockBadge: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    stockText: {
        color: '#991B1B', // Red text
        fontWeight: 'bold',
        fontSize: 12,
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
    },
    trendBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    trendText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    rankBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    rankText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
});
