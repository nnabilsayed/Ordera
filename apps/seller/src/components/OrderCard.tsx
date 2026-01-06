import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Order } from '../types';
import { THEME, getAccessibleUrl } from '../utils';
import { getActionState } from '../utils/statusLogic';

interface OrderCardProps {
  item: Order;
  onUpdateStatus: (id: string, status: string) => void;
  onViewReceipt: (url: string) => void;
  onPress: (order: Order) => void;
}

export const OrderCard = ({ item, onUpdateStatus, onViewReceipt, onPress }: OrderCardProps) => {

  const actionState = getActionState(item.status);
  
  const getTimeAgo = (dateString: string) => {
      const now = new Date();
      const past = new Date(dateString);
      const diffMs = now.getTime() - past.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHrs < 1) return 'Just now';
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays}d ago`;
  };



  const itemCount = item.items?.reduce((sum, i) => sum + i.quantity, 0) || 1; // Fallback to 1 if no items array (legacy/link_ref logic)

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.9}>
      
      {/* Top Row: ID & Status */}
      <View style={styles.row}>
          <Text style={styles.orderId}>Order #{item.human_id}</Text>
          <View style={[styles.badge, { backgroundColor: actionState.bg }]}>
              <Text style={[styles.badgeText, { color: actionState.color }]}>{actionState.label}</Text>
          </View>
      </View>

      {/* Middle: Customer Name */}
      <Text style={styles.customerName}>{item.customer.full_name}</Text>

      {/* Bottom Row: Summary Metrics */}
      <View style={styles.metricsRow}>
          <Text style={styles.metricText}>📦 {itemCount} Items</Text>
          <Text style={styles.metricText}>🕒 {getTimeAgo(item.created_at)}</Text>
          <Text style={styles.totalPrice}>{Number(item.total_amount).toFixed(2)} EGP</Text>
      </View>

      {/* Quick Action Button Removed - Actions must be done via OrderDetailsModal for security */}

    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
  },
  orderId: {
      fontSize: 14,
      fontWeight: '600',
      color: '#6B7280',
  },
  badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
  },
  badgeText: {
      fontSize: 11,
      fontWeight: '700',
  },
  customerName: {
      fontSize: 16,
      fontWeight: '800',
      color: '#111827',
      marginBottom: 12,
  },
  metricsRow: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
  },
  metricText: {
      fontSize: 13,
      color: '#6B7280',
      fontWeight: '500',
  },
  totalPrice: {
      marginLeft: 'auto',
      fontSize: 16,
      fontWeight: '800',
      color: '#059669',
  },
  miniBtn: {
      paddingVertical: 8,
      borderRadius: 6,
      alignItems: 'center',
  },
  miniBtnText: {
      fontSize: 13,
      fontWeight: '700',
  }
});
