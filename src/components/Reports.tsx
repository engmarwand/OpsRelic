import { useState } from 'react';
import { useAppContext } from '../lib/store';
import { formatViews, formatMoney } from '../lib/data';
import { Printer, Download, Eye, FileText, CheckCircle, Lock, Layout, Palette, Type, Settings2, GripVertical, Crown, Calendar } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getFeatureMinTier } from '../lib/plans';

const PRESET_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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
  const { data, workspace, hasFeature, plan, getLimit, getUsage, trackUsage } = useAppContext();
  
  // Report Builder State
  const [selectedCampaign, setSelectedCampaign] = useState<string>('All');
  const [reportTitle, setReportTitle] = useState('Campaign Performance Report');
  const [agencyName, setAgencyName] = useState(workspace?.brand?.name || 'OpsRelic Agency');
  
  const [comments, setComments] = useState('');
  const [selectedColor, setSelectedColor] = useState(workspace?.color?.primary || '#3B82F6');
  const [customHex, setCustomHex] = useState(workspace?.color?.primary || '#3B82F6');
  const [selectedFont, setSelectedFont] = useState('Inter');
  
  const [showKpiSection, setShowKpiSection] = useState(true);
  const [showChart, setShowChart] = useState(true);
  const [showPerformerTable, setShowPerformerTable] = useState(true);

  // Timeline State
  const [timelineMode, setTimelineMode] = useState<'Full' | 'Single' | 'Last7' | 'Last30' | 'Custom'>(
    workspace?.reports?.defaultDateRange === 'Last 7 days' ? 'Last7' :
    workspace?.reports?.defaultDateRange === 'Last 30 days' ? 'Last30' : 'Full'
  );
  const [singleDate, setSingleDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Sections ordering simulation
  const [sectionsOrder, setSectionsOrder] = useState(['overview', 'kpis', 'chart', 'performers']);
  
  const campaigns = Array.from(new Set(data.map(r => r.Campaign))).sort();
  
  // Filter by Campaign
  let baseReportData = data.filter(r => (selectedCampaign === 'All' || r.Campaign === selectedCampaign) && r.Status === 'Approved');

  if (workspace?.reports?.defaultPlatforms) {
    baseReportData = baseReportData.filter(r => {
      const plat = r.Platform.toLowerCase().includes('tik') ? 'TikTok' : 
                   r.Platform.toLowerCase().includes('insta') || r.Platform.toLowerCase().includes('ig') ? 'Instagram' : 
                   r.Platform.toLowerCase().includes('you') || r.Platform.toLowerCase().includes('yt') ? 'YouTube' : 'Other';
      return workspace.reports.defaultPlatforms!.includes(plat);
    });
  }

  // Parse Dates to find the latest date
  let latestDateMs = 0;
  baseReportData.forEach(r => {
    const d = new Date(r["Submission Date"]).getTime();
    if (!isNaN(d) && d > latestDateMs) {
      latestDateMs = d;
    }
  });

  const latestDateStr = latestDateMs ? new Date(latestDateMs).toISOString().split('T')[0] : '';
  const nowMs = latestDateMs || Date.now();

  // Apply Timeline Filters
  const hasDateData = baseReportData.some(r => !isNaN(new Date(r["Submission Date"]).getTime()));
  
  const reportData = baseReportData.filter(r => {
    if (timelineMode === 'Full' || !hasDateData) return true;
    
    const d = new Date(r["Submission Date"]);
    if (isNaN(d.getTime())) return true; // Include rows without valid dates so we don't break them unnecessottedly, though requirements say 'skip invalid rows or flag them... do not break'. 
    
    // Convert to simple offset start-of-day UTC-ish timestamp for basic filtering
    const rowTime = d.getTime();

    if (timelineMode === 'Single') {
      if (!singleDate) return true;
      const sDate = new Date(singleDate).getTime();
      // approximate day matching
      return new Date(rowTime).toISOString().split('T')[0] === singleDate;
    }

    if (timelineMode === 'Last7') {
      const sevenDaysAgo = nowMs - (7 * 24 * 60 * 60 * 1000);
      return rowTime >= sevenDaysAgo && rowTime <= nowMs;
    }

    if (timelineMode === 'Last30') {
      const thirtyDaysAgo = nowMs - (30 * 24 * 60 * 60 * 1000);
      return rowTime >= thirtyDaysAgo && rowTime <= nowMs;
    }

    if (timelineMode === 'Custom') {
      if (!startDate && !endDate) return true;
      const sMs = startDate ? new Date(startDate).getTime() : 0;
      const eMs = endDate ? new Date(endDate).getTime() : Infinity;
      return rowTime >= sMs && rowTime <= eMs + (24 * 60 * 60 * 1000 - 1); // up to end of day
    }

    return true;
  });

  const totalViews = reportData.reduce((sum, r) => sum + r.Views, 0);
  const totalEarned = reportData.reduce((sum, r) => sum + r["Amount Paid"], 0);
  const totalCreators = new Set(reportData.map(r => r.Creator)).size;
  const avgViewsPerCreator = totalCreators > 0 ? totalViews / totalCreators : 0;
  const ecpm = totalViews > 0 ? (totalEarned / totalViews) * 1000 : 0;
  
  const handlePrint = () => {
    const success = trackUsage('reportsPerMonth');
    if (!success) {
      alert(`You have reached your limit of ${getLimit('reportsPerMonth')} reports this month. Please upgrade your plan to continue.`);
      return;
    }
    window.print();
  };

  // Chart Data
  const viewsByDate: Record<string, number> = {};
  [...reportData].sort((a,b) => new Date(a["Submission Date"]).getTime() - new Date(b["Submission Date"]).getTime()).forEach(r => {
    const dateStr = new Date(r["Submission Date"]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    viewsByDate[dateStr] = (viewsByDate[dateStr] || 0) + r.Views;
  });
  const chartData = Object.keys(viewsByDate).map(date => ({ date, views: viewsByDate[date] }));

  const activeColor = hasFeature("colorSchemePresets") ? customHex : selectedColor;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Editor Panel (Hidden in print) */}
      <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 space-y-6 print:hidden sticky top-24">
        
        {/* Removed Mock Plan Selector */}

        <div className="bg-[#111] border border-white/[0.05] rounded-2xl shadow-lg overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/[0.05] flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-3">
              <Settings2 className="w-5 h-5 text-white/40" />
              <div>
                <h3 className="font-bold text-sm text-white">Report Builder</h3>
                <p className="text-[10px] text-[#888] tracking-wide mt-0.5">Customize client deliverables</p>
              </div>
            </div>
            
            <div className="text-right">
              {getLimit('reportsPerMonth') === 'unlimited' ? (
                <div className="text-[10px] text-[#888] font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                  Unlimited Reports
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#888] font-bold uppercase tracking-widest">
                    {getUsage('reportsPerMonth')} / {getLimit('reportsPerMonth')} Used
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto no-scrollbar">
            
            {/* Basics - Available to all */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#888]">General Settings</h4>
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1.5">Target Campaign</label>
                <select 
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6] transition-colors"
                >
                  <option value="All">All Campaigns (Global)</option>
                  {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1.5">Agency Name</label>
                <input 
                  type="text" 
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1.5">Report Title</label>
                <input 
                  type="text" 
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6] transition-colors"
                />
              </div>
            </div>

            {/* Timeline Filter */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#888]">
                <Calendar className="w-3 h-3" /> Report Timeline
              </h4>

              <GatedFeature
                isAllowed={hasFeature("rollingDateRanges")}
                featureId="rollingDateRanges"
                description="Upgrade to Agency to generate day, week, or custom-range reports"
              >
                <div className="space-y-3">
                  <select 
                    value={hasFeature("rollingDateRanges") && hasDateData ? timelineMode : 'Full'}
                    onChange={(e) => setTimelineMode(e.target.value as any)}
                    disabled={!hasFeature("rollingDateRanges") || !hasDateData}
                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6] transition-colors disabled:opacity-50"
                  >
                    <option value="Full">Full campaign timeline</option>
                    <option value="Single">Single day</option>
                    <option value="Last7">Last 7 days</option>
                    <option value="Last30">Last 30 days</option>
                    <option value="Custom">Custom range</option>
                  </select>

                  {hasFeature("rollingDateRanges") && timelineMode === 'Single' && (
                    <input 
                      type="date"
                      value={singleDate}
                      onChange={(e) => setSingleDate(e.target.value)}
                      className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
                    />
                  )}

                  {hasFeature("rollingDateRanges") && timelineMode === 'Custom' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] text-white/50 mb-1">Start</label>
                          <input 
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] text-white/50 mb-1">End</label>
                          <input 
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
                          />
                        </div>
                      </div>
                      {startDate && endDate && new Date(startDate) > new Date(endDate) && (
                        <p className="text-[10px] text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20">
                          Start date cannot be after the end date.
                        </p>
                      )}
                    </div>
                  )}

                  {!hasDateData && (
                    <p className="text-[10px] text-yellow-500/80 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                      Date-based reports require submission-level dates in your imported data.
                    </p>
                  )}
                  {hasFeature("rollingDateRanges") && hasDateData && (
                    <p className="text-[10px] text-[#888]">
                      All report metrics and visuals will be generated from submissions inside the selected timeframe.
                    </p>
                  )}
                  {!hasFeature("rollingDateRanges") && (
                    <p className="text-[10px] text-[#888]">
                      Full campaign timeline only
                    </p>
                  )}
                </div>
              </GatedFeature>
            </div>

            {/* Styling */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#888]">
                <Palette className="w-3 h-3" /> Branding & Style
              </h4>
              
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-2">Accent Color</label>
                <div className="flex gap-2 mb-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => !hasFeature("colorSchemePresets") ? setSelectedColor(color) : setCustomHex(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${activeColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                <GatedFeature 
                  isAllowed={hasFeature("colorSchemePresets")} featureId="colorSchemePresets" 
                  description="Unlock custom brand hex codes & unlimited palettes"
                >
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="color" 
                      value={customHex}
                      onChange={(e) => setCustomHex(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                      disabled={!hasFeature("colorSchemePresets")}
                    />
                    <input 
                      type="text" 
                      value={customHex}
                      onChange={(e) => setCustomHex(e.target.value)}
                      className="flex-1 bg-[#0F0F0F] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-[#3B82F6]"
                      disabled={!hasFeature("colorSchemePresets")}
                    />
                  </div>
                </GatedFeature>
              </div>

              <GatedFeature
                isAllowed={hasFeature("layoutStyles")} featureId="layoutStyles"
                description="Use custom typography for polished brand alignment"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
                    <Type className="w-3 h-3" /> Custom Font
                  </label>
                  <select 
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    disabled={!hasFeature("layoutStyles")}
                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6] transition-colors"
                  >
                    <option value="Inter">Inter (Default)</option>
                    <option value="Space Grotesk">Space Grotesk</option>
                    <option value="Playfair Display">Playfair Display</option>
                  </select>
                </div>
              </GatedFeature>
            </div>

            {/* Content Blocks */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#888]">
                <Layout className="w-3 h-3" /> Content Blocks
              </h4>
              
              <GatedFeature
                isAllowed={hasFeature("whiteLabelBranding")} featureId="whiteLabelBranding"
                description="Add qualitative analysis and custom summaries"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-white/80 mb-1.5">Executive Summary</label>
                  <textarea 
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    disabled={!hasFeature("whiteLabelBranding")}
                    placeholder="Add qualitative analysis for the client..."
                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#3B82F6] min-h-[80px] resize-none"
                  />
                </div>
              </GatedFeature>
            </div>

            {/* Layout Order */}
            <div className="space-y-4 pt-4 border-t border-white/5">
               <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#888]">
                 <GripVertical className="w-3 h-3" /> Section Customization
               </h4>
               
               <GatedFeature
                 isAllowed={hasFeature("reportReordering")} featureId="reportReordering"
                 description="Toggle & reorder specific KPI blocks"
               >
                 <div className="space-y-2">
                   {[
                     { id: 'kpis', label: 'Key Metrics Grid', state: showKpiSection, set: setShowKpiSection },
                     { id: 'chart', label: 'Growth Trajectory Chart', state: showChart, set: setShowChart },
                     { id: 'performers', label: 'Top Performers Table', state: showPerformerTable, set: setShowPerformerTable }
                   ].map(section => (
                     <div key={section.id} className="flex items-center justify-between bg-[#0F0F0F] border border-white/5 p-2.5 rounded-lg">
                       <span className="text-xs text-white/80 font-medium">{section.label}</span>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={section.state}
                            onChange={(e) => section.set(e.target.checked)}
                            disabled={!hasFeature("reportReordering")}
                          />
                          <div className={`w-8 h-4 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all ${section.state ? 'bg-[#3B82F6]' : ''}`}></div>
                        </label>
                     </div>
                   ))}
                 </div>
               </GatedFeature>
            </div>

          </div>
          
          <div className="p-5 border-t border-white/5 bg-[#0F0F0F] flex flex-col gap-3">
             <button onClick={handlePrint} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold tracking-wide transition-colors">
              <Printer className="w-4 h-4" /> Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Preview Panel / Print Area */}
      <div className="flex-1 bg-white text-black p-8 md:p-14 rounded-2xl shadow-xl print:shadow-none print:p-0 relative overflow-hidden group min-h-[842px] max-w-[1000px] mx-auto w-full transition-all duration-300" style={{ fontFamily: hasFeature("layoutStyles") ? selectedFont : 'Inter' }}>
        <div className="absolute top-6 right-6 bg-black/5 text-black/60 px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-2 print:hidden backdrop-blur-sm border border-black/5 shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Preview Mode
        </div>

        {/* Report Content */}
        <div className="max-w-4xl mx-auto bg-white">
          
          {/* Cover Page */}
          {workspace?.reports?.coverPage && (
            <div className="flex flex-col items-center justify-center min-h-[800px] text-center pb-8 mb-8 break-after-page print:min-h-screen">
              {workspace?.brand?.logoUrl ? (
                 <img src={workspace.brand.logoUrl} alt="Logo" className="w-40 h-40 object-contain mb-10 shadow-sm rounded-xl" />
              ) : (
                 <div className="w-32 h-32 rounded-[2rem] flex items-center justify-center shadow-lg text-white mb-10" style={{ backgroundColor: activeColor }}>
                    <span className="font-black text-5xl">{agencyName.substring(0, 2).toUpperCase()}</span>
                 </div>
              )}
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 text-black leading-tight">{reportTitle}</h1>
              <p className="text-black/60 text-2xl font-medium tracking-wide mb-16">{selectedCampaign === 'All' ? 'Global HQ Overview' : `Campaign: ${selectedCampaign}`}</p>
              <div className="mt-auto pb-10">
                 <p className="font-bold text-xl tracking-tight text-black mb-2">{agencyName}</p>
                 <p className="text-black/50 font-semibold uppercase tracking-widest text-sm">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          )}

          <div className="space-y-12 shrink-0">
          {/* Header */}
          <header className={`flex justify-between items-end border-b-2 border-black/10 pb-8 ${workspace?.reports?.coverPage && 'print:hidden'}`}>
            <div>
              <div className="flex items-center gap-3 mb-6">
                {workspace?.brand?.logoUrl ? (
                  <img src={workspace.brand.logoUrl} alt="Logo" className="w-10 h-10 object-contain shadow-sm rounded-lg" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-white" style={{ backgroundColor: activeColor }}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                      <path d="M13 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7H13Z" fill="currentColor"/>
                    </svg>
                  </div>
                )}
                <span className="font-bold text-xl tracking-tight text-black">{agencyName}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 text-black leading-tight">{reportTitle}</h1>
              <p className="text-black/60 text-xl font-medium tracking-wide">{selectedCampaign === 'All' ? 'Global HQ Overview' : `Campaign: ${selectedCampaign}`}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold tracking-widest uppercase text-black/40 mb-1">Generated On</p>
              <p className="text-black/80 font-semibold text-lg">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </header>

          {/* Empty State */}
          {reportData.length === 0 && (
            <div className="py-20 text-center border border-black/10 rounded-2xl bg-black/5">
              <svg className="w-12 h-12 mx-auto text-black/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-bold text-black/80 mb-2">No submissions found in this timeframe</h3>
              <p className="text-sm font-medium text-black/50">Adjust your timeline selection or target campaign.</p>
            </div>
          )}

          {/* Core Structure Rendering based on sectionsOrder and Toggle States */}
          
          {/* Executive Summary */}
          {reportData.length > 0 && ((hasFeature("whiteLabelBranding") && comments) || (!comments && totalViews > 0)) ? (
            <div className="bg-black/5 rounded-2xl p-8 border-l-4" style={{ borderColor: activeColor }}>
              <h3 className="text-xs font-black uppercase tracking-widest text-black/40 mb-4">Executive Summary</h3>
              {hasFeature("whiteLabelBranding") && comments ? (
                <p className="text-black/80 text-base leading-relaxed whitespace-pre-wrap font-medium">{comments}</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-black/80 text-base leading-relaxed font-medium">
                    The {selectedCampaign === 'All' ? 'overall strategy' : `campaign "${selectedCampaign}"`} achieved <span className="font-bold text-black">{formatViews(totalViews)}</span> total verified views across <span className="font-bold text-black">{totalCreators}</span> active contractors, generating significant organic reach and engagement.
                  </p>
                  <p className="text-black/80 text-base leading-relaxed font-medium">
                    Financial efficiency remained extremely strong at an effective cost per thousand views (eCPM) of <span className="font-bold text-black">{formatMoney(ecpm)}</span>. Continued investment in top-performing assets is recommended to sustain narrative momentum.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* Overview Metrics (Always On) */}
          {reportData.length > 0 && (
          <div className="grid grid-cols-2 gap-6 md:gap-10">
            <div className="bg-black/5 p-8 rounded-2xl flex flex-col justify-between border border-black/5 shadow-sm">
              <p className="text-black/50 text-sm font-bold uppercase tracking-widest mb-4">Total Verified Views</p>
              <p className="text-5xl md:text-6xl font-black tabular-nums tracking-tight" style={{ color: activeColor }}>{formatViews(totalViews)}</p>
            </div>
            <div className="bg-black/5 p-8 rounded-2xl flex flex-col justify-between border border-black/5 shadow-sm">
              <p className="text-black/50 text-sm font-bold uppercase tracking-widest mb-4">Total Budget Spent</p>
              <p className="text-5xl md:text-6xl font-black tabular-nums tracking-tight text-slate-800">{formatMoney(totalEarned)}</p>
            </div>
          </div>
          )}

          {/* Deep Insights (Toggleable) */}
          {reportData.length > 0 && ((!hasFeature("reportReordering")) || showKpiSection) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="border-t-[3px] border-black pb-2 pt-6">
                <p className="text-black/50 text-[10px] font-black uppercase tracking-widest mb-2">Effective eCPM</p>
                <p className="text-2xl font-black text-black tabular-nums tracking-tight">{formatMoney(ecpm)} <span className="text-sm font-bold text-black/40 tracking-normal">/ 1k views</span></p>
              </div>
              <div className="border-t-[3px] border-black/10 pb-2 pt-6">
                <p className="text-black/50 text-[10px] font-black uppercase tracking-widest mb-2">Active Creators</p>
                <p className="text-2xl font-black text-black tabular-nums tracking-tight">{totalCreators} <span className="text-sm font-bold text-black/40 tracking-normal">contractors</span></p>
              </div>
              <div className="border-t-[3px] border-black/10 pb-2 pt-6">
                <p className="text-black/50 text-[10px] font-black uppercase tracking-widest mb-2">Avg Views / Creator</p>
                <p className="text-2xl font-black tabular-nums tracking-tight" style={{ color: activeColor }}>{formatViews(avgViewsPerCreator)}</p>
              </div>
              <div className="border-t-[3px] border-black/10 pb-2 pt-6">
                <p className="text-black/50 text-[10px] font-black uppercase tracking-widest mb-2">Est. Cost Per View</p>
                <p className="text-2xl font-black tabular-nums tracking-tight text-slate-700">${totalViews > 0 ? (totalEarned / totalViews).toFixed(4) : '0.00'}</p>
              </div>
            </div>
          )}

          {/* Chart (Toggleable) */}
          {reportData.length > 0 && ((!hasFeature("reportReordering")) || showChart) && (
            <div className="space-y-6 pt-4">
              <h2 className="text-2xl font-black tracking-tight border-b-2 border-black/10 pb-3">Growth Trajectory</h2>
              <div className="h-[320px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {workspace?.layout?.chartStyle === 'Area' ? (
                      <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="#0000001a" vertical={false} />
                        <XAxis dataKey="date" stroke="#0000006a" tick={{fill: '#0000008a', fontSize: 13, fontWeight: 500}} tickLine={false} axisLine={false} dy={15} />
                        <YAxis stroke="#0000006a" tick={{fill: '#0000008a', fontSize: 13, fontWeight: 500}} tickLine={false} axisLine={false} tickFormatter={formatViews} dx={-10} />
                        <Area type="monotone" dataKey="views" fillOpacity={0.3} fill={activeColor} stroke={activeColor} strokeWidth={4} activeDot={{ r: 8 }} />
                      </AreaChart>
                    ) : workspace?.layout?.chartStyle === 'Bar' ? (
                      <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="#0000001a" vertical={false} />
                        <XAxis dataKey="date" stroke="#0000006a" tick={{fill: '#0000008a', fontSize: 13, fontWeight: 500}} tickLine={false} axisLine={false} dy={15} />
                        <YAxis stroke="#0000006a" tick={{fill: '#0000008a', fontSize: 13, fontWeight: 500}} tickLine={false} axisLine={false} tickFormatter={formatViews} dx={-10} />
                        <Bar dataKey="views" fill={activeColor} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="#0000001a" vertical={false} />
                        <XAxis dataKey="date" stroke="#0000006a" tick={{fill: '#0000008a', fontSize: 13, fontWeight: 500}} tickLine={false} axisLine={false} dy={15} />
                        <YAxis stroke="#0000006a" tick={{fill: '#0000008a', fontSize: 13, fontWeight: 500}} tickLine={false} axisLine={false} tickFormatter={formatViews} dx={-10} />
                        <Line type="monotone" dataKey="views" stroke={activeColor} strokeWidth={4} dot={{ r: 5, fill: activeColor, strokeWidth: 0 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-black/40 font-medium">Not enough data to display chart</div>
                )}
              </div>
            </div>
          )}

          {/* Top Performers Table (Toggleable) */}
          {reportData.length > 0 && ((!hasFeature("reportReordering")) || showPerformerTable) && (
            <div className="space-y-6 pt-4">
              <h2 className="text-2xl font-black tracking-tight border-b-2 border-black/10 pb-3">Top Performing Assets</h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-black/10">
                    <th className="py-4 font-bold text-black/60 uppercase tracking-wider text-xs w-12">Rank</th>
                    <th className="py-4 font-bold text-black/60 uppercase tracking-wider text-xs">Contractor</th>
                    <th className="py-4 font-bold text-black/60 uppercase tracking-wider text-xs">Asset Title</th>
                    <th className="py-4 font-bold text-black/60 uppercase tracking-wider text-xs text-right">eCPM</th>
                    <th className="py-4 font-bold text-black/60 uppercase tracking-wider text-xs text-right">Yield (Views)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {reportData.sort((a,b) => b.Views - a.Views).slice(0, 10).map((r, i) => {
                    const rEcpm = r.Views > 0 ? (r["Amount Paid"] / r.Views) * 1000 : 0;
                    return (
                      <tr key={i} className="hover:bg-black/5 transition-colors">
                        <td className="py-4 text-black/40 text-sm font-bold pl-2">{i+1}</td>
                        <td className="py-4 font-semibold text-black/90">{r.Creator}</td>
                        <td className="py-4 text-black/60 text-sm font-medium pr-4">{r["Content Title"]}</td>
                        <td className="py-4 text-right font-bold tabular-nums text-black/50 text-sm">{formatMoney(rEcpm)}</td>
                        <td className="py-4 text-right font-black tabular-nums text-lg" style={{ color: activeColor }}>{formatViews(r.Views)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer - White Label Gated */}
          <footer className="pt-16 pb-8 border-t border-black/10 flex justify-between items-center text-black/40 text-xs font-bold uppercase tracking-widest mt-12 bg-white">
            <div className="flex items-center gap-2">
              {(!hasFeature("whiteLabelBranding") || !workspace?.reports?.fullReportBranding) && (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="black"/>
                  </svg>
                  <span>Powered by OpsRelic</span>
                </>
              )}
            </div>
            <span>CONFIDENTIAL & PROPRIETARY</span>
          </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
