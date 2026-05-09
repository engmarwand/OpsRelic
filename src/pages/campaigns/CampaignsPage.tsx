import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../../lib/store';
import { 
  FolderOpen, Plus, Search, ChevronRight, BarChart2, Bell, ExternalLink, Settings, 
  TrendingUp, Users, Target, Key, Lock, ArrowLeft, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Campaign, CampaignStatus } from '../../types';
import { cn } from '../../lib/utils';
import Chart from 'chart.js/auto';
import { db, auth } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export default function CampaignsPage() {
  const { data, campaignsList, clients, updates, briefs } = useAppContext();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'updates' | 'portal' | 'settings'>('overview');

  const [isCreating, setIsCreating] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', clientId: '', status: 'Active' as CampaignStatus });

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const forClient = params.get('new_for_client');
    if (forClient) {
      setNewCampaign(prev => ({ ...prev, clientId: forClient }));
      setIsCreating(true);
    }
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.clientId) return;
    try {
      await addDoc(collection(db, 'campaigns'), {
        ...newCampaign,
        userId: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        portalPassword: Math.random().toString(36).substring(2, 10).toUpperCase()
      });
      setIsCreating(false);
      setNewCampaign({ name: '', clientId: '', status: 'Active' });
      addToast("Campaign created successfully", "success");
    } catch (err) {
      console.error("Failed to create campaign", err);
      addToast("Failed to create campaign", "error");
    }
  };

  const filteredCampaigns = useMemo(() => {
    return (campaignsList || []).filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = selectedStatus === 'All' || c.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [campaignsList, searchTerm, selectedStatus]);

  const campaignData = useMemo(() => {
    if (!selectedCampaign) return [];
    return data.filter(r => r.Campaign === selectedCampaign.name || r._campaignId === selectedCampaign.id);
  }, [selectedCampaign, data]);

  const formatViews = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toString();
  };

  const [updateContent, setUpdateContent] = useState('');
  const [isPublicUpdate, setIsPublicUpdate] = useState(true);
  const [isSavingUpdate, setIsSavingUpdate] = useState(false);

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateContent || !selectedCampaign) return;
    setIsSavingUpdate(true);
    try {
      await addDoc(collection(db, 'campaign_updates'), {
        campaignId: selectedCampaign.id,
        authorId: auth.currentUser?.uid,
        authorName: auth.currentUser?.displayName || 'Agency Agent',
        content: updateContent,
        timestamp: new Date().toISOString(),
        clientVisible: isPublicUpdate
      });
      setUpdateContent('');
      addToast("Update added successfully", "success");
    } catch (err) {
      console.error("Update failed", err);
      addToast("Update failed", "error");
    } finally {
      setIsSavingUpdate(false);
    }
  };

  const campaignUpdates = useMemo(() => {
    return (updates || []).filter(u => u.campaignId === selectedCampaign?.id || u.campaignId === 'All');
  }, [updates, selectedCampaign]);

  const [localCampaign, setLocalCampaign] = useState<Partial<Campaign>>({});
  useEffect(() => {
    if (selectedCampaign) {
      setLocalCampaign({
        name: selectedCampaign.name,
        status: selectedCampaign.status,
        budget: selectedCampaign.budget || 0,
        portalPassword: selectedCampaign.portalPassword || ''
      });
    }
  }, [selectedCampaign]);

  const handleUpdateRegistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !localCampaign.name) return;
    try {
      await updateDoc(doc(db, 'campaigns', selectedCampaign.id), {
        ...localCampaign,
        updatedAt: new Date().toISOString()
      });
      addToast("Campaign settings updated", "success");
      setSelectedCampaign(prev => prev ? { ...prev, ...localCampaign } as Campaign : null);
    } catch (err) {
      addToast("Settings update failed", "error");
    }
  };

  const copyPortalLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?portal=${selectedCampaign?.id}`;
    navigator.clipboard.writeText(link);
    addToast("Portal link copied to clipboard", "success");
  };

  const getCampaignColor = (idx: number) => {
    const list = [
      { gradient: 'linear-gradient(135deg, #00d4e8, #007b8a)' },
      { gradient: 'linear-gradient(135deg, #00e5a0, #059669)' },
      { gradient: 'linear-gradient(135deg, #ffd166, #d97706)' },
      { gradient: 'linear-gradient(135deg, #c084fc, #7c3aed)' },
    ];
    return list[idx % list.length];
  };

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (activeTab === 'performance' && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      const viewsByDate: Record<string, number> = {};
      [...campaignData].sort((a,b) => new Date(a["Submission Date"]).getTime() - new Date(b["Submission Date"]).getTime()).forEach(r => {
        const d = new Date(r["Submission Date"]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        viewsByDate[d] = (viewsByDate[d] || 0) + r.Views;
      });

      const labels = Object.keys(viewsByDate);
      const dataPoints = Object.values(viewsByDate);

      if (labels.length === 0) {
        labels.push('Day 1', 'Day 2', 'Day 3');
        dataPoints.push(0, 0, 0);
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, 180);
        g.addColorStop(0, 'rgba(0,212,232,0.3)');
        g.addColorStop(1, 'rgba(0,212,232,0)');
        
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Views',
              data: dataPoints,
              borderColor: '#00d4e8',
              backgroundColor: g,
              borderWidth: 2.5,
              pointRadius: 3,
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
  }, [activeTab, campaignData]);


  return (
    <div className="page active p-6 md:p-8 min-h-[calc(100vh-var(--topbar-h))]">
      <AnimatePresence mode="wait">
        {!selectedCampaign ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="font-display text-xl font-extrabold text-[var(--color-text-main)] tracking-[-0.025em]">Campaigns</h1>
                <p className="text-sm text-muted mt-[3px]">Manage {campaignsList.length} active and past campaigns</p>
              </div>
              <button onClick={() => setIsCreating(true)} className="btn btn-primary">
                <Plus className="w-[13px] h-[13px]" /> New Campaign
              </button>
            </div>

            <div className="flex gap-2 mb-4 items-center flex-wrap">
              <div className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-[8px] flex-1 min-w-[180px] transition-colors focus-within:border-[var(--color-cyan)] focus-within:shadow-[0_0_0_3px_var(--color-cyan-dim)]">
                <Search className="w-[14px] h-[14px] text-faint shrink-0" />
                <input 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  type="text" 
                  placeholder="Search campaigns…" 
                  className="bg-transparent border-none outline-none text-sm w-full text-[var(--color-text-main)] placeholder:text-faint"
                />
              </div>
              <div className="flex bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-lg p-1 overflow-x-auto no-scrollbar shrink-0">
                {['All', 'Active', 'Draft', 'Complete'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setSelectedStatus(s)}
                    className={cn("px-3 py-[6px] text-xs font-semibold rounded-md transition-colors", selectedStatus === s ? "bg-[var(--color-cyan-dim)] text-[var(--color-cyan)]" : "text-muted hover:text-[var(--color-text-main)]")}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface2)] text-left">
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.07em] text-muted">Campaign</th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.07em] text-muted">Client</th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.07em] text-muted">Status</th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.07em] text-muted text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.length === 0 ? (
                    <tr><td colSpan={4} className="py-20 text-center text-muted">No campaigns found.</td></tr>
                  ) : filteredCampaigns.map((camp, idx) => {
                    const client = clients.find(c => c.id === camp.clientId);
                    const style = getCampaignColor(idx);
                    const sb = camp.status === 'Active' ? 'b-active' : camp.status === 'Complete' ? 'b-completed' : 'b-draft';

                    return (
                      <tr key={camp.id} onClick={() => setSelectedCampaign(camp)} className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors duration-150">
                        <td className="px-5 py-[18px]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm" style={{ background: style.gradient }}>
                              <FolderOpen className="w-[18px] h-[18px]" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-[var(--color-text-main)]">{camp.name}</div>
                              <div className="text-xs text-muted mt-[1px]">ID: {camp.id.substring(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-[18px]">
                          <div className="text-sm font-medium text-[var(--color-text-main)]">{client?.name || 'Legacy Client'}</div>
                        </td>
                        <td className="px-5 py-[18px]">
                          <span className={cn("inline-flex items-center gap-[5px] text-xs font-bold px-[9px] py-[3px] rounded-full", sb === 'b-active' && "bg-[var(--color-green-dim)] text-[var(--color-green)] border border-[rgba(0,229,160,0.2)]", sb === 'b-draft' && "bg-[var(--color-surface3)] text-muted border border-[var(--color-border-subtle)]", sb === 'b-completed' && "bg-[var(--color-purple-dim)] text-[var(--color-purple)] border border-[rgba(192,132,252,0.2)]")}>
                             {sb === 'b-active' && <span className="w-[5px] h-[5px] rounded-full bg-current animate-pulse opacity-100" />} {camp.status}
                          </span>
                        </td>
                        <td className="px-5 py-[18px] text-right">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[var(--color-surface2)] text-muted hover:bg-[var(--color-cyan-dim)] hover:text-[var(--color-cyan)] transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-end justify-between border-b border-[var(--color-border-subtle)] pb-4">
              <div className="flex flex-col gap-2">
                 <button className="btn btn-ghost btn-sm self-start px-0" onClick={() => setSelectedCampaign(null)}>
                   <ArrowLeft className="w-[13px] h-[13px]" /> Back to Campaigns
                 </button>
                 <div className="flex items-center gap-3 mt-2">
                   <div className="w-[38px] h-[38px] rounded-xl flex items-center justify-center font-display font-extrabold text-white text-lg shrink-0 shadow-md" style={{ background: 'linear-gradient(135deg, #00d4e8, #007b8a)' }}>
                     <FolderOpen className="w-[18px] h-[18px]" />
                   </div>
                   <div>
                     <h1 className="font-display text-xl font-extrabold text-[var(--color-text-main)] mb-[2px]">{selectedCampaign.name}</h1>
                     <div className="text-xs text-muted">{clients.find(c => c.id === selectedCampaign.clientId)?.name || 'Legacy Client'}</div>
                   </div>
                 </div>
              </div>

              <div className="flex bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-lg p-1 overflow-x-auto no-scrollbar">
                 {[
                    { id: 'overview', label: 'Overview', icon: Target },
                    { id: 'performance', label: 'Performance', icon: BarChart2 },
                    { id: 'updates', label: 'Updates', icon: Bell },
                    { id: 'portal', label: 'Portal', icon: ExternalLink },
                    { id: 'settings', label: 'Settings', icon: Settings }
                 ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn("px-3 py-[6px] text-xs font-semibold rounded-md transition-colors flex items-center gap-[6px]", activeTab === tab.id ? "bg-[var(--color-surface2)] text-[var(--color-text-main)] shadow-sm" : "text-muted hover:text-[var(--color-text-main)]")}
                    >
                      <tab.icon className={cn("w-[14px] h-[14px]", activeTab === tab.id ? "text-[var(--color-cyan)]" : "")} />
                      {tab.label}
                    </button>
                 ))}
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                   <div className="font-display text-md font-bold text-[var(--color-text-main)] mb-[14px]">Campaign Snapshot</div>
                   <div className="text-sm text-muted mb-4 leading-relaxed">
                     This campaign drives distribution for {clients.find(c=>c.id===selectedCampaign.clientId)?.name||'client'}. Track high-level metrics and delivery targets here.
                   </div>
                   <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-[var(--color-surface2)] rounded-xl p-4 border border-[var(--color-border-subtle)]">
                         <div className="text-xs font-bold text-muted uppercase tracking-[0.07em] mb-1">Total Views</div>
                         <div className="font-display text-xl font-extrabold text-[var(--color-text-main)] tabular-nums">{formatViews(campaignData.reduce((s, r) => s + r.Views, 0))}</div>
                      </div>
                      <div className="bg-[var(--color-surface2)] rounded-xl p-4 border border-[var(--color-border-subtle)]">
                         <div className="text-xs font-bold text-muted uppercase tracking-[0.07em] mb-1">Clips</div>
                         <div className="font-display text-xl font-extrabold text-[var(--color-text-main)] tabular-nums">{campaignData.length}</div>
                      </div>
                   </div>
                 </div>

                 <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                   <div className="font-display text-md font-bold text-[var(--color-text-main)] mb-[14px]">Latest Activity</div>
                   <div className="flex flex-col gap-3">
                     {campaignData.length === 0 ? <div className="text-sm text-faint">No clip data uploaded yet.</div> : campaignData.slice(0,3).map((r, i) => (
                       <div key={i} className="flex items-center gap-3 p-3 bg-[var(--color-surface2)] rounded-xl border border-[var(--color-border-subtle)]">
                          <div className="w-[30px] h-[30px] rounded-lg bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] flex items-center justify-center shrink-0">
                            <TrendingUp className="w-[14px] h-[14px]" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold">{r["Content Title"] || 'New Upload'}</div>
                            <div className="text-xs text-muted">{new Date(r["Submission Date"] || r.createdAt || new Date()).toLocaleDateString()}</div>
                          </div>
                          <div className="text-right">
                             <div className="text-sm font-bold tabular-nums">{formatViews(r.Views)}</div>
                             <div className="text-[10px] text-muted uppercase tracking-[0.07em] font-bold">Views</div>
                          </div>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                 <div className="font-display text-md font-bold text-[var(--color-text-main)] mb-6">Views Over Time</div>
                 <div className="relative h-[300px]">
                   <canvas ref={chartRef}></canvas>
                 </div>
              </div>
            )}

            {activeTab === 'updates' && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
                 <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                   <div className="font-display text-md font-bold text-[var(--color-text-main)] mb-6">Campaign Log</div>
                   <div className="flex flex-col gap-4">
                     {campaignUpdates.length === 0 ? <div className="text-sm text-faint py-4">No updates added yet.</div> : campaignUpdates.map(u => (
                       <div key={u.id} className="flex gap-4 p-4 bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] flex items-center justify-center shrink-0 mt-[2px]">
                            <Bell className="w-[14px] h-[14px]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold">{u.authorName || 'Agent'}</span>
                              <span className="text-xs text-muted">{new Date(u.timestamp).toLocaleString()}</span>
                              {u.clientVisible && <span className="text-[10px] bg-[var(--color-green-dim)] text-[var(--color-green)] px-2 py-[2px] rounded-full font-bold">Public</span>}
                            </div>
                            <div className="text-sm text-[var(--color-text-main)] leading-relaxed">{u.content}</div>
                          </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 <form onSubmit={handleAddUpdate} className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm h-fit">
                   <div className="font-display text-md font-bold text-[var(--color-text-main)] mb-4">Post Update</div>
                   <textarea required value={updateContent} onChange={e => setUpdateContent(e.target.value)} className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-sm focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] outline-none min-h-[100px] mb-3 transition-all" placeholder="Write a note or update..."></textarea>
                   <label className="flex items-center gap-2 mb-4 cursor-pointer text-sm select-none hover:text-[var(--color-text-main)] text-muted transition-colors">
                     <input type="checkbox" checked={isPublicUpdate} onChange={e => setIsPublicUpdate(e.target.checked)} className="accent-[var(--color-cyan)]" />
                     Show in client portal
                   </label>
                   <button type="submit" disabled={!updateContent || isSavingUpdate} className="btn btn-primary w-full justify-center">Post to Log</button>
                 </form>
              </div>
            )}

            {activeTab === 'portal' && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-8 shadow-sm max-w-2xl mx-auto text-center">
                 <div className="w-16 h-16 rounded-2xl bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] flex items-center justify-center mx-auto mb-4 border border-[rgba(0,212,232,0.2)] shadow-md">
                   <ExternalLink className="w-7 h-7" />
                 </div>
                 <h2 className="font-display text-xl font-extrabold text-[var(--color-text-main)] mb-2">Client Portal Active</h2>
                 <p className="text-sm text-muted mb-6 max-w-md mx-auto">Share this link with your client. They will be able to see performance stats and public updates using their secure password.</p>
                 
                 <div className="flex flex-col gap-3 max-w-sm mx-auto mb-6 text-left">
                   <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Portal Link</span>
                      <div className="flex items-center gap-2 bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-lg p-2 px-3">
                         <div className="text-xs font-mono text-[var(--color-text-main)] truncate flex-1">{window.location.origin}?portal={selectedCampaign.id}</div>
                         <button onClick={copyPortalLink} className="p-1 hover:bg-[var(--color-surface-hover)] rounded text-muted hover:text-[var(--color-text-main)]"><Copy className="w-[14px] h-[14px]" /></button>
                      </div>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Access Password</span>
                      <div className="flex items-center gap-2 bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-lg p-2 px-3">
                         <Key className="w-[14px] h-[14px] text-muted shrink-0" />
                         <div className="text-xs font-mono font-bold tracking-widest text-[var(--color-text-main)] truncate flex-1">{selectedCampaign.portalPassword || 'Not Set'}</div>
                      </div>
                   </div>
                 </div>

                 <button onClick={() => window.open(`${window.location.origin}?portal=${selectedCampaign.id}`, '_blank')} className="btn btn-primary">Open Preview Panel</button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm max-w-2xl">
                 <div className="font-display text-md font-bold text-[var(--color-text-main)] mb-6">Campaign Settings</div>
                 <form onSubmit={handleUpdateRegistry} className="space-y-4">
                    <div className="flex flex-col gap-[5px]">
                       <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Campaign Name</label>
                       <input value={localCampaign.name||''} onChange={e=>setLocalCampaign({...localCampaign, name: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-[5px]">
                         <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Status</label>
                         <select value={localCampaign.status||'Active'} onChange={e=>setLocalCampaign({...localCampaign, status: e.target.value as CampaignStatus})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all cursor-pointer">
                           <option value="Active">Active</option>
                           <option value="Draft">Draft</option>
                           <option value="Complete">Complete</option>
                         </select>
                      </div>
                      <div className="flex flex-col gap-[5px]">
                         <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Portal Password</label>
                         <div className="relative">
                           <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                           <input value={localCampaign.portalPassword||''} onChange={e=>setLocalCampaign({...localCampaign, portalPassword: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md pl-9 pr-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all w-full font-mono uppercase" />
                         </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                       <button type="submit" disabled={!localCampaign.name} className="btn btn-primary">Save Settings</button>
                    </div>
                 </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Campaign Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[8px]">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-2xl w-full max-w-[500px] shadow-lg shadow-glow">
               <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)]">
                 <div className="font-display text-md font-bold text-[var(--color-text-main)]">New Campaign</div>
                 <button onClick={() => setIsCreating(false)} className="w-[28px] h-[28px] rounded-md flex items-center justify-center text-muted hover:bg-[var(--color-surface-hover)] hover:text-white transition-all">&times;</button>
               </div>
               <form onSubmit={handleCreateCampaign}>
                 <div className="p-5 px-6 space-y-4">
                   <div className="flex flex-col gap-[5px]">
                      <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Campaign Name</label>
                      <input required value={newCampaign.name} onChange={e=>setNewCampaign({...newCampaign, name: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" placeholder="e.g. Q3 Push" />
                   </div>
                   <div className="flex flex-col gap-[5px]">
                      <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Client</label>
                      <select required value={newCampaign.clientId} onChange={e=>setNewCampaign({...newCampaign, clientId: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all cursor-pointer">
                        <option value="">Select a Client...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                   </div>
                 </div>
                 <div className="flex justify-end gap-2 p-4 px-6 border-t border-[var(--color-border-subtle)]">
                   <button type="button" onClick={() => setIsCreating(false)} className="btn btn-ghost">Cancel</button>
                   <button type="submit" disabled={!newCampaign.name||!newCampaign.clientId} className="btn btn-primary">Create Campaign</button>
                 </div>
               </form>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
