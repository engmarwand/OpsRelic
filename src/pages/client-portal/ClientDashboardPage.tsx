import React, { useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../../lib/store';
import { formatViews } from '../../lib/data';
import { 
  TrendingUp, Users, PlayCircle, Zap, ExternalLink, Calendar,
  BarChart2, Presentation, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import Chart from 'chart.js/auto';

export default function ClientDashboardPage({ campaignId }: { campaignId?: string }) {
  const { data, workspace, updates, campaignsList, clients, clipMetrics } = useAppContext();
  
  const campaign = useMemo(() => {
    return campaignsList.find(c => c.id === campaignId);
  }, [campaignsList, campaignId]);

  const campaignClipMetrics = useMemo(() => {
    return clipMetrics.filter(m => m.campaignId === campaignId);
  }, [clipMetrics, campaignId]);

  const client = useMemo(() => {
    return clients.find(c => c.id === campaign?.clientId);
  }, [clients, campaign]);

  const campaignData = useMemo(() => {
    return (data || []).filter(r => (!campaignId || r.Campaign === campaignId || r._campaignId === campaignId) && ((r.Status||'').toLowerCase() === 'approved'));
  }, [data, campaignId]);

  const stats = useMemo(() => {
    const platforms: Record<string, number> = {};
    campaignData.forEach(r => {
      const p = r.Platform || r.platform;
      if (p) platforms[p] = (platforms[p] || 0) + 1;
    });
    const topPlatform = Object.entries(platforms).sort((a,b) => b[1] - a[1])[0]?.[0] || 'TikTok';

    return {
      views: campaignData.reduce((sum, r) => sum + (r.Views || r.views || 0), 0) + campaignClipMetrics.reduce((sum, m) => sum + (m.views || 0), 0),
      creators: new Set([...campaignData.map(r => r.Creator || r.creatorId), ...campaignClipMetrics.map(m => m.creatorId || 'Live Creator')]).size,
      topPlatform,
      liveViews: campaignClipMetrics.reduce((sum, m) => sum + (m.views || 0), 0)
    };
  }, [campaignData, campaignClipMetrics]);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const chartData = useMemo(() => {
    const viewsByDate: Record<string, number> = {};
    const dates: string[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    dates.forEach(d => viewsByDate[d] = 0);

    campaignData.forEach(row => {
      const d = (row["Submission Date"] || row.submissionDate || '').split('T')[0];
      if (d && viewsByDate[d] !== undefined) {
        viewsByDate[d] += (row.Views || row.views || 0);
      }
    });

    return {
      labels: dates.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      dataPoints: dates.map(date => viewsByDate[date])
    };
  }, [campaignData]);

  const brandColor = workspace?.color?.primary || '#00d4e8';

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Convert hex to rgb string for chart gradient
        let r=0,g=212,b=232;
        if(brandColor.startsWith('#') && brandColor.length===7){
           r = parseInt(brandColor.slice(1,3), 16);
           g = parseInt(brandColor.slice(3,5), 16);
           b = parseInt(brandColor.slice(5,7), 16);
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, `rgba(${r},${g},${b},0.3)`);
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
        
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: chartData.labels,
            datasets: [{
              label: 'Views',
              data: chartData.dataPoints,
              borderColor: brandColor,
              backgroundColor: gradient,
              borderWidth: 2.5,
              pointRadius: 2,
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7a8fa6', font: { family: 'Inter', size: 11 } } },
              y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7a8fa6', font: { family: 'Inter', size: 11 } } }
            }
          }
        });
      }
    }
  }, [chartData, brandColor]);

  const visibleUpdates = useMemo(() => 
    updates.filter(u => u.clientVisible && (!campaignId || u.campaignId === campaignId || u.campaignId === 'All'))
           .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  , [updates, campaignId]);

  return (
    <div className="page active p-6 md:p-8 min-h-[calc(100vh-var(--topbar-h))]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-[var(--color-border-subtle)] pb-6 bg-[var(--color-surface)] -m-6 md:-m-8 mb-6 p-6 md:p-8 shrink-0">
         <div className="space-y-4">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full animate-pulse shadow-glow" style={{ backgroundColor: brandColor }} />
               <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted">Live Portal Feed</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-[var(--color-text-main)] tracking-[-0.025em]">
              {campaign?.name || 'Campaign'} Insights
            </h1>
            <p className="text-sm text-muted max-w-lg">
               Real-time viewing metrics and asset performance for {client?.name || 'your campaign'}. Automatically updated as data rolls in.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 opacity-10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: brandColor }}></div>
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-[var(--color-surface2)] text-[var(--color-text-main)] flex items-center justify-center border border-[var(--color-border-subtle)]">
               <TrendingUp className="w-5 h-5"/>
             </div>
             <div className="text-xs font-bold text-muted uppercase tracking-[0.07em]">Total Reach</div>
           </div>
           <div className="font-display text-3xl font-extrabold text-[var(--color-text-main)]">{formatViews(stats.views)}</div>
            {stats.liveViews > 0 && (
              <div className="text-[10px] font-bold text-[var(--color-cyan)] mt-2 flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5" /> {formatViews(stats.liveViews)} live traction
              </div>
            )}
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-[var(--color-surface2)] text-[var(--color-text-main)] flex items-center justify-center border border-[var(--color-border-subtle)]">
               <Users className="w-5 h-5"/>
             </div>
             <div className="text-xs font-bold text-muted uppercase tracking-[0.07em]">Active Creators</div>
           </div>
           <div className="font-display text-3xl font-extrabold text-[var(--color-text-main)]">{stats.creators}</div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-[var(--color-surface2)] text-[var(--color-text-main)] flex items-center justify-center border border-[var(--color-border-subtle)]">
               <Zap className="w-5 h-5"/>
             </div>
             <div className="text-xs font-bold text-muted uppercase tracking-[0.07em]">Top Platform</div>
           </div>
           <div className="font-display text-3xl font-extrabold text-[var(--color-text-main)] capitalize">{stats.topPlatform}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
         {/* Deep Chart */}
         <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-display text-md font-bold text-[var(--color-text-main)]">Performance Trajectory</h3>
               <span className="text-xs text-muted font-medium bg-[var(--color-surface2)] px-2 py-1 rounded">Last 14 Days</span>
            </div>
            <div className="relative flex-1">
               <canvas ref={chartRef}></canvas>
            </div>
         </div>

         {/* Updates Module */}
         <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="font-display text-md font-bold text-[var(--color-text-main)] mb-6 flex items-center gap-2">
              <Presentation className="w-4 h-4 text-muted" /> Public Log
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-6">
               {visibleUpdates.length === 0 ? (
                 <div className="text-center text-sm text-faint py-10">No public logs added yet.</div>
               ) : visibleUpdates.map((update, i) => (
                 <div key={i} className="relative pl-6 border-l-2 border-[var(--color-border-subtle)]">
                    <div className="absolute left-[-5px] top-[5px] w-2 h-2 rounded-full" style={{ backgroundColor: brandColor, boxShadow: `0 0 10px ${brandColor}88` }} />
                    <p className="text-xs font-bold text-muted uppercase tracking-[0.07em] mb-1">{new Date(update.timestamp).toLocaleDateString()}</p>
                    <p className="text-sm text-[var(--color-text-main)] leading-relaxed">{update.content}</p>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Asset Grid */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-sm overflow-hidden flex flex-col">
         <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface2)]">
            <h3 className="font-display text-md font-bold text-[var(--color-text-main)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-green)]" /> Verified Content Assets
            </h3>
         </div>
         {campaignData.length === 0 && campaignClipMetrics.length === 0 ? (
           <div className="py-20 text-center text-muted text-sm">No assets verified yet.</div>
         ) : (
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-[var(--color-surface2)] border-b border-[var(--color-border-subtle)]">
                       <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.07em] text-muted">Asset Title</th>
                       <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.07em] text-muted">Platform</th>
                       <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.07em] text-muted">Creator</th>
                       <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.07em] text-muted text-right">Views</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {/* Live Metrics First */}
                    {campaignClipMetrics.map(clip => (
                      <tr key={clip.id} className="hover:bg-[var(--color-surface-hover)] transition-colors group bg-[var(--color-cyan-dim)]/5">
                         <td className="px-6 py-[14px]">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-lg bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] flex items-center justify-center border border-[rgba(0,212,232,0.2)]">
                                  <TrendingUp className={cn("w-5 h-5", clip.status === 'pending' && "animate-pulse")} />
                               </div>
                               <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                     <a href={clip.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[var(--color-cyan)] hover:underline truncate max-w-[250px] transition-colors">Live Performance URL</a>
                                     {clip.status === 'pending' && <span className="text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">Crawling...</span>}
                                  </div>
                                  <span className="text-[10px] text-muted mt-[2px] uppercase font-bold tracking-[0.07em]">
                                     {clip.updatedAt ? `Synced ${new Date(clip.updatedAt.toMillis ? clip.updatedAt.toMillis() : clip.updatedAt).toLocaleTimeString()}` : 'Tracking started'}
                                  </span>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-[14px]">
                            <span className="px-3 py-1 bg-[var(--color-cyan-dim)] border border-[rgba(0,212,232,0.2)] rounded-full text-xs font-bold text-[var(--color-cyan)] capitalize">
                               {clip.platform}
                            </span>
                          </td>
                          <td className="px-6 py-[14px] text-sm text-[var(--color-text-main)] font-medium">Verified Live</td>
                          <td className="px-6 py-[14px] text-right">
                             <span className="text-sm font-bold text-[var(--color-text-main)] tabular-nums">{formatViews(clip.views || 0)}</span>
                          </td>
                       </tr>
                    ))}

                    {/* Regular CSV Assets */}
                    {campaignData.slice(0, 50).map((row, i) => (
                       <tr key={i} className="hover:bg-[var(--color-surface-hover)] transition-colors group">
                          <td className="px-6 py-[14px]">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[var(--color-surface2)] flex items-center justify-center border border-[var(--color-border-subtle)] group-hover:border-[var(--color-cyan)] transition-colors">
                                   <PlayCircle className="w-5 h-5 text-muted group-hover:text-[var(--color-cyan)]" />
                                </div>
                                <div className="flex flex-col">
                                   {row["Submission URL"] || row.url ? (
                                     <a href={row["Submission URL"] || row.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[var(--color-text-main)] hover:text-[var(--color-cyan)] truncate max-w-[250px] transition-colors">{row["Content Title"] || row.title}</a>
                                   ) : (
                                     <span className="text-sm font-semibold text-[var(--color-text-main)] truncate max-w-[250px]">{row["Content Title"] || row.title}</span>
                                   )}
                                   <span className="text-xs text-muted mt-[2px]">{row["Submission Date"] || row.submissionDate ? new Date(row["Submission Date"] || row.submissionDate).toLocaleDateString() : ''}</span>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-[14px]">
                             <span className="px-3 py-1 bg-[var(--color-surface3)] border border-[var(--color-border-subtle)] rounded-full text-xs font-semibold text-muted capitalize">
                                {row.Platform || row.platform || 'Unknown'}
                             </span>
                          </td>
                          <td className="px-6 py-[14px] text-sm text-[var(--color-text-main)] font-medium">{row.Creator || row.creatorId}</td>
                          <td className="px-6 py-[14px] text-right">
                             <span className="text-sm font-bold text-[var(--color-text-main)] tabular-nums">{formatViews(row.Views || row.views || 0)}</span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
         )}
      </div>
    </div>
  );
}
