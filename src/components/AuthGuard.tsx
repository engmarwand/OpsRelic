import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { AlertCircle, LogOut, ExternalLink } from 'lucide-react';
import { WHOP_STORE_URL } from '../lib/whopConfig';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading, isAuthenticated, error, logout } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#00D4FF]/20 border-t-[#00D4FF] rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-medium animate-pulse">Initializing OpsRelic...</p>
        </div>
      </div>
    );
  }

  // If not on the landing page and not authenticated, we could redirect or show landing
  // But usually we wrap the whole app or just dashboard parts
  // In this app, we'll let the user see the landing page
  const isDashboard = window.location.hash !== '' && window.location.hash !== '#';

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999] p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#111] border border-red-500/20 rounded-3xl p-8 text-center shadow-2xl"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            {error}
          </p>
          <div className="flex flex-col gap-3">
            <a 
              href={WHOP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-95"
            >
              Get Access <ExternalLink className="w-4 h-4" />
            </a>
            <button 
              onClick={logout}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 font-medium py-3 px-6 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};
