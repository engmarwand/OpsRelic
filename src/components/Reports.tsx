import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../lib/store';
import { formatViews, formatMoney } from '../lib/data';
import { 
  Printer, 
  Download, 
  Eye, 
  FileText, 
  CheckCircle, 
  Lock, 
  Layout, 
  Palette, 
  Type, 
  Settings2, 
  GripVertical, 
  Crown, 
  Calendar,
  Mail,
  ChevronRight,
  Maximize2,
  Trash2,
  Plus,
  Monitor,
  ExternalLink,
  Save,
  FolderOpen
} from 'lucide-react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { getFeatureMinTier } from '../lib/plans';

const PRESET_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function TierBadge({ tier }: { tier: 'starter' | 'pro' | 'agency' }) {
  if (tier === 'starter') return null;
  if (tier === 'pro') return <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#00D4FF]/15 text-[#00D4FF] uppercase tracking-wider">Pro</span>;
  return <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF8C00]/15 text-[#FF8C00] uppercase tracking-wider">Agency</span>;
}

function GatedFeature({ 
  isAllowed, 
  featureId, 
  description, 
  children,
  className = ""
}: { 
  isAllowed: boolean; 
  featureId: keyof import('../lib/plans').PlanFeatures; 
  description: string; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative group ${className}`}>
      <div className={`${isAllowed ? '' : 'opacity-30 pointer-events-none filter grayscale-[50%] blur-[0.5px] transition-all'}`}>
        {children}
      </div>
      {!isAllowed && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-black/40 rounded-xl border border-white/10 backdrop-blur-[1px]">
          <div className="bg-[#111] p-3 rounded-xl border border-white/5 shadow-2xl flex flex-col items-center text-center max-w-[200px]">
            <Lock className="w-4 h-4 text-emerald-500 mb-1.5" />
            <p className="text-[11px] font-bold text-white mb-0.5 leading-tight tracking-wide capitalize">Available on {getFeatureMinTier(featureId)}</p>
            <p className="text-[9px] text-[#888] leading-snug">{description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const { data, workspace, setWorkspace, hasFeature, trackUsage, getLimit, getUsage, setShowPricing } = useAppContext();
  
  // Local Config State
  const [activeConfigTab, setActiveConfigTab] = useState<'content' | 'branding' | 'sharing'>('content');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('All');
  const [reportTitle, setReportTitle] = useState('Campaign Performance Report');
  const [reportSubtitle, setReportSubtitle] = useState('');
  const [reportFont, setReportFont] = useState<'Inter' | 'Space Grotesk' | 'Outfit' | 'Playfair Display' | 'JetBrains Mono'>('Inter');
  const [reportBgColor, setReportBgColor] = useState<string>('#FFFFFF');
  const [reportHeadingColor, setReportHeadingColor] = useState<string>('#000000');
  const [reportAccentColor, setReportAccentColor] = useState<string>('#3B82F6');
  
  // Templates
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('opsrelic_report_templates');
    if (saved) setSavedTemplates(JSON.parse(saved));
  }, []);

  const saveTemplate = () => {
    if (!templateName) return;
    const newTemplate = {
       id: Date.now(),
       name: templateName,
       config: {
         reportTitle, reportSubtitle, reportFont, reportBgColor, reportHeadingColor, reportAccentColor,
         showKpiSection, showChart, showPerformerTable, showSummary, summaryText
       }
    };
    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem('opsrelic_report_templates', JSON.stringify(updated));
    setTemplateName('');
  };

  const applyTemplate = (t: any) => {
    const c = t.config;
    setReportTitle(c.reportTitle);
    setReportSubtitle(c.reportSubtitle);
    setReportFont(c.reportFont);
    setReportBgColor(c.reportBgColor);
    setReportHeadingColor(c.reportHeadingColor);
    setReportAccentColor(c.reportAccentColor);
    setShowKpiSection(c.showKpiSection);
    setShowChart(c.showChart);
    setShowPerformerTable(c.showPerformerTable);
    setShowSummary(c.showSummary);
    setSummaryText(c.summaryText || '');
  };
  
  // Local toggles for this specific report instance
  const [showKpiSection, setShowKpiSection] = useState(true);
  const [showChart, setShowChart] = useState(true);
  const [showPerformerTable, setShowPerformerTable] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  // Timeline State
  const [timelineMode, setTimelineMode] = useState<'Full' | 'Single' | 'Last7' | 'Last30' | 'Custom'>(
    workspace?.reports?.defaultDateRange === 'Last 7 days' ? 'Last7' :
    workspace?.reports?.defaultDateRange === 'Last 30 days' ? 'Last30' : 'Full'
  );
  const [singleDate, setSingleDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const campaigns = useMemo(() => Array.from(new Set(data.map(r => r.Campaign))).sort(), [data]);
  const primaryColor = workspace?.color?.primary || '#3B82F6';

  const updateReportsSetting = (key: string, value: any) => {
    if (!workspace) return;
    setWorkspace({ ...workspace, reports: { ...workspace.reports, [key]: value } });
  };

  const handlePrint = () => {
    const success = trackUsage('reportsPerMonth');
    if (!success) {
      alert(`You have reached your limit of ${getLimit('reportsPerMonth')} reports this month.`);
      return;
    }
    
    // Smooth transition for print
    const timer = setTimeout(() => {
      window.print();
    }, 100);
    
    return () => clearTimeout(timer);
  };

  // Data processing logic
  const baseReportData = useMemo(() => data.filter(r => (selectedCampaign === 'All' || r.Campaign === selectedCampaign) && r.Status === 'Approved'), [data, selectedCampaign]);

  // Parse latest date for relative offsets
  const latestDateMs = useMemo(() => {
    let max = 0;
    baseReportData.forEach(r => {
      const d = new Date(r["Submission Date"]).getTime();
      if (!isNaN(d) && d > max) max = d;
    });
    return max || Date.now();
  }, [baseReportData]);
  
  const nowMs = latestDateMs;

  const reportData = useMemo(() => baseReportData.filter(r => {
    if (timelineMode === 'Full') return true;
    const rowTime = new Date(r["Submission Date"]).getTime();
    if (isNaN(rowTime)) return true;

    if (timelineMode === 'Single') return new Date(rowTime).toISOString().split('T')[0] === singleDate;
    if (timelineMode === 'Last7') return rowTime >= nowMs - (7 * 24 * 60 * 60 * 1000);
    if (timelineMode === 'Last30') return rowTime >= nowMs - (30 * 24 * 60 * 60 * 1000);
    if (timelineMode === 'Custom') {
      const sMs = startDate ? new Date(startDate).getTime() : 0;
      const eMs = endDate ? new Date(endDate).getTime() : Infinity;
      return rowTime >= sMs && rowTime <= eMs + 86399999;
    }
    return true;
  }), [baseReportData, timelineMode, singleDate, nowMs, startDate, endDate]);

  const { totalViews, totalPaidOut, totalCreators, ecpm } = useMemo(() => {
    const views = reportData.reduce((sum, r) => sum + r.Views, 0);
    const paid = reportData.reduce((sum, r) => sum + r["Amount Paid"], 0);
    const creators = new Set(reportData.map(r => r.Creator)).size;
    const efficiency = views > 0 ? (paid / views) * 1000 : 0;
    return { totalViews: views, totalPaidOut: paid, totalCreators: creators, ecpm: efficiency };
  }, [reportData]);

  // Chart aggregation
  const chartData = useMemo(() => {
    const viewsByDate: Record<string, number> = {};
    [...reportData].sort((a,b) => new Date(a["Submission Date"]).getTime() - new Date(b["Submission Date"]).getTime()).forEach(r => {
      const d = new Date(r["Submission Date"]);
      const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
      viewsByDate[dateStr] = (viewsByDate[dateStr] || 0) + r.Views;
    });
    return Object.keys(viewsByDate).map(date => ({ date, views: viewsByDate[date] }));
  }, [reportData]);

  const { currentTier, plan } = useAppContext();
  // Lock builder if on free tier or no plan
  const isLocked = !plan || plan.id === 'starter';

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start min-h-[calc(100vh-100px)]">
      
      {/* SIDEBAR EDITOR */}
      <div className="w-full xl:w-[450px] shrink-0 print:hidden space-y-8 relative">
        {isLocked && (
          <div className="absolute inset-0 z-50 bg-[#0A0A0A]/40 backdrop-blur-[4px] flex flex-col items-center justify-center p-8 text-center rounded-[48px] border border-white/5">
             <div className="bg-[#0A0A0A] p-10 rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-sm relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-4 mt-8 italic">Builder Locked</h3>
                <p className="text-[10px] text-[#444] font-black uppercase tracking-[0.2em] leading-relaxed mb-10">
                  Provision higher clearance to unlock manual report generation and automated scheduling modules.
                </p>
                <button 
                  onClick={() => setShowPricing(true)}
                  className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-gray-100 transition-all font-sans shadow-xl active:scale-95"
                >
                  Upgrade Access
                </button>
             </div>
          </div>
        )}
        
            {/* Header/Limit Info */}
        <div className="bg-[#0A0A0A] border border-white/[0.05] rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-lg text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em]">Module</h3>
                  <p className="text-xl font-display font-black text-white tracking-widest uppercase italic mt-1">Audit Builder</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-[#333] font-black uppercase tracking-[0.4em]">Quotas</p>
                <p className="text-lg font-black text-white tabular-nums tracking-tighter mt-1">{getUsage('reportsPerMonth')} <span className="text-[#333] text-sm">/ {getLimit('reportsPerMonth')}</span></p>
              </div>
            </div>

            {/* Template Quick Actions */}
            <div className="space-y-3">
               <div className="flex items-center gap-2 mb-2">
                 <FolderOpen className="w-3 h-3 text-[#555]" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-[#555]">Templates</span>
               </div>
               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        placeholder="Template Name..."
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-blue-500/50 shadow-inner"
                      />
                      {templateName && (
                        <button onClick={saveTemplate} className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors">
                          <Save className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  {savedTemplates.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#888] hover:text-white hover:border-white/20 transition-all flex items-center gap-2"
                    >
                      {t.name}
                      <Trash2 className="w-2.5 h-2.5 text-[#333] hover:text-red-500" onClick={(e) => {
                         e.stopPropagation();
                         const updated = savedTemplates.filter(item => item.id !== t.id);
                         setSavedTemplates(updated);
                         localStorage.setItem('opsrelic_report_templates', JSON.stringify(updated));
                      }} />
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Floating Navigation Tabs */}
        <div className="flex p-2 bg-[#0A0A0A] rounded-[24px] border border-white/5 shadow-2xl">
          {[
            { id: 'content', label: 'Content', icon: Layout },
            { id: 'branding', label: 'Design', icon: Palette },
            { id: 'sharing', label: 'Sharing', icon: Mail },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveConfigTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeConfigTab === tab.id ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-[#444] hover:text-[#888]'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Config Area */}
        <div className="bg-[#111] border border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-280px)] xl:max-h-[700px]">
          <div className="p-6 space-y-8 overflow-y-auto no-scrollbar pb-10">
            
            {/* CONTENT TAB */}
            {activeConfigTab === 'content' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#555] flex items-center gap-2">
                    <Settings2 className="w-3 h-3" /> Report Data Source
                  </h4>
                  <div className="space-y-4">
                    <div className="group/field">
                      <label className="block text-[10px] font-black text-[#555] uppercase tracking-widest mb-2 pl-1 group-focus-within/field:text-blue-400 transition-colors">Campaign Source</label>
                      <select 
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        className="w-full bg-[#0F0F0F] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white/90 focus:outline-none focus:border-blue-500/30 transition-all font-bold"
                      >
                        <option value="All">All Campaigns (Global View)</option>
                        {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="group/field">
                      <label className="block text-[10px] font-black text-[#555] uppercase tracking-widest mb-2 pl-1 group-focus-within/field:text-blue-400 transition-colors">Date Selection</label>
                      <select 
                        value={timelineMode}
                        onChange={(e) => setTimelineMode(e.target.value as any)}
                        className="w-full bg-[#0F0F0F] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white/90 focus:outline-none focus:border-blue-500/30 transition-all font-bold"
                      >
                        <option value="Full">Full History</option>
                        <option value="Last7">Last 7 Days</option>
                        <option value="Last30">Last 30 Days</option>
                        <option value="Custom">Custom Range</option>
                      </select>
                      {timelineMode === 'Custom' && (
                        <div className="grid grid-cols-2 gap-2 mt-3 p-1.5 bg-black/20 rounded-xl animate-in zoom-in-95 duration-200">
                          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white font-bold" />
                          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white font-bold" />
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="space-y-4 pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#555] flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Report Metadata
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider mb-2 pl-1">Primary Title</label>
                      <input 
                        type="text" 
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="e.g. Q4 Performance Audit"
                        className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider mb-2 pl-1">Subtitle / Reference</label>
                      <input 
                        type="text" 
                        value={reportSubtitle}
                        onChange={(e) => setReportSubtitle(e.target.value)}
                        placeholder="Internal Use Only"
                        className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4 pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#555] flex items-center gap-2">
                    <Maximize2 className="w-3 h-3" /> Module Visibility
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Executive Summary', state: showSummary, set: setShowSummary, featureId: 'perClientBranding', desc: 'Qualitative analysis for Agency clients' },
                      { label: 'Key Metrics Grid', state: showKpiSection, set: setShowKpiSection },
                      { label: 'Growth Trajectory Chart', state: showChart, set: setShowChart },
                      { label: 'Top Performers Table', state: showPerformerTable, set: setShowPerformerTable, featureId: 'reportReordering', desc: 'Granular asset breakdown for high-tier audits' }
                    ].map((m, i) => {
                      const isAllowed = !m.featureId || hasFeature(m.featureId as any);
                      return (
                        <GatedFeature key={i} isAllowed={isAllowed} featureId={m.featureId as any} description={m.desc || ""}>
                          <button 
                            onClick={() => m.set(!m.state)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${m.state ? 'bg-white/5 border-white/10 text-white' : 'bg-transparent border-transparent text-[#444] hover:text-[#666]'}`}
                          >
                            <span className="text-xs font-bold">{m.label}</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${m.state ? 'bg-blue-500' : 'bg-white/10'}`}>
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${m.state ? 'right-0.5' : 'left-0.5'}`}></div>
                            </div>
                          </button>
                        </GatedFeature>
                      );
                    })}
                  </div>
                </section>

                {showSummary && (
                  <section className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#555]">Qualitative Analysis</h4>
                      <TierBadge tier="agency" />
                    </div>
                    <GatedFeature isAllowed={hasFeature('perClientBranding')} featureId="perClientBranding" description="Add manual commentary to your reports">
                      <textarea 
                        value={summaryText}
                        onChange={e => setSummaryText(e.target.value)}
                        placeholder="Summarize the performance for your client..."
                        className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all min-h-[100px] no-scrollbar shadow-inner"
                      />
                    </GatedFeature>
                  </section>
                )}
              </div>
            )}

            {/* BRANDING TAB */}
            {activeConfigTab === 'branding' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#555]">Report Aesthetics</h4>
                  
                  {/* Highlight Color */}
                  <div className="space-y-3">
                    <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider pl-1">Primary Accent</label>
                    <div className="flex gap-2">
                      {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#000000'].map(color => (
                        <button
                          key={color}
                          onClick={() => setReportAccentColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${reportAccentColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Heading Color */}
                  <div className="space-y-3">
                    <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider pl-1">Typography Color</label>
                    <div className="flex gap-4">
                      {[{l: 'Onyx', c: '#000000'}, {l: 'Slate', c: '#334155'}, {l: 'Iron', c: '#1E293B'}].map(color => (
                        <button
                          key={color.c}
                          onClick={() => setReportHeadingColor(color.c)}
                          className={`flex-1 py-3 px-4 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${reportHeadingColor === color.c ? 'border-blue-500 bg-blue-500/5 text-blue-400' : 'border-white/5 bg-black/20 text-[#444]'}`}
                        >
                          {color.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Typography Selection */}
                  <div className="space-y-3">
                    <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider pl-1">Typography System</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'Inter', name: 'Inter (Modern)', font: 'Inter' },
                        { id: 'Space Grotesk', name: 'Space Grotesk (Tech)', font: 'Space Grotesk' },
                        { id: 'Outfit', name: 'Outfit (Clean)', font: 'Outfit' },
                        { id: 'Playfair Display', name: 'Playfair (Editorial)', font: 'Playfair Display' },
                        { id: 'JetBrains Mono', name: 'JetBrains (Mono)', font: 'JetBrains Mono' }
                      ].map(font => (
                        <button
                          key={font.id}
                          onClick={() => setReportFont(font.id as any)}
                          className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${reportFont === font.id ? 'border-blue-500 bg-blue-500/5 text-white' : 'border-white/5 bg-black/20 text-[#666] hover:text-[#888] hover:border-white/10'}`}
                        >
                          <span className="text-xs font-bold" style={{ fontFamily: font.font }}>{font.name}</span>
                          {reportFont === font.id && <CheckCircle className="w-4 h-4 text-blue-500" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] p-6 rounded-[28px] border border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                       <div>
                         <p className="text-[11px] font-bold text-white">Cover Page</p>
                         <p className="text-[10px] text-[#666]">Include high-impact intro</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={workspace?.reports?.coverPage ?? true} onChange={(e) => updateReportsSetting('coverPage', e.target.checked)} />
                        <div className="w-10 h-5 bg-white/5 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>

                    <GatedFeature isAllowed={hasFeature('whiteLabelBranding')} featureId="whiteLabelBranding" description="Remove 'Powered by' branding from document footer">
                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div>
                          <p className="text-[11px] font-bold text-white">White Labeling</p>
                          <p className="text-[10px] text-[#666]">Remove OpsRelic branding</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={workspace?.reports?.fullReportBranding ?? false} 
                            onChange={(e) => updateReportsSetting('fullReportBranding', e.target.checked)} 
                          />
                          <div className="w-10 h-5 bg-white/5 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                    </GatedFeature>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                       <div>
                         <p className="text-[11px] font-bold text-white">Platform Filters</p>
                         <p className="text-[10px] text-[#666]">Show platform specific data</p>
                       </div>
                       <div className="flex gap-1.5 flex-wrap justify-end max-w-[120px]">
                         {['TikTok', 'Instagram', 'YouTube'].map(p => (
                            <button 
                              key={p} 
                              onClick={() => {
                                const current = workspace?.reports?.defaultPlatforms || [];
                                const next = current.includes(p) ? current.filter(x => x !== p) : [...current, p];
                                updateReportsSetting('defaultPlatforms', next);
                              }}
                              className={`px-2 py-1 rounded text-[9px] font-black border transition-all ${workspace?.reports?.defaultPlatforms?.includes(p) ? 'bg-white text-black border-white' : 'text-[#666] border-white/10 hover:border-white/20'}`}
                            >
                              {p.substring(0,2)}
                            </button>
                         ))}
                       </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#555]">Email Identity</h4>
                    <TierBadge tier="agency" />
                  </div>
                  <GatedFeature isAllowed={hasFeature('emailBranding')} featureId="emailBranding" description="Custom sender info for all scheduled reports">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider mb-2 pl-1">From Name</label>
                        <input type="text" value={workspace?.reports?.fromName || ''} onChange={e => updateReportsSetting('fromName', e.target.value)} placeholder={workspace?.brand?.name || "Agency Name"} className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none shadow-inner" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider mb-2 pl-1">Reply-To Email</label>
                        <input type="email" value={workspace?.reports?.replyTo || ''} onChange={e => updateReportsSetting('replyTo', e.target.value)} placeholder="hello@opsrelic.com" className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none shadow-inner" />
                      </div>
                    </div>
                  </GatedFeature>
                </section>
              </div>
            )}

            {/* SHARING TAB */}
            {activeConfigTab === 'sharing' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <section className="space-y-6">
                  <div className="bg-blue-600/5 border border-blue-500/10 p-8 rounded-[32px] text-center space-y-6 transition-all hover:bg-blue-600/10 group">
                    <div className="w-16 h-16 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/30 group-hover:scale-110 transition-transform">
                      <Download className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-display font-black text-white tracking-widest uppercase italic mb-2">Export Audit</h4>
                      <p className="text-[10px] text-[#555] font-black uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto">
                        High-fidelity PDF document with embedded performance metrics and clip links.
                      </p>
                    </div>
                    <button 
                      onClick={handlePrint} 
                      className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-blue-500 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.4)] active:scale-95 flex items-center justify-center gap-3"
                    >
                      Download Performance PDF
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </section>

                <section className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#555]">Automation Roadmap</h4>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded">Coming Soon</span>
                  </div>
                  <GatedFeature isAllowed={hasFeature('scheduledReports')} featureId="scheduledReports" description="Schedule automatic recurring report emails">
                     <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-4 filter grayscale opacity-60">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-white/40" />
                           </div>
                           <div>
                              <p className="text-[11px] font-bold text-white">Smart Scheduling</p>
                              <p className="text-[9px] text-[#444]">Auto-email reports to clients weekly</p>
                           </div>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-600 w-[75%] opacity-20"></div>
                        </div>
                        <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest text-center">Development at 75% • Q3 2026</p>
                     </div>
                  </GatedFeature>
                </section>
              </div>
            )}

          </div>

          {/* Action Bar */}
          <div className="p-6 bg-[#1A1A1A] border-t border-white/5">
             <button onClick={handlePrint} className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.3em] text-[10px] py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]">
               <Download className="w-4 h-4" />
               Build Professional Audit PDF
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full bg-[#111] p-1 lg:p-4 rounded-[40px] border border-white/5 shadow-2xl relative group print:p-0 print:border-none print:shadow-none print:bg-white">
        
        {/* Device Wrapper Emulation */}
        <div className="rounded-[32px] overflow-hidden min-h-[1000px] shadow-2xl transition-all duration-500 text-black p-0 relative print:rounded-none print:shadow-none print:min-h-0" style={{ fontFamily: reportFont, backgroundColor: reportBgColor, color: reportHeadingColor }}>
          
          <div className="mx-auto max-w-4xl py-16 px-12 md:px-20 min-h-screen print:py-10 print:px-10">
            
            {/* Cover Page */}
            {workspace?.reports?.coverPage && (
              <div className="flex flex-col items-center justify-center min-h-[900px] text-center mb-20 border-b-8 border-black/5 animate-in fade-in duration-700 print:min-h-screen print:mb-0 print:break-after-page">
                {workspace?.brand?.logoUrl ? (
                  <img src={workspace.brand.logoUrl} alt="Logo" className="w-24 h-24 object-contain mb-12" />
                ) : (
                  <div className="w-20 h-20 rounded-3xl mb-12 flex items-center justify-center text-white text-3xl font-black shadow-2xl" style={{ backgroundColor: reportAccentColor }}>
                    {workspace?.brand?.name?.substring(0,2).toUpperCase() || 'OR'}
                  </div>
                )}
                <div className="space-y-6">
                  <h1 className="text-6xl font-black tracking-tighter leading-[1.1]" style={{ color: reportHeadingColor }}>{reportTitle}</h1>
                  {reportSubtitle && <p className="text-2xl font-medium tracking-tight opacity-40" style={{ color: reportHeadingColor }}>{reportSubtitle}</p>}
                </div>

                <div className="mt-32 w-12 h-1 mx-auto rounded-full opacity-10" style={{ backgroundColor: reportHeadingColor }}></div>

                <div className="mt-auto space-y-2 pb-20">
                  <p className="text-sm font-black uppercase tracking-widest opacity-30" style={{ color: reportHeadingColor }}>Prepared by</p>
                  <p className="text-xl font-bold" style={{ color: reportHeadingColor }}>{workspace?.brand?.name || 'OpsRelic Agency'}</p>
                  <p className="text-sm font-semibold opacity-40" style={{ color: reportHeadingColor }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="space-y-24">
              
              {/* Internal Header */}
              <header className="flex justify-between items-end border-b-2 border-black/5 pb-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1 px-2 text-white text-[8px] font-black uppercase tracking-widest rounded" style={{ backgroundColor: reportHeadingColor }}>Confidential</div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-20" style={{ color: reportHeadingColor }}>{workspace?.brand?.name || 'OpsRelic Agency'} | Internal Audit</span>
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter leading-none" style={{ color: reportHeadingColor }}>{selectedCampaign === 'All' ? 'Overall Strategy' : selectedCampaign}</h2>
                  <p className="font-bold uppercase tracking-widest text-[11px] opacity-40">{reportTitle}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-1" style={{ color: reportHeadingColor }}>Snapshot Date</p>
                   <p className="text-sm font-bold" style={{ color: reportHeadingColor }}>{new Date().toLocaleDateString()}</p>
                </div>
              </header>

              {/* Summary Module */}
              {showSummary && (
                <div className="relative group/module">
                  <div className={`bg-black/5 rounded-[32px] p-10 border-l-[12px] transition-all ${hasFeature('perClientBranding') ? '' : 'filter blur-[2px] opacity-40 select-none pointer-events-none'}`} style={{ borderColor: reportAccentColor }}>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-6" style={{ color: reportHeadingColor }}>Agency Commentary</h3>
                    <div className="text-lg font-medium opacity-70 leading-relaxed space-y-4" style={{ color: reportHeadingColor }}>
                      {summaryText ? (
                        <div className="whitespace-pre-wrap">{summaryText}</div>
                      ) : (
                        <p>
                          Performance remains robust with <span className="font-bold" style={{ color: reportHeadingColor }}>{formatViews(totalViews)}</span> total verified impressions across <span className="font-bold" style={{ color: reportHeadingColor }}>{totalCreators}</span> active contributors. 
                          The effective capital efficiency is sustained at <span className="font-bold" style={{ color: reportHeadingColor }}>{formatMoney(ecpm)} eCPM</span>, indicating a highly optimized viral feedback loop.
                        </p>
                      )}
                    </div>
                  </div>
                  {!hasFeature('perClientBranding') && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white px-6 py-3 rounded-2xl shadow-2xl border border-black/5 flex items-center gap-3">
                        <Crown className="w-5 h-5 text-amber-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-black">Agency Exclusive Module</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* KPI Module */}
              {showKpiSection && (
                 <div className="grid grid-cols-2 gap-8">
                   <div className="bg-black/5 p-12 rounded-[40px] border border-black/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110"></div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-30 mb-4 relative z-10" style={{ color: reportHeadingColor }}>Total Verified Impressions</p>
                      <p className="text-7xl font-black tracking-tighter leading-none relative z-10" style={{ color: reportAccentColor }}>{formatViews(totalViews)}</p>
                   </div>
                   <div className="bg-black/5 p-12 rounded-[40px] border border-black/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110"></div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-30 mb-4 relative z-10" style={{ color: reportHeadingColor }}>Total Payouts (USD)</p>
                      <p className="text-7xl font-black tracking-tighter leading-none relative z-10" style={{ color: reportHeadingColor }}>{formatMoney(totalPaidOut)}</p>
                   </div>
                 </div>
              )}

              {/* Chart Module */}
              {showChart && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black tracking-tight flex items-center gap-3" style={{ color: reportHeadingColor }}>
                      Performance Trajectory
                      <div className="w-1.5 h-1.5 rounded-full opacity-10" style={{ backgroundColor: reportHeadingColor }}></div>
                      <span className="text-xs font-bold opacity-30 uppercase tracking-widest">{chartData.length} Data Points</span>
                    </h3>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={reportAccentColor} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={reportAccentColor} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#E5E5E5" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 10, fontWeight: 700}} dy={15} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 10, fontWeight: 700}} tickFormatter={formatViews} dx={-10} />
                        <Area type="monotone" dataKey="views" isAnimationActive={false} stroke={reportAccentColor} strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" activeDot={{ r: 8, strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Table Module */}
              {showPerformerTable && (
                <div className="relative group/module print:break-before-page">
                  <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 transition-all ${hasFeature('reportReordering') ? '' : 'filter blur-[2px] opacity-40 select-none pointer-events-none'}`}>
                    <h3 className="text-xl font-black tracking-tight" style={{ color: reportHeadingColor }}>Contributor Yield Audit</h3>
                    <div className="overflow-hidden border border-black/5 rounded-[32px]">
                      <table className="w-full text-left">
                        <thead className="bg-black/5 border-b border-black/5">
                          <tr className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: reportHeadingColor }}>
                            <th className="px-8 py-5">Asset Intelligence</th>
                            <th className="px-8 py-5 text-right">Yield</th>
                            <th className="px-8 py-5 text-right print:hidden">Audit Link</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 text-sm font-medium">
                          {reportData.sort((a,b) => b.Views - a.Views).slice(0, 15).map((row, i) => (
                             <tr key={i} className="hover:bg-black/[0.02] transition-colors">
                              <td className="px-8 py-6">
                                 <p className="font-bold leading-tight" style={{ color: reportHeadingColor }}>{row["Content Title"]}</p>
                                 <span className="text-[10px] uppercase font-black opacity-20 tracking-wider flex items-center gap-2 mt-1" style={{ color: reportHeadingColor }}>
                                   {row.Creator}
                                   <div className="w-1 h-1 rounded-full bg-black/10"></div>
                                   {row.Platform}
                                 </span>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <span className="text-xl font-black tracking-tighter" style={{ color: i < 3 ? reportAccentColor : reportHeadingColor }}>{formatViews(row.Views)}</span>
                              </td>
                              <td className="px-8 py-6 text-right print:hidden">
                                 {row["Clip URL"] ? (
                                   <a href={row["Clip URL"]} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-black/5 rounded-lg inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-all">
                                      View Clip <ExternalLink className="w-3 h-3" />
                                   </a>
                                 ) : (
                                   <span className="text-[9px] font-bold opacity-10 uppercase italic">No Link</span>
                                 )}
                              </td>
                             </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {!hasFeature('reportReordering') && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white px-6 py-3 rounded-2xl shadow-2xl border border-black/5 flex items-center gap-3">
                        <Crown className="w-5 h-5 text-amber-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-black">Agency Exclusive Table</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

               {/* Footer */}
              <footer className="pt-20 pb-10 flex flex-col items-center mt-20 gap-8 border-t border-black/5">
                 {workspace?.reports?.fullReportBranding && hasFeature('whiteLabelBranding') ? (
                    <div className="flex flex-col items-center gap-3">
                       {workspace.brand?.logoUrl && <img src={workspace.brand.logoUrl} alt="L" className="w-10 h-10 object-contain brightness-0 opacity-20" />}
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20" style={{ color: reportHeadingColor }}>{workspace.brand?.name || 'OpsRelic Agency'}</p>
                    </div>
                 ) : (
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] opacity-10 transition-opacity hover:opacity-50" style={{ color: reportHeadingColor }}>
                       <FileText className="w-3.5 h-3.5" />
                       Powered by OpsRelic Intelligence
                    </div>
                 )}
                 <div className="flex gap-10 text-[10px] font-bold opacity-20 tracking-widest" style={{ color: reportHeadingColor }}>
                    <span>SECURITY CLASSIFICATION: C1</span>
                    <span>SNAPSHOT ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                    <span>{new Date().getUTCFullYear()} PRIVATE DATA</span>
                 </div>
              </footer>

            </div>
          </div>
        </div>

        {/* Floating Print Shortcut */}
        <button onClick={handlePrint} className="absolute bottom-10 right-10 p-5 bg-white text-black rounded-full shadow-2xl border border-black/5 hover:scale-110 active:scale-95 transition-all print:hidden opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
          <Download className="w-6 h-6" />
        </button>

      </div>

    </div>
  );
}
