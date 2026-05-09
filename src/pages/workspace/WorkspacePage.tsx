import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../lib/store';
import { auth, resetPassword, db, doc, updateDoc, serverTimestamp } from '../../lib/firebase';
import PasswordSecurityModal from '../../components/PasswordSecurityModal';
import { Settings, Image as ImageIcon, Palette, LayoutDashboard, Bell, FileText, UploadCloud, X, Check, Lock, ChevronDown, Monitor, GripVertical, AlertCircle, Plus, Mail, Save, Loader2 } from 'lucide-react';
import { getFeatureMinTier } from '../../lib/plans';
import type { PlanFeatures } from '../../lib/plans';
import type { WorkspaceSettings } from '../../types';

function TierBadge({ tier }: { tier: 'starter' | 'pro' | 'agency' }) {
  if (tier === 'starter') return null;
  if (tier === 'pro') return <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#00D4FF]/15 text-[#00D4FF] uppercase tracking-wider">Pro</span>;
  return <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF8C00]/15 text-[#FF8C00] uppercase tracking-wider">Agency</span>;
}

function FeatureLock({ feature }: { feature: keyof PlanFeatures }) {
  const { hasFeature } = useAppContext();
  if (hasFeature(feature)) return null;
  return (
    <div className="group relative inline-flex ml-2">
      <Lock className="w-4 h-4 text-[#555] group-hover:text-white transition-colors" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-[#222] border border-white/10 rounded-lg text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
        Upgrade to unlock this feature
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const { workspace: globalWorkspace, saveWorkspace, hasFeature } = useAppContext();
  const [activeTab, setActiveTab] = useState<'brand' | 'customization' | 'notificationPreferences' | 'security'>('brand');
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [localWorkspace, setLocalWorkspace] = useState<WorkspaceSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize local workspace from global one
  useEffect(() => {
    if (globalWorkspace && !localWorkspace) {
      setLocalWorkspace(globalWorkspace);
    }
  }, [globalWorkspace]);

  const isDirty = localWorkspace && globalWorkspace && JSON.stringify(localWorkspace) !== JSON.stringify(globalWorkspace);

  const handleSave = async () => {
    if (!localWorkspace || isSaving) return;
    setIsSaving(true);
    try {
      await saveWorkspace(localWorkspace);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateBrand = (key: string, value: any) => {
    if (!localWorkspace) return;
    setLocalWorkspace({ ...localWorkspace, brand: { ...localWorkspace.brand, [key]: value } });
  };

  const updateColor = (key: string, value: any) => {
    if (!localWorkspace) return;
    setLocalWorkspace({ ...localWorkspace, color: { ...localWorkspace.color, [key]: value } });
  };

  const updateLayout = (key: string, value: any) => {
    if (!localWorkspace) return;
    setLocalWorkspace({ ...localWorkspace, layout: { ...localWorkspace.layout, [key]: value } });
  };

  const updateNotifications = (key: string, value: any) => {
    if (!localWorkspace) return;
    setLocalWorkspace({ ...localWorkspace, notifications: { ...localWorkspace.notifications, [key]: value } });
  };

  // Preview styling extraction
  const previewColor = localWorkspace?.color?.primary || '#00D4FF';
  const previewName = localWorkspace?.brand?.name || 'Your Agency';
  const previewTagline = localWorkspace?.brand?.tagline || 'Clipping Agency Operations';

  if (!localWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1600px] mx-auto min-h-[calc(100vh-120px)] relative">
      {/* Background Visual Artifacts */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[5%] left-[-10%] w-[500px] h-[500px] bg-purple-600/5 blur-[100px] rounded-full"></div>
      </div>
      
      {/* Save Button Overlay */}
      {isDirty && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-10 fade-in duration-300">
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-3 font-black uppercase tracking-widest text-xs border border-white/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
           >
             {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             {isSaving ? 'Synchronizing...' : 'Save Workspace Changes'}
           </button>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
           <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-6 py-3 rounded-2xl backdrop-blur-md flex items-center gap-3 font-bold text-xs uppercase tracking-wider">
             <Check className="w-4 h-4" /> Changes Persisted Successfully
           </div>
        </div>
      )}
      
      {/* LEFT COLUMN - TABS & CONTENT */}
      <div className="w-full lg:w-[65%] flex flex-col gap-6 pb-32">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Workspace Settings</h1>
          <p className="text-[#888] text-sm tabular-nums">Customize your OpsRelic experience and client deliverables.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 bg-[#0A0A0A]/40 backdrop-blur-xl p-2 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar shadow-xl relative z-10">
          {[
            { id: 'brand', label: 'Brand & Identity', icon: Palette },
            { id: 'customization', label: 'Customization', icon: LayoutDashboard },
            { id: 'notificationPreferences', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Lock },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-[#222] text-white shadow-sm border border-white/10' : 'text-[#888] hover:text-white hover:bg-white/5 border border-transparent'}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.id === 'notificationPreferences' && <TierBadge tier="agency" />}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="bg-[#0A0A0A]/40 backdrop-blur-xl border border-white/5 rounded-[48px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] flex-1 overflow-hidden relative z-10">
          
          {/* BRAND & IDENTITY TAB */}
          {activeTab === 'brand' && (
            <div className="p-10 md:p-14 space-y-14">
              
              {/* Agency Name & Tagline */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-display font-black text-white tracking-widest uppercase italic">
                    Agency Identity
                  </h3>
                  <p className="text-[10px] font-black text-[#333] uppercase tracking-[0.2em] mt-2">Configure primary agency identifiers for reports and dashboard.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-[#555] uppercase tracking-[0.3em] ml-1">Agency Name</label>
                    <input 
                      type="text" 
                      value={localWorkspace?.brand?.name || ''} 
                      onChange={(e) => updateBrand('name', e.target.value)}
                      placeholder="ACME MEDIA"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#222]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-[#555] uppercase tracking-[0.3em] ml-1">Tagline</label>
                    <input 
                      type="text" 
                      value={localWorkspace?.brand?.tagline || ''} 
                      onChange={(e) => updateBrand('tagline', e.target.value)}
                      placeholder="VIRAL CONTENT OPERATIONS"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#222]"
                    />
                  </div>
                </div>
              </div>

              {/* Logo Upload */}
              <div className={`space-y-4 pt-8 border-t border-white/5 ${hasFeature('whiteLabelBranding') ? '' : 'opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center">
                      Logo Upload
                      <TierBadge tier={getFeatureMinTier('whiteLabelBranding')} />
                      <FeatureLock feature="whiteLabelBranding" />
                    </h3>
                    <p className="text-xs text-[#888] mt-1">Appears on the dashboard header and white-label report exports.</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4">
                  <div className="w-24 h-24 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center overflow-hidden">
                    {localWorkspace?.brand?.logoUrl ? (
                      <img src={localWorkspace?.brand.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-[#555]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="url" 
                      value={localWorkspace?.brand?.logoUrl || ''} 
                      onChange={(e) => updateBrand('logoUrl', e.target.value)}
                      disabled={!hasFeature('whiteLabelBranding')}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#333]"
                    />
                    <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest mt-2">Paste a direct image URL (PNG/SVG transparent recommended)</p>
                  </div>
                </div>
              </div>

              {/* Brand Colors */}
              <div className="space-y-6 pt-8 border-t border-white/5">
                <div>
                  <h3 className="text-lg font-bold text-white">Color Palette</h3>
                  <p className="text-xs text-[#888] mt-1">Defines the primary accent color across the app.</p>
                </div>
                
                <div className="grid grid-cols-5 gap-3">
                  {[
                    '#3B82F6', // Blue
                    '#10B981', // Emerald
                    '#F59E0B', // Amber
                    '#EF4444', // Red
                    '#8B5CF6', // Purple
                    '#EC4899', // Pink
                    '#14B8A6', // Teal
                    '#F97316', // Orange
                    '#06B6D4', // Cyan
                    '#6366F1', // Indigo
                  ].map((presetColor) => (
                    <button
                      key={presetColor}
                      onClick={() => updateColor('primary', presetColor)}
                      className={`h-12 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${localWorkspace?.color?.primary === presetColor ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: presetColor }}
                    />
                  ))}
                </div>
                <div className="pt-2">
                   <label className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2 block">Custom Hex</label>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg border border-white/10" style={{ backgroundColor: localWorkspace?.color?.primary || '#3B82F6' }}></div>
                     <input 
                       type="text" 
                       value={localWorkspace?.color?.primary || '#3B82F6'} 
                       onChange={(e) => updateColor('primary', e.target.value)}
                       className="w-32 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                     />
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMIZATION TAB */}
          {activeTab === 'customization' && (
            <div className="p-10 md:p-14 space-y-14">
              
              {/* Dashboard Layout */}
              <div className={`space-y-6 ${hasFeature('workspaceCustomization') ? '' : 'opacity-50'}`}>
                <div>
                   <h3 className="text-2xl font-display font-black text-white tracking-widest uppercase italic flex items-center">
                    Dashboard Layout
                    <TierBadge tier={getFeatureMinTier('workspaceCustomization')} />
                    <FeatureLock feature="workspaceCustomization" />
                  </h3>
                  <p className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em] mt-2">Adjust the primary view characteristics.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#0F0F0F] border border-white/5 rounded-xl">
                     <div className="flex items-center gap-3">
                       <Monitor className="w-5 h-5 text-[#888]" />
                       <div>
                         <p className="text-sm font-bold text-white">Default View Category</p>
                         <p className="text-xs text-[#555]">What stats show first?</p>
                       </div>
                     </div>
                     <select 
                       disabled={!hasFeature('workspaceCustomization')}
                       value={localWorkspace?.layout?.defaultView || 'Creators'}
                       onChange={(e) => updateLayout('defaultView', e.target.value)}
                       className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                     >
                       <option value="Creators">Creators List</option>
                       <option value="Platforms">Platform Distribution</option>
                       <option value="Timeline">Timeline / Growth</option>
                     </select>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#0F0F0F] border border-white/5 rounded-xl">
                     <div className="flex items-center gap-3">
                       <LayoutDashboard className="w-5 h-5 text-[#888]" />
                       <div>
                         <p className="text-sm font-bold text-white">Chart Style</p>
                         <p className="text-xs text-[#555]">Primary visualization format.</p>
                       </div>
                     </div>
                     <select 
                       disabled={!hasFeature('workspaceCustomization')}
                       value={localWorkspace?.layout?.chartStyle || 'Line'}
                       onChange={(e) => updateLayout('chartStyle', e.target.value)}
                       className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                     >
                       <option value="Line">Clean Line Chart</option>
                       <option value="Area">Filled Area Chart</option>
                       <option value="Bar">Vertical Bar Chart</option>
                     </select>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notificationPreferences' && (
            <div className="p-8 space-y-10">
              <div className={`space-y-4 ${hasFeature('notificationPreferences') ? '' : 'opacity-50'}`}>
                <h3 className="text-lg font-bold text-white flex items-center">
                  Alerts & Summaries
                  <TierBadge tier={getFeatureMinTier('notificationPreferences')} />
                  <FeatureLock feature="notificationPreferences" />
                </h3>
                
                <div className="space-y-3">
                  {[
                    { id: 'flagsPending', label: 'Flagger approvals pending', desc: 'Notify when clips are marked for manual review.' },
                    { id: 'weeklySummary', label: 'Weekly performance summary', desc: 'Receive a self-email every Monday morning.' }
                  ].map(notif => (
                    <div key={notif.id} className="bg-[#0F0F0F] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{notif.label}</h4>
                        <p className="text-xs text-[#888] mt-0.5">{notif.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" disabled={!hasFeature('notificationPreferences')} checked={localWorkspace?.notifications?.[notif.id as keyof typeof localWorkspace.notifications] ?? false} onChange={(e) => updateNotifications(notif.id, e.target.checked)} />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="p-10 md:p-14 space-y-10">
              <div>
                <h3 className="text-2xl font-display font-black text-white tracking-widest uppercase italic">
                  Security
                </h3>
                <p className="text-[10px] font-black text-[#333] uppercase tracking-[0.2em] mt-2">Manage your account authentication settings.</p>
              </div>

              <div className="bg-[#0F0F0F] p-6 rounded-xl border border-white/5 space-y-4">
                <h4 className="text-sm font-bold text-white">Password Management</h4>
                <p className="text-xs text-[#888]">
                  Click the button below to send a secure password reset link to your email address ({auth.currentUser?.email}).
                </p>
                <button 
                  onClick={async () => {
                     const user = auth.currentUser;
                     if (user?.email) {
                        try {
                           const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                           await updateDoc(doc(db, 'users', user.uid), {
                             passwordResetCode: code,
                             codeCreatedAt: serverTimestamp()
                           });
                           setShowSecurityModal(true);
                           alert("Code generated: " + code + ". (In production, this would be sent to " + user.email + ")");
                        } catch (e) {
                           console.error("Error:", e);
                           alert("Error: " + (e instanceof Error ? e.message : String(e)));
                        }
                     }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                >
                  Generate Reset Code
                </button>
              </div>
            </div>
          )}

          <PasswordSecurityModal 
            isOpen={showSecurityModal} 
            onClose={() => setShowSecurityModal(false)}
            email={auth.currentUser?.email || ''}
          />

        </div>
      </div>      {/* RIGHT COLUMN - LIVE PREVIEW */}
      <div className="w-full lg:w-[35%] flex flex-col gap-6 sticky top-24 h-max">
        <h3 className="text-[10px] font-black text-[#333] uppercase tracking-[0.3em] pl-1">Live Preview</h3>
        
        {/* Preview Container */}
        <div className="relative group">
           <div className="absolute -inset-4 bg-blue-600/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>
           <div className="bg-[#0A0A0A]/60 backdrop-blur-3xl rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] overflow-hidden border border-white/10 relative p-6 transition-all duration-500 group-hover:border-white/20" style={{ minHeight: '600px' }}>
          
          {/* Mock Browser Frame */}
          <div className="bg-white/5 px-6 py-4 flex items-center justify-between rounded-t-[32px] border border-white/5 border-b-0">
             <div className="flex space-x-2">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
             </div>
             <div className="text-[9px] font-black text-white/20 bg-black/40 px-4 py-1.5 rounded-full border border-white/5 tracking-widest uppercase">
               RELIC.OS_DASHBOARD
             </div>
             <div className="w-10"></div>
          </div>

          <div className="bg-white rounded-b-[32px] p-10 min-h-[500px]">
             {/* Preview: Header / Cover */}
             <div className="flex flex-col items-center text-center mb-12 pb-12 border-b border-black/5">
                {localWorkspace?.brand?.logoUrl ? (
                  <img src={localWorkspace.brand.logoUrl} alt="Logo" className="w-24 h-24 object-contain mb-6" />
                ) : (
                  <div className="w-20 h-20 rounded-[32px] mb-6 flex items-center justify-center text-white shadow-2xl transition-all duration-500 transform hover:rotate-6" style={{ backgroundColor: previewColor, boxShadow: `0 20px 40px ${previewColor}44` }}>
                     <span className="font-black text-3xl">{previewName.substring(0, 2).toUpperCase()}</span>
                  </div>
                )}
                <h2 className="text-3xl font-display font-black text-black tracking-tighter uppercase italic">{previewName}</h2>
                <p className="text-[10px] font-black tracking-[0.3em] mt-3 uppercase" style={{ color: previewColor }}>{previewTagline}</p>
             </div>

             {/* Preview: Mock content based on tab */}
             <div className="space-y-8">
                {/* Mock dashboard KPIs */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-[24px] bg-black/[0.02] border border-black/5">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30 mb-3">Net Impressions</div>
                    <div className="text-3xl font-black text-black tracking-tighter leading-none italic">12.4M</div>
                  </div>
                  <div className="p-6 rounded-[24px] bg-black/[0.02] border border-black/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110" style={{ backgroundColor: previewColor }}></div>
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30 mb-3">Total Payouts</div>
                    <div className="text-3xl font-black tracking-tighter leading-none italic" style={{ color: previewColor }}>$12.5K</div>
                  </div>
                </div>
                
                {/* Mock Chart Area */}
                <div className="p-8 rounded-[48px] bg-black/[0.02] border border-black/5 h-48 flex flex-col justify-end gap-2 items-end">
                   <div className="w-full flex items-end justify-between h-24 px-4">
                     {[30, 50, 40, 70, 45, 80, 60].map((h, i) => (
                       <div key={i} className="w-6 rounded-t-lg transition-all duration-500" style={{ height: `${h}%`, backgroundColor: previewColor, opacity: 0.3 + (i * 0.1) }}></div>
                     ))}
                   </div>
                </div>
                
                <button className="w-full py-5 rounded-[24px] text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all" style={{ backgroundColor: previewColor, boxShadow: `0 15px 30px ${previewColor}33` }}>
                  Execute Deployment
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
