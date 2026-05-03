import React, { createContext, useContext, useState, useEffect } from 'react';
import { WhopUser, WHOP_PRODUCT_TIERS, WhopTier, WHOP_STORAGE_KEY, getWhopRedirectUri } from '../lib/whopConfig';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: WhopUser | null;
  loading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
  error: string | null;
  firebaseUser: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<WhopUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [whopLoading, setWhopLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSession = React.useCallback(async () => {
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
      setWhopLoading(false);
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      sessionStorage.removeItem(WHOP_STORAGE_KEY);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, []);

  useEffect(() => {
    // Listen to Firebase Auth
    const unsubscribeFirebase = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // We use functional update to avoid stale user closure if needed, 
        // but here we just want to ensure we don't overwrite a better user object from Whop
        setUser(prev => {
          if (prev) return prev;
          return {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            productTier: 'starter',
          };
        });
      }
    });

    const initAuth = async () => {
      // With server-side callback, we just check the session
      await checkSession();
    };

    initAuth();
    return () => unsubscribeFirebase();
  }, [checkSession]);

  useEffect(() => {
    if (!whopLoading) {
      setLoading(false);
    }
  }, [whopLoading]);

  const contextValue = React.useMemo(() => ({ 
    user, 
    loading, 
    logout, 
    isAuthenticated: !!user || !!firebaseUser, 
    error, 
    firebaseUser 
  }), [user, loading, logout, firebaseUser, error]);

  return (
    <AuthContext.Provider value={contextValue}>
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
