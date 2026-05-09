import React, { useState } from 'react';
import { User, Bell, Shield, CreditCard, Paintbrush, ChevronRight, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useToast } from '../../lib/toast';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { addToast } = useToast();

  const tabs = [
    { id: 'profile', icon: User, label: 'Profile Settings' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'display', icon: Paintbrush, label: 'Appearance' },
  ];

  const handleSave = () => {
    addToast('Settings saved successfully', 'success');
  };

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
                  {activeTab === 'profile' && (
                    <div className="space-y-8 max-w-2xl">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="flex flex-col gap-[5px]">
                            <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Full Name</label>
                            <input defaultValue="Agency Admin" className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" />
                         </div>
                         <div className="flex flex-col gap-[5px]">
                            <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Email Address</label>
                            <input defaultValue="admin@opsrelic.com" className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" />
                         </div>
                       </div>
                       <div className="flex flex-col gap-[5px]">
                          <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Company Name</label>
                          <input defaultValue="OpsRelic Inc." className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" />
                       </div>
                    </div>
                  )}

                  {activeTab === 'notifications' && (
                    <div className="space-y-6 max-w-2xl">
                       {[
                         { label: 'Weekly Summary', desc: 'Receive a weekly email summarizing campaign performance', active: true },
                         { label: 'Upload Alerts', desc: 'Notify me when large CSV uploads complete', active: true },
                         { label: 'Client Portal Views', desc: 'Email digest when clients access their portals', active: false },
                       ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface2)] hover:border-[var(--color-cyan)] transition-colors">
                             <div>
                                <div className="text-sm font-semibold text-[var(--color-text-main)]">{item.label}</div>
                                <div className="text-xs text-muted mt-1">{item.desc}</div>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked={item.active} />
                                <div className="w-9 h-5 bg-[var(--color-border-strong)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-cyan)]"></div>
                             </label>
                          </div>
                       ))}
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div className="space-y-6 max-w-2xl">
                       <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface2)] mb-6">
                          <h4 className="text-sm font-semibold text-[var(--color-text-main)] mb-1">Change Password</h4>
                          <p className="text-xs text-muted mb-4">Ensure your account is using a long, random password to stay secure.</p>
                          <div className="space-y-3">
                            <input type="password" placeholder="Current Password" className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-cyan)] transition-all" />
                            <input type="password" placeholder="New Password" className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-cyan)] transition-all" />
                            <button onClick={() => addToast('Password updated successfully', 'success')} className="btn btn-primary mt-2">Update Password</button>
                          </div>
                       </div>
                       
                       <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface2)]">
                           <div>
                              <div className="text-sm font-semibold text-[var(--color-text-main)]">Two-Factor Authentication</div>
                              <div className="text-xs text-muted mt-1">Add an extra layer of security to your account.</div>
                           </div>
                           <button onClick={() => addToast('2FA enabled', 'success')} className="btn btn-ghost border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">Enable</button>
                       </div>
                    </div>
                  )}

                  {activeTab === 'billing' && (
                    <div className="space-y-6 max-w-2xl">
                       <div className="p-6 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border-subtle)]">
                          <div className="flex items-center justify-between mb-4">
                             <div>
                                <h4 className="text-sm font-semibold text-[var(--color-text-main)] font-display text-lg">Agency Pro</h4>
                                <p className="text-xs text-muted">Active plan</p>
                             </div>
                             <div className="text-right">
                                <div className="font-display font-extrabold text-2xl text-[var(--color-text-main)]">$299<span className="text-sm text-muted font-normal">/mo</span></div>
                             </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => addToast('Redirecting to billing portal...', 'info')} className="btn btn-ghost border border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex-1 justify-center">Change Plan</button>
                            <button onClick={() => addToast('Opened support ticket', 'info')} className="btn btn-ghost border border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex-1 justify-center">Cancel</button>
                          </div>
                       </div>

                       <div>
                          <h4 className="text-xs font-bold uppercase tracking-[0.07em] text-muted mb-3">Billing History</h4>
                          <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden bg-[var(--color-surface2)]">
                             <div className="flex items-center justify-between p-3 border-b border-[var(--color-border-subtle)] text-sm">
                                <div className="text-[var(--color-text-main)] font-medium">Dec 1, 2024</div>
                                <div className="text-[var(--color-text-main)] font-medium">$299.00</div>
                             </div>
                             <div className="flex items-center justify-between p-3 border-b border-[var(--color-border-subtle)] text-sm">
                                <div className="text-[var(--color-text-main)] font-medium">Nov 1, 2024</div>
                                <div className="text-[var(--color-text-main)] font-medium">$299.00</div>
                             </div>
                             <button onClick={() => addToast('Viewing all receipts...', 'info')} className="w-full text-center p-3 text-xs text-[var(--color-cyan)] font-semibold hover:bg-[var(--color-surface-hover)] transition-colors">View All Receipts</button>
                          </div>
                       </div>
                    </div>
                  )}

                  {activeTab === 'display' && (
                    <div className="space-y-6 max-w-2xl">
                       <div className="flex flex-col gap-[5px]">
                          <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Theme Preference</label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="border-2 border-[var(--color-cyan)] rounded-xl p-4 bg-black cursor-pointer">
                               <div className="w-full h-20 bg-[#111] rounded-lg border border-[#222] mb-3"></div>
                               <div className="text-center text-sm font-semibold text-white">Dark Mode</div>
                            </div>
                            <div className="border border-[var(--color-border-subtle)] rounded-xl p-4 bg-gray-100 cursor-not-allowed opacity-50 relative overflow-hidden">
                               <div className="w-full h-20 bg-white rounded-lg border border-gray-300 mb-3"></div>
                               <div className="text-center text-sm font-semibold text-gray-900">Light Mode</div>
                               <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                                 <span className="bg-white/90 text-xs px-2 py-1 rounded font-bold uppercase tracking-widest">Coming Soon</span>
                               </div>
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
