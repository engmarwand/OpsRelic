import { useState, useEffect } from 'react';
import { AppProvider } from './lib/store';
import { Home, UploadCloud, BarChart2, FileText, UserPlus, TrendingUp, Settings, Bell, X, Zap, Sparkles, Bot, LayoutGrid, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
// Components
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import Campaigns from './components/Campaigns';
import Workspace from './components/Workspace';
import Landing from './components/Landing';
import Walkthrough from './components/Walkthrough';
import Pricing from './components/Pricing';
import ClientDashboard from './components/ClientDashboard';
import Reports from './components/Reports';
import Pipeline from './components/Pipeline';
import CopilotPage from './components/CopilotPage';
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

const primaryNavItems = [
  { id: 'campaigns', label: 'Growth Hub', icon: LayoutGrid, hash: '#campaigns' },
  { id: 'copilot', label: 'Copilot', icon: Sparkles, hash: '#copilot' },
  { id: 'reports', label: 'Intelligence', icon: BarChart2, hash: '#reports' },
];

const secondaryNavItems = [
  { id: 'dashboard', label: 'Overview', icon: Home, hash: '#dashboard' },
  { id: 'upload', label: 'Data Import', icon: Database, hash: '#upload' },
  { id: 'workspace', label: 'Settings', icon: Settings, hash: '#workspace' },
];

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
    { id: 'dashboard', label: 'Dashboard', icon: Home, hash: '#dashboard' }
  ] : primaryNavItems;

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1) || 'campaigns';
      if ([...primaryNavItems, ...secondaryNavItems].some(i => i.id === hash)) {
        setActiveTab(hash);
      }
    };
    
    // Set initial
    if (!window.location.hash) {
      window.location.hash = '#campaigns';
    } else {
      handleHashChange();
    }
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [userRole]);

  const activeItem = [...primaryNavItems, ...secondaryNavItems].find(item => item.id === activeTab);

  const BackgroundLines = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />
      <div className="absolute top-0 left-2/4 w-[1px] h-full bg-gradient-to-b from-transparent via-blue-600/50 to-transparent" />
      <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 relative isolate">
      {/* Background Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <BackgroundLines />

      {/* Sidebar - fixed left */}
      <aside className="w-[280px] fixed inset-y-0 left-0 bg-[#0A0A0A]/80 backdrop-blur-md border-r border-white/5 flex flex-col z-50 transition-transform max-md:-translate-x-full print:hidden">
        <div className="p-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
              {workspace?.brand?.logoUrl ? (
                <img src={workspace.brand.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
              ) : (
                <Zap className="w-5 h-5 text-white fill-current" />
              )}
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-xl tracking-tight leading-none">{workspace?.brand?.name || 'OpsRelic'}</h1>
              <p className="text-[10px] text-[#555] font-black uppercase tracking-widest mt-1.5">{workspace?.brand?.tagline || 'Content Agency Software'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-6">
          <div className="px-4 mb-4">
            <p className="text-[9px] font-black uppercase text-[#333] tracking-[0.2em] mb-4">Engagement & Flow</p>
            <div className="space-y-1">
              {currentNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.hash}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all relative group",
                      isActive 
                        ? "text-white bg-blue-600 shadow-xl shadow-blue-600/20" 
                        : "text-[#444] hover:text-white hover:bg-white/[0.03]"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-[#222] group-hover:text-blue-500")} />
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="mt-8 px-4">
            <p className="text-[9px] font-black uppercase text-[#333] tracking-[0.2em] mb-4">Global Intelligence</p>
            <div className="space-y-1">
              {userRole !== 'client' && secondaryNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.hash}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all relative group",
                      isActive 
                        ? "text-white bg-white/5" 
                        : "text-[#444] hover:text-white hover:bg-white/[0.02]"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isActive ? "text-blue-400" : "text-[#222]")} />
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="p-6">
          <button 
            className="w-full relative group overflow-hidden rounded-[32px] p-[1px] transition-transform active:scale-95"
            onClick={() => setShowPricing(true)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/50 via-purple-500/50 to-orange-500/50 opacity-50 group-hover:opacity-100 transition-opacity blur-md"></div>
            <div className="relative bg-[#0F0F0F] rounded-[31px] p-5 border border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black tracking-[0.2em] text-[#555] uppercase">Active Plan</p>
                  <p className="text-white font-black text-sm mt-0.5">{plan?.name || 'Starter'}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center">
                   <Zap className="w-3.5 h-3.5 text-blue-500 fill-current" />
                </div>
              </div>
              
              {/* Credit Meter */}
              {userRole !== 'client' && (
                <div className="space-y-1.5 px-1">
                   <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[#444]">
                      <span>AI Credits</span>
                      <span className="text-blue-500">{workspace?.credits || 0} / {plan?.limits.aiCredits || 0}</span>
                   </div>
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((workspace?.credits || 0) / (plan?.limits.aiCredits || 1)) * 100)}%` }}
                        className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                      />
                   </div>
                </div>
              )}

              <div className="w-full h-px bg-white/5"></div>
              <p className="text-[10px] text-[#888] font-bold text-center group-hover:text-white transition-colors">UPGRADE TO UNLOCK ALL FEATURES</p>
            </div>
          </button>
        </div>
      </aside>

      <Walkthrough />

      {/* Main Content */}
      <main className="flex-1 md:ml-[280px] min-h-screen print:ml-0 print:bg-white overflow-x-hidden">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 sticky top-0 bg-[#050505]/60 backdrop-blur-3xl z-40 print:hidden">
          <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-[#555]">{activeItem?.label}</h2>
          
            <div className="flex items-center gap-6">
              {/* Notifications */}
              {workspace?.notifications && Object.values(workspace.notifications).some(Boolean) && (
                <div className="relative group cursor-pointer">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                    <Bell className="w-4.5 h-4.5 text-[#888] group-hover:text-white" />
                    <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full border-[1.5px] border-[#050505]"></div>
                  </div>
                  <div className="absolute right-0 top-full mt-3 w-72 bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                      <p className="text-xs font-black text-white uppercase tracking-widest">Inbox</p>
                    </div>
                    <div className="p-2 space-y-1">
                       {workspace?.notifications?.flagsPending && flaggedCount > 0 && (
                         <div className="p-3 flex gap-3 text-xs text-[#888] hover:text-white border-b border-white/5 last:border-0 hover:bg-white/5 rounded-xl cursor-pointer transition-all">
                           <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0" />
                           {flaggedCount} clips pending manual review
                         </div>
                       )}
                       {workspace?.notifications?.weeklySummary && (
                         <div className="p-3 flex gap-3 text-xs text-[#888] hover:text-white border-b border-white/5 last:border-0 hover:bg-white/5 rounded-xl cursor-pointer transition-all">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                           Simulation: Weekly summary scheduled
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="relative group cursor-pointer">
                <div className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-lg bg-blue-600">
                    {(workspace?.brand?.name || 'OR').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="max-md:hidden">
                    <p className="text-[11px] font-black text-white leading-none truncate max-w-[120px]">{user?.displayName || 'OpsRelic User'}</p>
                    <p className="text-[9px] text-[#555] font-bold uppercase tracking-widest mt-1">{userRole === 'client' ? 'Client' : 'Management'}</p>
                  </div>
                </div>
                <div className="absolute right-0 top-full mt-3 w-56 bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-4 border-b border-white/5">
                    <p className="text-xs font-black text-white truncate uppercase tracking-widest">{user?.displayName || (userRole === 'client' ? 'Client' : 'User')}</p>
                    <p className="text-[10px] text-[#555] truncate font-bold mt-1">{user?.email || (userRole === 'client' ? 'Portal Access' : '')}</p>
                  </div>
                  <button onClick={() => {
                    if (portalContext.active) {
                      window.location.href = window.location.origin + window.location.pathname;
                    } else {
                      onLogout();
                    }
                  }} className="w-full text-left px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500/5 transition-colors">
                    {portalContext.active ? 'Exit Portal' : 'Log Out'}
                  </button>
                </div>
              </div>
            </div>
        </header>

        <div className="p-10 pb-32 relative max-w-[1400px] mx-auto min-h-[calc(100vh-80px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              {userRole === 'client' ? (
                 <ClientDashboard campaignId={portalContext.active ? (portalContext.campaignId || undefined) : (new URLSearchParams(window.location.hash.split('?')[1] || '').get('campaign') || undefined)} />
              ) : (
                <>
                  {activeTab === 'dashboard' && <Dashboard />}
                  {activeTab === 'upload' && <Upload />}
                  {activeTab === 'campaigns' && <Campaigns />}
                  {activeTab === 'reports' && <Reports />}
                  {activeTab === 'copilot' && <CopilotPage />}
                  {activeTab === 'workspace' && <Workspace />}
                  {![ 'dashboard', 'upload', 'campaigns', 'reports', 'copilot', 'workspace' ].includes(activeTab) && (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                      <div className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                        {activeItem && <activeItem.icon className="w-8 h-8 text-[#333]" />}
                      </div>
                      <h3 className="text-3xl font-display font-black text-white tracking-tight mb-3">Modular Expansion</h3>
                      <p className="text-[#888] font-medium max-w-sm leading-relaxed">The {activeItem?.label} module is currently in the deployment phase of our system roadmap.</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {showPricing && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             className="w-full max-w-7xl max-h-[92vh] overflow-y-auto bg-[#050505] rounded-[48px] border border-white/5 shadow-2xl relative custom-scrollbar"
           >
              <button 
                className="absolute top-10 right-10 z-[70] text-[#555] p-3 hover:text-white hover:bg-white/5 rounded-full transition-all" 
                onClick={() => setShowPricing(false)}
              >
                <X className="w-6 h-6" />
              </button>
              <Pricing onClose={() => setShowPricing(false)} />
           </motion.div>
        </div>
      )}
    </div>
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

import ClientIntake from './components/ClientIntake';

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
    return <ClientIntake />;
  }

  if (portalContext.active && !portalContext.authorized) {
    return <PortalAuth />;
  }

  return user || portalContext.authorized ? (
    <AppContent user={user} onLogout={onLogout} />
  ) : (
    <Landing />
  );
}
