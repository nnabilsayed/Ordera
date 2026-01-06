import { API_URL, SELLER_ID } from '../config';
import { Order } from '../types';

export const OrderService = {
    async fetchOrders(): Promise<Order[]> {
        const res = await fetch(`${API_URL}/orders/${SELLER_ID}`);
        if (!res.ok) throw new Error("Failed to fetch orders");
        return await res.json();
    },

    async updateOrderStatus(orderId: string, status: string) {
        const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error("Failed to update order status");
        return await res.json();
    },

    async createManualOrder(orderData: {
        sellerId: string;
        customerName: string;
        customerPhone: string;
        items: { variantId: string; quantity: number; unitPrice: number }[];
        isPaid: boolean;
    }) {
        const res = await fetch(`${API_URL}/orders/manual`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || "Failed to create order");
        }
        return await res.json();
    }
};
