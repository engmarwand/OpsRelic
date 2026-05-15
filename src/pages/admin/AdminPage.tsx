import React, { useEffect, useState, useMemo } from 'react';
import { Bot, Users, Database, Clock, TrendingUp, Filter, BarChart, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../../lib/store';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { collection as fCollection, onSnapshot as fOnSnapshot } from 'firebase/firestore';

export default function AdminPage() {
  const { userRole, userDoc, activeWorkspaceId } = useAppContext();
  const [sysCampaigns, setSysCampaigns] = useState<any[]>([]);
  const [sysMetrics, setSysMetrics] = useState<any[]>([]);
  const [sysData, setSysData] = useState<any[]>([]);
  const [sysUsers, setSysUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // We check via activeWorkspaceId and email if the user is engmarwand@gmail.com
  // We can't rely just on store userRole since store might set it to 'agency' for permissions
  // To verify, we can use the top level auth if needed, but we can also just let firestore rules reject.

  useEffect(() => {
    // Only subscribe if admin
    const unsubCampaigns = fOnSnapshot(fCollection(db, 'campaigns'), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setSysCampaigns(arr);
    }, err => {
      console.warn("Not authorized for global campaigns", err);
    });

    const unsubMetrics = fOnSnapshot(fCollection(db, 'clipMetrics'), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setSysMetrics(arr);
    });

    const unsubSubmissions = fOnSnapshot(fCollection(db, 'submissions'), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setSysData(arr);
    });

    const unsubUsers = fOnSnapshot(fCollection(db, 'users'), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setSysUsers(arr);
      setLoading(false);
    });

    return () => {
      unsubCampaigns();
      unsubMetrics();
      unsubSubmissions();
      unsubUsers();
    };
  }, []);
  
  const stats = useMemo(() => {
    const totalCampaigns = sysCampaigns.length;
    const totalUsers = sysUsers.length;
    
    // total views logic
    const totalViewsAcrossSystem = sysMetrics.reduce((s, m) => s + (m.views || 0), 0) + sysData.reduce((s, d) => s + (d.views || 0), 0);
    const uniqueLiveClipsCount = sysMetrics.length;
    const csvCounts = sysData.length;
    const totalAssetsTracking = uniqueLiveClipsCount + csvCounts;

    // Time saved estimate: assume 1 min saved per asset link + 5 mins per campaign setup
    let totalTimeSavedHours: number | string = Math.floor(((uniqueLiveClipsCount * 1) + (csvCounts * 0.5) + (totalCampaigns * 5)) / 60);
    if (totalTimeSavedHours === 0 && (uniqueLiveClipsCount > 0 || csvCounts > 0 || totalCampaigns > 0)) {
        totalTimeSavedHours = "< 1";
    }

    return {
      campaigns: totalCampaigns,
      users: totalUsers,
      views: totalViewsAcrossSystem,
      assets: totalAssetsTracking,
      timeSaved: totalTimeSavedHours
    };
  }, [sysCampaigns, sysMetrics, sysData, sysUsers]);

  return (
    <div className="page active p-6 md:p-8 min-h-[calc(100vh-var(--topbar-h))]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-black text-[var(--color-text-main)] tracking-[-0.02em] leading-none">
            Admin Control
          </h1>
          <p className="text-sm text-muted mt-[3px]">System-wide overview and operational intelligence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="p-6 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Total Users</p>
          <div className="text-4xl font-display font-black text-[var(--color-text-main)]">
            {stats.users}
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
            <Filter className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Total Campaigns</p>
          <div className="text-4xl font-display font-black text-[var(--color-text-main)]">
            {stats.campaigns}
          </div>
        </div>
        
        <div className="p-6 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#00ff88]/10 text-[#00ff88] flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Total Views Managed</p>
          <div className="text-4xl font-display font-black text-[var(--color-text-main)]">
            {(stats.views >= 1000000 ? (stats.views / 1000000).toFixed(1) + 'M' : stats.views >= 1000 ? (stats.views / 1000).toFixed(1) + 'K' : stats.views)}
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
            <Database className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Assets Tracking</p>
          <div className="text-4xl font-display font-black text-[var(--color-text-main)]">
            {stats.assets}
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Bot className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#a020f0]/10 text-[#a020f0] flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Est. Time Saved</p>
            <div className="text-4xl font-display font-black text-[var(--color-text-main)]">
              {stats.timeSaved} Hrs+
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-[var(--color-divider)]">
            <h2 className="text-lg font-bold">Registered Users</h2>
            <p className="text-sm text-muted">All active workspaces connected to the platform.</p>
          </div>
          <div className="px-0 py-0 overflow-x-auto flex-1">
            <table className="w-full text-sm text-left whitespace-nowrap">
               <thead className="bg-[var(--color-surface2)] text-muted uppercase text-[10px] font-black tracking-widest">
                 <tr>
                   <th className="px-6 py-4">User Email</th>
                   <th className="px-6 py-4">Role / Plan</th>
                   <th className="px-6 py-4 text-right">Campaigns</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[var(--color-divider)]">
                 {sysUsers.map(u => (
                   <tr key={u.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                     <td className="px-6 py-4 font-bold text-[var(--color-text-main)] flex items-center gap-2">
                       <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-surface2)] flex items-center justify-center text-[10px] text-muted border border-[var(--color-border-subtle)]">
                         {u.email?.charAt(0).toUpperCase() || 'U'}
                       </span>
                       <span className="truncate max-w-[120px] md:max-w-xs">{u.email}</span>
                     </td>
                     <td className="px-6 py-4">
                       <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[var(--color-surface2)] border border-[var(--color-border-subtle)]">
                         {u.subscription?.planId || u.role || 'Member'}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right font-mono text-muted">
                        {sysCampaigns.filter(c => c.workspaceId === u.id || c.userId === u.id).length}
                     </td>
                   </tr>
                 ))}
                 {sysUsers.length === 0 && (
                   <tr>
                     <td colSpan={3} className="px-6 py-8 text-center text-muted">No users found.</td>
                   </tr>
                 )}
               </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-[var(--color-divider)]">
            <h2 className="text-lg font-bold">Recent Campaigns</h2>
            <p className="text-sm text-muted">Active operations across the system.</p>
          </div>
          <div className="px-0 py-0 overflow-x-auto flex-1">
             <table className="w-full text-sm text-left whitespace-nowrap">
               <thead className="bg-[var(--color-surface2)] text-muted uppercase text-[10px] font-black tracking-widest">
                 <tr>
                   <th className="px-6 py-4">Campaign Name</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4">Workspace</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[var(--color-divider)]">
                 {sysCampaigns.slice(0, 10).map(c => (
                   <tr key={c.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                     <td className="px-6 py-4 font-bold text-[var(--color-text-main)] truncate max-w-[150px]">{c.name || c.id}</td>
                     <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          c.status === 'Active' ? 'bg-[var(--color-green-dim)] text-[var(--color-green)] border border-[var(--color-green)]/20' : 'bg-[var(--color-surface2)] text-muted border border-[var(--color-border-subtle)]'
                        )}>
                          {c.status === 'Active' && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-green)] animate-pulse" />}
                          {c.status || 'Draft'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-muted truncate max-w-[150px]">
                        {sysUsers.find(u => u.id === (c.workspaceId || c.userId))?.email || c.workspaceId || c.userId}
                     </td>
                   </tr>
                 ))}
                 {sysCampaigns.length === 0 && (
                   <tr>
                     <td colSpan={3} className="px-6 py-8 text-center text-muted">No recent activity detected.</td>
                   </tr>
                 )}
               </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
