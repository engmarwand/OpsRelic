import { useState, useEffect } from 'react';
import { AppProvider } from './lib/store';
import { Home, UploadCloud, BarChart2, FileText, UserPlus, TrendingUp, Settings, Bell, X, Zap } from 'lucide-react';
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

const navItems = [
  { id: 'dashboard', label: 'Home', icon: Home, hash: '#dashboard' },
  { id: 'upload', label: 'Upload', icon: UploadCloud, hash: '#upload' },
  { id: 'campaigns', label: 'Campaigns', icon: BarChart2, hash: '#campaigns' },
  { id: 'reports', label: 'Reports', icon: FileText, hash: '#reports' },
  { id: 'workspace', label: 'Settings', icon: Settings, hash: '#workspace' },
];

import { ToastProvider } from './lib/toast';

function AppContent({ user, onLogout }: { user: FirebaseUser | null, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('dashboard');
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
  ] : navItems;

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1) || 'dashboard';
      if (currentNavItems.some(i => i.id === hash)) {
        setActiveTab(hash);
      }
    };
    
    // Set initial
    if (!window.location.hash) {
      window.location.hash = '#dashboard';
    } else {
      handleHashChange();
    }
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentNavItems]);

  const activeItem = currentNavItems.find(item => item.id === activeTab);

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] relative isolate">
      {/* Background Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-6 print:hidden">
        <div className="flex items-center gap-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              {workspace?.brand?.logoUrl ? (
                <img src={workspace.brand.logoUrl} alt="Logo" className="w-4 h-4 object-contain" />
              ) : (
                <Zap className="w-4 h-4 text-white fill-current" />
              )}
            </div>
            <h1 className="font-display font-bold text-white text-lg tracking-tight leading-none">{workspace?.brand?.name || 'OpsRelic'}</h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
            {currentNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={item.hash}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all relative group",
                    isActive 
                      ? "text-white" 
                      : "text-[#666] hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="top-nav-active"
                      className="absolute inset-0 bg-white/10 rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn("w-4 h-4 transition-colors relative z-10", isActive ? "text-white" : "text-[#444] group-hover:text-[#888]")} />
                  <span className="relative z-10 font-bold">{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Upgrade Plan Indicator */}
          {userRole !== 'client' && (
            <button 
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111] border border-white/10 hover:border-blue-500/30 hover:bg-white/5 transition-all text-[10px] font-black tracking-widest uppercase text-[#888] hover:text-white group"
              onClick={() => setShowPricing(true)}
            >
              <Zap className="w-3.5 h-3.5 text-blue-500 group-hover:drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
              {plan?.name || 'Starter'}
            </button>
          )}

          {/* Notifications */}
          {workspace?.notifications && Object.values(workspace.notifications).some(Boolean) && (
            <div className="relative group cursor-pointer">
              <div className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-all text-[#666] hover:text-white">
                <Bell className="w-4 h-4" />
                {flaggedCount > 0 && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full border-[1.5px] border-[#050505]"></div>}
              </div>
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
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

          {/* User Profile */}
          <div className="relative group cursor-pointer pl-2">
            <div className="flex items-center gap-2.5">
              <div className="max-md:hidden text-right">
                <p className="text-[12px] font-bold text-white leading-none truncate max-w-[120px]">{user?.displayName || 'OpsRelic User'}</p>
                <p className="text-[9px] text-[#555] font-black uppercase tracking-widest mt-1">{userRole === 'client' ? 'Client' : 'Management'}</p>
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg bg-[#222] border-2 border-[#333] group-hover:border-blue-500 transition-colors">
                {(workspace?.brand?.name || 'OR').substring(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
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

      <Walkthrough />

      {/* Main Content Area */}
      <main className="flex-1 pt-16 flex flex-col relative w-full border-t-[1px] border-white/5 bg-[#050505]">
        {/* Subtle top gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
        
        <div className="max-w-[1600px] w-full mx-auto p-6 md:p-8 lg:p-12 min-h-[calc(100vh-64px)] relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {userRole === 'client' ? (
                 <ClientDashboard campaignId={portalContext.active ? (portalContext.campaignId || undefined) : (new URLSearchParams(window.location.hash.split('?')[1] || '').get('campaign') || undefined)} />
              ) : (
                <>
                  {activeTab === 'dashboard' && <Dashboard />}
                  {activeTab === 'upload' && <Upload />}
                  {activeTab === 'campaigns' && <Campaigns />}
                  {activeTab === 'reports' && <Reports />}
                  {activeTab === 'workspace' && <Workspace />}
                  {activeTab !== 'dashboard' && activeTab !== 'upload' && activeTab !== 'campaigns' && activeTab !== 'reports' && activeTab !== 'workspace' && (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                      <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                        {activeItem && <activeItem.icon className="w-8 h-8 text-[#555]" />}
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Module Not Found</h3>
                      <p className="text-[#888] text-sm max-w-sm">The {activeItem?.label} module is currently unavailable.</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Pricing Modal */}
      {showPricing && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             className="w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-[#0A0A0A] rounded-[32px] border border-white/10 shadow-2xl relative custom-scrollbar ring-1 ring-white/5"
           >
              <button 
                className="absolute top-8 right-8 z-[110] text-[#666] hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-md p-3 rounded-full transition-all" 
                onClick={() => setShowPricing(false)}
              >
                <X className="w-5 h-5" />
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

function AppWrapper({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { portalContext } = useAppContext();

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

  if (portalContext.active && !portalContext.authorized) {
    return <PortalAuth />;
  }

  return user || portalContext.authorized ? (
    <AppContent user={user} onLogout={onLogout} />
  ) : (
    <Landing />
  );
}
