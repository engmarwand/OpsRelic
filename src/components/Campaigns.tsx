import { useState, useMemo } from 'react';
import { useAppContext } from '../lib/store';
import { formatViews, formatMoney } from '../lib/data';
import { Search, TrendingUp, DollarSign, Users, Target, Calendar } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { isWithinInterval, parseISO } from 'date-fns';

export default function Campaigns() {
  const { data, workspace } = useAppContext();
  const primaryColor = workspace?.color?.primary || '#3B82F6';

  const [selectedCampaign, setSelectedCampaign] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeStatuses, setActiveStatuses] = useState<string[]>(['Approved', 'Pending', 'Rejected', 'Flagged']);

  const campaigns = Array.from(new Set(data.map(r => r.Campaign))).sort();
  
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

    return fd;
  }, [data, selectedCampaign, searchTerm, activeStatuses, startDate, endDate, workspace]);

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
  const costPerMillion = totalViews > 0 ? (totalSpent / totalViews) * 1000000 : 0;

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
      {/* Campaign Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 hide-scrollbar">
        <button 
          onClick={() => setSelectedCampaign('All')}
          className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-wide whitespace-nowrap transition-all shadow-sm ${
            selectedCampaign === 'All' ? 'text-white' : 'bg-[#111] border border-white/[0.05] text-[#888] hover:text-white hover:bg-white/5'
          }`}
          style={selectedCampaign === 'All' ? { backgroundColor: primaryColor, boxShadow: `0 4px 20px ${primaryColor}33` } : {}}
        >
          All Campaigns
        </button>
        {campaigns.map(c => (
          <button 
            key={c}
            onClick={() => setSelectedCampaign(c)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-wide whitespace-nowrap transition-all shadow-sm ${
              selectedCampaign === c ? 'text-white' : 'bg-[#111] border border-white/[0.05] text-[#888] hover:text-white hover:bg-white/5'
            }`}
            style={selectedCampaign === c ? { backgroundColor: primaryColor, boxShadow: `0 4px 20px ${primaryColor}33` } : {}}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Campaign Overview Card (Only when a specific campaign is selected) */}
      {selectedCampaign !== 'All' && (
        <div className="bg-[#111] border p-8 rounded-2xl relative overflow-hidden shadow-lg" style={{ borderColor: `${primaryColor}1A` }}>
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" style={{ backgroundColor: `${primaryColor}1A` }}></div>
          
          <div className="mb-8 border-b border-white/[0.05] pb-6 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tighter text-white mb-2">{selectedCampaign} Overview</h2>
              <p className="text-sm font-medium" style={{ color: primaryColor }}>Active campaign tracked up to {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-10 relative z-10">
            <div>
              <p className="text-[#888] text-[11px] font-bold uppercase tracking-widest mb-2">{workspace?.metrics?.customLabels?.['Views'] || 'Total Views'}</p>
              <p className="text-3xl font-black tabular-nums tracking-tighter" style={{ color: primaryColor }}>{formatViews(totalViews)}</p>
            </div>
            <div>
              <p className="text-[#888] text-[11px] font-bold uppercase tracking-widest mb-2">{workspace?.metrics?.customLabels?.['Amount Paid'] || 'Total Earned'}</p>
              <p className="text-3xl font-black text-[#10B981] tabular-nums tracking-tighter">{formatMoney(totalSpent)}</p>
            </div>
            <div>
              <p className="text-[#888] text-[11px] font-bold uppercase tracking-widest mb-2">{workspace?.metrics?.customLabels?.['Clippers'] || 'Clips Submitted'}</p>
              <p className="text-3xl font-black text-white tabular-nums tracking-tighter">{totalSubmissions}</p>
            </div>
            <div>
              <p className="text-[#888] text-[11px] font-bold uppercase tracking-widest mb-2">Approval Rate</p>
              <p className="text-3xl font-black text-white tabular-nums tracking-tighter">{approvalRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[#888] text-[11px] font-bold uppercase tracking-widest mb-2">{workspace?.metrics?.customLabels?.['Avg Views/Clip'] || 'Avg Views/Clip'}</p>
              <p className="text-3xl font-black text-white tabular-nums tracking-tighter">{formatViews(avgViewsPerClip)}</p>
            </div>
            <div>
              <p className="text-[#888] text-[11px] font-bold uppercase tracking-widest mb-2">Cost / 1M Views</p>
              <p className="text-3xl font-black text-white tabular-nums tracking-tighter">{formatMoney(costPerMillion)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-[#111] p-5 rounded-2xl border border-white/[0.05] shadow-lg space-y-5 relative z-10">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search content or creator..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
            />
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-[#0F0F0F] border border-white/10 rounded-lg p-1">
               <Calendar className="w-4 h-4 text-[#888] ml-2" />
               <input 
                 type="date"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 className="bg-transparent text-sm text-white border-none focus:outline-none p-1"
               />
               <span className="text-[#555]">-</span>
               <input 
                 type="date"
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
                 className="bg-transparent text-sm text-white border-none focus:outline-none p-1 mr-1"
               />
             </div>
             {(startDate || endDate || searchTerm || activeStatuses.length < 4) && (
               <button onClick={resetFilters} className="text-sm font-medium text-[#3B82F6] hover:text-[#2563EB]">Reset</button>
             )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
          <span className="text-sm text-[#888] mr-2 self-center">Status Filters:</span>
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
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${colorCls}`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-[#111] border border-white/[0.05] p-6 rounded-2xl shadow-lg">
          <h3 className="text-sm font-bold tracking-widest text-[#888] uppercase mb-6">Campaign Performance (Views)</h3>
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

        {/* Top Creators in Campaign */}
        <div className="lg:col-span-1 bg-[#111] border border-white/[0.05] p-6 rounded-2xl shadow-lg">
          <h3 className="text-sm font-bold tracking-widest text-[#888] uppercase mb-4">Top Generators</h3>
          <div className="space-y-4">
            {Array.from(new Set(approvedData.map(r => r.Creator))).slice(0, 6).map((c, i) => {
              const clData = approvedData.filter(r => r.Creator === c);
              const views = clData.reduce((s,r) => s+r.Views, 0);
              return (
                <div key={i} className="flex items-center justify-between group hover:bg-white/[0.02] p-2 -mx-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 text-[#888] flex items-center justify-center text-xs font-bold">#{i+1}</div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{c}</p>
                      <p className="text-xs font-medium text-[#555]">{clData.length} clips</p>
                    </div>
                  </div>
                  <div className="text-sm tabular-nums text-emerald-400 font-bold">{formatViews(views)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Raw Data Table */}
      <div className="bg-[#111] border border-white/[0.05] rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-white/[0.05] flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-widest text-[#888] uppercase">Targeted Submissions</h3>
          <span className="text-[#888] text-xs font-bold bg-white/5 px-2.5 py-1 rounded-full">{filteredData.length} results</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0F0F0F]/50">
              <tr className="text-[11px] uppercase tracking-wider text-[#666] bg-black/20 border-b border-white/[0.05]">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Creator</th>
                <th className="p-4 font-medium">Platform</th>
                <th className="p-4 font-medium">Views</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.slice(0, 30).map((row, i) => (
                <tr key={i} className="hover:bg-[#242424] transition-colors">
                  <td className="p-4 text-sm text-[#888] whitespace-nowrap tabular-nums">{row["Submission Date"]}</td>
                  <td className="p-4 text-sm font-medium text-white whitespace-nowrap">{row.Creator}</td>
                  <td className="p-4 text-sm text-[#888] whitespace-nowrap">{row.Platform}</td>
                  <td className="p-4 text-sm tabular-nums whitespace-nowrap">{formatViews(row.Views)}</td>
                  <td className="p-4 text-sm whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${
                      row.Status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      row.Status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      row.Status === 'Flagged' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {row.Status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-right tabular-nums text-emerald-400 whitespace-nowrap">{formatMoney(row["Amount Paid"])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
