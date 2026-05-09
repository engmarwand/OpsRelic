import React from 'react';

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative isolate overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="w-full max-w-md bg-[#0A0A0A] border border-white/5 p-12 rounded-[48px] shadow-2xl space-y-8 relative z-10">
        {children}
      </div>
    </div>
  );
};
