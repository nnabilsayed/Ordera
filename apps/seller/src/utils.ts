import { Dimensions } from 'react-native';

export const MANUAL_SERVER_URL = 'http://192.168.1.2:3001';

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

  // 4. Prepend the hardcoded manual server URL (IP address)
  return `${MANUAL_SERVER_URL}${cleanPath}`;
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
