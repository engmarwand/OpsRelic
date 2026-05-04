import { useAppContext } from '../lib/store';
import { formatViews, formatMoney } from '../lib/data';
import { TrendingUp, DollarSign, Target, Users, UploadCloud, ChevronUp, Activity, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { motion } from 'motion/react';
import { AnimatedNumber } from './AnimatedNumber';
import React, { useMemo, useState } from 'react';

export default function Dashboard() {
  const { data, workspace, hasFeature, setShowPricing, plan } = useAppContext();
  const primaryColor = workspace?.color?.primary || '#3B82F6';

  const chartStyle = workspace?.layout?.chartStyle || 'Line';
  const layout = workspace?.layout?.layout || 'Standard';
  const getPadding = () => layout === 'Condensed' ? 'p-4' : layout === 'Expanded' ? 'p-8' : 'p-6';
  const getGap = () => layout === 'Condensed' ? 'gap-3' : layout === 'Expanded' ? 'gap-8' : 'gap-6';

  const [startMonth, setStartMonth] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const dashboardData = useMemo(() => {
    let filtered = data || [];
    
    // Filter by time range
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = new Date(now.setDate(now.getDate() - days));
    
    filtered = filtered.filter(r => {
      const date = new Date(r["Submission Date"]);
      return date >= cutoff;
    });

    if (startMonth) {
      filtered = filtered.filter(r => {
        if (!r["Submission Date"]) return false;
        return r["Submission Date"].substring(0, 7) >= startMonth;
      });
    }
    if (endMonth) {
      filtered = filtered.filter(r => {
        if (!r["Submission Date"]) return false;
        return r["Submission Date"].substring(0, 7) <= endMonth;
      });
    }
    return filtered;
  }, [data, startMonth, endMonth, timeRange]);

  const approvedData = useMemo(() => {
    let filtered = dashboardData.filter(r => r.Status === 'Approved');
    
    if (workspace?.reports?.defaultPlatforms) {
      filtered = filtered.filter(r => {
        const plat = r.Platform.toLowerCase().includes('tik') ? 'TikTok' : 
                     r.Platform.toLowerCase().includes('insta') || r.Platform.toLowerCase().includes('ig') ? 'Instagram' : 
                     r.Platform.toLowerCase().includes('you') || r.Platform.toLowerCase().includes('yt') ? 'YouTube' : 'Other';
        return workspace.reports.defaultPlatforms!.includes(plat);
      });
    }
    return filtered;
  }, [dashboardData, workspace?.reports?.defaultPlatforms]);

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

  const { totalViews, totalPaidOut, uniqueCampaigns, uniqueClippers } = useMemo(() => {
    return {
      totalViews: approvedData.reduce((sum, r) => sum + r.Views, 0),
      totalPaidOut: approvedData.reduce((sum, r) => sum + r["Amount Paid"], 0),
      uniqueCampaigns: new Set(approvedData.map(r => r.Campaign)).size,
      uniqueClippers: new Set(approvedData.map(r => r.Creator)).size
    };
  }, [approvedData]);

  // Aggregated data for charts
  const { chartData, campaigns } = useMemo(() => {
    const viewsByDateAndCampaign: Record<string, Record<string, number>> = {};
    const campaignSet = new Set<string>();
    
    const sortedData = [...approvedData].sort((a, b) => new Date(a["Submission Date"]).getTime() - new Date(b["Submission Date"]).getTime());
    
    sortedData.forEach(row => {
      campaignSet.add(row.Campaign);
      const date = new Date(row["Submission Date"]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!viewsByDateAndCampaign[date]) viewsByDateAndCampaign[date] = {};
      if (!viewsByDateAndCampaign[date][row.Campaign]) viewsByDateAndCampaign[date][row.Campaign] = 0;
      viewsByDateAndCampaign[date][row.Campaign] += row.Views;
    });

    const activeCampaigns = Array.from(campaignSet);
    const data = Object.keys(viewsByDateAndCampaign).map(date => {
      const p: any = { date };
      activeCampaigns.forEach(c => {
        p[c] = viewsByDateAndCampaign[date][c] || 0;
      });
      return p;
    });

    return { chartData: data, campaigns: activeCampaigns };
  }, [approvedData]);

  // Calculate Platform Distribution
  const platformData = useMemo(() => {
    const platformDataMap: Record<string, number> = {};
    approvedData.forEach(r => {
      const plat = r.Platform.toLowerCase().includes('tik') ? 'TikTok' : 
                   r.Platform.toLowerCase().includes('insta') || r.Platform.toLowerCase().includes('ig') ? 'Instagram' : 
                   r.Platform.toLowerCase().includes('you') || r.Platform.toLowerCase().includes('yt') ? 'YouTube' : 'Other';
      platformDataMap[plat] = (platformDataMap[plat] || 0) + r.Views;
    });
    return Object.keys(platformDataMap).map(name => ({
      name, value: platformDataMap[name]
    })).sort((a,b) => b.value - a.value);
  }, [approvedData]);

  const campaignSummary = useMemo(() => {
    const summaryMap: Record<string, { views: number, paid: number }> = {};
    campaigns.forEach(c => {
      summaryMap[c] = { views: 0, paid: 0 };
    });
    
    approvedData.forEach(r => {
      if (summaryMap[r.Campaign]) {
        summaryMap[r.Campaign].views += r.Views;
        summaryMap[r.Campaign].paid += r["Amount Paid"];
      }
    });

    return Object.entries(summaryMap)
      .map(([campaign, stats]) => ({ campaign, ...stats }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
  }, [campaigns, approvedData]);
  
  const generateShades = (hex: string) => [`${hex}`, `${hex}E6`, `${hex}B3`, `${hex}80`, `${hex}4D`];
  const currentThemeColors = generateShades(primaryColor);

  // Unique Colors for Platforms
  const PLATFORM_COLORS: Record<string, string> = {
    'TikTok': '#00F2EA',
    'Instagram': '#E1306C',
    'YouTube': '#FF0000',
    'Other': '#888888'
  };

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

  return (
    <div className={`space-y-8 ${layout === 'Condensed' ? 'text-sm' : ''}`}>
      {/* Top filter row */}
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between z-20 relative">
        <div>
          <h2 className="text-4xl font-display font-black text-white tracking-tight leading-tight">Dashboard Overview</h2>
          <p className="text-sm text-[#555] font-bold uppercase tracking-widest mt-1">Real-time performance summary</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md">
          <input 
            type="month"
            value={startMonth}
            onChange={e => setStartMonth(e.target.value)}
            className="bg-transparent text-white text-[11px] font-black uppercase tracking-widest px-4 py-2.5 focus:outline-none placeholder-white/20 cursor-pointer hover:bg-white/5 rounded-xl transition-colors"
            aria-label="Start Month"
          />
          <span className="text-[#333] font-black">—</span>
          <input 
            type="month"
            value={endMonth}
            onChange={e => setEndMonth(e.target.value)}
            className="bg-transparent text-white text-[11px] font-black uppercase tracking-widest px-4 py-2.5 focus:outline-none placeholder-white/20 cursor-pointer hover:bg-white/5 rounded-xl transition-colors"
            aria-label="End Month"
          />
          {(startMonth || endMonth) && (
             <button onClick={() => { setStartMonth(''); setEndMonth(''); }} className="text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-all ml-1">Clear</button>
          )}
        </div>
      </div>

      {/* Top Banner Insight */}
      <div className={`relative overflow-hidden rounded-[40px] border border-white/5 bg-[#0A0A0A] p-10 group/insight ${!hasFeature('aiInsights') ? 'opacity-90' : ''}`} style={{ boxShadow: `0 40px 80px -20px ${primaryColor}15` }}>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover/insight:opacity-20 transition-opacity duration-1000" style={{ backgroundColor: primaryColor }}></div>
        
        {!hasFeature('aiInsights') && (
          <div className="absolute inset-0 z-50 bg-[#050505]/80 backdrop-blur-md flex items-center justify-center p-6 md:p-12">
             <div className="bg-[#0A0A0A] p-8 md:p-12 rounded-[48px] border border-white/10 shadow-[0_0_100px_rgba(37,99,235,0.2)] flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-4xl w-full">
                <div className="w-20 h-20 shrink-0 bg-blue-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-600/30 rotate-3">
                  <Activity className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                   <h4 className="text-white font-display font-black uppercase tracking-[0.2em] text-2xl md:text-3xl mb-3 leading-none italic">AI Insights Locked</h4>
                   <p className="text-[#444] text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed">Upgrade your plan to unlock deep performance analysis and growth trends across your campaigns.</p>
                </div>
                <button 
                  onClick={() => setShowPricing(true)}
                  className="shrink-0 px-10 py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-gray-100 transition-all shadow-2xl active:scale-95 flex items-center gap-3"
                >
                  UPGRADE NOW
                  <Zap className="w-4 h-4 fill-current" />
                </button>
             </div>
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-10 items-start xl:items-center relative z-10">
          <div className="max-w-md shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/insight:border-blue-500/30 transition-colors">
                <Zap className="w-5 h-5 text-blue-500 fill-current" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#555]">Agency Insights</span>
            </div>
            <h2 className="text-3xl font-display font-black text-white mb-3 tracking-tight">AI Insights</h2>
            <p className="text-[#666] font-bold text-sm leading-relaxed max-w-xs uppercase tracking-tight">Smart observations about your agency performance.</p>
          </div>
          
          <div className="flex-1 w-full p-8 rounded-[32px] bg-white/[0.02] border border-white/5 flex gap-6 items-start backdrop-blur-xl group-hover/insight:bg-white/[0.04] transition-all duration-500">
            <div className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-600 shadow-lg shadow-blue-600/20 mt-1">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="font-black text-white uppercase tracking-[0.2em] text-[10px] opacity-40">Live Analysis</p>
              </div>
              <p className="text-lg text-white/90 leading-relaxed font-bold tracking-tight">
                {hasFeature('aiInsights') ? topInsight : "Upgrade your plan to access trend analysis and ROI strategies."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${getGap()}`}>
        {[
          { label: 'Network Views', key: 'Views', value: totalViews, format: formatViews, icon: TrendingUp, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Agency Payouts', key: 'Amount Paid', value: totalPaidOut, format: formatMoney, icon: DollarSign, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Active Campaigns', key: 'Active Campaigns', value: uniqueCampaigns, icon: Target, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Total Creators', key: 'Clippers', value: uniqueClippers, icon: Users, color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
        ].map((kpi, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -5 }}
            className={`bg-[#0A0A0A] border border-white/5 p-8 rounded-[32px] transition-all duration-500 relative overflow-hidden group shadow-xl hover:bg-[#0F0F0F] hover:border-white/10`}
          >
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 pointer-events-none" style={{ backgroundColor: kpi.color }}></div>
            
            <div className="flex justify-between items-start mb-10 relative z-10">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#444] group-hover:text-[#888] font-black transition-colors">{workspace?.metrics?.customLabels?.[kpi.key] || kpi.label}</span>
              <div 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner transition-all duration-500 group-hover:scale-110`}
                style={{ backgroundColor: kpi.bg, color: kpi.color }}
              >
                 <kpi.icon className="w-5 h-5 shadow-sm" />
              </div>
            </div>
            
            <div className="relative z-10 flex flex-col">
              <span className="text-5xl font-display font-black leading-none tracking-tighter text-white">
                <AnimatedNumber value={kpi.value} format={kpi.format} />
              </span>
              <div className="flex items-center gap-2 mt-4">
                <ChevronUp className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">+12.4% vs last period</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Row 2: Charts */}
      <div className={`grid grid-cols-1 lg:grid-cols-5 ${getGap()}`}>
        <div className={`lg:col-span-3 bg-[#0A0A0A] border border-white/5 p-8 lg:p-10 rounded-[40px] shadow-2xl relative overflow-hidden group/chart`}>
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[11px] font-black tracking-[0.3em] text-[#444] uppercase group-hover/chart:text-[#888] transition-colors">Views Trend</h3>
            <div className="flex gap-2">
              {['7d', '30d', '90d'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setTimeRange(t as any)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${t === timeRange ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-[#555] hover:bg-white/10 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartStyle === 'Area' ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="date" stroke="#222" tick={{fill: '#444', fontSize: 10, fontWeight: 900}} tickLine={false} axisLine={false} dy={15} />
                  <YAxis stroke="#222" tick={{fill: '#444', fontSize: 10, fontWeight: 900}} tickLine={false} axisLine={false} tickFormatter={formatViews} dx={-15} />
                  <Tooltip 
                    cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 2 }}
                    contentStyle={{ backgroundColor: '#0F0F0F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    labelStyle={{ color: '#555', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.2em' }}
                  />
                  {campaigns.map((c, i) => (
                    <Area key={c} type="monotone" dataKey={c} isAnimationActive={false} fillOpacity={1} fill="url(#colorPrimary)" stroke={i === 0 ? primaryColor : i === 1 ? "#10B981" : i === 2 ? "#F59E0B" : "#EC4899"} strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }} />
                  ))}
                </AreaChart>
              ) : chartStyle === 'Bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="date" stroke="#222" tick={{fill: '#444', fontSize: 10, fontWeight: 900}} tickLine={false} axisLine={false} dy={15} />
                  <YAxis stroke="#444" tick={{fill: '#444', fontSize: 10, fontWeight: 900}} tickLine={false} axisLine={false} tickFormatter={formatViews} dx={-15} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#0F0F0F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '16px' }}
                    itemStyle={{ fontSize: 12, fontWeight: 900 }}
                  />
                  {campaigns.map((c, i) => (
                    <Bar key={c} dataKey={c} isAnimationActive={false} fill={i === 0 ? primaryColor : i === 1 ? "#10B981" : i === 2 ? "#F59E0B" : "#EC4899"} radius={[6, 6, 0, 0]} />
                  ))}
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="date" stroke="#222" tick={{fill: '#444', fontSize: 10, fontWeight: 900}} tickLine={false} axisLine={false} dy={15} />
                  <YAxis stroke="#444" tick={{fill: '#444', fontSize: 10, fontWeight: 900}} tickLine={false} axisLine={false} tickFormatter={formatViews} dx={-15} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F0F0F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '16px' }}
                  />
                  {campaigns.map((c, i) => (
                    <Line key={c} type="monotone" dataKey={c} isAnimationActive={false} stroke={i === 0 ? primaryColor : i === 1 ? "#10B981" : i === 2 ? "#F59E0B" : "#EC4899"} strokeWidth={4} dot={false} activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }} />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className={`lg:col-span-2 bg-[#0A0A0A] border border-white/5 p-8 lg:p-10 rounded-[40px] shadow-2xl relative flex flex-col`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-black tracking-[0.3em] text-[#444] uppercase">Platform Distribution</h3>
          </div>
          <div className="flex-1 flex items-center justify-center relative min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 40, right: 60, bottom: 40, left: 60 }}>
                <Pie 
                  data={platformData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={55} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none" 
                  cornerRadius={10}
                  isAnimationActive={false}
                  labelLine={{ stroke: 'white', strokeWidth: 1, opacity: 0.3 }}
                  label={({ name, percent }) => (
                    <text
                      fill="#FFFFFF"
                      fontSize={10}
                      fontWeight={900}
                      textAnchor="middle"
                      className="font-black uppercase tracking-widest"
                    >
                      {`${name} ${(percent * 100).toFixed(0)}%`}
                    </text>
                  )}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[entry.name] || '#888888'} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatViews(value)}
                  contentStyle={{ backgroundColor: '#0F0F0F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-display font-black tracking-tighter text-white/20 tabular-nums leading-none">{platformData.length > 0 ? ((platformData[0].value / totalViews) * 100).toFixed(0) : '0'}%</span>
              <span className="text-[10px] text-white/10 font-black tracking-[0.4em] uppercase mt-2">{platformData.length > 0 ? platformData[0].name : 'Null'}</span>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {platformData.map((p, i) => (
              <div key={p.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p.name] || '#888888' }}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#666]">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Tables */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 ${getGap()}`}>
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
          <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[11px] font-black tracking-[0.3em] text-[#444] uppercase">Campaign Performance</h3>
            <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#555]">By Volume</span>
          </div>
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-[#333] bg-black/20">
                  <th className="p-6 pl-10 font-black">Campaign</th>
                  <th className="p-6 font-black text-right">Views</th>
                  <th className="p-6 font-black text-right">eCPM</th>
                  <th className="p-6 pr-10 font-black text-right">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaignSummary.map((camp, i) => {
                  const ecpm = camp.views > 0 ? (camp.paid / camp.views) * 1000 : 0;
                  return (
                    <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                      <td className="p-6 pl-10 text-sm font-black text-white whitespace-nowrap tracking-tight">{camp.campaign}</td>
                      <td className="p-6 text-sm text-right tabular-nums font-bold text-[#888]">{formatViews(camp.views)}</td>
                      <td className="p-6 text-sm text-right tabular-nums text-[#444] font-bold">{formatMoney(ecpm)}</td>
                      <td className="p-6 pr-10 text-sm text-right tabular-nums text-emerald-500 font-black group-hover:text-emerald-400 transition-colors">{formatMoney(camp.paid)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
          <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[11px] font-black tracking-[0.3em] text-[#444] uppercase">Top Creators</h3>
            <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#555]">Top 10%</span>
          </div>
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-[#333] bg-black/20">
                  <th className="p-6 pl-10 font-black w-16 text-center">Rank</th>
                  <th className="p-6 font-black">Creator Name</th>
                  <th className="p-6 font-black text-right">Views</th>
                  <th className="p-6 font-black text-right">eCPM</th>
                  <th className="p-6 pr-10 font-black text-right">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clippersMap.slice(0,6).map((c, i) => {
                  const ecpm = c.views > 0 ? (c.earned / c.views) * 1000 : 0;
                  return (
                    <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                      <td className="p-6 pl-10 text-sm text-center">
                        <span className="w-6 h-6 rounded-lg bg-white/5 text-[#444] inline-flex items-center justify-center text-[10px] font-black group-hover:text-white transition-colors">{(i+1).toString().padStart(2, '0')}</span>
                      </td>
                      <td className="p-6 text-sm font-black text-white whitespace-nowrap tracking-tight">{c.creator}</td>
                      <td className="p-6 text-sm text-right tabular-nums font-bold text-[#888]">{formatViews(c.views)}</td>
                      <td className="p-6 text-sm text-right tabular-nums text-[#444] font-bold">{formatMoney(ecpm)}</td>
                      <td className="p-6 pr-10 text-sm text-right tabular-nums text-emerald-500 font-black group-hover:text-emerald-400 transition-colors">{formatMoney(c.earned)}</td>
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
