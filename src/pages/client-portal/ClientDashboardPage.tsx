import React, { useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../../lib/store';
import { formatViews } from '../../lib/data';
import { 
  TrendingUp, Users, PlayCircle, Zap, ExternalLink, Calendar,
  BarChart2, Presentation, ShieldCheck, ChevronDown, ChevronRight, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import Chart from 'chart.js/auto';

export default function ClientDashboardPage({ campaignId }: { campaignId?: string }) {
  const { data, workspace, updates, campaignsList, clients, clipMetrics } = useAppContext();
  const [selectedAuthor, setSelectedAuthor] = React.useState<string>('All');
  const [expandedAuthors, setExpandedAuthors] = React.useState<Set<string>>(new Set());

  const toggleAuthor = (author: string) => {
    const next = new Set(expandedAuthors);
    if (next.has(author)) next.delete(author);
    else next.add(author);
    setExpandedAuthors(next);
  };
  
  const campaign = useMemo(() => {
    return campaignsList.find(c => c.id === campaignId);
  }, [campaignsList, campaignId]);

  const campaignClipMetrics = useMemo(() => {
    let filtered = clipMetrics.filter(m => m.campaignId === campaignId);
    if (selectedAuthor !== 'All') {
      filtered = filtered.filter(m => m.author === selectedAuthor);
    }
    return filtered;
  }, [clipMetrics, campaignId, selectedAuthor]);

  const client = useMemo(() => {
    return clients.find(c => c.id === campaign?.clientId);
  }, [clients, campaign]);

  const campaignData = useMemo(() => {
    let filtered = (data || []).filter(r => (!campaignId || r.Campaign === campaignId || r._campaignId === campaignId) && ((r.Status||'').toLowerCase() === 'approved'));
    if (selectedAuthor !== 'All') {
      filtered = filtered.filter(r => r.Creator === selectedAuthor);
    }
    return filtered;
  }, [data, campaignId, selectedAuthor]);

   const stats = useMemo(() => {
    const platforms: Record<string, number> = {};
    campaignClipMetrics.forEach(m => {
      const p = m.platform;
      if (p) platforms[p] = (platforms[p] || 0) + 1;
    });
    const topPlatform = Object.entries(platforms).sort((a,b) => b[1] - a[1])[0]?.[0] || 'TikTok';

    return {
      views: campaignClipMetrics.reduce((sum, m) => sum + (m.views || 0), 0),
      likes: campaignClipMetrics.reduce((sum, m) => sum + (m.likes || 0), 0),
      comments: campaignClipMetrics.reduce((sum, m) => sum + (m.comments || 0), 0),
      shares: campaignClipMetrics.reduce((sum, m) => sum + (m.shares || 0), 0),
      creators: new Set(campaignClipMetrics.map(m => m.author || 'Creator')).size,
      topPlatform
    };
  }, [campaignClipMetrics]);

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
                <div className="w-2 h-2 rounded-full shadow-glow" style={{ backgroundColor: brandColor }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted">Portal Feed</span>
             </div>
             <h1 className="font-display text-2xl font-extrabold text-[var(--color-text-main)] tracking-[-0.025em]">
               {campaign?.name || 'Campaign'} Insights
             </h1>
             <p className="text-sm text-muted max-w-lg">
                Verified viewing metrics and asset performance for {client?.name || 'your campaign'}. Updated via agency reports.
             </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest whitespace-nowrap">Filter Creator:</label>
            <select 
              value={selectedAuthor} 
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] min-w-[160px]"
            >
              <option value="All">All Creators</option>
              {Array.from(new Set([
                ...clipMetrics.filter(m => m.campaignId === campaignId).map(c => c.author),
                ...data.filter(r => (!campaignId || r.Campaign === campaignId || r._campaignId === campaignId)).map(r => r.Creator)
              ].filter(Boolean))).sort().map(author => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
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

      {/* Asset Grid grouped by Creator */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-sm overflow-hidden flex flex-col">
         <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface2)]">
            <h3 className="font-display text-md font-bold text-[var(--color-text-main)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-green)]" /> Verified Content Assets
            </h3>
         </div>
         <div className="p-6">
           {campaignClipMetrics.length === 0 ? (
             <div className="py-12 text-center text-muted text-sm border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl">No assets verified yet.</div>
           ) : (
             <div className="space-y-4">
                {(() => {
                  const displayList: any[] = [...campaignClipMetrics];
                  const clipUrls = new Set(campaignClipMetrics.map(c => c.url).filter(Boolean));
                  campaignData.forEach(r => {
                    if (r["Submission URL"] && !clipUrls.has(r["Submission URL"])) {
                      displayList.push({
                        id: `csv-${Math.random()}`,
                        url: r["Submission URL"],
                        title: r["Content Title"],
                        author: r.Creator || 'Unknown',
                        platform: r.Platform,
                        views: r.Views || 0,
                        likes: r.Likes || 0,
                        isCSV: true,
                        updatedAt: r.Date || r.Timestamp
                      } as any);
                    }
                  });

                  let filteredList = displayList;
                  if (selectedAuthor !== 'All') {
                    filteredList = filteredList.filter(item => item.author === selectedAuthor);
                  }

                  // Group by author
                  const groups: Record<string, any[]> = {};
                  filteredList.forEach(item => {
                    const author = item.author || 'Verified Creator';
                    if (!groups[author]) groups[author] = [];
                    groups[author].push(item);
                  });

                  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length).map(([author, clips]) => {
                    const isExpanded = expandedAuthors.has(author);
                    const creatorViews = clips.reduce((sum, c) => sum + (c.views || 0), 0);
                    const creatorPayout = clips.reduce((sum, c) => {
                      let p = ((c.views || 0) / 1000 * (campaign?.cpm || 0));
                      if (campaign?.maxPayout && p > campaign.maxPayout) p = campaign.maxPayout;
                      return sum + p;
                    }, 0);
                    
                    return (
                      <div key={author} className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden bg-[var(--color-surface)] shadow-sm">
                        <div 
                          onClick={() => toggleAuthor(author)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--color-surface2)] transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/20 flex items-center justify-center font-bold text-sm uppercase">
                              {author.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-extrabold text-[var(--color-text-main)]">@{author}</div>
                              <div className="text-[10px] text-muted uppercase tracking-widest font-bold mt-0.5">{clips.length} Clips</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right hidden sm:block">
                              <div className="text-[10px] font-bold text-muted uppercase tracking-tighter text-right">Reach</div>
                              <div className="text-sm font-extrabold text-[var(--color-text-main)] tabular-nums">{formatViews(creatorViews)}</div>
                            </div>
                            <div className="text-right hidden sm:block">
                              <div className="text-[10px] font-bold text-muted uppercase tracking-tighter text-right">Earnings</div>
                              <div className="text-sm font-extrabold text-[var(--color-green)] tabular-nums">${creatorPayout.toFixed(2)}</div>
                            </div>
                            <div className={cn("p-2 rounded-lg bg-[var(--color-surface2)] text-muted transition-transform duration-300", isExpanded && "rotate-180")}>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-[var(--color-border-subtle)] bg-[var(--color-surface2)]/30 shadow-inner"
                            >
                              <div className="p-4 space-y-3">
                                {clips.sort((a,b) => (b.views || 0) - (a.views || 0)).map(clip => (
                                  <div key={clip.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-subtle)] gap-4 hover:border-brand-primary/50 transition-all group">
                                    <div className="flex items-center gap-4 min-w-0">
                                      <div className="w-12 h-12 rounded-lg bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 text-muted transition-colors group-hover:text-brand-primary">
                                        <PlayCircle className="w-6 h-6 opacity-60" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-sm font-bold text-[var(--color-text-main)] truncate max-w-full">
                                          {clip.title || 'Untitled Asset'}
                                        </div>
                                        <div className="text-[10px] text-muted flex items-center gap-x-2 mt-1 font-medium">
                                          <span className="bg-[var(--color-surface2)] px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">{clip.platform || 'Clip'}</span>
                                          <span>•</span>
                                          <span>{clip.updatedAt ? new Date(clip.updatedAt.toMillis ? clip.updatedAt.toMillis() : clip.updatedAt).toLocaleDateString() : 'Verified'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 shrink-0">
                                      <div className="text-left md:text-right">
                                        <div className="font-display font-black text-sm tabular-nums text-[var(--color-text-main)]">{formatViews(clip.views || 0)}</div>
                                        <div className="text-[9px] text-muted font-bold uppercase tracking-widest">Views</div>
                                      </div>
                                       <div className="text-left md:text-right">
                                         <div className="font-display font-black text-sm tabular-nums text-[var(--color-green)]">
                                           ${(() => {
                                             let p = ((clip.views || 0) / 1000 * (campaign?.cpm || 0));
                                             if (campaign?.maxPayout && p > campaign.maxPayout) p = campaign.maxPayout;
                                             return p.toFixed(2);
                                           })()}
                                         </div>
                                         <div className="text-[9px] text-[var(--color-green)] opacity-80 font-bold uppercase tracking-widest">Payout</div>
                                       </div>
                                      <div className="text-left md:text-right hidden sm:block">
                                        <div className="font-display font-black text-sm tabular-nums text-[var(--color-cyan)]">{clip.engagementRate ? (clip.engagementRate * 100).toFixed(1) + '%' : '0%'}</div>
                                        <div className="text-[9px] text-[var(--color-cyan)] opacity-80 font-bold uppercase tracking-widest">Engagement</div>
                                      </div>
                                      <div className="text-right flex items-center justify-end">
                                        <a href={clip.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[var(--color-surface2)] text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-all">
                                          <ExternalLink className="w-4 h-4" />
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  });
                })()}
             </div>
           )}
         </div>
      </div>
    </div>
  );
}
