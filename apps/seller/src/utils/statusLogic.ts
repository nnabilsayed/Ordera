export interface ActionState {
    label: string;
    color: string;
    bg: string;
    action: 'verify' | 'ship' | 'deliver' | null;
}

export const getActionState = (status: string): ActionState => {
    switch (status) {
        case 'pending_verification':
            return { 
                label: 'Verify Payment', 
                color: '#D97706', // Darker Orange for text
                bg: '#FDE68A', // Light Orange (Amber 200)
                action: 'verify' 
            };
        case 'confirmed':
            return { 
                label: '📦 Pack & Ship', 
                color: '#2563EB', // Blue 600
                bg: '#DBEAFE', // Blue 100
                action: 'ship' 
            };
        case 'shipped':
            return { 
                label: 'Mark Delivered', 
                color: '#7C3AED', // Violet 600
                bg: '#EDE9FE', // Violet 100
                action: 'deliver' 
            };
        case 'delivered':
            return { 
                label: 'Completed', 
                color: '#059669', // Green 600
                bg: '#D1FAE5', // Green 100
                action: null 
            };
        case 'rejected':
            return { 
                label: 'Cancelled', 
                color: '#DC2626', // Red 600
                bg: '#FEE2E2', // Red 100
                action: null 
            };
        default:
            return { 
                label: status, 
                color: '#4B5563', // Gray 600
                bg: '#F3F4F6', // Gray 100
                action: null 
            };
    }
};
