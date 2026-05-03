import React, { createContext, useContext, useState, useEffect } from 'react';
import { WhopUser, WHOP_PRODUCT_TIERS, WhopTier, WHOP_STORAGE_KEY } from '../lib/whopConfig';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: WhopUser | null;
  loading: boolean;
  login: (tokens: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<WhopUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async (tokens: any) => {
    try {
      // Fetch User Info
      const userInfoResponse = await fetch('/api/auth/whop/userinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: tokens.access_token }),
      });
      
      if (!userInfoResponse.ok) throw new Error('Failed to fetch user info');
      const userData = await userInfoResponse.json();

      // Fetch Memberships to check Tier
      const membershipsResponse = await fetch('/api/auth/whop/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: tokens.access_token }),
      });
      
      if (!membershipsResponse.ok) throw new Error('Failed to fetch memberships');
      const membershipsData = await membershipsResponse.json();
      
      // Find active membership with matching product ID
      const activeMembership = membershipsData.data?.find((m: any) => 
        m.status === 'active' && WHOP_PRODUCT_TIERS[m.product_id as keyof typeof WHOP_PRODUCT_TIERS]
      );

      if (!activeMembership) {
        setError('No active subscription found. Please subscribe via the Whop store.');
        return null;
      }

      const tier = WHOP_PRODUCT_TIERS[activeMembership.product_id as keyof typeof WHOP_PRODUCT_TIERS] as WhopTier;

      const userWithTier: WhopUser = {
        id: userData.id,
        name: userData.username || userData.email.split('@')[0],
        email: userData.email,
        profile_pic_url: userData.profile_pic_url,
        productTier: tier,
      };

      return userWithTier;
    } catch (err) {
      console.error('Auth fetch error:', err);
      setError('An error occurred during authentication.');
      return null;
    }
  };

  const login = async (tokens: any) => {
    setLoading(true);
    setError(null);
    const authedUser = await fetchUserData(tokens);
    if (authedUser) {
      setUser(authedUser);
      localStorage.setItem('opsrelic_user', JSON.stringify(authedUser));
      localStorage.setItem('opsrelic_tokens', JSON.stringify(tokens));
    }
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('opsrelic_user');
    localStorage.removeItem('opsrelic_tokens');
    sessionStorage.removeItem(WHOP_STORAGE_KEY);
    window.location.href = '/';
  };

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check for OAuth code in URL
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
              // Exchange code for token
              const exchangeResponse = await fetch('/api/auth/whop/exchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  code, 
                  code_verifier: pkce.codeVerifier,
                  redirect_uri: `${window.location.origin}/api/auth/whop/callback`
                }),
              });

              if (exchangeResponse.ok) {
                const tokens = await exchangeResponse.json();
                await login(tokens);
                // Clear URL and storage
                sessionStorage.removeItem(WHOP_STORAGE_KEY);
                window.history.replaceState({}, document.title, window.location.pathname);
                window.location.hash = '#dashboard';
              } else {
                setError('Failed to exchange authorization code.');
              }
            } else {
              setError('OAuth state mismatch.');
            }
          } catch (e) {
            console.error('Exchange error:', e);
            setError('Auth flow failed.');
          }
        }
        setLoading(false);
      }

      // 2. Check for Whop Session in Local Storage
      const savedUser = localStorage.getItem('opsrelic_user');
      const savedTokens = localStorage.getItem('opsrelic_tokens');

      if (savedUser && savedTokens) {
        try {
          const user = JSON.parse(savedUser);
          setUser(user);
          (window as any).OpsRelicData = { ...(window as any).OpsRelicData, user };
        } catch (e) {
          localStorage.removeItem('opsrelic_user');
          localStorage.removeItem('opsrelic_tokens');
        }
      }
      
      // 3. Listen for Firebase Session
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const mappedUser: WhopUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            profile_pic_url: firebaseUser.photoURL || undefined,
            productTier: 'starter',
          };
          setUser(mappedUser);
          (window as any).OpsRelicData = { ...(window as any).OpsRelicData, user: mappedUser };
        } else if (!localStorage.getItem('opsrelic_user')) {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    const cleanup = initAuth();
    return () => {
      cleanup.then(unsub => unsub?.());
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user, error }}>
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
