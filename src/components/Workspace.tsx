import React, { useState, useEffect } from 'react';
import { useAppContext } from '../lib/store';
import { Settings, Image as ImageIcon, Palette, LayoutDashboard, Bell, FileText, UploadCloud, X, Check, Lock, ChevronDown, Monitor, GripVertical, AlertCircle, Plus, Mail, Save, Loader2 } from 'lucide-react';
import { getFeatureMinTier } from '../lib/plans';
import type { PlanFeatures } from '../lib/plans';
import type { WorkspaceSettings } from '../types';

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

export default function Workspace() {
  const { workspace: globalWorkspace, saveWorkspace, hasFeature } = useAppContext();
  const [activeTab, setActiveTab] = useState<'brand' | 'customization' | 'notificationPreferences'>('brand');
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
        <div className="flex space-x-2 bg-[#111] p-1.5 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
          {[
            { id: 'brand', label: 'Brand & Identity', icon: Palette },
            { id: 'customization', label: 'Customization', icon: LayoutDashboard },
            { id: 'notificationPreferences', label: 'Notifications', icon: Bell },
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
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[48px] shadow-2xl flex-1 overflow-hidden">
          
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

                <div className="flex gap-6 items-start">
                  <label className="flex-1 border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:bg-white/5 transition-colors cursor-pointer bg-[#0F0F0F]">
                    <UploadCloud className="w-8 h-8 text-[#555] mx-auto mb-3" />
                    <p className="text-sm font-semibold text-white/80">Click to upload logo</p>
                    <p className="text-xs text-[#555] mt-1">PNG, JPG or SVG (Max 2MB)</p>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/png, image/jpeg, image/svg+xml"
                      disabled={!hasFeature('whiteLabelBranding')}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateBrand('logoUrl', reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <div className="w-32 h-32 bg-[#0F0F0F] border border-white/5 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative group">
                    {localWorkspace?.brand?.logoUrl ? (
                      <>
                        <img src={localWorkspace.brand.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        <button 
                          onClick={() => updateBrand('logoUrl', null)}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-[#333]" />
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Domains (Agency) */}
              <div className={`space-y-4 pt-8 border-t border-white/5 ${hasFeature('customDomains') ? '' : 'opacity-50'}`}>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    Custom Domain
                    <TierBadge tier={getFeatureMinTier('customDomains')} />
                    <FeatureLock feature="customDomains" />
                  </h3>
                  <p className="text-xs text-[#888] mt-1">Host client reports on your own domain.</p>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      disabled={!hasFeature('customDomains')}
                      placeholder="reports.myagency.com"
                      className="flex-1 bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--primary-color)] transition-colors disabled:opacity-50"
                    />
                    <div className="shrink-0 bg-white/5 text-white/50 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/5">
                      Not configured
                    </div>
                  </div>
                  <p className="text-[10px] text-white/40 mt-2">Connect your custom domain in Settings → Domain Configuration (Coming Soon).</p>
                </div>
              </div>

              {/* Accent Color Section */}
              <div className="space-y-4 pt-8 border-t border-white/5">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    Accent Color
                  </h3>
                  <p className="text-xs text-[#888] mt-1">Replaces the default blue globally across charts, buttons, and reports.</p>
                </div>

                <div className="flex items-start gap-8">
                  {/* Single Color Picker (Pro+) */}
                  <div className={hasFeature('colorSchemePresets') ? '' : 'opacity-40'}>
                    <label className="flex items-center text-xs font-bold text-white/70 uppercase tracking-wider mb-3">
                      Custom Hex
                      {!hasFeature('colorSchemePresets') && <TierBadge tier="pro" />}
                      {!hasFeature('colorSchemePresets') && <FeatureLock feature="colorSchemePresets" />}
                    </label>
                    <div className="flex items-center gap-3">
                      <div className={`relative w-12 h-12 rounded-xl border border-white/20 overflow-hidden shadow-lg shrink-0 ${hasFeature('colorSchemePresets') ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <input 
                          type="color" 
                          disabled={!hasFeature('colorSchemePresets')}
                          value={localWorkspace?.color?.primary || '#00D4FF'} 
                          onChange={(e) => updateColor('primary', e.target.value)}
                          className={`absolute -inset-2 w-16 h-16 ${hasFeature('colorSchemePresets') ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                        />
                      </div>
                      <input 
                        type="text" 
                        disabled={!hasFeature('colorSchemePresets')}
                        value={localWorkspace?.color?.primary || '#00D4FF'} 
                        onChange={(e) => updateColor('primary', e.target.value)}
                        className="bg-[#0F0F0F] border border-white/10 rounded-lg px-3 py-2 text-sm text-white uppercase w-24 font-mono focus:outline-none focus:border-[var(--primary-color)] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Preset Colors (Pro) */}
                  <div className={`flex-1 ${hasFeature('colorSchemePresets') ? '' : 'opacity-40'}`}>
                    <label className="flex items-center text-xs font-bold text-white/70 uppercase tracking-wider mb-3">
                      Color Presets
                      <TierBadge tier={getFeatureMinTier('colorSchemePresets')} />
                      <FeatureLock feature="colorSchemePresets" />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { name: 'Electric Blue', hex: '#00D4FF' },
                        { name: 'Emerald Green', hex: '#10B981' },
                        { name: 'Violet Purple', hex: '#8B5CF6' },
                        { name: 'Amethyst Mango', hex: '#F97316' },
                      ].map(preset => (
                        <button
                          key={preset.hex}
                          disabled={!hasFeature('colorSchemePresets')}
                          onClick={() => {
                            updateColor('preset', preset.name);
                            updateColor('primary', preset.hex);
                          }}
                          className={`w-10 h-10 rounded-full border-2 transition-transform shadow-lg ${localWorkspace?.color?.primary === preset.hex ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* CUSTOMIZATION TAB */}
          {activeTab === 'customization' && (
            <div className="p-8 space-y-10">
              
              {/* Workspace Layout Preference (Agency) */}
              <div className={`space-y-4 ${hasFeature('layoutStyles') ? '' : 'opacity-50'}`}>
                <h3 className="text-lg font-bold text-white flex items-center">
                  Dashboard Layout
                  <TierBadge tier={getFeatureMinTier('layoutStyles')} />
                  <FeatureLock feature='layoutStyles' />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0F0F0F] p-4 rounded-xl border border-white/5">
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Data Density</label>
                    <select disabled={!hasFeature('layoutStyles')} value={localWorkspace?.layout?.layout || 'Standard'} onChange={(e) => updateLayout('layout', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-50">
                      <option value="Standard">Standard Layout</option>
                      <option value="Condensed">Condensed (More data visible)</option>
                      <option value="Expanded">Expanded (Larger cards)</option>
                    </select>
                  </div>
                  <div className="bg-[#0F0F0F] p-4 rounded-xl border border-white/5">
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Chart Style Preference</label>
                    <select disabled={!hasFeature('layoutStyles')} value={localWorkspace?.layout?.chartStyle || 'Line'} onChange={(e) => updateLayout('chartStyle', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-50">
                      <option value="Line">Smoothed Line Chart</option>
                      <option value="Bar">Vertical Bar Chart</option>
                      <option value="Area">Filled Area Chart</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Custom Metric Labels (Agency) */}
              <div className={`space-y-4 pt-8 border-t border-white/5 ${hasFeature('metricLabelCustomization') ? '' : 'opacity-50'}`}>
                <h3 className="text-lg font-bold text-white flex items-center">
                  Custom Metric Labels
                  <TierBadge tier={getFeatureMinTier('metricLabelCustomization')} />
                  <FeatureLock feature="metricLabelCustomization" />
                </h3>
                <div className="bg-[#0F0F0F] border border-white/5 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-2 bg-black/40 p-3 border-b border-white/5 text-xs font-bold text-[#888] uppercase tracking-wider">
                    <div>System Metric</div>
                    <div>How it appears to clients</div>
                  </div>
                  <div className="p-3 space-y-3">
                    {[
                      { key: 'Views', default: 'Views' },
                      { key: 'Amount Paid', default: 'Amount Paid' },
                      { key: 'Clippers', default: 'Clippers' },
                      { key: 'Avg Views/Clip', default: 'Avg Views/Clip' }
                    ].map(metric => (
                      <div key={metric.key} className="grid grid-cols-2 gap-4 items-center">
                        <div className="text-sm font-semibold text-white/90 pl-2">{metric.default}</div>
                        <input 
                          type="text"
                          disabled={!hasFeature('metricLabelCustomization')}
                          placeholder={`e.g. ${metric.default}`}
                          value={localWorkspace?.metrics?.customLabels?.[metric.key] || ''}
                          onChange={(e) => {
                             if(!localWorkspace) return;
                             setLocalWorkspace({...localWorkspace, metrics: { ...localWorkspace.metrics, customLabels: { ...(localWorkspace.metrics?.customLabels || {}), [metric.key]: e.target.value }}})
                          }}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--primary-color)] disabled:opacity-50"
                        />
                      </div>
                    ))}
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

        </div>
      </div>      {/* RIGHT COLUMN - LIVE PREVIEW */}
      <div className="w-full lg:w-[35%] flex flex-col gap-6 sticky top-24 h-max">
        <h3 className="text-[10px] font-black text-[#333] uppercase tracking-[0.3em] pl-1">Live Preview</h3>
        
        {/* Preview Container */}
        <div className="bg-[#0A0A0A] rounded-[48px] shadow-[0_0_80px_-20px_rgba(0,0,0,1)] overflow-hidden border border-white/5 relative group p-6" style={{ minHeight: '600px' }}>
          
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
  );
}
