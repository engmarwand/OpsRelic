import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, Shield, CreditCard, Paintbrush, ChevronRight, Save, Palette, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useToast } from '../../lib/toast';
import { useAppContext } from '../../lib/store';
import { PLANS } from '../../lib/plans';
import { WorkspaceSettings } from '../../types';
import ResetData from '../../components/ResetData';
import { writeBatch, collection, getDocs, doc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

export default function SettingsPage() {
  const { workspace, activeWorkspace, saveWorkspace, currentTier, setShowPricing, userDoc } = useAppContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [isResetting, setIsResetting] = useState(false);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localWorkspace, setLocalWorkspace] = useState<WorkspaceSettings | undefined>(workspace);

  useEffect(() => {
    setLocalWorkspace(workspace);
  }, [workspace]);

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
      const wsId = activeWorkspace?.id || (workspace as any)?.id;
      if (wsId) {
        const subCollections = ['tasks', 'discussion', 'files'];
        for (const subCol of subCollections) {
          const q = collection(db, 'workspaces', wsId, subCol);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localWorkspace) return;
    try {
      await saveWorkspace(localWorkspace);
      addToast("Settings saved successfully", "success");
    } catch (err) {
      addToast("Failed to save settings", "error");
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'branding', name: 'Branding', icon: Paintbrush },
    { id: 'plan', name: 'Plan & Billing', icon: CreditCard },
  ];

  return (
    <div className="page active p-6 md:p-8 min-h-[calc(100vh-var(--topbar-h))]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-extrabold text-[var(--color-text-main)] mb-1">Settings</h1>
          <p className="text-sm text-muted">Manage your personal profile and agency workspace</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  activeTab === tab.id
                    ? "bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] shadow-sm"
                    : "text-muted hover:bg-[var(--color-surface2)] hover:text-[var(--color-text-main)]"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm space-y-6"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] flex items-center justify-center overflow-hidden">
                       {userDoc?.avatarUrl ? (
                         <img src={userDoc.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                       ) : (
                         <User className="w-8 h-8 text-muted" />
                       )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--color-text-main)]">{userDoc?.fullName || 'Agency Operator'}</h3>
                      <p className="text-sm text-muted mb-3">{auth.currentUser?.email}</p>
                      <button className="btn btn-ghost btn-sm text-xs border border-[var(--color-border-subtle)]">Change Photo</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-muted uppercase tracking-widest">Full Name</label>
                       <input 
                         type="text" 
                         defaultValue={userDoc?.fullName || ''}
                         className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-cyan)] transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-muted uppercase tracking-widest">Display Name</label>
                       <input 
                         type="text" 
                         defaultValue={userDoc?.displayName || ''}
                         className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-cyan)] transition-all"
                       />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'branding' && (
                <motion.div
                  key="branding"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm"
                >
                  <form onSubmit={handleSave} className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="font-display font-bold text-[var(--color-text-main)] flex items-center gap-2">
                        <Palette className="w-4 h-4 text-[var(--color-cyan)]" /> Workspace Identity
                      </h3>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted uppercase tracking-widest">Agency Name</label>
                          <input
                            type="text"
                            value={localWorkspace?.brand.name || ''}
                            onChange={(e) => setLocalWorkspace(prev => prev ? {
                              ...prev,
                              brand: { ...prev.brand, name: e.target.value }
                            } : undefined)}
                            className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-cyan)] transition-all"
                            placeholder="OpsRelic Agency"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted uppercase tracking-widest">Tagline</label>
                          <input
                            type="text"
                            value={localWorkspace?.brand.tagline || ''}
                            onChange={(e) => setLocalWorkspace(prev => prev ? {
                              ...prev,
                              brand: { ...prev.brand, tagline: e.target.value }
                            } : undefined)}
                            className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-cyan)] transition-all"
                            placeholder="Premier Content Operations"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-display font-bold text-[var(--color-text-main)] flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[var(--color-cyan)]" /> Theme & Colors
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted uppercase tracking-widest">Brand Color (Hex)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={localWorkspace?.color.primary || ''}
                              onChange={(e) => setLocalWorkspace(prev => prev ? {
                                ...prev,
                                color: { ...prev.color, primary: e.target.value }
                              } : undefined)}
                              className="flex-1 bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-cyan)] transition-all font-mono"
                              placeholder="#00d4e8"
                            />
                            <div 
                              className="w-[42px] h-[42px] rounded-xl border border-[var(--color-border-subtle)] shadow-sm shrink-0"
                              style={{ backgroundColor: localWorkspace?.color.primary }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                       <ResetData />
                       <button type="submit" className="btn btn-primary">
                         <Save className="w-4 h-4" /> Save Branding
                       </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'plan' && (
                <motion.div
                  key="plan"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand-primary)]/5 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />
                    
                    <div className="flex items-start justify-between relative">
                       <div>
                         <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
                           Active Subscription
                         </div>
                         <h3 className="font-display text-2xl font-black text-[var(--color-text-main)] mb-1">
                           {PLANS[currentTier || 'STARTER'].name}
                         </h3>
                         <p className="text-sm text-muted">Billed Monthly through Whop</p>
                       </div>
                       <CreditCard className="w-8 h-8 text-faint opacity-20" />
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-4 bg-[var(--color-surface2)] rounded-xl border border-[var(--color-border-subtle)]">
                          <div className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Renews On</div>
                          <div className="text-sm font-bold text-[var(--color-text-main)]">Next billing cycle</div>
                       </div>
                       <div className="p-4 bg-[var(--color-surface2)] rounded-xl border border-[var(--color-border-subtle)]">
                          <div className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Price</div>
                          <div className="text-sm font-bold text-[var(--color-green)]">
                            ${PLANS[currentTier || 'STARTER'].price}/month
                          </div>
                       </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                       <button onClick={() => setShowPricing(true)} className="btn btn-primary flex-1">Upgrade Tier</button>
                       <button className="btn btn-ghost flex-1 border border-[var(--color-border-subtle)]">Manage on Whop</button>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-4">
                     <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                     <div>
                        <h4 className="text-sm font-bold text-amber-500 mb-1">Plan Limitations</h4>
                        <p className="text-xs text-amber-500/80 leading-relaxed">
                          Your current plan includes up to {PLANS[currentTier || 'STARTER'].maxClients} clients. To add more clients or unlock white-label portals, consider upgrading to the Agency tier.
                        </p>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
