import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, FolderOpen, Upload, BarChart2, 
  ExternalLink, Settings, UserPlus, Plus, Moon, Sun, X, 
  PanelLeftClose, PanelLeft, Kanban, FileText, Globe, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Pricing from '../components/Pricing';
import AppWalkthrough from '../components/AppWalkthrough';
import { useAppContext } from '../lib/store';
import { User as FirebaseUser } from 'firebase/auth';

export const managementNavItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, hash: '#overview' },
  { id: 'clients', label: 'Clients', icon: Users, hash: '#clients' },
  { id: 'campaigns', label: 'Campaigns', icon: FolderOpen, hash: '#campaigns' },
];

export const workflowNavItems = [
  { id: 'uploads', label: 'Uploads', icon: Upload, hash: '#uploads' },
  { id: 'reports', label: 'Reports', icon: FileText, hash: '#reports' },
];

export const assetsNavItems = [
  { id: 'workspace', label: 'Agency Home', icon: LayoutDashboard, hash: '#workspace' },
  { id: 'workspace-files', label: 'Brand Assets', icon: FolderOpen, hash: '#workspace-files' },
];

export const systemNavItems = [
  { id: 'portal', label: 'Client Portal', icon: Globe, hash: '#portal' },
  { id: 'settings', label: 'Settings', icon: Settings, hash: '#settings' },
];

export const adminNavItems = [
  { id: 'admin', label: 'Admin Control', icon: ShieldCheck, hash: '#admin' },
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
  const { workspace, data, plan, showPricing, setShowPricing, userRole, portalContext, clients, campaignsList, currentTier } = useAppContext();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed.toString());
  }, [collapsed]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const NavItem = ({ item }: { item: any }) => {
    const isActive = activeTab === item.id;
    const badge = item.id === 'clients' ? (clients.length > 0 ? clients.length.toString() : null) : 
                   item.id === 'campaigns' ? (campaignsList.length > 0 ? campaignsList.length.toString() : null) : null;

    return (
      <a
        id={`tour-${item.id}`}
        href={item.hash}
        className={cn(
          "flex items-center gap-[12px] px-3 py-[10px] rounded-xl text-sm font-medium transition-all relative select-none mb-[4px] group",
          collapsed ? "justify-center px-0 hover:px-0" : "",
          isActive 
            ? "bg-gradient-to-br from-[var(--color-cyan-dim)] to-[rgba(0,114,255,0.06)] text-[var(--color-cyan)] font-semibold border border-[rgba(0,212,232,0.1)]" 
            : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-main)]"
        )}
      >
        <div className={cn("relative flex items-center justify-center transition-transform duration-300", collapsed && "group-hover:scale-110")}>
          <item.icon className={cn("w-[20px] h-[20px] flex-shrink-0 transition-colors", isActive && "text-[var(--color-cyan)]")} />
          {badge && collapsed && (
            <span className={cn(
              "absolute -top-1.5 -right-1.5 w-[14px] h-[14px] rounded-full text-[8px] font-black flex items-center justify-center shadow-lg border border-[var(--color-surface)]",
              isActive ? "bg-[var(--color-cyan)] text-[var(--color-cyan-on)]" : "bg-blue-600 text-white"
            )}>
              {badge}
            </span>
          )}
        </div>

        {!collapsed && <span className="truncate">{item.label}</span>}
        
        {badge && !collapsed && (
          <span className={cn(
            "ml-auto text-[0.6rem] font-bold px-[8px] py-[1.5px] rounded-full min-w-[22px] text-center",
            isActive ? "bg-[var(--color-cyan)] text-[var(--color-cyan-on)]" : "bg-[var(--color-surface3)] text-[var(--color-text-muted)]"
          )}>
            {badge}
          </span>
        )}

        {collapsed && (
          <div 
            className="absolute left-[calc(100%+12px)] px-3 py-2 bg-[var(--color-surface2)] text-white text-[11px] font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 scale-95 group-hover:scale-100 whitespace-nowrap z-[100] border border-[var(--color-border-subtle)] shadow-2xl pointer-events-none flex items-center gap-2"
          >
            {item.label}
            {badge && (
              <span className="bg-[var(--color-cyan)] text-[var(--color-cyan-on)] px-1.5 py-0.5 rounded-full text-[9px]">
                {badge}
              </span>
            )}
            {/* Arrow */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-[var(--color-surface2)]" />
          </div>
        )}
      </a>
    );
  };

  const NavGroup = ({ title, items }: { title: string, items: any[] }) => {
    if (collapsed) return (
      <div className="flex flex-col gap-0.5 mb-2">
        {items.map(item => <NavItem key={item.id} item={item} />)}
        <div className="h-[1px] w-[16px] bg-[var(--color-divider)] mx-auto my-3 opacity-30" />
      </div>
    );
    
    return (
      <div className="mb-6 last:mb-0">
        <div className="text-[0.65rem] font-black tracking-[0.15em] uppercase text-faint px-3 pb-2 flex items-center gap-2">
          {title}
          <div className="h-px bg-[var(--color-divider)] flex-1"></div>
        </div>
        <div className="flex flex-col gap-0.5">
          {items.map(item => <NavItem key={item.id} item={item} />)}
        </div>
      </div>
    );
  };

  const pageNames: Record<string, string> = {
    overview: 'Overview', clients: 'Clients', campaigns: 'Campaigns', 
    uploads: 'Uploads', reports: 'Reports', portal: 'Client Portal', settings: 'Settings',
    workspace: 'Agency Home', 'workspace-files': 'Brand Assets', admin: 'Admin Dashboard'
  };

  const sidebarWidth = collapsed ? '72px' : '260px';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-bg)]">
      
      {/* SIDEBAR */}
      <aside 
        className={cn(
          "bg-[var(--color-surface)] border-r border-[var(--color-border-subtle)] flex flex-col relative z-30 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl",
        )}
        style={{ width: sidebarWidth, flexShrink: 0 }}
      >
        <div className="absolute top-0 left-0 right-0 h-[220px] pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--color-cyan-glow) 0%, transparent 70%)' }}></div>
        
        {/* LOGO AREA */}
        <div className={cn("flex items-center gap-3 border-b border-[var(--color-divider)] relative z-10 flex-shrink-0 transition-all px-5 py-4", collapsed && "justify-center px-0")}>
          <div className="w-[32px] h-[32px] rounded-lg bg-[var(--color-bg)] flex items-center justify-center relative shadow-inner overflow-hidden border border-[var(--color-border-subtle)] shrink-0">
             {workspace?.brand?.logoUrl ? (
                <img src={workspace.brand.logoUrl} alt="Logo" className="w-[32px] h-[32px] object-contain drop-shadow-[0_0_10px_var(--color-cyan-glow)]" />
              ) : (
                <img src="/logo.png" alt="OpsRelic Logo" className="w-full h-full object-contain drop-shadow-[0_0_8px_var(--color-cyan-glow)]" />
              )}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-display text-md font-extrabold text-[var(--color-text-main)] -tracking-[0.02em] truncate">{workspace?.brand?.name || 'OpsRelic'}</div>
              <div className="text-[0.62rem] text-faint tracking-[0.1em] uppercase font-bold">Agency OS</div>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className={cn(
          "flex-1 custom-scrollbar px-3 relative z-10",
          collapsed ? "py-4 overflow-y-visible" : "py-6 overflow-y-auto"
        )}>
          {userRole === 'client' ? (
            <NavGroup title="Main" items={[{ id: 'overview', label: 'Overview', icon: LayoutDashboard, hash: '#overview' }]} />
          ) : (
            <>
              <NavGroup title="Management" items={managementNavItems} />
              <NavGroup title="Workflow" items={workflowNavItems} />
              <NavGroup title="Team Workspace" items={assetsNavItems} />
              <NavGroup title="System" items={systemNavItems} />
              {user?.email === 'engmarwand@gmail.com' && (
                <NavGroup title="Admin" items={adminNavItems} />
              )}
            </>
          )}
        </nav>

        {/* USER PROFILE */}
        <div className="px-3 py-4 border-t border-[var(--color-divider)] relative z-10 flex-shrink-0">
          <div className="relative group">
            <button className={cn("flex items-center gap-3 w-full text-left p-2 rounded-xl hover:bg-[var(--color-surface-hover)] transition-all peer", collapsed && "justify-center p-0")}>
              <div className="w-[36px] h-[36px] rounded-xl bg-gradient-to-br from-[var(--color-cyan)] to-[#0072ff] flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-[0_4px_12px_rgba(0,212,232,0.25)] border border-white/10">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'M')}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--color-text-main)] truncate">{user?.displayName || user?.email?.split('@')[0] || 'John Doe'}</div>
                  <div className="text-[0.65rem] text-faint font-semibold uppercase tracking-wider">{userRole === 'client' ? 'Client' : `${currentTier || 'Starter'}`}</div>
                </div>
              )}
            </button>
            <div className={cn(
              "absolute mb-2 bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible peer-focus:opacity-100 peer-focus:visible hover:opacity-100 hover:visible transition-all duration-300 flex flex-col z-50 py-2 overflow-hidden min-w-[220px]",
              collapsed 
                ? "left-[calc(100%+12px)] bottom-0 translate-x-[-12px] group-hover:translate-x-0" 
                : "left-0 w-full bottom-full"
            )}>
               {userRole !== 'client' && (
                 <>
                   <a href="#settings" className="px-5 py-2.5 text-sm font-medium text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)] transition-colors flex items-center gap-3">
                     <Settings className="w-4 h-4 text-muted" /> Settings
                   </a>
                   <a href="#settings?tab=billing" className="px-5 py-2.5 text-sm font-medium text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)] transition-colors flex items-center gap-3">
                     <BarChart2 className="w-4 h-4 text-muted" /> Plan & Billing
                   </a>
                   <div className="h-px bg-[var(--color-divider)] my-1 mx-2"></div>
                 </>
               )}
               <button onClick={onLogout} className="px-5 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left w-full font-bold flex items-center gap-3">
                 <X className="w-4 h-4" /> Log out
               </button>
               {collapsed && (
                 <div className="absolute left-[-12px] bottom-[20px] w-0 h-0 border-y-[8px] border-y-transparent border-r-[12px] border-r-[var(--color-surface2)]" />
               )}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* TOPBAR */}
        <header className="h-[64px] bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-border-subtle)] flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 -ml-2 rounded-lg text-muted hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-main)] transition-all"
            >
              {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <h1 className="font-display text-lg font-black text-[var(--color-text-main)] tracking-tight">
              {pageNames[activeTab] || activeTab}
            </h1>
          </div>
          
          {userRole !== 'client' && (
            <div className="flex items-center gap-3">
              <button onClick={() => window.location.hash = '#clients?new=true'} className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-muted hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-main)] shadow-sm">
                <UserPlus className="w-4 h-4" /> New Client
              </button>
              <button id="tour-new-campaign" onClick={() => window.location.hash = '#campaigns?new=true'} className="inline-flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all bg-gradient-to-r from-[var(--color-cyan)] to-[#0099ff] text-[var(--color-cyan-on)] hover:shadow-[0_8px_24px_rgba(0,212,232,0.3)] shadow-md transform hover:-translate-y-0.5 active:translate-y-0">
                <Plus className="w-4 h-4" /> New Campaign
              </button>
              <div className="w-px h-6 bg-[var(--color-divider)] mx-2 hidden sm:block"></div>
              <button onClick={toggleTheme} className="w-[40px] h-[40px] rounded-xl flex items-center justify-center text-muted border border-[var(--color-border-subtle)] transition-all hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-main)] bg-[var(--color-surface)]">
                {theme === 'dark' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
              </button>
            </div>
          )}
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

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
      <AppWalkthrough />
    </div>
  );
};
