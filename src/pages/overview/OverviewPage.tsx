import { useAppContext } from '../../lib/store';
import { Upload, Plus, FolderOpen, Users, Eye, Scissors, ChevronRight, Activity, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import React, { useMemo, useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { db, auth } from '../../lib/firebase';
import { addDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

import { formatDistanceToNow } from 'date-fns';

export default function OverviewPage() {
  const { data, campaignsList, clients, clipMetrics, activeWorkspaceId } = useAppContext();
  const [tasks, setTasks] = useState<any[]>([]);
  const workspaceId = activeWorkspaceId || auth.currentUser?.uid;

  useEffect(() => {
    if (!workspaceId) return;
    const q = query(
      collection(db, 'workspaces', workspaceId, 'tasks'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tsks: any[] = [];
      snapshot.forEach(doc => tsks.push({ id: doc.id, ...doc.data() }));
      setTasks(tsks);
    }, (err) => {
      console.error("Overview tasks listener error:", err);
    });

    return () => unsubscribe();
  }, [workspaceId]);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const stats = useMemo(() => {
    const totalViews = clipMetrics.reduce((sum, item) => sum + (item.views || 0), 0);

    const formatViews = (val: number) => {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
      return val.toString();
    };

    return {
      activeCampaigns: campaignsList.filter(c => c.status === 'Active').length, 
      totalClients: clients.length,
      totalViews30d: formatViews(totalViews),
      clipsDelivered30d: clipMetrics.length,
    };
  }, [campaignsList, clients, clipMetrics]);

  const needsAttentionItems = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const items: any[] = [];

    // Prioritize Tasks first
    const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < today);
    const priorityTasks = tasks.filter(t => t.status !== 'done' && t.priority === 'high');
    const dueSoonTasks = tasks.filter(t => t.status !== 'done' && t.dueDate === today);

    overdueTasks.forEach(t => items.push({ id: t.id, title: t.title, reason: 'Overdue Task', color: 'var(--color-red)', type: 'task' }));
    dueSoonTasks.forEach(t => items.push({ id: t.id, title: t.title, reason: 'Due Today', color: 'var(--color-yellow)', type: 'task' }));
    priorityTasks.forEach(t => items.push({ id: t.id, title: t.title, reason: 'High Priority', color: 'var(--color-purple)', type: 'task' }));

    // Fallback to campaign issues if not enough task alerts
    if (items.length < 4) {
      for (const camp of campaignsList) {
        if (camp.status !== 'Active') continue;
        if (!camp.portalEnabled) {
          items.push({ id: `portal-${camp.id}`, title: camp.name, reason: "Portal not enabled", color: "var(--color-yellow)", campId: camp.id });
        }
        const hasData = data.some(d => d._campaignId === camp.id) || clipMetrics.some(m => m.campaignId === camp.id);
        if (!hasData) {
          items.push({ id: `empty-${camp.id}`, title: camp.name, reason: "No assets uploaded yet", color: "var(--color-red)", campId: camp.id });
        }
      }
    }
    
    return items.slice(0, 4);
  }, [campaignsList, data, clipMetrics, tasks]);

  const recentActivity = useMemo(() => {
    const activity: any[] = [];
    
    // Tasks
    for (const t of tasks.slice(0, 5)) {
      const ts = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      activity.push({
        type: 'task',
        title: 'Task added',
        detail: t.title,
        timestamp: ts.getTime(),
        dateStr: formatDistanceToNow(ts, { addSuffix: true }),
        rawDate: ts,
        author: t.creatorName || 'Team'
      });
    }

    // Uploads
    for (const u of data) {
      const ts = u.createdAt ? new Date((u.createdAt.toMillis ? u.createdAt.toMillis() : u.createdAt)) : (u["Submission Date"] ? new Date(u["Submission Date"]) : new Date());
      activity.push({
        type: 'upload',
        title: 'CSV uploaded',
        detail: u["Content Title"] || 'Performance Data',
        timestamp: ts.getTime(),
        dateStr: formatDistanceToNow(ts, { addSuffix: true }),
        rawDate: ts
      });
    }

    // New Campaigns
    for (const c of campaignsList) {
      const ts = c.createdAt ? new Date((c.createdAt.toMillis ? c.createdAt.toMillis() : c.createdAt)) : new Date();
      activity.push({
        type: 'campaign',
        title: 'Campaign created',
        detail: c.name,
        timestamp: ts.getTime(),
        dateStr: formatDistanceToNow(ts, { addSuffix: true }),
        rawDate: ts
      });
    }

    activity.sort((a,b) => b.timestamp - a.timestamp);
    return activity.slice(0, 5);
  }, [data, campaignsList, tasks]);

  const chartData = useMemo(() => {
    // Generate labels for the last 6 months
    const labels: string[] = [];
    const counts: number[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
      
      // Calculate views for this month
      let monthViews = 0;
      
      // From CSV data
      data.forEach(r => {
        const rowDate = r["Submission Date"] ? new Date(r["Submission Date"]) : null;
        if (rowDate && rowDate.getMonth() === d.getMonth() && rowDate.getFullYear() === d.getFullYear()) {
          monthViews += (r.Views || 0);
        }
      });
      
      // From Clip Metrics
      clipMetrics.forEach(m => {
        const mDate = m.createdAt ? new Date(m.createdAt) : null;
        if (mDate && mDate.getMonth() === d.getMonth() && mDate.getFullYear() === d.getFullYear()) {
          monthViews += (m.views || 0);
        }
      });
      
      counts.push(monthViews);
    }
    
    return { labels, counts };
  }, [data, clipMetrics]);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, 180);
        g.addColorStop(0, 'rgba(0,212,232,0.3)');
        g.addColorStop(1, 'rgba(0,212,232,0)');
        
        const hasData = chartData.counts.some(v => v > 0);

        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: chartData.labels,
            datasets: [{
              label: 'Views',
              data: chartData.counts,
              borderColor: '#00d4e8',
              backgroundColor: g,
              borderWidth: 2.5,
              pointRadius: hasData ? 3 : 0,
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
              legend: { display: false },
              tooltip: {
                enabled: hasData,
                mode: 'index',
                intersect: false,
              }
            },
            scales: {
              x: { 
                grid: { color: 'rgba(255,255,255,0.04)' }, 
                ticks: { color: '#7a8fa6', font: { family: 'Inter', size: 11 } } 
              },
              y: { 
                grid: { color: 'rgba(255,255,255,0.04)' }, 
                ticks: { 
                  color: '#7a8fa6', 
                  font: { family: 'Inter', size: 11 },
                  callback: (value) => {
                    if (Number(value) >= 1000000) return (Number(value) / 1000000).toFixed(1) + 'M';
                    if (Number(value) >= 1000) return (Number(value) / 1000).toFixed(0) + 'K';
                    return value;
                  }
                },
                beginAtZero: true
              }
            }
          }
        });
      }
    }
  }, [chartData]);

  return (
    <div className="page active p-6 md:p-8 min-h-[calc(100vh-var(--topbar-h))]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[var(--color-text-main)] tracking-[-0.025em]">Good morning{auth.currentUser?.displayName ? `, ${auth.currentUser.displayName.split(' ')[0]}` : ''} 👋</h1>
          <p className="text-sm text-muted mt-[3px]">Here's what's happening across your agency today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md hover:border-strong cursor-default">
          <div className="absolute -top-[10px] -right-[10px] w-[90px] h-[90px] rounded-full opacity-55 blur-[32px] bg-[var(--color-cyan)] pointer-events-none" />
          <div className="w-[38px] h-[38px] rounded-lg flex items-center justify-center mb-3 relative z-10 bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] border border-[rgba(0,212,232,0.2)]">
            <FolderOpen className="w-[18px] h-[18px]" />
          </div>
          <div className="text-xs text-muted uppercase tracking-[0.07em] font-bold relative z-10">Active Campaigns</div>
          <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)] my-1 leading-none tabular-nums relative z-10">{stats.activeCampaigns}</div>
          <span className="inline-block text-xs font-semibold px-2 py-[2px] rounded-full relative z-10 bg-[var(--color-green-dim)] text-[var(--color-green)]">↑ Active</span>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md hover:border-strong cursor-default">
          <div className="absolute -top-[10px] -right-[10px] w-[90px] h-[90px] rounded-full opacity-55 blur-[32px] bg-[var(--color-green)] pointer-events-none" />
          <div className="w-[38px] h-[38px] rounded-lg flex items-center justify-center mb-3 relative z-10 bg-[var(--color-green-dim)] text-[var(--color-green)] border border-[rgba(0,229,160,0.2)]">
            <Users className="w-[18px] h-[18px]" />
          </div>
          <div className="text-xs text-muted uppercase tracking-[0.07em] font-bold relative z-10">Total Clients</div>
          <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)] my-1 leading-none tabular-nums relative z-10">{stats.totalClients}</div>
          <span className="inline-block text-xs font-semibold px-2 py-[2px] rounded-full relative z-10 bg-[var(--color-surface3)] text-muted">All active</span>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md hover:border-strong cursor-default">
          <div className="absolute -top-[10px] -right-[10px] w-[90px] h-[90px] rounded-full opacity-55 blur-[32px] bg-[var(--color-purple)] pointer-events-none" />
          <div className="w-[38px] h-[38px] rounded-lg flex items-center justify-center mb-3 relative z-10 bg-[var(--color-purple-dim)] text-[var(--color-purple)] border border-[rgba(192,132,252,0.2)]">
            <Eye className="w-[18px] h-[18px]" />
          </div>
          <div className="text-xs text-muted uppercase tracking-[0.07em] font-bold relative z-10">Total Reach</div>
          <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)] my-1 leading-none tabular-nums relative z-10">{stats.totalViews30d}</div>
          <span className="inline-block text-xs font-semibold px-2 py-[2px] rounded-full relative z-10 bg-[var(--color-surface3)] text-muted">Across all channels</span>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md hover:border-strong cursor-default">
          <div className="absolute -top-[10px] -right-[10px] w-[90px] h-[90px] rounded-full opacity-55 blur-[32px] bg-[var(--color-orange)] pointer-events-none" />
          <div className="w-[38px] h-[38px] rounded-lg flex items-center justify-center mb-3 relative z-10 bg-[var(--color-orange-dim)] text-[var(--color-orange)] border border-[rgba(255,159,67,0.2)]">
            <Scissors className="w-[18px] h-[18px]" />
          </div>
          <div className="text-xs text-muted uppercase tracking-[0.07em] font-bold relative z-10">Clips Delivered</div>
          <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)] my-1 leading-none tabular-nums relative z-10">{stats.clipsDelivered30d}</div>
          <span className="inline-block text-xs font-semibold px-2 py-[2px] rounded-full relative z-10 bg-[var(--color-surface3)] text-muted">All time</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-4 mb-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-md font-bold text-[var(--color-text-main)]">Performance Over Time</div>
              <div className="text-xs text-muted mt-[2px]">Reach generated by your campaigns</div>
            </div>
            <span className="inline-flex items-center gap-[5px] text-xs font-bold px-[9px] py-[3px] rounded-full bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] border border-[rgba(0,212,232,0.2)]">
              Verified
            </span>
          </div>
          <div className="relative h-[190px] mt-4">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="font-display text-md font-bold text-[var(--color-text-main)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" />
              Needs Attention
            </div>
            <span className="inline-flex items-center gap-[5px] text-xs font-bold px-[9px] py-[3px] rounded-full bg-[var(--color-yellow-dim)] text-[var(--color-yellow)] border border-[rgba(255,209,102,0.2)]">
               {needsAttentionItems.length} issues
            </span>
          </div>
          
          {needsAttentionItems.length === 0 ? (
            <div className="text-sm text-faint py-8 text-center flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              All clear. No issues found.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {needsAttentionItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => window.location.hash = item.type === 'task' ? '#workspace' : '#campaigns'} 
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent hover:bg-[var(--color-surface2)] hover:border-[var(--color-border-subtle)] group"
                >
                  <div className={cn("w-1 h-8 rounded-full shrink-0")} style={{ backgroundColor: item.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[var(--color-text-main)] truncate group-hover:text-[var(--color-cyan)] transition-colors">{item.title}</div>
                    <div className="text-[10px] font-bold text-faint uppercase tracking-tight">{item.reason}</div>
                  </div>
                  <ChevronRight className="w-[14px] h-[14px] text-faint group-hover:translate-x-0.5 transition-transform" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="font-display text-md font-bold text-[var(--color-text-main)]">Active Campaigns</div>
            <button onClick={() => window.location.hash = '#campaigns'} className="btn btn-ghost btn-sm">View all →</button>
          </div>
          <div className="flex flex-col gap-2">
            {campaignsList.length === 0 ? <div className="text-sm text-faint py-4 text-center">No active campaigns.</div> : campaignsList.slice(0,4).map((camp, idx) => {
              const clientObj = clients.find(c => c.id === camp.clientId);
              const campColor = idx % 3 === 0 ? 'var(--color-green)' : idx % 3 === 1 ? 'var(--color-yellow)' : 'var(--color-blue)';
              
              const csvViews = data.filter(d => d._campaignId === camp.id).reduce((s, r) => s + (r.Views || 0), 0);
              const liveViews = clipMetrics.filter(m => m.campaignId === camp.id).reduce((s, m) => s + (m.views || 0), 0);
              const campViews = csvViews + liveViews;

              const formatViews = (val: number) => val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val.toString();
              
              return (
                <div key={camp.id} onClick={() => window.location.hash = '#campaigns'} className="flex items-center gap-3 p-3 bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl cursor-pointer transition-all duration-150 hover:border-strong">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: campColor, boxShadow: `0 0 8px ${campColor}` }} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[var(--color-text-main)]">{camp.name}</div>
                    <div className="text-xs text-muted">{clientObj?.name || 'Unknown Client'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold tabular-nums text-[var(--color-text-main)]">{formatViews(campViews)}</div>
                    <div className="text-xs text-muted">views</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="font-display text-md font-bold text-[var(--color-text-main)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-cyan)]" />
              Recent Activity
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse shadow-[0_0_8px_rgba(0,185,255,0.5)]"></div>
          </div>
          {recentActivity.length === 0 ? <div className="text-sm text-faint py-4 text-center">No recent activity.</div> : (
            <div className="flex flex-col gap-3">
              {recentActivity.map((activity, idx) => (
                <div key={`act-${idx}`} className="flex items-start gap-4 p-3 rounded-xl hover:bg-[var(--color-surface2)] transition-colors group">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-[1px] border border-white/5",
                    activity.type === 'upload' ? "bg-[var(--color-cyan-dim)] text-[var(--color-cyan)]" : 
                    activity.type === 'task' ? "bg-purple-500/10 text-purple-400" :
                    "bg-[var(--color-green-dim)] text-[var(--color-green)]"
                  )}>
                    {activity.type === 'upload' ? <Upload className="w-3.5 h-3.5" /> : 
                     activity.type === 'task' ? <Zap className="w-3.5 h-3.5" /> :
                     <Plus className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--color-text-main)] leading-relaxed font-bold group-hover:text-[var(--color-cyan)] transition-colors">
                      {activity.author ? <span className="text-faint font-medium">{activity.author} added </span> : null}
                      {activity.detail}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black uppercase text-faint tracking-widest">{activity.title}</span>
                      <span className="w-1 h-1 rounded-full bg-white/10"></span>
                      <span className="text-[10px] font-bold text-faint/60" title={activity.rawDate.toLocaleString()}>{activity.dateStr}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
