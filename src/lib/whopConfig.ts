// Product IDs mapping
export const WHOP_PRODUCT_TIERS = {
  'prod_q1yWnOh7XBg7N': 'starter',
  'prod_4mjwFYSyRDCyz': 'pro',
  'prod_cvOeKqq0GMWED': 'agency',
} as const;

export const WHOP_CLIENT_ID = 'app_Lm1pKoAki3PWjp';
export const WHOP_STORE_URL = 'https://whop.com/opsrelic-hq';
export const WHOP_STORAGE_KEY = "whop_oauth_pkce";

/**
 * Gets the redirect URI based on the current environment.
 * Supports localhost for development and www.opsrelic.com for production
 */
export const getWhopRedirectUri = () => {
  // Get the current origin from window.location
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // If running locally or in development, use current domain
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    return `${currentOrigin}/api/auth/whop/callback`;
  }
  
  // Production: always use www.opsrelic.com
  return "https://www.opsrelic.com/api/auth/whop/callback";
};

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(
    /[+/=]/g,
    (c) => ({ "+": "-", "/": "_", "=": "" })[c]!
  );
}

function randomString(len: number) {
  return base64url(crypto.getRandomValues(new Uint8Array(len)));
}

async function sha256(str: string) {
  return base64url(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))
    )
  );
}

export async function startWhopOAuth(redirectUri: string) {
  // We use server-side login to handle PKCE securely and set cookies.
  // We MUST ensure the login starts on the SAME domain as the redirectUri
  // otherwise cookies set by the login endpoint won't be visible to the callback.
  const url = new URL(redirectUri);
  const loginUrl = `${url.origin}/api/auth/whop/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
  console.log("[v0] Starting Whop OAuth with redirect URI:", redirectUri);
  console.log("[v0] Login URL:", loginUrl);
  window.location.href = loginUrl;
}

export type WhopTier = 'starter' | 'pro' | 'agency';

export interface WhopUser {
  id: string;
  name: string;
  email: string;
  profile_pic_url?: string;
  productTier?: WhopTier;
}
