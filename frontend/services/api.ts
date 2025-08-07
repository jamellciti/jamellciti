const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://0cf8f361-2398-415b-b274-ff11de2ad810.preview.emergentagent.com';

export async function fetcher(endpoint: string) {
  try {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

export async function fetchWithAuth(endpoint: string, token: string) {
  try {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('Auth API fetch error:', error);
    throw error;
  }
}

// API endpoints
export const endpoints = {
  // Trust & Transparency
  TRUST_CONSENT_MIX: '/api/v1/metrics/consent_mix',
  TRUST_CLIPS_ANON: '/api/v1/metrics/clips_anon',
  TRUST_CIVIC_EXPORTS: '/api/v1/metrics/civic_exports',
  
  // CityScape (QA only)
  CITYSCAPE_TILE: (z: number, x: number, y: number) => `/api/v1/cityscape/tiles/${z}/${x}/${y}`,
  
  // Existing endpoints
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  CONSENT_STATUS: '/api/v1/consent',
  SUBSCRIPTION_STATUS: '/api/v1/subscription/status',
  DASHBOARD_KPIS: '/api/kpis',
  EVENTS: '/api/events',
};

export default fetcher;