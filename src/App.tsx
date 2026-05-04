import { useState, useEffect } from 'react';
import { AppProvider } from './lib/store';
import { Home, UploadCloud, BarChart2, FileText, Wallet, UserPlus, TrendingUp, Settings, Bell, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
// Components
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import Campaigns from './components/Campaigns';
import Reports from './components/Reports';
import Budget from './components/Budget';
import Onboarding from './components/Onboarding';
import Workspace from './components/Workspace';
import Landing from './components/Landing';
import Walkthrough from './components/Walkthrough';
import Pricing from './components/Pricing';
import { auth, logout } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

import { useAppContext } from './lib/store';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, hash: '#dashboard' },
  { id: 'upload', label: 'Upload', icon: UploadCloud, hash: '#upload' },
  { id: 'campaigns', label: 'Campaigns', icon: BarChart2, hash: '#campaigns' },
  { id: 'reports', label: 'Reports', icon: FileText, hash: '#reports' },
  { id: 'budget', label: 'Budgets', icon: Wallet, hash: '#budget' },
  { id: 'onboarding', label: 'Onboarding', icon: UserPlus, hash: '#onboarding' },
  { id: 'workspace', label: 'Workspace', icon: Settings, hash: '#workspace' },
];

import { ToastProvider } from './lib/toast';

function AppContent({ user, onLogout }: { user: FirebaseUser, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { workspace, data, hasFeature, plan, showPricing, setShowPricing } = useAppContext();
  
  const flaggedCount = data?.filter(r => r.Status === 'Flagged').length || 0;

  const currentNavItems = navItems.filter(item => {
    if (item.id === 'budget' && !hasFeature('budgetTracker')) return false;
    // Onboarding is always visible
    return true;
  });

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
    <div className="flex min-h-screen bg-[#050505] relative isolate">
      {/* Background Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Sidebar - fixed left */}
      <aside className="w-[280px] fixed inset-y-0 left-0 bg-[#0A0A0A] border-r border-white/5 flex flex-col z-50 transition-transform max-md:-translate-x-full print:hidden">
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

        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {currentNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.hash}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all relative group",
                  isActive 
                    ? "text-white bg-white/5 shadow-inner" 
                    : "text-[#666] hover:text-white hover:bg-white/[0.03]"
                )}
              >
                <item.icon className={cn("w-4.5 h-4.5 transition-colors", isActive ? "text-blue-500" : "text-[#444] group-hover:text-[#888]")} />
                {item.label}
                {isActive && (
                  <motion.div 
                    layoutId="nav-active"
                    className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </a>
            );
          })}
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
                       {workspace?.notifications?.budgetAlerts && (
                         <div className="p-3 flex gap-3 text-xs text-[#888] hover:text-white border-b border-white/5 last:border-0 hover:bg-white/5 rounded-xl cursor-pointer transition-all">
                           <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                           Simulation: "Summer Blast" crossed 70% budget
                         </div>
                       )}
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
                    <p className="text-[11px] font-black text-white leading-none truncate max-w-[120px]">{user.displayName || 'OpsRelic User'}</p>
                    <p className="text-[9px] text-[#555] font-bold uppercase tracking-widest mt-1">Management</p>
                  </div>
                </div>
                <div className="absolute right-0 top-full mt-3 w-56 bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-4 border-b border-white/5">
                    <p className="text-xs font-black text-white truncate uppercase tracking-widest">{user.displayName || 'User'}</p>
                    <p className="text-[10px] text-[#555] truncate font-bold mt-1">{user.email}</p>
                  </div>
                  <button onClick={onLogout} className="w-full text-left px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500/5 transition-colors">
                    Log Out
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
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'upload' && <Upload />}
              {activeTab === 'campaigns' && <Campaigns />}
              {activeTab === 'reports' && <Reports />}
              {activeTab === 'budget' && <Budget />}
              {activeTab === 'onboarding' && <Onboarding />}
              {activeTab === 'workspace' && <Workspace />}
              {activeTab !== 'dashboard' && activeTab !== 'upload' && activeTab !== 'campaigns' && activeTab !== 'reports' && activeTab !== 'budget' && activeTab !== 'onboarding' && activeTab !== 'workspace' && (
                 <div className="flex flex-col items-center justify-center py-32 text-center">
                   <div className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                     <activeItem.icon className="w-8 h-8 text-[#333]" />
                   </div>
                   <h3 className="text-3xl font-display font-black text-white tracking-tight mb-3">Modular Expansion</h3>
                   <p className="text-[#888] font-medium max-w-sm leading-relaxed">The {activeItem?.label} module is currently in the deployment phase of our system roadmap.</p>
                 </div>
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
        {user ? (
          <AppContent user={user} onLogout={logout} />
        ) : (
          <Landing />
        )}
      </ToastProvider>
    </AppProvider>
  );
}
