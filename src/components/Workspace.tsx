import React, { useState, useRef } from 'react';
import { useAppContext } from '../lib/store';
import { Settings, Image as ImageIcon, Palette, LayoutDashboard, Bell, FileText, UploadCloud, X, Check, Lock, ChevronDown, Monitor, Moon, Sun, GripVertical, AlertCircle, Plus, Mail } from 'lucide-react';
import { getFeatureMinTier } from '../lib/plans';
import type { PlanFeatures } from '../lib/plans';

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
  const { workspace, setWorkspace, hasFeature } = useAppContext();
  const [activeTab, setActiveTab] = useState<'brand' | 'reports' | 'customization' | 'notificationPreferences'>('brand');

  const updateBrand = (key: string, value: any) => {
    if (!workspace) return;
    setWorkspace({ ...workspace, brand: { ...workspace.brand, [key]: value } });
  };

  const updateColor = (key: string, value: any) => {
    if (!workspace) return;
    setWorkspace({ ...workspace, color: { ...workspace.color, [key]: value } });
  };

  const updateReports = (key: string, value: any) => {
    if (!workspace) return;
    setWorkspace({ ...workspace, reports: { ...workspace.reports, [key]: value } });
  };

  const updateLayout = (key: string, value: any) => {
    if (!workspace) return;
    setWorkspace({ ...workspace, layout: { ...workspace.layout, [key]: value } });
  };

  const updateNotifications = (key: string, value: any) => {
    if (!workspace) return;
    setWorkspace({ ...workspace, notifications: { ...workspace.notifications, [key]: value } });
  };

  // Preview styling extraction
  const previewColor = workspace?.color?.primary || '#00D4FF';
  const previewName = workspace?.brand?.name || 'Your Agency';
  const previewTagline = workspace?.brand?.tagline || 'Clipping Agency Operations';

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1600px] mx-auto min-h-[calc(100vh-120px)]">
      
      {/* LEFT COLUMN - TABS & CONTENT */}
      <div className="w-full lg:w-[65%] flex flex-col gap-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Workspace Settings</h1>
          <p className="text-[#888] text-sm tabular-nums">Customize your OpsRelic experience and client deliverables.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 bg-[#111] p-1.5 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
          {[
            { id: 'brand', label: 'Brand & Identity', icon: Palette },
            { id: 'reports', label: 'Reports', icon: FileText },
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
        <div className="bg-[#111] border border-white/5 rounded-2xl shadow-xl flex-1 overflow-hidden">
          
          {/* BRAND & IDENTITY TAB */}
          {activeTab === 'brand' && (
            <div className="p-8 space-y-10">
              
              {/* Agency Name & Tagline */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    Brand Name & Tagline
                  </h3>
                  <p className="text-xs text-[#888] mt-1">These appear on the dashboard header and on generated reports.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Agency Name</label>
                    <input 
                      type="text" 
                      value={workspace?.brand?.name || ''} 
                      onChange={(e) => updateBrand('name', e.target.value)}
                      placeholder="e.g. OpsRelic Agency"
                      className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--primary-color)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Tagline / Slogan</label>
                    <input 
                      type="text" 
                      value={workspace?.brand?.tagline || ''} 
                      onChange={(e) => updateBrand('tagline', e.target.value)}
                      placeholder="e.g. Premium Viral Distribution"
                      className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--primary-color)] transition-colors"
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
                    {workspace?.brand?.logoUrl ? (
                      <>
                        <img src={workspace.brand.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
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

              {/* Per-Client Branding Profiles (Agency) */}
              <div className={`space-y-4 pt-8 border-t border-white/5 ${hasFeature('clientProfiles') ? '' : 'opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center">
                      Client Profiles
                      <TierBadge tier={getFeatureMinTier('clientProfiles')} />
                      <FeatureLock feature="clientProfiles" />
                    </h3>
                    <p className="text-xs text-[#888] mt-1">Create unlimited isolated profiles with custom branding.</p>
                  </div>
                  <button disabled={!hasFeature('clientProfiles')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-50">
                    <Plus className="w-3 h-3" /> Add Client
                  </button>
                </div>

                <div className="bg-[#0F0F0F] rounded-xl border border-white/5 p-8 text-center text-white/40">
                  <p className="text-sm">No client profiles created yet.</p>
                  <p className="text-xs mt-1">Click "Add Client" to override colors and logos for specific campaigns.</p>
                </div>
              </div>
              <div className="space-y-4 pt-8 border-t border-white/5">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    Accent Color
                  </h3>
                  <p className="text-xs text-[#888] mt-1">Replaces the default blue globally across charts, buttons, and reports.</p>
                </div>

                <div className="flex items-start gap-8">
                  {/* Single Color Picker (Starter) */}
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-3">Custom Hex</label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl border border-white/20 overflow-hidden shadow-lg cursor-pointer shrink-0">
                        <input 
                          type="color" 
                          value={workspace?.color?.primary || '#00D4FF'} 
                          onChange={(e) => updateColor('primary', e.target.value)}
                          className="absolute -inset-2 w-16 h-16 cursor-pointer"
                        />
                      </div>
                      <input 
                        type="text" 
                        value={workspace?.color?.primary || '#00D4FF'} 
                        onChange={(e) => updateColor('primary', e.target.value)}
                        className="bg-[#0F0F0F] border border-white/10 rounded-lg px-3 py-2 text-sm text-white uppercase w-24 font-mono focus:outline-none focus:border-[var(--primary-color)]"
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
                          className={`w-10 h-10 rounded-full border-2 transition-transform shadow-lg ${workspace?.color?.primary === preset.hex ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
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

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="p-8 space-y-10">
              
              {/* Basic Report Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  Report Defaults
                </h3>
                
                <div className="bg-[#0F0F0F] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Report Cover Page</h4>
                    <p className="text-xs text-[#888] mt-0.5">Include a branded cover page on PDF exports.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={workspace?.reports?.coverPage ?? true} onChange={(e) => updateReports('coverPage', e.target.checked)} />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00D4FF]"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0F0F0F] p-4 rounded-xl border border-white/5">
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Default Date Range</label>
                    <select 
                      value={workspace?.reports?.defaultDateRange || 'Last 30 days'}
                      onChange={(e) => updateReports('defaultDateRange', e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--primary-color)]"
                    >
                      <option value="Last 7 days">Last 7 days</option>
                      <option value="Last 30 days">Last 30 days</option>
                      <option value="Last Week (Mon-Sun)">Last Week (Mon-Sun)</option>
                      <option value="Full Campaign">Full Campaign</option>
                    </select>
                  </div>
                  
                  {/* Rolling Dates Toggle (Pro) */}
                  <div className={`bg-[#0F0F0F] p-4 rounded-xl border border-white/5 ${hasFeature('rollingDateRanges') ? '' : 'opacity-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                       <label className="flex items-center text-xs font-bold text-white/70 uppercase tracking-wider">
                        Rolling Dates
                        <TierBadge tier={getFeatureMinTier('rollingDateRanges')} />
                      </label>
                      <FeatureLock feature="rollingDateRanges" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-[#888]">Use relative rolling timelines.</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" disabled={!hasFeature('rollingDateRanges')} checked={workspace?.rollingDates ?? false} onChange={(e) => workspace && setWorkspace({...workspace, rollingDates: e.target.checked})} />
                        <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00D4FF]"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0F0F0F] p-4 rounded-xl border border-white/5">
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-3">Default Platforms</label>
                  <div className="flex flex-wrap gap-4">
                    {['TikTok', 'Instagram', 'YouTube', 'Other'].map(plat => (
                      <label key={plat} className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${workspace?.reports?.defaultPlatforms?.includes(plat) ? 'bg-[#00D4FF] border-[#00D4FF]' : 'border-white/20 bg-transparent group-hover:border-white/40'}`}>
                          {workspace?.reports?.defaultPlatforms?.includes(plat) && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={workspace?.reports?.defaultPlatforms?.includes(plat)} 
                          onChange={(e) => {
                            if (!workspace) return;
                            const current = workspace?.reports?.defaultPlatforms || [];
                            if (e.target.checked) updateReports('defaultPlatforms', [...current, plat]);
                            else updateReports('defaultPlatforms', current.filter(p => p !== plat));
                          }}
                        />
                        <span className="text-sm font-semibold text-white/90">{plat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Report Branding (Pro) */}
              <div className={`space-y-4 pt-8 border-t border-white/5 ${hasFeature('whiteLabelBranding') ? '' : 'opacity-50'}`}>
                 <h3 className="text-lg font-bold text-white flex items-center">
                  Full Report Branding
                  <TierBadge tier={getFeatureMinTier('whiteLabelBranding')} />
                  <FeatureLock feature="whiteLabelBranding" />
                </h3>
                <div className="bg-[#0F0F0F] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Apply branding to report exports</h4>
                    <p className="text-xs text-[#888] mt-0.5">Custom cover, headers, charts, and footer text over default OpsRelic styles.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" disabled={!hasFeature('whiteLabelBranding')} />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00D4FF]"></div>
                  </label>
                </div>
              </div>

              {/* Email Branding (Pro) */}
              <div className={`space-y-4 pt-8 border-t border-white/5 ${hasFeature('emailBranding') ? '' : 'opacity-50'}`}>
                <h3 className="text-lg font-bold text-white flex items-center">
                  Email Branding
                  <TierBadge tier={getFeatureMinTier('emailBranding')} />
                  <FeatureLock feature="emailBranding" />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">From Name</label>
                    <input type="text" disabled={!hasFeature('emailBranding')} value={workspace?.reports?.fromName || ''} onChange={(e) => updateReports('fromName', e.target.value)} placeholder={workspace?.brand?.name || "Your Agency"} className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Reply-To Email</label>
                    <input type="email" disabled={!hasFeature('emailBranding')} value={workspace?.reports?.replyTo || ''} onChange={(e) => updateReports('replyTo', e.target.value)} placeholder="hello@agency.com" className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none disabled:opacity-50" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Email Signature</label>
                    <textarea disabled={!hasFeature('emailBranding')} value={workspace?.reports?.emailSignature || ''} onChange={(e) => updateReports('emailSignature', e.target.value)} placeholder="Best regards,&#10;The Team" className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none min-h-[80px] disabled:opacity-50" />
                  </div>
                </div>
              </div>

              {/* Scheduled Report Templates (Agency) */}
              <div className={`space-y-4 pt-8 border-t border-white/5 ${hasFeature('scheduledReports') ? '' : 'opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center">
                      Auto-Report Schedule
                      <TierBadge tier={getFeatureMinTier('scheduledReports')} />
                      <FeatureLock feature="scheduledReports" />
                    </h3>
                    <p className="text-xs text-[#888] mt-1">Configure automated recurring emails per client profile.</p>
                  </div>
                  <button disabled={!hasFeature('scheduledReports')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-50">
                    <Plus className="w-3 h-3" /> New Schedule
                  </button>
                </div>
                
                <div className="bg-[#0F0F0F] border border-white/5 rounded-xl p-6 text-center">
                  <Mail className="w-8 h-8 text-[#555] mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white/80">No active schedules</p>
                  <p className="text-xs text-[#555] mt-1">Auto-reports require webhook integrations via Zapier or Make.com</p>
                </div>
              </div>

              {/* Advanced Report Sections (Agency) */}
              <div className={`space-y-4 pt-8 border-t border-white/5 ${hasFeature('reportReordering') ? '' : 'opacity-50'}`}>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    Advanced Report Modules
                    <TierBadge tier={getFeatureMinTier('reportReordering')} />
                    <FeatureLock feature="reportReordering" />
                  </h3>
                  <p className="text-xs text-[#888] mt-1">Granular section toggles and drag-and-drop reordering.</p>
                </div>

                <div className="bg-[#0F0F0F] border border-white/5 rounded-xl overflow-hidden p-2 space-y-2">
                  {['Campaign Executive Summary', 'Timeline & Performance Charts', 'Demographic Breakdown', 'Top Submissions Gallery', 'Spend & ROI Analysis'].map((section, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-black/40 border border-white/5 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-default">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-[#555] cursor-grab hover:text-white" />
                        <span className="text-sm font-semibold text-white/90">{section}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked disabled={!hasFeature('reportReordering')} />
                        <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* CUSTOMIZATION TAB */}
          {activeTab === 'customization' && (
            <div className="p-8 space-y-10">
              
              {/* Light/Dark Mode Toggle (Starter) */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  Theme 
                </h3>
                <div className="flex gap-4">
                  <button onClick={() => updateLayout('theme', 'dark')} className={`flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${workspace?.layout?.theme === 'dark' ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-[var(--primary-color)]' : 'border-white/5 bg-[#0F0F0F] hover:bg-white/5 text-[#888]'}`}>
                    <Moon className="w-8 h-8 mb-3" />
                    <span className="font-bold">Dark Mode</span>
                  </button>
                  <button onClick={() => updateLayout('theme', 'light')} className={`flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${workspace?.layout?.theme === 'light' ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-[var(--primary-color)]' : 'border-white/5 bg-[#0F0F0F] hover:bg-white/5 text-[#888]'}`}>
                     <Sun className="w-8 h-8 mb-3" />
                     <span className="font-bold">Light Mode</span>
                  </button>
                </div>
                <p className="text-xs text-[#888]">Client PDF exports always render in high-contrast light mode automatically.</p>
              </div>

              {/* Workspace Layout Preference (Agency) */}
              <div className={`space-y-4 pt-8 border-t border-white/5 ${hasFeature('layoutStyles') ? '' : 'opacity-50'}`}>
                <h3 className="text-lg font-bold text-white flex items-center">
                  Dashboard Layout
                  <TierBadge tier={getFeatureMinTier('layoutStyles')} />
                  <FeatureLock feature='layoutStyles' />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0F0F0F] p-4 rounded-xl border border-white/5">
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Data Density</label>
                    <select disabled={!hasFeature('layoutStyles')} value={workspace?.layout?.layout || 'Standard'} onChange={(e) => updateLayout('layout', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-50">
                      <option value="Standard">Standard Layout</option>
                      <option value="Condensed">Condensed (More data visible)</option>
                      <option value="Expanded">Expanded (Larger cards)</option>
                    </select>
                  </div>
                  <div className="bg-[#0F0F0F] p-4 rounded-xl border border-white/5">
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Chart Style Preference</label>
                    <select disabled={!hasFeature('layoutStyles')} value={workspace?.layout?.chartStyle || 'Line'} onChange={(e) => updateLayout('chartStyle', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-50">
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
                          value={workspace?.metrics?.customLabels?.[metric.key] || ''}
                          onChange={(e) => {
                             if(!workspace) return;
                             setWorkspace({...workspace, metrics: { ...workspace.metrics, customLabels: { ...(workspace.metrics?.customLabels || {}), [metric.key]: e.target.value }}})
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
                    { id: 'budgetAlerts', label: 'Budget Alerts', desc: 'Notify when a campaign crosses 70% and 80% of total budget.' },
                    { id: 'flagsPending', label: 'Flagger approvals pending', desc: 'Notify when clips are marked for manual review.' },
                    { id: 'weeklySummary', label: 'Weekly performance summary', desc: 'Receive a self-email every Monday morning.' }
                  ].map(notif => (
                    <div key={notif.id} className="bg-[#0F0F0F] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{notif.label}</h4>
                        <p className="text-xs text-[#888] mt-0.5">{notif.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" disabled={!hasFeature('notificationPreferences')} checked={workspace?.notifications?.[notif.id as keyof typeof workspace.notifications] ?? false} onChange={(e) => updateNotifications(notif.id, e.target.checked)} />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-color)]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT COLUMN - LIVE PREVIEW */}
      <div className="w-full lg:w-[35%] flex flex-col gap-6 sticky top-24 h-max">
        <h3 className="text-xs font-bold text-[#888] uppercase tracking-widest pl-1">Live Preview</h3>
        
        {/* Preview Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-black/5" style={{ minHeight: '500px' }}>
          
          {/* Mock Document Header */}
          <div className="bg-black/5 px-6 py-4 flex items-center justify-between border-b border-black/5">
             <div className="flex space-x-1.5">
               <div className="w-3 h-3 rounded-full bg-red-400"></div>
               <div className="w-3 h-3 rounded-full bg-amber-400"></div>
               <div className="w-3 h-3 rounded-full bg-green-400"></div>
             </div>
             <div className="text-[10px] font-bold text-black/40 bg-white px-3 py-1 rounded border border-black/5 shadow-sm">
               dashboard.preview
             </div>
             <div className="w-10"></div>
          </div>

          <div className="p-8 pb-10">
             {/* Preview: Header / Cover */}
             <div className="flex flex-col items-center text-center mb-10 pb-10 border-b border-black/5">
                {workspace?.brand?.logoUrl ? (
                  <img src={workspace.brand.logoUrl} alt="Logo" className="w-20 h-20 object-contain mb-4" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center text-white shadow-lg shadow-black/10 transition-colors" style={{ backgroundColor: previewColor }}>
                     <span className="font-black text-2xl">{previewName.substring(0, 2).toUpperCase()}</span>
                  </div>
                )}
                <h2 className="text-2xl font-black text-black tracking-tight">{previewName}</h2>
                <p className="text-sm font-semibold text-black/50 tracking-wide mt-1 uppercase" style={{ color: previewColor }}>{previewTagline}</p>
             </div>

             {/* Preview: Mock content based on tab */}
             {activeTab === 'reports' ? (
                <div className="space-y-6">
                  <div className="h-4 w-32 bg-black/10 rounded animate-pulse"></div>
                  <div className="bg-black/5 h-32 rounded-xl border border-black/5"></div>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-black/5 h-20 rounded-xl border border-black/5"></div>
                    <div className="flex-1 bg-black/5 h-20 rounded-xl border border-black/5"></div>
                  </div>
                  {workspace?.reports?.coverPage && (
                    <div className="mt-8 p-4 rounded-xl border-2 border-dashed border-black/10 flex items-center justify-center text-xs font-bold text-black/40">
                      Cover Page Rendering Enabled
                    </div>
                  )}
                </div>
             ) : (
                <div className="space-y-6">
                  {/* Mock dashboard KPIs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-black/5 shadow-sm">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Total Views</div>
                      <div className="text-xl font-black text-black">4.2M</div>
                    </div>
                    <div className="p-4 rounded-xl border border-black/5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: previewColor }}></div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Active Cap</div>
                      <div className="text-xl font-black" style={{ color: previewColor }}>$8,400</div>
                    </div>
                  </div>
                  
                  {/* Mock Chart Area */}
                  <div className="p-4 rounded-xl border border-black/5 shadow-sm h-40 flex flex-col justify-end gap-2 items-end">
                     <div className="w-full flex items-end justify-between h-20 px-2">
                       {[30, 50, 40, 70, 45, 80, 60].map((h, i) => (
                         <div key={i} className="w-4 rounded-t-sm transition-all" style={{ height: `${h}%`, backgroundColor: previewColor }}></div>
                       ))}
                     </div>
                  </div>
                  
                  <button className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-colors" style={{ backgroundColor: previewColor }}>
                    Primary Action
                  </button>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
