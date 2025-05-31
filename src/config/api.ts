export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  }
}; 