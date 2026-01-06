import { Product, Order } from '../types';

export const filterProducts = (products: Product[], searchQuery: string, activeFilter: string): Product[] => {
    let result = [...products];

    // 1. Search Query
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(p => p.title.toLowerCase().includes(q));
    }

    // 2. Filter Tabs
    switch (activeFilter) {
        case 'Out of Stock':
            result = result.filter(p => {
                const totalStock = p.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                return totalStock === 0;
            });
            break;
        case 'Active':
            result = result.filter(p => {
                const totalStock = p.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                return totalStock > 0;
            });
            break;
        case 'Newest':
            result.reverse(); 
            break;
        default: // 'All'
            break;
    }

    return result;
};

export const filterOrders = (orders: Order[], query: string, filter: string): Order[] => {
    let result = [...orders];

    // 1. Search Query (Customer Name or Order ID)
    if (query) {
        const q = query.toLowerCase();
        result = result.filter(o => 
            o.customer.full_name.toLowerCase().includes(q) || 
            o.human_id.toString().includes(q)
        );
    }

    // 2. Filter by Status
    if (filter !== 'All') {
        // Status in DB might be lower case (e.g. 'pending_verification', 'confirmed', 'shipped')
        // Filter options might be Title Case (e.g. 'Pending', 'Shipped')
        
        const filterKey = filter.toLowerCase();
        
        result = result.filter(o => {
            const status = o.status.toLowerCase();
            if (filterKey === 'pending') return status === 'pending_verification' || status === 'pending';
            if (filterKey === 'paid') return status === 'confirmed'; // Assuming 'confirmed' means paid per previous code context
            return status === filterKey;
        });
    }

    return result;
};
