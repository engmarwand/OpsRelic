import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, FolderOpen, Upload, BarChart2, ExternalLink, Settings, UserPlus, Plus, Moon, Sun, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Pricing from '../components/Pricing';
import { useAppContext } from '../lib/store';
import { User as FirebaseUser } from 'firebase/auth';

export const primaryNavItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, hash: '#overview' },
  { id: 'clients', label: 'Clients', icon: Users, hash: '#clients', badge: '4' },
  { id: 'campaigns', label: 'Campaigns', icon: FolderOpen, hash: '#campaigns', badge: '7' },
];

export const secondaryNavItems = [
  { id: 'uploads', label: 'Uploads', icon: Upload, hash: '#uploads' },
  { id: 'reports', label: 'Reports', icon: BarChart2, hash: '#reports' },
];

export const sharingNavItems = [
  { id: 'portal', label: 'Client Portal', icon: ExternalLink, hash: '#portal' },
];

export const systemNavItems = [
  { id: 'settings', label: 'Settings', icon: Settings, hash: '#settings' },
];

export const AppLayout = ({ 
  children, 
  user,
  onLogout,
  activeTab 
}: { 
  children: React.ReactNode,
  user: FirebaseUser | null,
  onLogout: () => void,
  activeTab: string
}) => {
  const { workspace, data, plan, showPricing, setShowPricing, userRole, portalContext, clients, campaignsList } = useAppContext();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const navItemsWithCounts = primaryNavItems.map(item => {
    if (item.id === 'clients') return { ...item, badge: clients.length > 0 ? clients.length.toString() : undefined };
    if (item.id === 'campaigns') return { ...item, badge: campaignsList.length > 0 ? campaignsList.length.toString() : undefined };
    return item;
  });

  const currentPrimaryNav = userRole === 'client' ? [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, hash: '#overview' }
  ] : navItemsWithCounts;

  const NavItem = ({ item }: { item: typeof primaryNavItems[0] }) => {
    const isActive = activeTab === item.id;
    return (
      <a
        href={item.hash}
        className={cn(
          "flex items-center gap-[10px] px-3 py-[8px] rounded-md text-sm font-medium transition-all relative select-none mb-[2px]",
          isActive 
            ? "bg-gradient-to-br from-[var(--color-cyan-dim)] to-[rgba(0,114,255,0.08)] text-[var(--color-cyan)] font-semibold border border-[rgba(0,212,232,0.15)]" 
            : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-main)]"
        )}
      >
        <item.icon className="w-[15px] h-[15px] flex-shrink-0" />
        <span>{item.label}</span>
        {item.badge && (
          <span className={cn(
            "ml-auto text-[0.6rem] font-bold px-[7px] py-[1px] rounded-full min-w-[20px] text-center",
            isActive ? "bg-[var(--color-cyan-dim)] text-[var(--color-cyan)]" : "bg-[var(--color-surface3)] text-[var(--color-text-muted)]"
          )}>
            {item.badge}
          </span>
        )}
      </a>
    );
  };

  const pageNames: Record<string, string> = {
    overview: 'Overview', clients: 'Clients', campaigns: 'Campaigns', 
    uploads: 'Uploads', reports: 'Reports', portal: 'Client Portal', settings: 'Settings'
  };

  return (
    <div className="grid h-screen w-full" style={{ gridTemplateColumns: 'var(--sidebar-w) 1fr', gridTemplateRows: 'var(--topbar-h) 1fr' }}>
      
      {/* SIDEBAR */}
      <aside className="bg-[var(--color-surface)] border-r border-[var(--color-border-subtle)] flex flex-col relative overflow-hidden" style={{ gridRow: '1/3' }}>
        <div className="absolute top-0 left-0 right-0 h-[220px] pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--color-cyan-glow) 0%, transparent 70%)' }}></div>
        
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-divider)] relative z-10 flex-shrink-0">
          <div className="w-[30px] h-[30px] rounded flex items-center justify-center relative">
             {workspace?.brand?.logoUrl ? (
                <img src={workspace.brand.logoUrl} alt="Logo" className="w-[30px] h-[30px] object-contain drop-shadow-[0_0_10px_var(--color-cyan-glow)]" />
              ) : (
                <img src="/logo.png" alt="OpsRelic Logo" className="w-full h-full object-contain drop-shadow-[0_0_8px_var(--color-cyan-glow)]" />
              )}
          </div>
          <div>
            <div className="font-display text-md font-bold text-[var(--color-text-main)] -tracking-[0.01em]">{workspace?.brand?.name || 'OpsRelic'}</div>
            <div className="text-[0.62rem] text-faint tracking-[0.1em] uppercase">Agency OS</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 relative z-10">
          <div className="text-[0.6rem] font-bold tracking-[0.12em] uppercase text-faint px-3 pb-1 mt-1">Workspace</div>
          {currentPrimaryNav.map(item => <NavItem key={item.id} item={item} />)}

          {userRole !== 'client' && (
            <>
              <div className="text-[0.6rem] font-bold tracking-[0.12em] uppercase text-faint px-3 pb-1 mt-4">Data</div>
              {secondaryNavItems.map(item => <NavItem key={item.id} item={item} />)}

              <div className="text-[0.6rem] font-bold tracking-[0.12em] uppercase text-faint px-3 pb-1 mt-4">Sharing</div>
              {sharingNavItems.map(item => <NavItem key={item.id} item={item} />)}

              <div className="text-[0.6rem] font-bold tracking-[0.12em] uppercase text-faint px-3 pb-1 mt-4">System</div>
              {systemNavItems.map(item => <NavItem key={item.id} item={item} />)}
            </>
          )}
        </nav>

        <div className="px-4 py-3 border-t border-[var(--color-divider)] relative z-10 flex-shrink-0">
          <div className="relative group">
            <button className="flex items-center gap-3 w-full text-left p-2 -mx-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors peer">
              <div className="w-[32px] h-[32px] rounded-full bg-gradient-to-br from-[var(--color-cyan)] to-[#0072ff] flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0 shadow-[0_0_12px_var(--color-cyan-glow)]">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'M')}
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--color-text-main)] truncate max-w-[120px]">{user?.displayName || user?.email || 'John Doe'}</div>
                <div className="text-[0.62rem] text-faint">{userRole === 'client' ? 'Client' : 'Agency Owner · Pro'}</div>
              </div>
            </button>
            <div className="absolute bottom-full left-0 mb-2 w-full min-w-[200px] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible peer-focus:opacity-100 peer-focus:visible hover:opacity-100 hover:visible transition-all flex flex-col z-50 py-1 overflow-hidden">
               {userRole !== 'client' && (
                 <>
                   <a href="#settings" className="px-4 py-2 text-sm text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)] transition-colors">Settings</a>
                   <a href="#settings?tab=billing" className="px-4 py-2 text-sm text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)] transition-colors text-left w-full block">Plan & Billing</a>
                   <div className="h-px bg-[var(--color-border-subtle)] my-1"></div>
                 </>
               )}
               <button onClick={onLogout} className="px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left w-full font-medium">Log out</button>
            </div>
          </div>
        </div>
      </aside>

      {/* TOPBAR */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)] flex items-center justify-between px-6 z-20" style={{ gridColumn: 2 }}>
        <span className="font-display text-md font-bold text-[var(--color-text-main)]">{pageNames[activeTab] || activeTab}</span>
        
        {userRole !== 'client' && (
          <div className="flex items-center gap-2">
            <button onClick={() => window.location.hash = '#clients?new=true'} className="inline-flex items-center gap-2 px-[14px] py-[7px] rounded-md text-sm font-semibold transition-all border border-transparent whitespace-nowrap bg-transparent text-muted hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-main)] hover:border-[var(--color-border-subtle)]">
              <UserPlus className="w-[13px] h-[13px]" /> New Client
            </button>
            <button onClick={() => window.location.hash = '#campaigns?new=true'} className="inline-flex items-center gap-2 px-[14px] py-[7px] rounded-md text-sm font-semibold transition-all border border-transparent whitespace-nowrap bg-gradient-to-br from-[var(--color-cyan)] to-[#0099ff] text-[var(--color-cyan-on)] hover:from-[var(--color-cyan-hover)] hover:to-[#0080e6] shadow-[0_2px_14px_rgba(0,212,232,0.3)] hover:shadow-[0_4px_22px_rgba(0,212,232,0.5)] transform hover:-translate-y-[1px]">
              <Plus className="w-[13px] h-[13px]" /> New Campaign
            </button>
            <button onClick={toggleTheme} className="w-[34px] h-[34px] rounded-md flex items-center justify-center text-muted border border-[var(--color-border-subtle)] transition-all hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-main)] hover:border-strong ml-2">
              {theme === 'dark' ? <Moon className="w-[15px] h-[15px]" /> : <Sun className="w-[15px] h-[15px]" />}
            </button>
          </div>
        )}
      </header>

      {/* MAIN */}
      <main className="overflow-y-auto bg-[var(--color-bg)]" style={{ gridColumn: 2 }}>
        {children}
      </main>

      {/* Auth Modal / Pricing */}
      <AnimatePresence>
        {showPricing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowPricing(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-7xl max-h-[90vh] overflow-y-auto bg-[#050505] rounded-[48px] border border-white/10 relative z-10 shadow-2xl custom-scrollbar"
            >
              <button 
                onClick={() => setShowPricing(false)}
                className="absolute top-8 right-8 text-[#555] hover:text-white transition-colors z-50 p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-6 h-6" />
              </button>
              <Pricing onClose={() => setShowPricing(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
