import React, { useMemo, useState } from 'react';
import { useAppContext } from '../lib/store';
import { formatViews } from '../lib/data';
import { 
  TrendingUp, Users, PlayCircle, MessageSquare, Heart, Share2, AlertCircle, RefreshCw, Search, Calendar
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line } from 'recharts';
import { parseISO, isWithinInterval } from 'date-fns';

export default function ClientDashboard({ campaignId }: { campaignId?: string }) {
  const { data, workspace, updates, userRole } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeStatuses, setActiveStatuses] = useState<string[]>(['Approved']);
  const [selectedClipper, setSelectedClipper] = useState<string | null>(null);

  const baseClientData = useMemo(() => {
    // Only approved/flagged/pending etc if client wants to see them. Let's say they can see whatever status except rejected. But let's default to filtering by the active tab if they shouldn't see 'amount paid'. Let's restrict data to the campaign.
    return data.filter(r => (!campaignId || r.Campaign === campaignId) && (r.Status !== 'Rejected'));
  }, [data, campaignId]);

  const filteredData = useMemo(() => {
    let fd = baseClientData;
    if (searchTerm) {
      fd = fd.filter(r => r["Content Title"].toLowerCase().includes(searchTerm.toLowerCase()) || r.Creator.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (activeStatuses.length > 0) {
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
    if (selectedClipper) {
      fd = fd.filter(r => r.Creator === selectedClipper);
    }
    return fd;
  }, [baseClientData, searchTerm, activeStatuses, startDate, endDate, selectedClipper]);

  const { totalViews, uniqueClippers, topPlatform } = useMemo(() => {
    const platViews: Record<string, number> = {};
    filteredData.forEach(r => {
      if (!platViews[r.Platform]) platViews[r.Platform] = 0;
      platViews[r.Platform] += r.Views;
    });
    
    let bestPlat = 'N/A';
    let maxV = 0;
    for (const [p, v] of Object.entries(platViews)) {
      if (v > maxV) { maxV = v; bestPlat = p; }
    }

    return {
      totalViews: filteredData.reduce((sum, r) => sum + r.Views, 0),
      uniqueClippers: new Set(filteredData.map(r => r.Creator)).size,
      topPlatform: bestPlat
    };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const viewsByDate: Record<string, number> = {};
    [...filteredData].sort((a,b) => new Date(a["Submission Date"]).getTime() - new Date(b["Submission Date"]).getTime()).forEach(row => {
      const date = new Date(row["Submission Date"]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!viewsByDate[date]) viewsByDate[date] = 0;
      viewsByDate[date] += row.Views;
    });
    return Object.keys(viewsByDate).map(date => ({ date, views: viewsByDate[date] }));
  }, [filteredData]);

  const toggleStatus = (status: string) => {
    setActiveStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };
  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setActiveStatuses(['Approved']);
    setSearchTerm('');
  };

  const visibleUpdates = useMemo(() => updates.filter(u => u.clientVisible && (!campaignId || u.campaignId === campaignId || u.campaignId === 'All')).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [updates, campaignId]);

  const primaryColor = workspace?.color?.primary || '#3B82F6';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 relative z-20 pt-4">
        <h2 className="text-3xl lg:text-4xl font-display font-black text-white tracking-tight leading-tight">
          Campaign Dashboard
        </h2>
        <p className="text-[#888] font-medium max-w-xl">
          Welcome to your live performance portal. Track your campaign metrics, creator submissions, and recent updates from the agency.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Views', value: totalViews, format: formatViews, icon: TrendingUp },
          { label: 'Creators Activated', value: uniqueClippers, format: (v:any) => v, icon: Users },
          { label: 'Top Platform', value: topPlatform, format: (v:any) => <span className="capitalize">{v}</span>, icon: PlayCircle }
        ].map((kpi, i) => (
          <div key={i} className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -inset-2 opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl pointer-events-none" style={{ backgroundColor: primaryColor }} />
            <div className="flex justify-between items-start mb-6 z-10 relative">
              <span className="text-xs uppercase tracking-widest text-[#888] font-bold">{kpi.label}</span>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10" style={{ color: primaryColor }}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="z-10 relative">
              <span className="text-4xl font-black tracking-tighter text-white">
                {kpi.format(kpi.value)}
              </span>
            </div>
          </div>
        ))}
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
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-[#666]"
            />
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-[#0F0F0F] border border-white/10 rounded-xl p-1.5 transition-colors">
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
             {(startDate || endDate || searchTerm || activeStatuses.length > 0) && (
               <button onClick={resetFilters} className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 rounded-xl transition-all">Reset</button>
             )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.05]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#888] mr-2 self-center">Status Filters:</span>
          {['Approved', 'Pending', 'Flagged'].map(s => {
            const isActive = activeStatuses.includes(s);
            let colorCls = isActive ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-[#555] border-white/5 hover:text-[#888] hover:border-white/10';
            if (isActive) {
              if (s === 'Approved') colorCls = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black tracking-widest text-[#555] uppercase">Views Trajectory</h3>
          </div>
          <div className="h-[300px] w-full">
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

        {/* Updates Feed */}
        <div className="lg:col-span-1 bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black tracking-widest text-[#555] uppercase">Campaign Updates</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 max-h-[300px]">
            {visibleUpdates.length === 0 ? (
               <div className="text-center py-10 px-4 text-[#666] text-sm bg-white/[0.02] rounded-2xl border border-white/5">
                 No updates from the agency yet.
               </div>
            ) : visibleUpdates.map((update) => (
              <div key={update.id} className="relative pl-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-px before:bg-white/10 last:before:hidden">
                 <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                 </div>
                 <p className="text-xs text-[#555] font-semibold mb-1">{new Date(update.timestamp).toLocaleDateString()}</p>
                 <p className="text-sm text-white leading-relaxed">{update.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* All Clippers in Campaign */}
         <div className="lg:col-span-1 bg-[#0A0A0A] border border-white/[0.05] p-6 lg:p-8 rounded-[32px] shadow-lg flex flex-col max-h-[420px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold tracking-widest text-[#888] uppercase">Top Creators</h3>
            {selectedClipper && (
               <button onClick={() => setSelectedClipper(null)} className="text-[10px] uppercase font-bold text-[#3B82F6] hover:text-[#2563EB] bg-[#3B82F6]/10 px-3 py-1.5 rounded-full transition-colors">View All</button>
            )}
          </div>
          <div className="space-y-3 overflow-y-auto pr-3 custom-scrollbar flex-1">
              {Array.from(new Set(filteredData.map(r => r.Creator))).sort((a,b) => {
                 // Sort by total views descending
                 const aViews = filteredData.filter(r => r.Creator === a).reduce((s,r) => s+r.Views, 0);
                 const bViews = filteredData.filter(r => r.Creator === b).reduce((s,r) => s+r.Views, 0);
                 return bViews - aViews;
              }).map((c, i) => {
              const clData = filteredData.filter(r => r.Creator === c);
              const views = clData.reduce((s,r) => s+r.Views, 0);
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
                    <span className="text-white text-xs font-bold tabular-nums">{formatViews(views)} views</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#888] font-medium">{clData.length} clips • <span className="capitalize">{platforms.join(', ')}</span></span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Raw Data Table */}
        <div className="lg:col-span-3 bg-[#0A0A0A] border border-white/[0.05] rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[420px]">
          <div className="p-6 lg:p-8 border-b border-white/[0.05] flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold tracking-widest text-[#888] uppercase">Submissions {selectedClipper && <span className="text-white ml-2">({selectedClipper})</span>}</h3>
            <span className="text-[#888] text-[10px] uppercase tracking-widest font-bold bg-white/5 px-3 py-1.5 rounded-full">{filteredData.length} results</span>
          </div>
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
               <thead className="bg-[#0A0A0A] sticky top-0 z-10">
                 <tr className="text-[10px] uppercase tracking-widest text-[#666] border-b border-white/[0.05] bg-[#0A0A0A]">
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Creator</th>
                  <th className="px-6 py-4 font-bold">Platform</th>
                  <th className="px-6 py-4 font-bold text-right">Views</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredData.slice(0, 50).map((row, i) => (
                  <tr key={i} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => { if(row["Submission URL"]) window.open(row["Submission URL"], '_blank') }}>
                    <td className="px-6 py-3 text-sm text-[#888] whitespace-nowrap tabular-nums">{row["Submission Date"]}</td>
                    <td className="px-6 py-3 text-sm font-bold text-white whitespace-nowrap">{row.Creator}</td>
                    <td className="px-6 py-3 text-sm text-[#888] whitespace-nowrap"><span className="capitalize">{row.Platform}</span></td>
                    <td className="px-6 py-3 text-sm font-bold text-white tabular-nums whitespace-nowrap text-right">{formatViews(row.Views)}</td>
                    <td className="px-6 py-3 text-sm whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        row.Status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        row.Status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        row.Status === 'Flagged' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {row.Status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
                <div className="text-center py-12 text-[#666] text-sm">No submissions match the current filters.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
