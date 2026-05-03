import React, { useEffect, useState } from 'react';
import { handleWhopCallback, storeTokens, WHOP_CLIENT_ID, getWhopRedirectUri } from '../lib/whopConfig';

export const WhopCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const tokens = await handleWhopCallback(WHOP_CLIENT_ID, getWhopRedirectUri());
        storeTokens(tokens);
        // Redirect to dashboard on success
        window.location.href = '/#dashboard';
        window.location.reload(); // Ensure re-auth logic runs
      } catch (err: any) {
        console.error('Whop Callback failed:', err);
        setErrorMsg(err.message || 'Failed to complete authentication');
        setStatus('error');
      }
    };
    processCallback();
  }, []);

  if (status === 'error') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
        <div className="text-center p-6 bg-red-950/20 border border-red-900 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Authentication Error</h2>
          <p className="text-red-500 mb-6">{errorMsg}</p>
          <a href="/" className="inline-block bg-blue-600 px-6 py-2 rounded-lg font-bold">Go Back</a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
      <div className="animate-pulse font-bold text-xl">Authenticating with Whop...</div>
    </div>
  );
};
