import { useState, useMemo } from 'react';
import { useAppContext } from '../lib/store';
import { formatViews, formatMoney } from '../lib/data';
import { Search, TrendingUp, DollarSign, Users, Target, Calendar, Trash2 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { isWithinInterval, parseISO } from 'date-fns';
import { auth, db } from '../lib/firebase';
import { writeBatch, query, collection, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '../lib/toast';

export default function Campaigns() {
  const { data, workspace, getCampaignName, campaignsList } = useAppContext();
  const primaryColor = workspace?.color?.primary || '#3B82F6';

  const [selectedCampaign, setSelectedCampaign] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeStatuses, setActiveStatuses] = useState<string[]>(['Approved', 'Pending', 'Rejected', 'Flagged']);
  const [selectedClipper, setSelectedClipper] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
        {/* Top Campaign selector/metrics */}
        <div className="bg-[#0A0A0A] p-10 lg:p-14 rounded-[48px] border border-white/[0.05] shadow-[0_0_80px_-20px_rgba(37,99,235,0.15)] relative overflow-hidden flex flex-col gap-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none transition-all duration-1000" style={{ backgroundColor: primaryColor }}></div>
          
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 relative z-10">
            <div>
              <div className="text-[10px] text-[#444] font-black tracking-[0.3em] uppercase mb-4">Choose Campaign</div>
              <div className="flex items-center gap-3 overflow-x-auto pb-4 px-1 -mx-1 custom-scrollbar max-w-[80vw] lg:max-w-3xl">
                <button 
                  onClick={() => setSelectedCampaign('All')}
                  className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${
                    selectedCampaign === 'All' ? 'text-white' : 'bg-white/[0.02] border border-white/[0.05] text-[#555] hover:text-white hover:bg-white/[0.05]'
                  }`}
                  style={selectedCampaign === 'All' ? { backgroundColor: primaryColor, boxShadow: `0 0 40px ${primaryColor}66` } : {}}
                >
                  All Campaigns
                </button>
                {campaigns.map(c => (
                  <button 
                    key={c}
                    onClick={() => setSelectedCampaign(c)}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${
                      selectedCampaign === c ? 'text-white' : 'bg-white/[0.02] border border-white/[0.05] text-[#555] hover:text-white hover:bg-white/[0.05]'
                    }`}
                    style={selectedCampaign === c ? { backgroundColor: primaryColor, boxShadow: `0 0 40px ${primaryColor}66` } : {}}
                  >
                    {getCampaignName(c)}
                  </button>
                ))}
              </div>
            </div>

            {selectedCampaign !== 'All' && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-3 xl:mb-4">
                    <span className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-2">Confirm Delete:</span>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-colors ml-2"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        deleteCampaign(selectedCampaign);
                      }}
                      disabled={isDeleting}
                      className="px-5 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="flex items-center gap-3 px-6 py-4 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/10 disabled:opacity-50 xl:mb-4"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? "Deleting..." : "Delete Campaign"}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-12 gap-y-12 relative z-10 border-t border-white/[0.05] pt-14">
            <div>
              <p className="text-[#333] text-[9px] font-black uppercase tracking-[0.3em] mb-4">{workspace?.metrics?.customLabels?.['Views'] || 'Total Views'}</p>
              <p className="text-[40px] font-black tabular-nums tracking-tighter leading-none" style={{ color: primaryColor }}>{formatViews(totalViews)}</p>
            </div>
            <div>
              <p className="text-[#333] text-[9px] font-black uppercase tracking-[0.3em] mb-4">{workspace?.metrics?.customLabels?.['Amount Paid'] || 'Total Paid'}</p>
              <p className="text-[40px] font-black text-[#10B981] tabular-nums tracking-tighter leading-none">{formatMoney(totalSpent)}</p>
            </div>
            <div>
              <p className="text-[#333] text-[9px] font-black uppercase tracking-[0.3em] mb-4">{workspace?.metrics?.customLabels?.['Clippers'] || 'Submissions'}</p>
              <p className="text-[40px] font-black text-white tabular-nums tracking-tighter leading-none">{totalSubmissions}</p>
            </div>
            <div>
              <p className="text-[#333] text-[9px] font-black uppercase tracking-[0.3em] mb-4">Approval Rate</p>
              <p className="text-[40px] font-black text-white tabular-nums tracking-tighter leading-none">{approvalRate.toFixed(1)}%</p>
            </div>
            
            {/* Show cost per 1K for "All", show Budget for a single campaign */}
            {selectedCampaign === 'All' ? (
              <div>
                <p className="text-[#333] text-[9px] font-black uppercase tracking-[0.3em] mb-4">Cost per 1k views</p>
                <p className="text-[40px] font-black text-white tabular-nums tracking-tighter leading-none">{formatMoney(costPerThousand)}</p>
              </div>
            ) : (
              <div>
                <p className="text-[#333] text-[9px] font-black uppercase tracking-[0.3em] mb-4">Campaign Budget</p>
                <p className="text-[40px] font-black text-white tabular-nums tracking-tighter leading-none">{selectedCampObj?.budget ? formatMoney(selectedCampObj.budget) : 'N/A'}</p>
              </div>
            )}

            <div>
              <p className="text-[#333] text-[9px] font-black uppercase tracking-[0.3em] mb-4">Density Index</p>
              <p className="text-[40px] font-black text-white tabular-nums tracking-tighter leading-none">{formatViews(avgViewsPerClip)}</p>
            </div>
          </div>
        </div>

      {/* Advanced Filters */}
      <div className="bg-[#0A0A0A] p-6 lg:p-8 rounded-[32px] border border-white/[0.05] shadow-lg space-y-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search content or creator..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3B82F6] transition-colors placeholder-[#666]"
            />
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl p-1.5 transition-colors">
               <Calendar className="w-4 h-4 text-[#888] ml-2 shrink-0" />
               <input 
                 type="date"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 className="bg-transparent text-sm text-white border-none focus:outline-none p-1 placeholder-[#666]"
               />
               <span className="text-[#555] font-bold">—</span>
               <input 
                 type="date"
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
                 className="bg-transparent text-sm text-white border-none focus:outline-none p-1 mr-1 placeholder-[#666]"
               />
             </div>
             {(startDate || endDate || searchTerm || activeStatuses.length < 4) && (
               <button onClick={resetFilters} className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 rounded-xl transition-all">Reset</button>
             )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.05]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#888] mr-2 self-center">Status Filters:</span>
          {['Approved', 'Pending', 'Rejected', 'Flagged'].map(s => {
            const isActive = activeStatuses.includes(s);
            let colorCls = isActive ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-[#555] border-white/5 hover:text-[#888] hover:border-white/10';
            if (isActive) {
              if (s === 'Approved') colorCls = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
              if (s === 'Rejected') colorCls = 'bg-red-500/20 text-red-400 border-red-500/30';
              if (s === 'Pending') colorCls = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
              if (s === 'Flagged') colorCls = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            }
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${colorCls}`}
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
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold tracking-widest text-[#888] uppercase">Clippers</h3>
            {selectedClipper && (
               <button onClick={() => setSelectedClipper(null)} className="text-[10px] uppercase font-bold text-[#3B82F6] hover:text-[#2563EB] bg-[#3B82F6]/10 px-3 py-1.5 rounded-full transition-colors">View All</button>
            )}
          </div>
          <div className="space-y-3 overflow-y-auto pr-3 custom-scrollbar flex-1">
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
                  className={`flex flex-col gap-1 p-3 rounded-2xl transition-colors cursor-pointer border ${isSelected ? 'bg-[#3B82F6]/10 border-[#3B82F6]/20' : 'bg-white/[0.02] border-transparent hover:border-white/10 hover:bg-white/5'}`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-bold transition-colors ${isSelected ? 'text-[#3B82F6]' : 'text-white'}`}>{c}</p>
                    <div className="text-[13px] tabular-nums text-[#10B981] font-bold">{formatMoney(paidOutValue)}</div>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#888] font-medium">{clData.length} clips • <span className="capitalize">{platforms.join(', ')}</span></span>
                    <span className="text-white font-bold">{formatViews(views)} views</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Raw Data Table */}
      <div className="bg-[#0A0A0A] border border-white/[0.05] rounded-[32px] shadow-2xl overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-white/[0.05] flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-widest text-[#888] uppercase">Targeted Submissions {selectedClipper && <span className="text-white ml-2">({selectedClipper})</span>}</h3>
          <span className="text-[#888] text-[10px] uppercase tracking-widest font-bold bg-white/5 px-3 py-1.5 rounded-full">{filteredData.length} results</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-[#0A0A0A]">
               <tr className="text-[10px] uppercase tracking-widest text-[#666] border-b border-white/[0.05]">
                <th className="px-6 lg:px-8 py-5 font-bold">Date</th>
                <th className="px-6 lg:px-8 py-5 font-bold">Creator</th>
                <th className="px-6 lg:px-8 py-5 font-bold">Platform</th>
                <th className="px-6 lg:px-8 py-5 font-bold">Views</th>
                <th className="px-6 lg:px-8 py-5 font-bold">Status</th>
                <th className="px-6 lg:px-8 py-5 font-bold text-right">Paid Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.slice(0, 50).map((row, i) => (
                <tr key={i} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => { if(row["Submission URL"]) window.open(row["Submission URL"], '_blank') }}>
                  <td className="px-6 lg:px-8 py-4 text-sm text-[#888] whitespace-nowrap tabular-nums">{row["Submission Date"]}</td>
                  <td className="px-6 lg:px-8 py-4 text-sm font-bold text-white whitespace-nowrap">{row.Creator}</td>
                  <td className="px-6 lg:px-8 py-4 text-sm text-[#888] whitespace-nowrap"><span className="capitalize">{row.Platform}</span></td>
                  <td className="px-6 lg:px-8 py-4 text-sm font-bold text-white tabular-nums whitespace-nowrap">{formatViews(row.Views)}</td>
                  <td className="px-6 lg:px-8 py-4 text-sm whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      row.Status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      row.Status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      row.Status === 'Flagged' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {row.Status}
                    </span>
                  </td>
                  <td className="px-6 lg:px-8 py-4 text-sm text-right tabular-nums text-[#10B981] font-bold whitespace-nowrap group-hover:text-emerald-300 transition-colors">{formatMoney(row["Amount Paid"])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
