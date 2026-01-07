import { Dimensions, Linking, Alert } from 'react-native';
import { API_URL } from './config';

export const openWhatsApp = async (phone: string | undefined, orderId: string, name: string) => {
    if (!phone) {
        Alert.alert("Error", "No phone number available.");
        return;
    }

    // 1. Sanitize: Remove all non-digits
    let cleanPhone = phone.replace(/\D/g, '');

    // 2. Egypt Format Logic
    if (cleanPhone.startsWith('010') || cleanPhone.startsWith('011') || cleanPhone.startsWith('012') || cleanPhone.startsWith('015')) {
        cleanPhone = '2' + cleanPhone; // Replace leading 0 with 20 effectively? No, remove 0 then add 20, or just prepend 2 if it starts with 0
        // User said: "If the number starts with "0" (e.g., "010..."), replace the leading "0" with "20"."
        // cleanPhone is "010..." -> replace start 0 with 20 -> "2010..."
    } 
    
    // Exact implementation of user rule:
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '2' + cleanPhone.substring(1); // "010..." -> "2" + "10..." = "2010..."
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
        cleanPhone = '20' + cleanPhone;
    }

    const message = `Hi ${name}, I received your order #${orderId} on Ordera. We are preparing it now!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    try {
        await Linking.openURL(url);
    } catch (err) {
        Alert.alert("Error", "Could not open WhatsApp");
    }
};

export const SCREEN_WIDTH = Dimensions.get('window').width;

// Helper to fix localhost URLs for physical devices (iPhone/Android)
export const getAccessibleUrl = (url: string | null | undefined) => {
  if (!url) return null;
  
  // 1. If it's already a full remote URL (not localhost), use it.
  if (url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url;
  }

  // 2. Clean the path (remove localhost part if present)
  let cleanPath = url
    .replace('http://localhost:3001', '')
    .replace('http://127.0.0.1:3001', '')
    .replace('http://10.0.2.2:3001', '');

  // 3. Ensure it starts with /
  if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
  }

  // 4. Prepend the API URL
  return `${API_URL}${cleanPath}`;
};

export const THEME = {
  primary: "#4F46E5", // Indigo/Blurple
  background: "#F3F4F6", // Soft Gray
  card: "#FFFFFF",
  text: "#1F2937", // Dark Gray
  textSecondary: "#6B7280",
  success: "#10B981",
  border: "#E5E7EB"
};
