import { useState, useEffect } from 'react';
import { AppProvider } from './lib/store';
import { Home, UploadCloud, BarChart2, FileText, Wallet, UserPlus, TrendingUp, Settings, Bell, X } from 'lucide-react';
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
  { id: 'upload', label: 'Upload Data', icon: UploadCloud, hash: '#upload' },
  { id: 'campaigns', label: 'Campaigns', icon: BarChart2, hash: '#campaigns' },
  { id: 'reports', label: 'Client Reports', icon: FileText, hash: '#reports' },
  { id: 'budget', label: 'Budget Tracker', icon: Wallet, hash: '#budget' },
  { id: 'onboarding', label: 'Onboarding', icon: UserPlus, hash: '#onboarding' },
  { id: 'workspace', label: 'Workspace', icon: Settings, hash: '#workspace' },
];

import { ToastProvider } from './lib/toast';

function AppContent({ user, onLogout }: { user: FirebaseUser, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPricing, setShowPricing] = useState(false);
  const { workspace, data, hasFeature, plan } = useAppContext();
  
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
    <div className="flex min-h-screen">
      {/* Sidebar - fixed left */}
      <aside className="w-[260px] fixed inset-y-0 left-0 bg-[#0A0A0A] border-r border-white/5 flex flex-col z-50 transition-transform max-md:-translate-x-full print:hidden">
        <div className="p-6">
          <div className="flex items-center gap-3">
            {workspace?.brand?.logoUrl ? (
              <img src={workspace.brand.logoUrl} alt="Logo" className="w-8 h-8 rounded-md object-contain" />
            ) : (
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-md object-contain" />
            )}
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">{workspace?.brand?.name || 'OpsRelic'}</h1>
              <p className="text-[11px] text-[#888]">{workspace?.brand?.tagline || 'Agency Operations'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {currentNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.hash}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all relative group",
                  isActive 
                    ? "text-white bg-white/10" 
                    : "text-[#888] hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-[var(--color-brand-primary)]" : "text-[#888] group-hover:text-white")} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 mx-4 mb-4">
          <button 
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            onClick={() => setShowPricing(true)}
          >
             <div className="text-left">
               <p className="text-[10px] text-[#888] uppercase tracking-wider font-semibold">Current Plan</p>
               <p className="text-sm font-bold text-white">{plan?.name || 'No Plan'}</p>
             </div>
             <div className="text-[10px] bg-[var(--color-brand-primary)] text-white px-2 py-1 rounded-md font-bold">UPGRADE</div>
          </button>
        </div>
      </aside>

      <Walkthrough />

      {/* Main Content */}
      <main className="flex-1 md:ml-[260px] bg-[#0A0A0A] min-h-screen print:ml-0 print:bg-white">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-40 print:hidden">
          <h2 className="text-[16px] font-semibold tracking-wide">{activeItem?.label}</h2>
          
            <div className="flex items-center gap-4">
              {/* Notifications */}
              {workspace?.notifications && Object.values(workspace.notifications).some(Boolean) && (
                <div className="relative group cursor-pointer">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                    <Bell className="w-5 h-5 text-white" />
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0A0A0A]"></div>
                  </div>
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-3 border-b border-white/5">
                      <p className="text-sm font-bold text-white">Notifications Active</p>
                    </div>
                    <div className="p-2">
                       {workspace?.notifications?.budgetAlerts && (
                         <div className="p-2 flex gap-3 text-sm text-white/80 border-b border-white/5 last:border-0 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                           <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                           Simulation: "Summer Blast" crossed 70% budget
                         </div>
                       )}
                       {workspace?.notifications?.flagsPending && flaggedCount > 0 && (
                         <div className="p-2 flex gap-3 text-sm text-white/80 border-b border-white/5 last:border-0 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                           <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                           {flaggedCount} clips pending manual review
                         </div>
                       )}
                       {workspace?.notifications?.weeklySummary && (
                         <div className="p-2 flex gap-3 text-sm text-white/80 border-b border-white/5 last:border-0 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                           <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                           Simulation: Weekly summary scheduled
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="relative group cursor-pointer">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg bg-[var(--color-brand-primary)]" style={{ boxShadow: '0 4px 20px color-mix(in srgb, var(--color-brand-primary) 30%, transparent)' }}>
                  {(workspace?.brand?.name || 'OR').substring(0, 2).toUpperCase()}
                </div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-3 border-b border-white/5">
                    <p className="text-sm font-bold text-white truncate">{user.displayName || 'OpsRelic User'}</p>
                    <p className="text-xs text-[#888] truncate">{user.email}</p>
                  </div>
                  <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-white/5 font-semibold transition-colors">
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="p-8 pb-32 relative max-w-[1600px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'upload' && <Upload />}
                {activeTab === 'campaigns' && <Campaigns />}
                {activeTab === 'reports' && <Reports />}
                {activeTab === 'budget' && <Budget />}
                {activeTab === 'onboarding' && <Onboarding />}
                {activeTab === 'workspace' && <Workspace />}
                {activeTab !== 'dashboard' && activeTab !== 'upload' && activeTab !== 'campaigns' && activeTab !== 'reports' && activeTab !== 'budget' && activeTab !== 'onboarding' && activeTab !== 'workspace' && (
                   <div className="text-center py-20">
                     <activeItem.icon className="w-12 h-12 text-[#555] mx-auto mb-4" />
                     <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
                     <p className="text-[#888]">The {activeItem?.label} module is being built.</p>
                   </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        
        {showPricing && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-[#050505] rounded-3xl relative">
                <button className="absolute top-8 right-8 z-50 text-white p-2 hover:bg-white/10 rounded-full" onClick={() => setShowPricing(false)}><X /></button>
                <Pricing onClose={() => setShowPricing(false)} />
             </div>
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
