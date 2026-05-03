import React from 'react';
import { motion } from 'motion/react';
import { startWhopOAuth, getWhopRedirectUri } from '../lib/whopConfig';

export const WhopLoginButton: React.FC<{ className?: string }> = ({ className }) => {
  const handleWhopLogin = async () => {
    await startWhopOAuth(getWhopRedirectUri());
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleWhopLogin}
      className={`flex items-center justify-center gap-3 bg-black text-white font-bold py-3.5 px-8 rounded-2xl transition-all border border-white/10 hover:bg-[#111] ${className}`}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.6c-5.302 0-9.6-4.298-9.6-9.6S6.698 2.4 12 2.4s9.6 4.298 9.6 9.6-4.298 9.6-9.6 9.6zm-1.8-6.6h3.6v1.8h-3.6v-1.8zm0-3.6h3.6v1.8h-3.6v-1.8zm0-3.6h3.6v1.8h-3.6v-1.8z"/>
      </svg>
      Sign In with Whop
    </motion.button>
  );
};
