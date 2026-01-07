export interface ActionState {
    statusLabel: string;
    buttonLabel: string | null;
    color: string;
    bg: string;
    action: 'verify' | 'ship' | 'deliver' | null;
}

export const getActionState = (status: string): ActionState => {
    switch (status) {
        case 'pending':
        case 'pending_verification':
            return { 
                statusLabel: 'Needs Verification',
                buttonLabel: 'Verify Payment', 
                color: '#D97706', // Darker Orange for text
                bg: '#FDE68A', // Light Orange (Amber 200)
                action: 'verify' 
            };
        case 'confirmed':
            return { 
                statusLabel: 'Paid',
                buttonLabel: '📦 Pack & Ship', 
                color: '#2563EB', // Blue 600
                bg: '#DBEAFE', // Blue 100
                action: 'ship' 
            };
        case 'shipped':
            return { 
                statusLabel: 'Shipped',
                buttonLabel: 'Mark Delivered', 
                color: '#7C3AED', // Violet 600
                bg: '#EDE9FE', // Violet 100
                action: 'deliver' 
            };
        case 'delivered':
            return { 
                statusLabel: 'Delivered',
                buttonLabel: null, 
                color: '#059669', // Green 600
                bg: '#D1FAE5', // Green 100
                action: null 
            };
        case 'rejected':
            return { 
                statusLabel: 'Cancelled',
                buttonLabel: null, 
                color: '#DC2626', // Red 600
                bg: '#FEE2E2', // Red 100
                action: null 
            };
        default:
            return { 
                statusLabel: status,
                buttonLabel: null, 
                color: '#4B5563', // Gray 600
                bg: '#F3F4F6', // Gray 100
                action: null 
            };
    }
};
