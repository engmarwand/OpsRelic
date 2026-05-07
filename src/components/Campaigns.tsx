import { useState, useMemo } from 'react';
import { useAppContext } from '../lib/store';
import { formatViews, formatMoney } from '../lib/data';
import { Search, TrendingUp, DollarSign, Users, Target, Calendar, Trash2, LayoutDashboard, LineChart as LineChartIcon, FileText, Bell, Settings, Wand2, Link as LinkIcon, X, Lock } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { isWithinInterval, parseISO } from 'date-fns';
import { auth, db } from '../lib/firebase';
import { writeBatch, query, collection, where, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { useToast } from '../lib/toast';
import ClientDashboard from './ClientDashboard';

export default function CampaignWorkspace() {
  const { data, workspace, getCampaignName, campaignsList, clients, briefs, updates, currentTier, setShowPricing, hasFeature } = useAppContext();
  const primaryColor = workspace?.color?.primary || '#3B82F6';

  const [activeTab, setActiveTab] = useState<'client-view' | 'performance' | 'updates' | 'settings'>('performance');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeStatuses, setActiveStatuses] = useState<string[]>(['Approved', 'Pending', 'Rejected', 'Flagged']);
  const [selectedClipper, setSelectedClipper] = useState<string | null>(null);
  
  // Mock whitelist state per campaign
  const [whitelists, setWhitelists] = useState<Record<string, string[]>>({});

  const campaigns = Array.from(new Set(data.map(r => r.Campaign))).sort();
  const { addToast } = useToast();
  
  const selectedCampObj = useMemo(() => {
     if (selectedCampaign === 'All') return null;
     const row = data.find(r => r.Campaign === selectedCampaign);
     if (!row || !row._campaignId) return null;
     return campaignsList.find((c: any) => c.id === row._campaignId);
  }, [selectedCampaign, data, campaignsList]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteCampaign = async (campaignIdOrName: string) => {
    if (!auth.currentUser) return;
    
    // Convert ID to Name for the confirmation prompt
    const realName = getCampaignName(campaignIdOrName);
    
    try {
      setIsDeleting(true);
      // Find the actual campaign ID from our data
      const sampleRow = data.find(r => r.Campaign === campaignIdOrName);
      const cIdFromName = sampleRow?._campaignId ? sampleRow._campaignId : `id_camp_${campaignIdOrName.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 100)}`;

      const qSubs = query(collection(db, 'submissions'), where('userId', '==', auth.currentUser.uid), where('campaignId', '==', cIdFromName));
      const subSnap = await getDocs(qSubs);
      
      const docsToDelete = [...subSnap.docs];
      
      // Batch delete in chunks of 400
      for (let i = 0; i < docsToDelete.length; i += 400) {
          const chunk = docsToDelete.slice(i, i + 400);
          const chunkBatch = writeBatch(db);
          chunk.forEach(d => chunkBatch.delete(d.ref));
          await chunkBatch.commit();
      }
      
      // Also delete the campaign document itself
      const campRef = doc(db, 'campaigns', cIdFromName);
      await deleteDoc(campRef);
      
      addToast(`Campaign "${realName}" deleted successfully.`, "success");
      if (selectedCampaign === campaignIdOrName) {
        setSelectedCampaign('All');
      }
    } catch(err: any) {
      console.error(err);
      addToast(`Failed to delete campaign: ${err.message}`, "error");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const filteredData = useMemo(() => {
    let fd = data;
    if (selectedCampaign !== 'All') {
      fd = fd.filter(r => r.Campaign === selectedCampaign);
    }
    if (searchTerm) {
      fd = fd.filter(r => r["Content Title"].toLowerCase().includes(searchTerm.toLowerCase()) || r.Creator.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (activeStatuses.length < 4) {
      fd = fd.filter(r => activeStatuses.includes(r.Status));
    }
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      fd = fd.filter(r => {
        const d = parseISO(r["Submission Date"]);
        return isWithinInterval(d, { start, end });
      });
    }
    if (workspace?.reports?.defaultPlatforms) {
      fd = fd.filter(r => {
        const plat = r.Platform.toLowerCase().includes('tik') ? 'TikTok' : 
                     r.Platform.toLowerCase().includes('insta') || r.Platform.toLowerCase().includes('ig') ? 'Instagram' : 
                     r.Platform.toLowerCase().includes('you') || r.Platform.toLowerCase().includes('yt') ? 'YouTube' : 'Other';
        return workspace.reports.defaultPlatforms!.includes(plat);
      });
    }

    if (selectedClipper) {
      fd = fd.filter(r => r.Creator === selectedClipper);
    }

    return fd;
  }, [data, selectedCampaign, searchTerm, activeStatuses, startDate, endDate, workspace, selectedClipper]);

  const approvedData = filteredData.filter(r => r.Status === 'Approved');
  
  // KPIs for selected view
  const totalViews = approvedData.reduce((sum, r) => sum + r.Views, 0);
  const totalSpent = approvedData.reduce((sum, r) => sum + r["Amount Paid"], 0);
  const totalSubmissions = filteredData.length;
  const approvedSubmissions = approvedData.length;
  const rejectedSubmissions = filteredData.filter(r => r.Status === 'Rejected').length;
  const approvalRate = totalSubmissions > 0 ? (approvedSubmissions / totalSubmissions) * 100 : 0;
  const rejectionRate = totalSubmissions > 0 ? (rejectedSubmissions / totalSubmissions) * 100 : 0;
  const avgViewsPerClip = approvedSubmissions > 0 ? totalViews / approvedSubmissions : 0;
  const costPerThousand = totalViews > 0 ? (totalSpent / totalViews) * 1000 : 0;

  // Chart
  const viewsByDate: Record<string, number> = {};
  [...approvedData].sort((a,b) => new Date(a["Submission Date"]).getTime() - new Date(b["Submission Date"]).getTime()).forEach(r => {
    // format actual dates
    const displayDate = new Date(r["Submission Date"]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    viewsByDate[displayDate] = (viewsByDate[displayDate] || 0) + r.Views;
  });
  const chartData = Object.keys(viewsByDate).map(date => ({ date, views: viewsByDate[date] }));

  const toggleStatus = (status: string) => {
    setActiveStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setActiveStatuses(['Approved', 'Pending', 'Rejected', 'Flagged']);
    setSearchTerm('');
  };

  if (data.length === 0) {
    return <div className="text-center p-12 text-[#888]">No data available. Please upload a CSV on the Upload Data page.</div>;
  }

  const isAgency = currentTier === 'agency';

  return (
      <div className="space-y-6 lg:space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-4 overflow-x-auto custom-scrollbar">
          {[
            { id: 'client-view', label: 'Client View', icon: LayoutDashboard, feature: 'clientProfiles' },
            { id: 'performance', label: 'Performance', icon: LineChartIcon },
            { id: 'updates', label: 'Updates', icon: Bell, feature: 'clientProfiles' },
            { id: 'settings', label: 'Settings', icon: Settings, feature: 'clientProfiles' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                 if (t.feature && !hasFeature(t.feature as any)) {
                    setShowPricing(true);
                 } else {
                    setActiveTab(t.id as any);
                 }
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === t.id ? 'bg-[#222] text-white shadow-sm' : 'text-[#888] hover:text-white hover:bg-white/5'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.feature && !hasFeature(t.feature as any) && <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 rounded text-[9px] uppercase tracking-wider font-bold">PRO</span>}
            </button>
          ))}
        </div>

        {/* Top Campaign selector/metrics */}
        <div className="bg-[#0A0A0A] p-8 lg:p-10 rounded-[32px] border border-white/[0.05] shadow-lg relative overflow-hidden flex flex-col gap-8">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 -translate-y-1/2 translate-x-1/3 pointer-events-none transition-all duration-1000" style={{ backgroundColor: primaryColor }}></div>
          
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 relative z-10">
            <div>
              <div className="text-[11px] text-[#666] font-semibold tracking-wider uppercase mb-3">Choose Campaign</div>
              <div className="flex items-center gap-2 overflow-x-auto pb-4 px-1 -mx-1 custom-scrollbar max-w-[80vw] lg:max-w-3xl">
                <button 
                  onClick={() => setSelectedCampaign('All')}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm ${
                    selectedCampaign === 'All' ? 'text-white' : 'bg-white/[0.02] border border-white/[0.05] text-[#888] hover:text-white hover:bg-white/[0.05]'
                  }`}
                  style={selectedCampaign === 'All' ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                >
                  All Campaigns
                </button>
                {campaigns.map(c => (
                  <button 
                    key={c}
                    onClick={() => setSelectedCampaign(c)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm ${
                      selectedCampaign === c ? 'text-white' : 'bg-white/[0.02] border border-white/[0.05] text-[#888] hover:text-white hover:bg-white/[0.05]'
                    }`}
                    style={selectedCampaign === c ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                  >
                    {getCampaignName(c)}
                  </button>
                ))}
              </div>
            </div>

            {selectedCampaign !== 'All' && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full p-2 xl:mb-2">
                    <span className="text-xs text-red-500 font-semibold ml-3 px-1">Confirm Delete:</span>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-semibold text-white transition-colors ml-1"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        deleteCampaign(selectedCampaign);
                      }}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full text-xs font-semibold text-white transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Confirm"}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-full text-sm font-medium transition-all border border-red-500/10 disabled:opacity-50 xl:mb-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? "Deleting..." : "Delete Campaign"}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-10 gap-y-10 relative z-10 border-t border-white/[0.05] pt-10">
            <div>
              <p className="text-[#666] text-[11px] font-semibold uppercase tracking-wider mb-2">{workspace?.metrics?.customLabels?.['Views'] || 'Total Views'}</p>
              <p className="text-3xl font-display font-medium tabular-nums tracking-tight leading-none text-white">{formatViews(totalViews)}</p>
            </div>
            <div>
              <p className="text-[#666] text-[11px] font-semibold uppercase tracking-wider mb-2">{workspace?.metrics?.customLabels?.['Amount Paid'] || 'Total Spent'}</p>
              <p className="text-3xl font-display font-medium tabular-nums tracking-tight leading-none text-[#10B981]">{formatMoney(totalSpent)}</p>
            </div>
            <div>
              <p className="text-[#666] text-[11px] font-semibold uppercase tracking-wider mb-2">{workspace?.metrics?.customLabels?.['Clippers'] || 'Submissions'}</p>
              <p className="text-3xl font-display font-medium tabular-nums tracking-tight leading-none text-white">{totalSubmissions}</p>
            </div>
            <div>
              <p className="text-[#666] text-[11px] font-semibold uppercase tracking-wider mb-2">Approval Rate</p>
              <p className="text-3xl font-display font-medium tabular-nums tracking-tight leading-none text-white">{approvalRate.toFixed(1)}%</p>
            </div>
            
            {/* Show cost per 1K for "All", show Budget for a single campaign */}
            {selectedCampaign === 'All' ? (
              <div>
                <p className="text-[#666] text-[11px] font-semibold uppercase tracking-wider mb-2">Cost per 1k views</p>
                <p className="text-3xl font-display font-medium tabular-nums tracking-tight leading-none text-white">{formatMoney(costPerThousand)}</p>
              </div>
            ) : (
              <div>
                <p className="text-[#666] text-[11px] font-semibold uppercase tracking-wider mb-2">Budget</p>
                <p className="text-3xl font-display font-medium tabular-nums tracking-tight leading-none text-white">{selectedCampObj?.budget ? formatMoney(selectedCampObj.budget) : 'N/A'}</p>
              </div>
            )}

            <div>
              <p className="text-[#666] text-[11px] font-semibold uppercase tracking-wider mb-2">Views / Clip</p>
              <p className="text-3xl font-display font-medium tabular-nums tracking-tight leading-none text-white">{formatViews(avgViewsPerClip)}</p>
            </div>
          </div>
        </div>

      {/* Performance Content */}
      {activeTab === 'performance' && (
        <>
          {/* Advanced Filters */}
          <div className="bg-[#0A0A0A] p-6 lg:p-8 rounded-[24px] border border-white/[0.05] shadow-lg space-y-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search content or creator..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6] transition-colors placeholder-[#666]"
            />
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-[#111] border border-white/5 rounded-full p-1 transition-colors">
               <Calendar className="w-4 h-4 text-[#666] ml-3 shrink-0" />
               <input 
                 type="date"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 className="bg-transparent text-xs font-medium text-[#888] border-none focus:outline-none p-1 placeholder-[#666]"
               />
               <span className="text-[#333] font-medium">—</span>
               <input 
                 type="date"
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
                 className="bg-transparent text-xs font-medium text-[#888] border-none focus:outline-none p-1 mr-2 placeholder-[#666]"
               />
             </div>
             {(startDate || endDate || searchTerm || activeStatuses.length < 4) && (
               <button onClick={resetFilters} className="text-[11px] font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-full transition-all tracking-wider uppercase">Reset</button>
             )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.05]">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-[#666] mr-2 self-center">Status Filters:</span>
          {['Approved', 'Pending', 'Rejected', 'Flagged'].map(s => {
            const isActive = activeStatuses.includes(s);
            let colorCls = isActive ? 'bg-[#222] text-white border-transparent shadow-sm' : 'bg-transparent text-[#666] border-white/5 hover:text-white hover:bg-white/5';
            if (isActive) {
              if (s === 'Approved') colorCls = 'bg-emerald-500/10 text-emerald-400 border-none shadow-sm';
              if (s === 'Rejected') colorCls = 'bg-red-500/10 text-red-400 border-none shadow-sm';
              if (s === 'Pending') colorCls = 'bg-blue-500/10 text-blue-400 border-none shadow-sm';
              if (s === 'Flagged') colorCls = 'bg-orange-500/10 text-orange-400 border-none shadow-sm';
            }
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${colorCls}`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/[0.05] p-6 lg:p-8 rounded-3xl shadow-lg">
          <h3 className="text-xs font-bold tracking-widest text-[#888] uppercase mb-8">Campaign Performance (Views)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {workspace?.layout?.chartStyle === 'Area' ? (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                  <XAxis dataKey="date" stroke="#444" tick={{fill: '#888', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} dy={15} />
                  <YAxis stroke="#444" tick={{fill: '#888', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} tickFormatter={formatViews} dx={-15} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: 13, fontWeight: 600, color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="views" fillOpacity={0.3} fill={primaryColor} stroke={primaryColor} strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              ) : workspace?.layout?.chartStyle === 'Bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                  <XAxis dataKey="date" stroke="#444" tick={{fill: '#888', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} dy={15} />
                  <YAxis stroke="#444" tick={{fill: '#888', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} tickFormatter={formatViews} dx={-15} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: 13, fontWeight: 600, color: '#fff' }}
                  />
                  <Bar dataKey="views" fill={primaryColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                  <XAxis dataKey="date" stroke="#444" tick={{fill: '#888', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} dy={15} />
                  <YAxis stroke="#444" tick={{fill: '#888', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} tickFormatter={formatViews} dx={-15} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: 13, fontWeight: 600, color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="views" stroke={primaryColor} strokeWidth={3} dot={{ r: 4, fill: primaryColor, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* All Clippers in Campaign */}
        <div className="lg:col-span-1 bg-[#0A0A0A] border border-white/[0.05] p-6 lg:p-8 rounded-[32px] shadow-lg flex flex-col max-h-[420px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold tracking-tight text-[#888]">Clippers</h3>
            {selectedClipper && (
               <button onClick={() => setSelectedClipper(null)} className="text-[10px] uppercase font-bold text-blue-400 hover:text-white hover:bg-blue-500/20 bg-blue-500/10 px-3 py-1.5 rounded-full transition-colors">View All</button>
            )}
          </div>
          <div className="space-y-2 overflow-y-auto pr-3 custom-scrollbar flex-1">
              {Array.from(new Set(approvedData.map(r => r.Creator))).sort().map((c, i) => {
              const clData = approvedData.filter(r => r.Creator === c);
              const views = clData.reduce((s,r) => s+r.Views, 0);
              const paidOutValue = clData.reduce((s,r) => s+r["Amount Paid"], 0);
              const platforms = Array.from(new Set(clData.map(r => r.Platform)));
              const isSelected = selectedClipper === c;
              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedClipper(isSelected ? null : c)}
                  className={`flex flex-col gap-1 p-3.5 rounded-2xl transition-colors cursor-pointer border ${isSelected ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/[0.02] border-transparent hover:border-white/10 hover:bg-white/5'}`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium transition-colors ${isSelected ? 'text-blue-400' : 'text-white'}`}>{c}</p>
                    <div className="text-[13px] tabular-nums text-[#10B981] font-semibold">{formatMoney(paidOutValue)}</div>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#666] font-medium">{clData.length} clips • <span className="capitalize">{platforms.join(', ')}</span></span>
                    <span className="text-white/80 font-medium">{formatViews(views)} views</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Raw Data Table */}
      <div className="bg-[#0A0A0A] border border-white/[0.05] rounded-[32px] shadow-lg overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-white/[0.05] flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight text-[#888]">Targeted Submissions {selectedClipper && <span className="text-white ml-2 opacity-80">({selectedClipper})</span>}</h3>
          <span className="text-[#666] text-xs font-medium bg-white/5 px-3 py-1.5 rounded-full">{filteredData.length} results</span>
        </div>
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <table className="w-full text-left">
             <thead className="bg-transparent">
               <tr className="text-xs text-[#555] border-b border-white/[0.05]">
                <th className="px-6 lg:px-8 py-5 font-medium">Date</th>
                <th className="px-6 lg:px-8 py-5 font-medium">Creator</th>
                <th className="px-6 lg:px-8 py-5 font-medium">Platform</th>
                <th className="px-6 lg:px-8 py-5 font-medium">Views</th>
                <th className="px-6 lg:px-8 py-5 font-medium">Status</th>
                <th className="px-6 lg:px-8 py-5 font-medium text-right">Paid Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.slice(0, 50).map((row, i) => (
                <tr key={i} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => { if(row["Submission URL"]) window.open(row["Submission URL"], '_blank') }}>
                  <td className="px-6 lg:px-8 py-4 text-sm text-[#888] whitespace-nowrap tabular-nums">{row["Submission Date"]}</td>
                  <td className="px-6 lg:px-8 py-4 text-sm font-medium text-white whitespace-nowrap tracking-tight">{row.Creator}</td>
                  <td className="px-6 lg:px-8 py-4 text-sm text-[#888] whitespace-nowrap tracking-tight"><span className="capitalize">{row.Platform}</span></td>
                  <td className="px-6 lg:px-8 py-4 text-sm font-medium text-white tabular-nums whitespace-nowrap">{formatViews(row.Views)}</td>
                  <td className="px-6 lg:px-8 py-4 text-sm whitespace-nowrap">
                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase border ${
                      row.Status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-none' : 
                      row.Status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-none' : 
                      row.Status === 'Flagged' ? 'bg-orange-500/10 text-orange-400 border-none' :
                      'bg-[#222] text-[#888] border-none'
                    }`}>
                      {row.Status}
                    </span>
                  </td>
                  <td className="px-6 lg:px-8 py-4 text-sm text-right tabular-nums text-[#10B981] font-medium whitespace-nowrap group-hover:text-emerald-400 transition-colors">{formatMoney(row["Amount Paid"])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Client View Tab */}
      {activeTab === 'client-view' && (
        <div className="bg-[#0A0A0A] p-2 rounded-[32px] border border-white/[0.05] shadow-lg flex flex-col pt-8">
           <div className="px-8 pb-4 mb-4 border-b border-white/5 flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
               <LayoutDashboard className="w-4 h-4 text-blue-500" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-white">Client Portal Preview</h3>
               <p className="text-[#888] text-xs">This is exactly what the client sees when they log in to this campaign.</p>
             </div>
           </div>
           
           <div className="px-8 pb-8 pointer-events-none opacity-90 rounded-b-[24px]">
             <ClientDashboard campaignId={selectedCampaign === 'All' ? undefined : selectedCampaign} />
           </div>
        </div>
      )}

      {/* Updates Tab */}
      {activeTab === 'updates' && selectedCampObj && (
        <div className="bg-[#0A0A0A] p-8 rounded-[32px] border border-white/[0.05] shadow-lg space-y-8">
           <div>
             <h3 className="text-xl font-medium text-white mb-2 leading-tight tracking-tight">Campaign Updates</h3>
             <p className="text-[#888] text-sm">Post updates to the client dashboard or internal notes.</p>
           </div>
           
           <form className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex flex-col gap-4" onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
              const isVisible = (form.elements.namedItem('visibility') as HTMLInputElement).checked;
              if (content) {
                form.reset();
                alert(`Update posted! (Visible to client: ${isVisible})`);
              }
           }}>
              <textarea name="content" required placeholder="What's the latest with this campaign?" className="w-full h-28 bg-[#111] border border-white/5 rounded-2xl p-5 text-sm text-white focus:border-blue-500/50 focus:outline-none resize-none transition-colors placeholder-[#666]"></textarea>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#888] hover:text-white transition-colors">
                  <input type="checkbox" name="visibility" className="accent-blue-500 w-4 h-4 cursor-pointer" defaultChecked />
                  Visible to Client
                </label>
                <button type="submit" className="bg-[#222] hover:bg-white text-white hover:text-black hover:shadow-lg px-6 py-2.5 rounded-full text-sm font-medium transition-all">Post Update</button>
              </div>
           </form>

           <div className="space-y-4">
             {updates.filter(u => u.campaignId === selectedCampObj.id || selectedCampObj.id === 'All').map(u => (
               <div key={u.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                 <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2 text-xs font-semibold text-[#666]">
                     <span className="text-white/90">{u.authorName}</span>
                     <span>•</span>
                     <span>{new Date(u.timestamp).toLocaleDateString()}</span>
                   </div>
                   <span className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${u.clientVisible ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-[#888]'}`}>
                      {u.clientVisible ? 'Client Visible' : 'Internal Only'}
                   </span>
                 </div>
                 <p className="text-[15px] sm:text-base text-white/90 leading-relaxed font-medium tracking-tight">{u.content}</p>
               </div>
             ))}
             {updates.filter(u => u.campaignId === selectedCampObj.id || selectedCampObj.id === 'All').length === 0 && (
                <div className="text-center py-16 text-[#666] text-sm font-medium">No updates posted yet.</div>
             )}
           </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && selectedCampObj && (
        <div className="bg-[#0A0A0A] p-8 lg:p-10 rounded-[32px] border border-white/[0.05] shadow-lg">
          <h3 className="text-xl font-medium text-white mb-2 leading-tight tracking-tight">Campaign Settings & Access</h3>
          <p className="text-[#888] text-sm mb-8">Manage client portal access and custom security.</p>

          <div className="flex flex-col gap-6 max-w-2xl">
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2 tracking-tight">
                  <LinkIcon className="w-4 h-4 text-[#3B82F6]" /> 
                  Client Portal Link
                </h4>
                <div className="px-2.5 py-1 bg-[#111] border border-white/5 rounded-full text-[10px] font-semibold text-[#888]">
                  opsrelic.com domain
                </div>
              </div>

              <p className="text-sm text-[#888] mb-6 relative z-10">Clients will need the portal password to access their data via this link.</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
                <input 
                  type="text" 
                  readOnly 
                  value={`https://opsrelic.com/portal/${getCampaignName(selectedCampObj.id).toLowerCase().replace(/[^a-z0-9]+/g, '-')}---${selectedCampObj.id}`} 
                  className="flex-1 bg-[#111] border border-white/5 rounded-2xl px-4 py-3 text-sm text-blue-400 font-mono focus:outline-none" 
                />
                <button 
                  onClick={() => {
                    const slug = getCampaignName(selectedCampObj.id).toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    const portalId = `${slug}---${selectedCampObj.id}`;
                    // We copy the actual dev/preview URL so the user can test it right away during preview,
                    // but they see the opsrelic.com domain in the visual input.
                    const portalLink = `${window.location.origin}/?portal=${portalId}`;
                    navigator.clipboard.writeText(portalLink);
                    addToast("Portal link copied to clipboard!", "success");
                  }} 
                  className="bg-[#222] hover:bg-white text-white hover:text-black hover:shadow-lg px-6 py-3 rounded-2xl text-sm font-medium transition-all shadow-sm active:scale-95 whitespace-nowrap"
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2 tracking-tight">
                <Lock className="w-4 h-4 text-amber-500" /> 
                Portal Password
              </h4>
              <p className="text-sm text-[#888] mb-6">Clients will be prompted for this password when they visit the link.</p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                 <div className="relative flex-1">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                   <input 
                     type="text" 
                     placeholder="Set a secure password..."
                     defaultValue={selectedCampObj.portalPassword || ''}
                     id={`portal-pw-${selectedCampObj.id}`}
                     className="w-full bg-[#111] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-[#3B82F6]/50 focus:outline-none placeholder:text-[#666]" 
                   />
                 </div>
                 <button 
                   onClick={async () => {
                     const pw = (document.getElementById(`portal-pw-${selectedCampObj.id}`) as HTMLInputElement).value;
                     try {
                        const campRef = doc(db, 'campaigns', selectedCampObj.id);
                        await setDoc(campRef, { portalPassword: pw }, { merge: true });
                        addToast("Portal password updated successfully.", "success");
                     } catch(err: any) {
                        addToast("Failed to update password", "error");
                     }
                   }} 
                   className="bg-[#222] hover:bg-white text-white hover:text-black hover:shadow-lg px-6 py-3 rounded-2xl text-sm font-medium transition-all whitespace-nowrap"
                 >
                   Update Password
                 </button>
              </div>
            </div>

            <div className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl opacity-60">
              <div className="flex items-center justify-between mb-2">
                 <h4 className="text-sm font-semibold text-[#888] flex items-center gap-2">
                   <Target className="w-4 h-4 text-[#666]" /> 
                   Legacy Email Whitelist
                 </h4>
              </div>
              <p className="text-xs text-[#555] font-medium">Email whitelisting is being deprecated in favor of password-protected portals.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
