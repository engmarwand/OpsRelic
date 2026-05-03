import React, { createContext, useContext, useState, useEffect } from 'react';
import { WhopUser, WHOP_PRODUCT_TIERS, WhopTier, WHOP_STORAGE_KEY, getWhopRedirectUri } from '../lib/whopConfig';

interface AuthContextType {
  user: WhopUser | null;
  loading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<WhopUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const session = await response.json();
        
        // Fetch Memberships to determine Tier
        const membershipsResponse = await fetch('/api/auth/whop/memberships');
        let tier: WhopTier = 'starter';
        
        if (membershipsResponse.ok) {
          const membershipsData = await membershipsResponse.json();
          const activeMembership = membershipsData.data?.find((m: any) => 
            m.status === 'active' && WHOP_PRODUCT_TIERS[m.product_id as keyof typeof WHOP_PRODUCT_TIERS]
          );
          if (activeMembership) {
            tier = WHOP_PRODUCT_TIERS[activeMembership.product_id as keyof typeof WHOP_PRODUCT_TIERS] as WhopTier;
          }
        }

        const mappedUser: WhopUser = {
          id: session.whopUserId,
          name: session.name,
          email: session.email,
          productTier: tier,
        };
        setUser(mappedUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Session check failed:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      sessionStorage.removeItem(WHOP_STORAGE_KEY);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check for OAuth code in URL (PKCE Exchange)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code) {
        setLoading(true);
        const pkceStr = sessionStorage.getItem(WHOP_STORAGE_KEY);
        if (pkceStr) {
          try {
            const pkce = JSON.parse(pkceStr);
            if (pkce.state === state) {
              const exchangeResponse = await fetch('/api/auth/whop/exchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  code, 
                  code_verifier: pkce.codeVerifier,
                  redirect_uri: getWhopRedirectUri()
                }),
              });

              if (exchangeResponse.ok) {
                console.log('Whop exchange successful');
                // Success! Clear PKCE and refresh session
                sessionStorage.removeItem(WHOP_STORAGE_KEY);
                window.history.replaceState({}, document.title, window.location.pathname);
                await checkSession();
                window.location.hash = '#dashboard';
                return;
              } else {
                const errData = await exchangeResponse.json().catch(() => ({}));
                console.error('Whop exchange failed:', errData);
                setError(errData.error || 'Authentication failed during code exchange.');
              }
            } else {
              setError('Security mismatch detected.');
            }
          } catch (e) {
            console.error('Exchange error:', e);
            setError('An error occurred during authentication flow.');
          }
        }
        setLoading(false);
      }

      // 2. Check existing session if no code in URL
      await checkSession();
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, isAuthenticated: !!user, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
