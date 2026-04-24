// Values come from .env (EXPO_PUBLIC_* vars are inlined by Expo at build time).
// Set EXPO_PUBLIC_API_BASE_URL to the IP shown in the Flask server console.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL;
