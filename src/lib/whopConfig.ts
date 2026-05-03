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
 * In a professional OAuth flow, we should use the current origin
 * so that session/PKCE data matches the domain the user is on.
 */
export const getWhopRedirectUri = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/auth/whop/callback`;
  }
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
  const pkce = {
    codeVerifier: randomString(32),
    state: randomString(16),
    nonce: randomString(16),
  };
  
  // Store in sessionStorage for the callback to verify
  sessionStorage.setItem(WHOP_STORAGE_KEY, JSON.stringify(pkce));

  const scope = "openid profile email membership:update member:basic:read member:email:read member:stats:read plan:basic:read stats:read chat:read";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: WHOP_CLIENT_ID,
    redirect_uri: redirectUri,
    scope,
    state: pkce.state,
    nonce: pkce.nonce,
    code_challenge: await sha256(pkce.codeVerifier),
    code_challenge_method: "S256",
  });

  window.location.href = `https://api.whop.com/oauth/authorize?${params.toString()}`;
}

export type WhopTier = 'starter' | 'pro' | 'agency';

export interface WhopUser {
  id: string;
  name: string;
  email: string;
  profile_pic_url?: string;
  productTier?: WhopTier;
}
