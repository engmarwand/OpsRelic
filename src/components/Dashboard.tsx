import { useAppContext } from '../lib/store';
import { formatViews, formatMoney } from '../lib/data';
import { TrendingUp, DollarSign, Target, Users, UploadCloud, ChevronUp, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { motion } from 'motion/react';
import { AnimatedNumber } from './AnimatedNumber';
import React, { useMemo } from 'react';

export default function Dashboard() {
  const { data, workspace } = useAppContext();
  const primaryColor = workspace?.color?.primary || '#3B82F6';

  const chartStyle = workspace?.layout?.chartStyle || 'Line';
  const layout = workspace?.layout?.layout || 'Standard';
  const getPadding = () => layout === 'Condensed' ? 'p-4' : layout === 'Expanded' ? 'p-8' : 'p-6';
  const getGap = () => layout === 'Condensed' ? 'gap-3' : layout === 'Expanded' ? 'gap-8' : 'gap-6';

  if (!data || data.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-12 text-center h-[70vh]"
      >
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: `${primaryColor}1A` }}
        >
          <UploadCloud className="w-10 h-10" style={{ color: primaryColor }} />
        </motion.div>
        <h2 className="text-[24px] font-bold text-[#F0F0F0] mb-3">Welcome to OpsRelic</h2>
        <p className="text-[#888] mb-8 max-w-md text-base leading-relaxed">Your data hub is currently empty. Upload your Content Rewards CSV to automatically generate insights, track campaigns, and build client reports.</p>
        <a href="#upload" className="text-white px-8 py-3.5 rounded-lg font-medium transition-opacity hover:opacity-80 shadow-lg" style={{ backgroundColor: primaryColor, boxShadow: `0 0 20px ${primaryColor}4D` }}>
          Upload CSV
        </a>
      </motion.div>
    );
  }

  // Calculate top-level KPIs
  let approvedData = data.filter(r => r.Status === 'Approved');
  
  if (workspace?.reports?.defaultPlatforms) {
    approvedData = approvedData.filter(r => {
      const plat = r.Platform.toLowerCase().includes('tik') ? 'TikTok' : 
                   r.Platform.toLowerCase().includes('insta') || r.Platform.toLowerCase().includes('ig') ? 'Instagram' : 
                   r.Platform.toLowerCase().includes('you') || r.Platform.toLowerCase().includes('yt') ? 'YouTube' : 'Other';
      return workspace.reports.defaultPlatforms!.includes(plat);
    });
  }

  const totalViews = approvedData.reduce((sum, r) => sum + r.Views, 0);
  const totalEarned = approvedData.reduce((sum, r) => sum + r["Amount Paid"], 0);
  
  const uniqueCampaigns = new Set<string>(data.map(r => r.Campaign)).size;
  const uniqueClippers = new Set<string>(data.map(r => r.Creator)).size;

  const viewsByDateAndCampaign: Record<string, Record<string, number>> = {};
  const campaigns: string[] = Array.from(new Set<string>(data.map(r => r.Campaign)));
  
  const sortedData = [...approvedData].sort((a, b) => new Date(a["Submission Date"]).getTime() - new Date(b["Submission Date"]).getTime());
  
  sortedData.forEach(row => {
    // format actual dates
    const date = new Date(row["Submission Date"]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!viewsByDateAndCampaign[date]) viewsByDateAndCampaign[date] = {};
    if (!viewsByDateAndCampaign[date][row.Campaign]) viewsByDateAndCampaign[date][row.Campaign] = 0;
    viewsByDateAndCampaign[date][row.Campaign] += row.Views;
  });

  const chartData = Object.keys(viewsByDateAndCampaign).map(date => {
    const p: any = { date };
    campaigns.forEach(c => {
      p[c] = viewsByDateAndCampaign[date][c] || 0;
    });
    return p;
  });

  // Calculate Platform Distribution
  const platformDataMap: Record<string, number> = {};
  approvedData.forEach(r => {
    // normalize platform names for matching colors
    const plat = r.Platform.toLowerCase().includes('tik') ? 'TikTok' : 
                 r.Platform.toLowerCase().includes('insta') || r.Platform.toLowerCase().includes('ig') ? 'Instagram' : 
                 r.Platform.toLowerCase().includes('you') || r.Platform.toLowerCase().includes('yt') ? 'YouTube' : 'Other';
    platformDataMap[plat] = (platformDataMap[plat] || 0) + r.Views;
  });
  const platformData = Object.keys(platformDataMap).map(name => ({
    name, value: platformDataMap[name]
  })).sort((a,b) => b.value - a.value);
  
  const generateShades = (hex: string) => [`${hex}`, `${hex}E6`, `${hex}B3`, `${hex}80`, `${hex}4D`];
  const currentThemeColors = generateShades(primaryColor);

  // Dynamic Insight logic
  const topInsight = useMemo(() => {
    if (approvedData.length === 0) return "Not enough data to generate insights. Upload more CSV data.";
    
    // Group by platform
    const platformStats: Record<string, number> = {};
    approvedData.forEach(r => {
      platformStats[r.Platform] = (platformStats[r.Platform] || 0) + r.Views;
    });

    const sortedPlatforms = Object.entries(platformStats).sort((a,b) => b[1] - a[1]);
    
    if (sortedPlatforms.length >= 2) {
      const top = sortedPlatforms[0];
      const second = sortedPlatforms[1];
      const diffPct = ((top[1] - second[1]) / second[1] * 100).toFixed(0);
      return `Short-form clips on ${top[0]} are outperforming ${second[0]} by ${diffPct}% overall. Consider re-allocating more creator incentives towards ${top[0]} to maximize ROI.`;
    } else if (sortedPlatforms.length === 1) {
      return `Your agency is highly concentrated on ${sortedPlatforms[0][0]}. Consider diversifying to other platforms like YouTube Shorts to capture new demographics.`;
    }

    return "Keep uploading data to generate deep AI insights.";
  }, [approvedData]);

  // Aggregate top clippers for real sorting
  const clippersMap = useMemo(() => {
    const map: Record<string, { views: number, earned: number }> = {};
    approvedData.forEach(r => {
      if (!map[r.Creator]) map[r.Creator] = { views: 0, earned: 0 };
      map[r.Creator].views += r.Views;
      map[r.Creator].earned += r["Amount Paid"];
    });
    return Object.entries(map).map(([creator, stats]) => ({ creator, ...stats })).sort((a, b) => b.views - a.views);
  }, [approvedData]);

  return (
    <div className={`space-y-6 ${layout === 'Condensed' ? 'text-sm' : ''}`}>
      {/* Top Banner Insight */}
      <div className={`bg-[#111] border shadow-[0_0_40px_-10px_rgba(59,130,246,0.15)] rounded-2xl ${getPadding()} flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden`} style={{ borderColor: `${primaryColor}33`, boxShadow: `0 0 40px -10px ${primaryColor}26` }}>
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(to right, ${primaryColor}, transparent)` }}></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Activity className="w-5 h-5" style={{ color: primaryColor }} /> Agency Insights</h2>
          <p className="text-sm text-white/60">AI observations based on your historical data.</p>
        </div>
        <div className="relative z-10 md:max-w-xl w-full bg-[#111] p-4 rounded-xl border border-white/[0.05] text-sm shadow-xl flex gap-4">
          <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}1A` }}>
            <TrendingUp className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="font-semibold text-white mb-1 tracking-wide uppercase text-[10px]">Generated Insight</p>
            <p className="text-white/80 leading-relaxed font-medium">
              {topInsight}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${getGap()}`}>
        {[
          { label: 'Total Views', key: 'Views', value: totalViews, format: formatViews, icon: TrendingUp, color: primaryColor, bg: `${primaryColor}1A` },
          { label: 'Total Earned', key: 'Amount Paid', value: totalEarned, format: formatMoney, icon: DollarSign, color: '#10B981', bg: '#10B9811a' },
          { label: 'Active Campaigns', key: 'Active Campaigns', value: uniqueCampaigns, icon: Target, color: '#8B5CF6', bg: '#8B5CF61a' },
          { label: 'Total Clippers', key: 'Clippers', value: uniqueClippers, icon: Users, color: '#F97316', bg: '#F973161a' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-[#111] border border-white/[0.05] ${getPadding()} rounded-2xl hover:border-white/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group shadow-lg`}>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-xs uppercase tracking-widest text-[#888] font-bold">{workspace?.metrics?.customLabels?.[kpi.key] || kpi.label}</span>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors`}
                style={{ backgroundColor: kpi.bg, color: kpi.color }}
              >
                 <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end gap-3 relative z-10">
              <div className="text-[36px] font-black leading-none tracking-tighter text-white">
                <AnimatedNumber value={kpi.value} format={kpi.format} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Charts */}
      <div className={`grid grid-cols-1 lg:grid-cols-5 ${getGap()}`}>
        <div className={`lg:col-span-3 bg-[#111] border border-white/[0.05] ${getPadding()} rounded-2xl shadow-lg`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold tracking-widest text-[#888] uppercase">Views Over Time</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartStyle === 'Area' ? (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="date" stroke="#444" tick={{fill: '#888', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} dy={15} />
                  <YAxis stroke="#444" tick={{fill: '#888', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} tickFormatter={formatViews} dx={-15} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: 13, fontWeight: 600 }}
                    labelStyle={{ color: '#888', fontSize: 12, marginBottom: '8px' }}
                  />
                  {campaigns.map((c, i) => (
                    <Area key={c} type="monotone" dataKey={c} fillOpacity={0.3} fill={i === 0 ? primaryColor : i === 1 ? "#10B981" : i === 2 ? "#8B5CF6" : "#E55A25"} stroke={i === 0 ? primaryColor : i === 1 ? "#10B981" : i === 2 ? "#8B5CF6" : "#E55A25"} strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
                  ))}
                </AreaChart>
              ) : chartStyle === 'Bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="date" stroke="#444" tick={{fill: '#888', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} dy={15} />
                  <YAxis stroke="#444" tick={{fill: '#888', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} tickFormatter={formatViews} dx={-15} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: 13, fontWeight: 600 }}
                    labelStyle={{ color: '#888', fontSize: 12, marginBottom: '8px' }}
                  />
                  {campaigns.map((c, i) => (
                    <Bar key={c} dataKey={c} fill={i === 0 ? primaryColor : i === 1 ? "#10B981" : i === 2 ? "#8B5CF6" : "#E55A25"} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="date" stroke="#444" tick={{fill: '#888', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} dy={15} />
                  <YAxis stroke="#444" tick={{fill: '#888', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} tickFormatter={formatViews} dx={-15} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: 13, fontWeight: 600 }}
                    labelStyle={{ color: '#888', fontSize: 12, marginBottom: '8px' }}
                  />
                  {campaigns.map((c, i) => (
                    <Line key={c} type="monotone" dataKey={c} stroke={i === 0 ? primaryColor : i === 1 ? "#10B981" : i === 2 ? "#8B5CF6" : "#E55A25"} strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className={`lg:col-span-2 bg-[#111] border border-white/[0.05] ${getPadding()} rounded-2xl shadow-lg`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold tracking-widest text-[#888] uppercase">Platform Breakdown</h3>
          </div>
          <div className="h-[300px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none" cornerRadius={4}>
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={currentThemeColors[index % currentThemeColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatViews(value)}
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white tabular-nums">{platformData.length > 0 ? ((platformData[0].value / totalViews) * 100).toFixed(0) : '0'}%</span>
              <span className="text-xs text-[#888] font-medium tracking-widest uppercase">{platformData.length > 0 ? platformData[0].name : 'No Data'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Tables */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 ${getGap()}`}>
        <div className="bg-[#111] border border-white/[0.05] rounded-2xl shadow-lg overflow-hidden">
          <div className={`${getPadding()} border-b border-white/[0.05]`}>
            <h3 className="text-sm font-bold tracking-widest text-[#888] uppercase">Top Campaigns</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] text-[11px] uppercase tracking-wider text-[#666] bg-black/20">
                  <th className="p-4 font-semibold">Campaign</th>
                  <th className="p-4 font-semibold text-right">Views</th>
                  <th className="p-4 font-semibold text-right">eCPM</th>
                  <th className="p-4 font-semibold text-right">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {campaigns.map(c => {
                  const cData = approvedData.filter(r => r.Campaign === c);
                  const cViews = cData.reduce((sum, r) => sum + r.Views, 0);
                  const cEarned = cData.reduce((sum, r) => sum + r["Amount Paid"], 0);
                  return { c, cViews, cEarned };
                }).sort((a,b) => b.cViews - a.cViews).slice(0,5).map((camp, i) => {
                  const ecpm = camp.cViews > 0 ? (camp.cEarned / camp.cViews) * 1000 : 0;
                  return (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-sm font-bold text-white whitespace-nowrap">{camp.c}</td>
                      <td className="p-4 text-sm text-right tabular-nums font-medium text-white/80">{formatViews(camp.cViews)}</td>
                      <td className="p-4 text-sm text-right tabular-nums text-[#888]">{formatMoney(ecpm)}</td>
                      <td className="p-4 text-sm text-right tabular-nums text-emerald-400 font-bold">{formatMoney(camp.cEarned)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#111] border border-white/[0.05] rounded-2xl shadow-lg overflow-hidden">
          <div className={`${getPadding()} border-b border-white/[0.05]`}>
            <h3 className="text-sm font-bold tracking-widest text-[#888] uppercase">Top Clippers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] text-[11px] uppercase tracking-wider text-[#666] bg-black/20">
                  <th className="p-4 font-semibold w-12 text-center">#</th>
                  <th className="p-4 font-semibold">Creator</th>
                  <th className="p-4 font-semibold text-right">Views</th>
                  <th className="p-4 font-semibold text-right">eCPM</th>
                  <th className="p-4 font-semibold text-right">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {clippersMap.slice(0,5).map((c, i) => {
                  const ecpm = c.views > 0 ? (c.earned / c.views) * 1000 : 0;
                  return (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-sm text-center">
                        <span className="w-6 h-6 rounded-full bg-white/5 text-[#888] inline-flex items-center justify-center text-xs font-bold">{(i+1)}</span>
                      </td>
                      <td className="p-4 text-sm font-bold text-white whitespace-nowrap">{c.creator}</td>
                      <td className="p-4 text-sm text-right tabular-nums font-medium text-white/80">{formatViews(c.views)}</td>
                      <td className="p-4 text-sm text-right tabular-nums text-[#888]">{formatMoney(ecpm)}</td>
                      <td className="p-4 text-sm text-right tabular-nums text-emerald-400 font-bold">{formatMoney(c.earned)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
