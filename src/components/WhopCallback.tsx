import React, { useEffect, useState } from 'react';
import { handleWhopCallback, WHOP_CLIENT_ID, getWhopRedirectUri } from '../lib/whopConfig';

export const WhopCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        await handleWhopCallback(WHOP_CLIENT_ID, getWhopRedirectUri());
        // Redirect to dashboard on success
        window.location.href = '/#dashboard';
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
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Error</h2>
          <p className="text-red-500">{errorMsg}</p>
          <a href="/" className="mt-6 inline-block bg-blue-600 px-6 py-2 rounded">Go Back</a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
      <div className="animate-pulse">Authenticating...</div>
    </div>
  );
};
