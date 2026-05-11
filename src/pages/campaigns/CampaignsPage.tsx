import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../../lib/store';
import { 
  FolderOpen, Plus, Search, ChevronRight, BarChart2, Bell, ExternalLink, Settings, 
  TrendingUp, Users, Target, Key, Lock, ArrowLeft, Copy, RefreshCw, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Campaign, CampaignStatus } from '../../types';
import { cn } from '../../lib/utils';
import Chart from 'chart.js/auto';
import { db, auth } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import { collection, addDoc, updateDoc, doc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';

export default function CampaignsPage() {
  const { data, campaignsList, clients, updates, briefs, workspace, clipMetrics: globalClipMetrics } = useAppContext();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  
  const [clipUrl, setClipUrl] = useState('');
  const [isAddingClip, setIsAddingClip] = useState(false);
  const [clipError, setClipError] = useState('');
  const [refreshingClipId, setRefreshingClipId] = useState<string | null>(null);

  const campaignClipMetrics = useMemo(() => {
    if (!selectedCampaign) return [];
    return globalClipMetrics.filter(m => m.campaignId === selectedCampaign.id);
  }, [globalClipMetrics, selectedCampaign]);

  const handlePasteClip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clipUrl) return;
    setIsAddingClip(true);
    setClipError('');
    try {
      const clipLinkId = doc(collection(db, 'clipMetrics')).id;
      const res = await fetch('/api/clip-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipLinkId,
          url: clipUrl,
          campaignId: selectedCampaign?.id,
          userId: auth.currentUser?.uid
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tracking data');
      setClipUrl('');
      addToast('Clip tracked successfully!', 'success');
    } catch (err: any) {
      setClipError(err.message);
    } finally {
      setIsAddingClip(false);
    }
  };

  const refreshClip = async (clip: any) => {
    setRefreshingClipId(clip.id);
    try {
      const res = await fetch('/api/clip-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipLinkId: clip.clipLinkId || clip.id,
          url: clip.url,
          campaignId: selectedCampaign?.id,
          userId: auth.currentUser?.uid
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync');
      addToast('Clip metrics refreshed', 'success');
    } catch (err: any) {
      addToast('Refresh failed: ' + err.message, 'error');
    } finally {
      setRefreshingClipId(null);
    }
  };

  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const handleRefreshAll = async () => {
    if (!selectedCampaign || isRefreshingAll) return;
    
    const urlSet = new Set<string>();
    const clips: any[] = [];
    
    // First grab already tracked clips
    campaignClipMetrics.forEach(c => {
      if (c.url) {
        urlSet.add(c.url);
        clips.push({
          url: c.url,
          campaignId: selectedCampaign.id,
          clipLinkId: c.clipLinkId || c.id
        });
      }
    });
    
    // Then grab untracked URLs from campaignData
    campaignData.forEach(r => {
      let foundUrl = r["Submission URL"];
      
      if (!foundUrl || typeof foundUrl !== 'string' || !foundUrl.startsWith('http')) {
        const keys = Object.keys(r);
        const urlKey = keys.find(key => {
          const k = key.toLowerCase();
          return k.includes('url') || k.includes('link') || k.includes('submission') || k.includes('video');
        });
        if (urlKey && typeof r[urlKey] === 'string' && r[urlKey].startsWith('http')) {
          foundUrl = r[urlKey];
        }
      }
      
      if (foundUrl && typeof foundUrl === 'string' && foundUrl.startsWith('http')) {
        if (!urlSet.has(foundUrl)) {
          urlSet.add(foundUrl);
          clips.push({
            url: foundUrl,
            campaignId: selectedCampaign.id,
            clipLinkId: doc(collection(db, 'clipMetrics')).id
          });
        }
      }
    });

    if (clips.length === 0) {
      if (campaignData.length > 0) {
        console.log('Sample Row Keys:', Object.keys(campaignData[0]));
        addToast(`Found ${campaignData.length} rows, but no columns like "Submission URL" or "Link" contain URLs.`, "info");
      } else {
        addToast("No data rows found for this campaign. Ensure the 'Campaign' column in your CSV matches this campaign's name exactly.", "info");
      }
      return;
    }

    setIsRefreshingAll(true);
    try {
      const res = await fetch('/api/clip-refresh-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clips: clips.slice(0, 50), // Safety limit
          userId: auth.currentUser?.uid
        })
      });
      if (!res.ok) throw new Error('Bulk refresh failed');
      addToast(`${clips.length} clips queued for sync`, 'success');
    } catch (err) {
      addToast('Bulk refresh failed', 'error');
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'updates' | 'portal' | 'settings'>('overview');
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [overviewForm, setOverviewForm] = useState<Partial<Campaign>>({});

  useEffect(() => {
    if (selectedCampaign) {
      setOverviewForm({
        name: selectedCampaign.name,
        status: selectedCampaign.status,
        startDate: selectedCampaign.startDate || '',
        endDate: selectedCampaign.endDate || ''
      });
    }
  }, [selectedCampaign]);

  const handleSaveOverview = async () => {
    if (!selectedCampaign || !overviewForm.name) return;
    try {
      await updateDoc(doc(db, 'campaigns', selectedCampaign.id), {
        ...overviewForm,
        updatedAt: new Date().toISOString()
      });
      addToast("Campaign updated", "success");
      setSelectedCampaign(prev => prev ? { ...prev, ...overviewForm } as Campaign : null);
      setIsEditingOverview(false);
    } catch (err) {
      addToast("Update failed", "error");
    }
  };


  const [isCreating, setIsCreating] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', clientId: '', status: 'Active' as CampaignStatus });

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const forClient = params.get('new_for_client');
    if (forClient) {
      setNewCampaign(prev => ({ ...prev, clientId: forClient }));
      setIsCreating(true);
      window.history.replaceState(null, '', window.location.pathname + '#campaigns');
    } else if (params.get('new') === 'true') {
      setIsCreating(true);
      window.history.replaceState(null, '', window.location.pathname + '#campaigns');
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
        updatedAt: new Date().toISOString()
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
    const campaignId = selectedCampaign.id;
    const campaignName = selectedCampaign.name.toLowerCase();
    
    return data.filter(r => {
      // Check for direct ID match (Campaign column or _campaignId in the mapped store object)
      if (r.Campaign === campaignId || r._campaignId === campaignId) return true;
      
      // Check for name match (case-insensitive)
      const rowCampaign = String(r.Campaign || '').toLowerCase();
      if (rowCampaign === campaignName) return true;
      
      return false;
    });
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
        clientId: selectedCampaign.clientId,
        status: selectedCampaign.status,
        budget: selectedCampaign.budget || 0,
        startDate: selectedCampaign.startDate || '',
        endDate: selectedCampaign.endDate || ''
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

      // Add current live metrics as a "Live" point if any
      const liveViews = campaignClipMetrics.reduce((sum, c) => sum + (c.views || 0), 0);
      if (liveViews > 0) {
        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        viewsByDate[today] = (viewsByDate[today] || 0) + liveViews;
      }

      const labels = Object.keys(viewsByDate);
      const dataPoints = Object.values(viewsByDate);

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
                   <div className="flex justify-between items-center mb-[14px]">
                     <div className="font-display text-md font-bold text-[var(--color-text-main)]">Campaign Details</div>
                     {!isEditingOverview ? (
                       <button onClick={() => setIsEditingOverview(true)} className="btn btn-ghost btn-sm">Edit</button>
                     ) : (
                       <div className="flex gap-2">
                         <button onClick={() => setIsEditingOverview(false)} className="btn btn-ghost btn-sm">Cancel</button>
                         <button onClick={handleSaveOverview} className="btn btn-primary btn-sm">Save</button>
                       </div>
                     )}
                   </div>
                   
                   {isEditingOverview ? (
                     <div className="space-y-4">
                       <div className="flex flex-col gap-[5px]">
                         <label className="text-xs font-bold text-muted uppercase">Campaign Name</label>
                         <input value={overviewForm.name||''} onChange={e=>setOverviewForm({...overviewForm, name: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-2 text-sm text-[var(--color-text-main)] focus:border-[var(--color-cyan)] outline-none" />
                       </div>
                       <div className="flex flex-col gap-[5px]">
                         <label className="text-xs font-bold text-muted uppercase">Status</label>
                         <select value={overviewForm.status||'Active'} onChange={e=>setOverviewForm({...overviewForm, status: e.target.value as CampaignStatus})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-2 text-sm text-[var(--color-text-main)] focus:border-[var(--color-cyan)] outline-none cursor-pointer">
                           <option value="Draft">Draft</option>
                           <option value="Active">Active</option>
                           <option value="Complete">Complete</option>
                         </select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="flex flex-col gap-[5px]">
                           <label className="text-xs font-bold text-muted uppercase">Start Date</label>
                           <input type="date" value={overviewForm.startDate||''} onChange={e=>setOverviewForm({...overviewForm, startDate: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-2 text-sm text-[var(--color-text-main)] focus:border-[var(--color-cyan)] outline-none" />
                         </div>
                         <div className="flex flex-col gap-[5px]">
                           <label className="text-xs font-bold text-muted uppercase">End Date</label>
                           <input type="date" value={overviewForm.endDate||''} onChange={e=>setOverviewForm({...overviewForm, endDate: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-2 text-sm text-[var(--color-text-main)] focus:border-[var(--color-cyan)] outline-none" />
                         </div>
                       </div>
                     </div>
                   ) : (
                     <>
                       <div className="text-sm text-muted mb-4 leading-relaxed">
                         This campaign drives distribution for {clients.find(c=>c.id===selectedCampaign.clientId)?.name||'client'}. Track high-level metrics and delivery targets here.
                       </div>
                       <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-[var(--color-surface2)] rounded-xl p-4 border border-[var(--color-border-subtle)] flex flex-col justify-between">
                             <div className="text-xs font-bold text-muted uppercase tracking-[0.07em] mb-1">Status & Dates</div>
                             <div className="text-sm font-semibold text-[var(--color-text-main)] mb-1">{selectedCampaign.status}</div>
                             {selectedCampaign.startDate && <div className="text-xs text-muted">From: {selectedCampaign.startDate}</div>}
                             {selectedCampaign.endDate && <div className="text-xs text-muted">To: {selectedCampaign.endDate}</div>}
                          </div>
                          <div className="bg-[var(--color-surface2)] rounded-xl p-4 border border-[var(--color-border-subtle)]">
                             <div className="text-xs font-bold text-muted uppercase tracking-[0.07em] mb-1">Total Views</div>
                             <div className="font-display text-xl font-extrabold text-[var(--color-text-main)] tabular-nums">{formatViews(campaignData.reduce((s, r) => s + r.Views, 0) + campaignClipMetrics.reduce((s, c) => s + (c.views || 0), 0))}</div>
                          </div>
                          <div className="bg-[var(--color-surface2)] rounded-xl p-4 border border-[var(--color-border-subtle)] col-span-2">
                             <div className="text-xs font-bold text-muted uppercase tracking-[0.07em] mb-1">Assets & Links</div>
                             <div className="font-display text-xl font-extrabold text-[var(--color-text-main)] tabular-nums">{(() => {
                               const csvUrls = new Set(campaignData.map(r => r["Submission URL"]).filter(Boolean));
                               const standaloneClips = campaignClipMetrics.filter(c => !c.url || !csvUrls.has(c.url)).length;
                               return campaignData.length + standaloneClips;
                             })()}</div>
                          </div>
                       </div>
                     </>
                   )}
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
               <div className="space-y-6">
                 {(() => {
                   const liveViews = campaignClipMetrics.reduce((sum, c) => sum + (c.views || 0), 0);
                   const liveLikes = campaignClipMetrics.reduce((sum, c) => sum + (c.likes || 0), 0);
                   const totalViews = campaignData.reduce((s, r) => s + (r.Views || r.views || 0), 0) + liveViews;
                   const totalLikes = campaignData.reduce((s, r) => s + (r.Likes || r.likes || 0), 0) + liveLikes;
                   
                   const csvUrls = new Set(campaignData.map(r => r["Submission URL"]).filter(Boolean));
                   const standaloneClips = campaignClipMetrics.filter(c => !c.url || !csvUrls.has(c.url)).length;
                   const totalAssets = campaignData.length + standaloneClips;

                   return (
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
                           <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Views</div>
                           <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)] tabular-nums">{formatViews(totalViews)}</div>
                           {liveViews > 0 && <div className="text-[10px] text-[var(--color-cyan)] font-bold mt-1.5 flex items-center gap-1">
                             <TrendingUp className="w-2.5 h-2.5" /> +{formatViews(liveViews)} Live
                           </div>}
                        </div>
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
                           <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Assets</div>
                           <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)] tabular-nums">{totalAssets}</div>
                           {campaignClipMetrics.length > 0 && <div className="text-[10px] text-[var(--color-cyan)] font-bold mt-1.5">{campaignClipMetrics.length} Active Tracks</div>}
                        </div>
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
                           <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Avg. per Clip</div>
                           <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)] tabular-nums">
                             {totalAssets > 0 ? formatViews(Math.round(totalViews / totalAssets)) : '0'}
                           </div>
                        </div>
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
                           <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Likes</div>
                           <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)] tabular-nums">{formatViews(totalLikes)}</div>
                           {liveLikes > 0 && <div className="text-[10px] text-pink-500 font-bold mt-1.5 flex items-center gap-1">
                             <TrendingUp className="w-2.5 h-2.5" /> +{formatViews(liveLikes)} Live
                           </div>}
                        </div>
                     </div>
                   );
                 })()}

                 <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                   <div className="font-display text-md font-bold text-[var(--color-text-main)] mb-6">Views Over Time</div>
                   {campaignData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center bg-[var(--color-surface2)] rounded-xl border border-[var(--color-border-subtle)]">
                        <BarChart2 className="w-8 h-8 text-faint mb-3" />
                        <div className="text-sm font-semibold text-[var(--color-text-main)]">No Performance Data</div>
                        <div className="text-xs text-muted max-w-xs mx-auto mt-1">Upload a CSV down below or add clip links to start tracking views and engagement here.</div>
                      </div>
                   ) : (
                     <div className="relative h-[300px]">
                       <canvas ref={chartRef}></canvas>
                     </div>
                   )}
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                   <div className="flex items-center justify-between mb-6">
                     <div className="font-display text-md font-bold text-[var(--color-text-main)]">Live Clip Performance</div>
                     <button 
                       onClick={handleRefreshAll}
                       disabled={isRefreshingAll}
                       className="btn btn-primary btn-sm gap-2 px-4 shadow-[var(--color-primary-soft)]/20"
                     >
                       <RefreshCw className={cn("w-3.5 h-3.5", (isRefreshingAll || refreshingClipId !== null) && "animate-spin")} />
                       {campaignClipMetrics.length > 0 ? 'Refresh All' : 'Sync CSV Clips'}
                     </button>
                   </div>
                   
                   <form onSubmit={handlePasteClip} className="flex gap-2 mb-6">
                     <input 
                       type="url" 
                       required
                       value={clipUrl}
                       onChange={e => setClipUrl(e.target.value)}
                       placeholder="Paste TikTok, Instagram Reel, or YouTube Shorts URL..." 
                       className="flex-1 bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl px-4 text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all placeholder:text-muted"
                     />
                     <button 
                       type="submit" 
                       disabled={isAddingClip}
                       className="btn btn-primary whitespace-nowrap"
                     >
                       {isAddingClip ? 'Fetching...' : 'Track Clip'}
                     </button>
                   </form>

                   {clipError && (
                     <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold">{clipError}</div>
                   )}

                   <div className="flex flex-col gap-3">
                     {campaignClipMetrics.length === 0 ? (
                       <div className="text-sm text-faint py-4 text-center border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-surface2)]">No tracking active. Click Sync CSV Clips above or paste a link to start tracking.</div>
                     ) : campaignClipMetrics.map(clip => (
                       <div key={clip.id} className="flex items-center justify-between p-4 bg-[var(--color-surface2)] rounded-xl border border-[var(--color-border-subtle)]">
                         <div className="flex items-center gap-4 truncate max-w-[50%]">
                           <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0">
                              <TrendingUp className={cn("w-4 h-4", clip.status === 'pending' ? 'text-amber-500 animate-pulse' : clip.status === 'error' ? 'text-red-500' : 'text-[var(--color-cyan)]')} />
                           </div>
                           <div className="truncate">
                             <div className="text-sm font-bold text-[var(--color-text-main)] flex items-center gap-2">
                               {clip.platform}
                               <a href={clip.url} target="_blank" rel="noreferrer" className="text-[var(--color-cyan)] hover:underline truncate opacity-70 hover:opacity-100 transition-opacity">Link</a>
                                {clip.status === 'pending' && (
                                  <span className="flex items-center gap-1.5 text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 uppercase font-bold ml-1">
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Queued
                                  </span>
                                )}
                                {clip.status === 'error' && (
                                  <span className="flex items-center gap-1.5 text-[9px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20 uppercase font-bold ml-1" title="Private video or unsupported format">
                                    <AlertTriangle className="w-2.5 h-2.5" /> Failed
                                  </span>
                                )}
                             </div>
                             <div className="text-[10px] text-muted flex items-center gap-1.5 mt-0.5">
                               {clip.updatedAt ? `Last Refreshed: ${new Date(clip.updatedAt.toMillis ? clip.updatedAt.toMillis() : clip.updatedAt).toLocaleString()}` : 'Just started'}
                             </div>
                           </div>
                         </div>
                         
                         <div className="flex items-center gap-6">
                           <div className="text-right">
                             <div className="font-display font-bold text-lg tabular-nums text-[var(--color-text-main)]">{formatViews(clip.views)}</div>
                             <div className="text-[10px] text-muted font-bold uppercase tracking-widest">Views</div>
                           </div>
                           <div className="text-right hidden sm:block">
                             <div className="font-display font-bold text-lg tabular-nums text-[var(--color-text-main)]">{formatViews(clip.likes)}</div>
                             <div className="text-[10px] text-muted font-bold uppercase tracking-widest">Likes</div>
                           </div>
                           <div className="text-right hidden md:block">
                             <div className="font-display font-bold text-lg tabular-nums text-[var(--color-text-main)]">{clip.engagementRate ? (clip.engagementRate * 100).toFixed(1) + '%' : '0%'}</div>
                             <div className="text-[10px] text-muted font-bold uppercase tracking-widest">Eng. Rate</div>
                           </div>
                           <button 
                             onClick={() => refreshClip(clip)}
                             disabled={refreshingClipId === clip.id}
                             className="w-10 h-10 rounded-lg hover:bg-[var(--color-surface-hover)] flex items-center justify-center transition-colors text-muted hover:text-[var(--color-text-main)] ml-2 disabled:opacity-50"
                           >
                             <RefreshCw className={cn("w-[18px] h-[18px]", refreshingClipId === clip.id && "animate-spin")} />
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
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
                 <h2 className="font-display text-xl font-extrabold text-[var(--color-text-main)] mb-2">Client Portal</h2>
                 <p className="text-sm text-muted mb-6 max-w-md mx-auto">Share a clean, read-only view of campaign performance and updates with your client. No login required.</p>
                 
                 <div className="flex flex-col gap-3 max-w-md mx-auto mb-6 text-left">
                   <div className="flex items-center justify-between p-4 bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl">
                     <div>
                       <div className="text-sm font-bold text-[var(--color-text-main)]">Enable Portal</div>
                       <div className="text-xs text-muted mt-1">Make the portal access link public</div>
                     </div>
                     <button
                       onClick={async () => {
                         const isEnabling = !selectedCampaign.portalEnabled;
                         const token = selectedCampaign.portalToken || Math.random().toString(36).substring(2, 16) + Date.now().toString(36);
                         await updateDoc(doc(db, 'campaigns', selectedCampaign.id), {
                           portalEnabled: isEnabling,
                           portalToken: token,
                           updatedAt: new Date().toISOString()
                         });
                         setSelectedCampaign(prev => prev ? { ...prev, portalEnabled: isEnabling, portalToken: token } as Campaign : null);
                       }}
                       className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", selectedCampaign.portalEnabled ? "bg-[var(--color-cyan)]" : "bg-[var(--color-surface3)]")}
                     >
                       <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", selectedCampaign.portalEnabled ? "translate-x-6" : "translate-x-1")} />
                     </button>
                   </div>

                   {selectedCampaign.portalEnabled && selectedCampaign.portalToken && (
                     <div className="flex flex-col gap-3 mt-2">
                        <div className="flex flex-col gap-1">
                           <span className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Portal Link</span>
                           <div className="flex items-center gap-2 bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-lg p-2 px-3">
                              <div className="text-xs font-mono text-[var(--color-text-main)] truncate flex-1">https://opsrelic.com/portal/{selectedCampaign.portalToken}</div>
                              <button onClick={() => {
                                 navigator.clipboard.writeText(`https://opsrelic.com/portal/${selectedCampaign.portalToken}`);
                                 addToast("Portal link copied to clipboard", "success");
                              }} className="p-1 hover:bg-[var(--color-surface-hover)] rounded text-muted hover:text-[var(--color-text-main)]"><Copy className="w-[14px] h-[14px]" /></button>
                           </div>
                        </div>
                        <div className="flex flex-col gap-1 mt-2">
                           <span className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Portal Password (Optional)</span>
                           <div className="flex items-center gap-2">
                             <input type="text" placeholder="Leave blank for no password" value={selectedCampaign.portalPassword || ''} onChange={e => setSelectedCampaign(prev => prev ? { ...prev, portalPassword: e.target.value } as Campaign : null)} className="input-field flex-1" />
                             <button onClick={async () => {
                                 await updateDoc(doc(db, 'campaigns', selectedCampaign.id), {
                                    portalPassword: selectedCampaign.portalPassword || '',
                                    updatedAt: new Date().toISOString()
                                 });
                                 addToast("Portal password updated", "success");
                             }} className="btn btn-secondary whitespace-nowrap">Save</button>
                           </div>
                           <div className="text-[10px] text-muted mt-1">If set, clients will need to enter this password to view the portal.</div>
                        </div>
                     </div>
                   )}
                 </div>

                 {selectedCampaign.portalEnabled && selectedCampaign.portalToken && (
                   <button onClick={() => window.open(`https://opsrelic.com/portal/${selectedCampaign.portalToken}`, '_blank')} className="btn btn-primary">Open Preview</button>
                 )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm max-w-2xl">
                 <div className="font-display text-md font-bold text-[var(--color-text-main)] mb-6">Campaign Settings</div>
                 <form onSubmit={handleUpdateRegistry} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-[5px]">
                         <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Campaign Name</label>
                         <input value={localCampaign.name||''} onChange={e=>setLocalCampaign({...localCampaign, name: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" />
                      </div>
                      <div className="flex flex-col gap-[5px]">
                         <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Client</label>
                         <select value={localCampaign.clientId||''} onChange={e=>setLocalCampaign({...localCampaign, clientId: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all cursor-pointer">
                           <option value="">Select a Client...</option>
                           {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-[5px]">
                         <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Start Date</label>
                         <input type="date" value={localCampaign.startDate||''} onChange={e=>setLocalCampaign({...localCampaign, startDate: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" />
                      </div>
                      <div className="flex flex-col gap-[5px]">
                         <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">End Date</label>
                         <input type="date" value={localCampaign.endDate||''} onChange={e=>setLocalCampaign({...localCampaign, endDate: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" />
                      </div>
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
