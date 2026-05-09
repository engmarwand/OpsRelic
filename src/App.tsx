import { useState, useEffect } from 'react';
import { AppProvider } from './lib/store';
import { Home, UploadCloud, BarChart2, FileText, UserPlus, TrendingUp, Settings, Bell, X, Zap, Sparkles, Bot, LayoutGrid, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
// Components
import OverviewPage from './pages/overview/OverviewPage';
import UploadPage from './pages/upload/UploadPage';
import CampaignsPage from './pages/campaigns/CampaignsPage';
import SettingsPage from './pages/settings/SettingsPage';
import LandingPage from './pages/welcome/LandingPage';
import Pricing from './components/Pricing';
import ClientDashboardPage from './pages/client-portal/ClientDashboardPage';
import ReportsPage from './pages/reports/ReportsPage';
import PipelinePage from './pages/pipeline/PipelinePage';
import { AppLayout, primaryNavItems, secondaryNavItems, sharingNavItems, systemNavItems } from './layouts/AppLayout';
import { auth, logout } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

import { useAppContext } from './lib/store';
import { Lock } from 'lucide-react';

function PortalAuth() {
  const { portalContext, workspace } = useAppContext();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const success = await portalContext.authorize(password);
    if (!success) setError(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative isolate overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0A0A0A] border border-white/5 p-12 rounded-[48px] shadow-2xl space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-[24px] mx-auto flex items-center justify-center shadow-2xl shadow-blue-600/20 mb-2">
            {workspace?.brand?.logoUrl ? (
              <img src={workspace.brand.logoUrl} alt="Logo" className="w-9 h-9 object-contain" />
            ) : (
              <Zap className="w-8 h-8 text-white fill-current" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">{workspace?.brand?.name || 'OpsRelic'}</h1>
            <p className="text-[#555] text-[10px] font-black uppercase tracking-[0.3em] mt-1">Client Portal Access</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Portal Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333]" />
              <input 
                type="password" 
                autoFocus
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#222]"
              />
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -4 }} 
                animate={{ opacity: 1, x: 0 }}
                className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-1"
              >
                Access Denied
              </motion.p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_20px_40px_rgba(37,99,235,0.2)] active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Unlock Dashboard'}
          </button>
        </form>

        <div className="pt-4 flex flex-col items-center gap-3">
          <p className="text-[9px] text-[#222] font-black uppercase tracking-[0.3em]">opsrelic.com secured</p>
        </div>
      </div>
    </div>
  );
}

import { ToastProvider } from './lib/toast';

function AppContent({ user, onLogout }: { user: FirebaseUser | null, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('campaigns');
  const { workspace, data, hasFeature, plan, showPricing, setShowPricing, userRole, portalContext } = useAppContext();
  const [successToastShown, setSuccessToastShown] = useState(false);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'success' && !successToastShown) {
      // We'll show a message or trigger something
      console.log('Fulfillment: Payment successful detected.');
      setSuccessToastShown(true);
      // Clean up URL
      window.history.replaceState({}, document.title, "/");
    }
  }, [successToastShown]);

  const flaggedCount = data?.filter(r => r.Status === 'Flagged').length || 0;

  const currentNavItems = userRole === 'client' ? [
    { id: 'overview', label: 'Overview', icon: Home, hash: '#overview' }
  ] : primaryNavItems;

  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash.substring(1) || 'overview';
      const hashPart = fullHash.split('?')[0];
      if ([...primaryNavItems, ...secondaryNavItems, ...sharingNavItems, ...systemNavItems].some(i => i.id === hashPart)) {
        setActiveTab(hashPart);
      }
    };
    
    // Set initial
    if (!window.location.hash) {
      window.location.hash = '#overview';
    } else {
      handleHashChange();
    }
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [userRole]);

  const activeItem = [...primaryNavItems, ...secondaryNavItems, ...sharingNavItems, ...systemNavItems].find(item => item.id === activeTab);

  return (
    <AppLayout user={user} onLogout={onLogout} activeTab={activeTab}>
      {userRole === 'client' ? (
         <ClientDashboardPage campaignId={portalContext.active ? (portalContext.campaignId || undefined) : (new URLSearchParams(window.location.hash.split('?')[1] || '').get('campaign') || undefined)} />
      ) : (
        <>
          {activeTab === 'overview' && <OverviewPage />}
          {activeTab === 'uploads' && <UploadPage />}
          {activeTab === 'campaigns' && <CampaignsPage />}
          {activeTab === 'clients' && <PipelinePage />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'settings' && <SettingsPage />}
          {activeTab === 'portal' && <ClientDashboardPage />}
          {![ 'overview', 'uploads', 'campaigns', 'clients', 'reports', 'settings', 'portal' ].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center mb-8">
              </div>
              <h3 className="text-3xl font-display font-black text-white tracking-tight mb-3">Modular Expansion</h3>
              <p className="text-[#888] font-medium max-w-sm leading-relaxed">This module is currently in the deployment phase of our system roadmap.</p>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[var(--color-brand-primary)]/20 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <AppProvider>
      <ToastProvider>
        <AppWrapper onLogout={logout} />
      </ToastProvider>
    </AppProvider>
  );
}

import ClientIntakePage from './pages/intake/ClientIntakePage';

function AppWrapper({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { portalContext } = useAppContext();

  const isIntakePage = window.location.pathname.startsWith('/intake/');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[var(--color-brand-primary)]/20 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
    </div>;
  }

  if (isIntakePage) {
    return <ClientIntakePage />;
  }

  if (portalContext.active && !portalContext.authorized) {
    return <PortalAuth />;
  }

  return user || portalContext.authorized ? (
    <AppContent user={user} onLogout={onLogout} />
  ) : (
    <LandingPage />
  );
}
