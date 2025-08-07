import storage from '../utils/storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://0cf8f361-2398-415b-b274-ff11de2ad810.preview.emergentagent.com';

export async function fetcher(endpoint: string, options: RequestInit = {}) {
  try {
    const token = await storage.getItem('auth_token');
    
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    // Debug log for authorization header
    if (token) {
      console.log(`🔑 API call to ${endpoint} with Authorization: Bearer ${token.slice(0, 12)}...`);
    } else {
      console.log(`📡 API call to ${endpoint} without auth token`);
    }
    
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    console.log(`📡 API Response: ${res.status} ${res.statusText} for ${endpoint}`);
    
    if (res.status === 401) {
      console.error('🚫 401 Unauthorized - clearing auth data');
      await storage.clear();
      throw new Error('unauth');
    }
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  return fetcher(endpoint, options);
}

// Enhanced fetcher for authentication endpoints
export async function authFetcher(endpoint: string, data: any) {
  try {
    console.log(`🔐 Auth API call to ${endpoint}`);
    
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    console.log(`🔐 Auth Response: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('Auth fetch error:', error);
    throw error;
  }
}

// API endpoints
export const endpoints = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  
  // Trust & Transparency
  TRUST_CONSENT_MIX: '/api/v1/metrics/consent_mix',
  TRUST_CLIPS_ANON: '/api/v1/metrics/clips_anon',
  TRUST_CIVIC_EXPORTS: '/api/v1/metrics/civic_exports',
  
  // CityScape (QA only)
  CITYSCAPE_TILE: (z: number, x: number, y: number) => `/api/v1/cityscape/tiles/${z}/${x}/${y}`,
  
  // User data
  CONSENT_STATUS: '/api/v1/consent',
  SUBSCRIPTION_STATUS: '/api/v1/subscription/status',
  DASHBOARD_KPIS: '/api/kpis',
  EVENTS: '/api/events',
};

export default fetcher;