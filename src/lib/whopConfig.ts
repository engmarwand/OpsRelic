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
 * We must use a frontend-handled path for the callback to maintain PKCE state in sessionStorage.
 */
export const getWhopRedirectUri = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // We use /oauth/callback as the redirect URI
    if (hostname.includes('opsrelic.com')) {
      return "https://www.opsrelic.com/oauth/callback";
    }
    return `${window.location.origin}/oauth/callback`;
  }
  return "https://www.opsrelic.com/oauth/callback";
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

export const startWhopOAuth = async (
  clientId: string,
  redirectUri: string,
  scope = "openid profile email membership:update member:basic:read member:email:read member:stats:read plan:basic:read stats:read chat:read",
) => {
  const pkce = {
    codeVerifier: randomString(32),
    state: randomString(16),
    nonce: randomString(16),
  };
  sessionStorage.setItem(WHOP_STORAGE_KEY, JSON.stringify(pkce));

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state: pkce.state,
    nonce: pkce.nonce,
    code_challenge: await sha256(pkce.codeVerifier),
    code_challenge_method: "S256",
  });

  const url = `https://api.whop.com/oauth/authorize?${params}`;
  console.log("Starting Whop OAuth with:", { clientId, redirectUri, url });
  window.location.href = url;
}

export interface WhopTokens {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  obtained_at: number;
}

export async function handleWhopCallback(
  clientId: string,
  redirectUri: string,
): Promise<WhopTokens> {
  const params = new URLSearchParams(window.location.search);
  const [code, returnedState, error] = [
    params.get("code"),
    params.get("state"),
    params.get("error"),
  ];
  
  if (error) {
    throw new Error(`OAuth error: ${error} - ${params.get("error_description") || ""}`);
  }

  if (!code) throw new Error("No code in callback URL");

  const stored = JSON.parse(sessionStorage.getItem(WHOP_STORAGE_KEY) || "null");
  sessionStorage.removeItem(WHOP_STORAGE_KEY);
  
  if (!stored || returnedState !== stored.state) {
    throw new Error("Invalid state - possible CSRF");
  }

  // We use our OWN server to exchange the code.
  // This is safer as it hides the Client Secret and avoids CORS issues.
  const res = await fetch("/api/auth/whop/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri,
      code_verifier: stored.codeVerifier,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${err.error_description || err.error || res.status}`);
  }

  const tokens = await res.json();
  // Our server returns { success: true, user: ... } and sets a cookie.
  // We return a dummy tokens object since the session is now set via cookie.
  return {
    access_token: "set-via-cookie",
    refresh_token: "set-via-cookie",
    token_type: "Bearer",
    expires_in: 3600,
    obtained_at: Date.now(),
  };
}

export type WhopTier = 'starter' | 'pro' | 'agency';

export interface WhopUser {
  id: string;
  name: string;
  email: string;
  profile_pic_url?: string;
  productTier?: WhopTier;
}
