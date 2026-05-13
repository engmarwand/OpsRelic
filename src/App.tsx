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
import PortalPage from './pages/portal/PortalPage';
import ReportsPage from './pages/reports/ReportsPage';
import ClientsPage from './pages/clients/ClientsPage';
import WorkspaceHomePage from './pages/workspace/WorkspaceHomePage';
import WorkspaceFilesPage from './pages/workspace/WorkspaceFilesPage';
import { AppLayout, managementNavItems, workflowNavItems, assetsNavItems, systemNavItems } from './layouts/AppLayout';
import { auth, logout, ALLOWED_EMAILS } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

import { useAppContext } from './lib/store';
import { Lock } from 'lucide-react';

function PortalAuth() {
  const { portalContext } = useAppContext();
  const [pw, setPw] = useState('');

  if (portalContext.loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-brand-primary)]/20 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  // If there's an expected password, it means the portal exists and expects auth
  if ((portalContext as any)._expectedPassword) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
          <Lock className="w-8 h-8 text-[var(--color-cyan)] opacity-80" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight uppercase mb-2">Password Required</h1>
        <p className="text-[#888] font-medium max-w-sm mb-6">This client portal is protected.</p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const success = await portalContext.authorize(pw);
          if (!success) alert("Incorrect password");
        }} className="w-full max-w-xs flex flex-col gap-3">
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Enter password" autoFocus className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white text-center focus:border-[var(--color-cyan)] outline-none" />
          <button type="submit" className="w-full bg-[var(--color-cyan)] text-black font-bold rounded-lg px-4 py-3 hover:opacity-90 transition-opacity">Access Portal</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
        <Lock className="w-8 h-8 text-white/40" />
      </div>
      <h1 className="text-2xl font-black text-white tracking-tight uppercase italic mb-2">Portal Unavailable</h1>
      <p className="text-[#888] font-medium max-w-sm">This campaign portal is either disabled or does not exist.</p>
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

  const allNavItems = [...managementNavItems, ...workflowNavItems, ...assetsNavItems, ...systemNavItems];

  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash.substring(1) || 'overview';
      const hashPart = fullHash.split('?')[0];
      if (allNavItems.some(i => i.id === hashPart)) {
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

  const activeItem = allNavItems.find(item => item.id === activeTab);

  return (
    <AppLayout user={user} onLogout={onLogout} activeTab={activeTab}>
      {userRole === 'client' ? (
         <ClientDashboardPage campaignId={portalContext.active ? (portalContext.campaignId || undefined) : (new URLSearchParams(window.location.hash.split('?')[1] || '').get('campaign') || undefined)} />
      ) : (
        <>
          {activeTab === 'overview' && <OverviewPage />}
          {activeTab === 'uploads' && <UploadPage />}
          {activeTab === 'campaigns' && <CampaignsPage />}
          {activeTab === 'clients' && <ClientsPage />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'settings' && <SettingsPage />}
          {activeTab === 'portal' && <PortalPage />}
          {activeTab === 'workspace' && <WorkspaceHomePage />}
          {activeTab === 'workspace-files' && <WorkspaceFilesPage />}
          {![ 'overview', 'uploads', 'campaigns', 'clients', 'reports', 'settings', 'portal', 'workspace', 'workspace-files' ].includes(activeTab) && (
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
  const isPortalPage = window.location.pathname.startsWith('/portal/');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email && !ALLOWED_EMAILS.includes(currentUser.email.toLowerCase())) {
        logout();
        setUser(null);
      } else {
        setUser(null); // default
        if (currentUser) setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading || (isPortalPage && portalContext.loading)) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[var(--color-brand-primary)]/20 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
    </div>;
  }

  if (isIntakePage) {
    return <ClientIntakePage />;
  }

  if (isPortalPage || portalContext.active) {
    if (portalContext.active && !portalContext.authorized) {
      return <PortalAuth />;
    }
    if (portalContext.authorized) {
      return <AppContent user={user} onLogout={onLogout} />;
    }
    // If we're on a portal page but not active yet (still looking up token)
    if (isPortalPage && !portalContext.active && !portalContext.loading) {
       // This handles the case where the token lookup finished but found nothing
       return <PortalAuth />; 
    }
  }

  return user || portalContext.authorized ? (
    <AppContent user={user} onLogout={onLogout} />
  ) : (
    <LandingPage />
  );
}
