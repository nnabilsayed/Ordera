import { Platform } from 'react-native';

const LOCALHOST = Platform.select({
  android: 'http://10.0.2.2:3001',
  ios: 'http://localhost:3001',
  default: 'http://localhost:3001',
});

// REPLACE "192.168.1.X" WITH YOUR ACTUAL COMPUTER IP:
export const API_URL = "http://192.168.1.2:3001";
// export const API_URL = LOCALHOST;

// Hardcoded from /test-seed endpoint
export const SELLER_ID = "dc5d47ce-0235-4f1b-9269-6f84b458100b";

// This points to the Next.js website (Buyer App)
export const WEB_URL = "http://192.168.1.2:3000";