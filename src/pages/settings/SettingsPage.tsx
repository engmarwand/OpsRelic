import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, Shield, CreditCard, Paintbrush, ChevronRight, Save, Palette, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useToast } from '../../lib/toast';
import { useAppContext } from '../../lib/store';
import { PLANS } from '../../lib/plans';
import { WorkspaceSettings } from '../../types';
import ResetData from '../../components/ResetData';

export default function SettingsPage() {
  const { workspace, saveWorkspace, currentTier, setShowPricing, userDoc } = useAppContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [isResetting, setIsResetting] = useState(false);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localWorkspace, setLocalWorkspace] = useState<WorkspaceSettings | undefined>(workspace);

  useEffect(() => {
    setLocalWorkspace(workspace);
  }, [workspace]);

  // ... (rest of the file content)

  useEffect(() => {
    const handleHashChange = () => {
      const match = window.location.hash.match(/\?tab=([^&]*)/);
      if (match && match[1]) {
        setActiveTab(match[1]);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const tabs = [
    { id: 'profile', icon: User, label: 'Profile Settings' },
    { id: 'appearance', icon: Palette, label: 'Appearance & Branding' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'danger', icon: AlertTriangle, label: 'Danger Zone' },
  ];

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete ALL your data? This cannot be undone.")) return;
    
    setIsResetting(true);
    addToast("Starting data reset...", "info");

    try {
      const collections = [
        'campaigns', 'clients', 'submissions', 'campaign_briefs', 'campaign_updates', 'clipMetrics', 'user_config'
      ];

      // Batch delete for root collections
      for (const colName of collections) {
        const querySnapshot = await getDocs(collection(db, colName));
        if (querySnapshot.size > 0) {
          const batch = writeBatch(db);
          querySnapshot.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
        }
      }

      // Workspace subcollections if workspace exists
      if (workspace?.id) {
        const subCollections = ['tasks', 'discussion', 'files'];
        for (const subCol of subCollections) {
          const q = collection(db, 'workspaces', workspace.id, subCol);
          const querySnapshot = await getDocs(q);
          if (querySnapshot.size > 0) {
            const batch = writeBatch(db);
            querySnapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
          }
        }
      }

      addToast("Data reset successfully", "success");
      window.location.reload();
    } catch (err) {
      console.error(err);
      addToast("Failed to reset data", "error");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSave = async () => {
    if (!localWorkspace) return;
    try {
      await saveWorkspace(localWorkspace);
      addToast('Settings saved successfully', 'success');
    } catch (err) {
      addToast('Failed to save settings', 'error');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalWorkspace(prev => prev ? {
          ...prev,
          brand: { ...prev.brand, logoUrl: reader.result as string, logo: reader.result as string }
        } : undefined);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentPlan = currentTier ? PLANS[currentTier] : PLANS.starter;

  return (
    <div className="page active p-6 md:p-8 min-h-[calc(100vh-var(--topbar-h))]">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
           <h1 className="font-display text-xl font-extrabold text-[var(--color-text-main)] tracking-[-0.025em]">Settings</h1>
           <p className="text-sm text-muted mt-[3px]">Manage your account preferences and configurations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <aside className="w-full">
           <nav className="flex flex-col gap-1">
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={cn(
                   "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                   activeTab === tab.id
                     ? "bg-[var(--color-surface2)] text-[var(--color-cyan)] shadow-sm"
                     : "text-muted hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-main)]"
                 )}
               >
                 <tab.icon className="w-4 h-4" />
                 {tab.label}
               </button>
             ))}
           </nav>
        </aside>

        <main className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
           <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface2)]">
             <h2 className="font-display text-md font-bold text-[var(--color-text-main)]">
               {tabs.find(t => t.id === activeTab)?.label}
             </h2>
             <button onClick={handleSave} className="btn btn-primary px-4">
               <Save className="w-4 h-4" /> Save Changes
             </button>
           </div>
           
           <div className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {activeTab === 'profile' && localWorkspace && (
                    <div className="space-y-8 max-w-2xl">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="flex flex-col gap-[5px]">
                            <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Workspace Name</label>
                            <input 
                              value={localWorkspace.brand.name || ''} 
                              onChange={e => setLocalWorkspace({...localWorkspace, brand: {...localWorkspace.brand, name: e.target.value}})}
                              className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" 
                            />
                         </div>
                         <div className="flex flex-col gap-[5px]">
                            <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Contact Email</label>
                            <input 
                              value={localWorkspace.brand.email || ''} 
                              onChange={e => setLocalWorkspace({...localWorkspace, brand: {...localWorkspace.brand, email: e.target.value}})}
                              className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" 
                            />
                         </div>
                       </div>
                       <div className="flex flex-col gap-[5px]">
                          <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Timezone</label>
                          <select 
                            value={localWorkspace.brand.timezone || 'UTC'} 
                            onChange={e => setLocalWorkspace({...localWorkspace, brand: {...localWorkspace.brand, timezone: e.target.value}})}
                            className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all cursor-pointer"
                          >
                             <option value="UTC">UTC</option>
                             <option value="America/New_York">Eastern Time (US & Canada)</option>
                             <option value="America/Chicago">Central Time (US & Canada)</option>
                             <option value="America/Denver">Mountain Time (US & Canada)</option>
                             <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                             <option value="Europe/London">London</option>
                             <option value="Europe/Berlin">Berlin</option>
                          </select>
                       </div>
                       <div className="pt-8 mt-8 border-t border-[var(--color-border-subtle)]">
                          <h3 className="text-sm font-bold text-[var(--color-text-main)] mb-4">Danger Zone</h3>
                          <ResetData />
                       </div>
                    </div>
                  )}

                  {activeTab === 'appearance' && localWorkspace && (
                    <div className="space-y-8 max-w-2xl">
                       <div className="flex flex-col gap-4">
                          <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Workspace Logo</label>
                          <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] flex items-center justify-center overflow-hidden">
                               {localWorkspace.brand.logoUrl ? (
                                  <img src={localWorkspace.brand.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                               ) : (
                                  <ImageIcon className="w-8 h-8 text-muted" />
                               )}
                            </div>
                            <div>
                               <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoUpload} />
                               <button onClick={() => fileInputRef.current?.click()} className="btn btn-ghost border border-[var(--color-border-subtle)] bg-[var(--color-surface)] mb-2">Upload New Logo</button>
                               <div className="text-xs text-muted">Recommended size: 256x256px</div>
                            </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-[5px]">
                          <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Primary Accent Color</label>
                          <div className="flex items-center gap-4 mt-2">
                            <input 
                              type="color" 
                              value={localWorkspace.color.primary || '#00D4FF'} 
                              onChange={e => setLocalWorkspace({...localWorkspace, color: {...localWorkspace.color, primary: e.target.value}})}
                              className="w-12 h-12 rounded-lg cursor-pointer bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] p-1"
                            />
                            <div className="text-sm text-[var(--color-text-main)] font-mono uppercase bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] px-3 py-2 rounded-lg">{localWorkspace.color.primary || '#00D4FF'}</div>
                          </div>
                          <p className="text-xs text-muted mt-2">This color is used for buttons, charts, and highlights throughout your workspace.</p>
                       </div>
                    </div>
                  )}

                  {activeTab === 'notifications' && localWorkspace && (
                    <div className="space-y-6 max-w-2xl">
                       <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface2)] hover:border-[var(--color-cyan)] transition-colors">
                          <div>
                             <div className="text-sm font-semibold text-[var(--color-text-main)]">Weekly Summary</div>
                             <div className="text-xs text-muted mt-1">Receive a weekly email summarizing campaign performance</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                             <input type="checkbox" className="sr-only peer" checked={localWorkspace.notifications.weeklySummary} onChange={e => setLocalWorkspace({...localWorkspace, notifications: {...localWorkspace.notifications, weeklySummary: e.target.checked}})} />
                             <div className="w-9 h-5 bg-[var(--color-border-strong)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-cyan)]"></div>
                          </label>
                       </div>
                       
                       <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface2)] hover:border-[var(--color-cyan)] transition-colors">
                          <div>
                             <div className="text-sm font-semibold text-[var(--color-text-main)]">Upload Alerts</div>
                             <div className="text-xs text-muted mt-1">Notify me when large CSV uploads complete</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                             <input type="checkbox" className="sr-only peer" checked={localWorkspace.notifications.uploadAlerts || false} onChange={e => setLocalWorkspace({...localWorkspace, notifications: {...localWorkspace.notifications, uploadAlerts: e.target.checked}})} />
                             <div className="w-9 h-5 bg-[var(--color-border-strong)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-cyan)]"></div>
                          </label>
                       </div>

                       <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface2)] hover:border-[var(--color-cyan)] transition-colors">
                          <div>
                             <div className="text-sm font-semibold text-[var(--color-text-main)]">Client Portal Views</div>
                             <div className="text-xs text-muted mt-1">Email digest when clients access their portals</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                             <input type="checkbox" className="sr-only peer" checked={localWorkspace.notifications.clientPortalViews || false} onChange={e => setLocalWorkspace({...localWorkspace, notifications: {...localWorkspace.notifications, clientPortalViews: e.target.checked}})} />
                             <div className="w-9 h-5 bg-[var(--color-border-strong)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-cyan)]"></div>
                          </label>
                       </div>
                    </div>
                  )}

                  {activeTab === 'billing' && (
                    <div className="space-y-6 max-w-2xl">
                       <div className="p-6 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border-subtle)]">
                          <div className="flex items-center justify-between mb-4">
                             <div>
                                <h4 className="text-sm font-semibold text-[var(--color-text-main)] font-display text-lg">
                                  Current Plan: {currentTier ? currentPlan.name : 'Free / Not set'}
                                </h4>
                                <p className="text-xs text-muted mt-1">
                                  {userDoc?.renewalDate ? `Renews on: ${new Date(userDoc.renewalDate.toMillis ? userDoc.renewalDate.toMillis() : userDoc.renewalDate).toLocaleDateString()}` : 'No renewal date set'}
                                </p>
                             </div>
                          </div>
                          <div className="flex gap-3 mt-6">
                            <button 
                              onClick={() => setShowPricing(true)} 
                              className="btn btn-primary flex-1 justify-center py-2.5"
                            >
                              View Plans
                            </button>
                          </div>
                       </div>
                       
                       <div>
                         <h4 className="text-xs font-bold uppercase tracking-[0.07em] text-muted mb-3">Plan Limits</h4>
                         <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border-subtle)]">
                             <div className="text-xs text-muted uppercase font-bold tracking-wider mb-1">Campaigns</div>
                             <div className="text-lg font-bold text-[var(--color-text-main)]">{currentPlan.limits.campaigns === Infinity ? 'Unlimited' : currentPlan.limits.campaigns}</div>
                           </div>
                           <div className="p-4 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border-subtle)]">
                             <div className="text-xs text-muted uppercase font-bold tracking-wider mb-1">Uploads/Campaign</div>
                             <div className="text-lg font-bold text-[var(--color-text-main)]">{currentPlan.limits.recordsPerCampaign === Infinity ? 'Unlimited' : currentPlan.limits.recordsPerCampaign}</div>
                           </div>
                         </div>
                       </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
           </div>
        </main>
      </div>
    </div>
  );
}

