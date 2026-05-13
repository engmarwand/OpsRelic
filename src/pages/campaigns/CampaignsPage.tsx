import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../../lib/store';
import { 
  FolderOpen, Plus, Search, ChevronRight, ChevronDown, BarChart2, Bell, ExternalLink, Settings, 
  TrendingUp, Users, Target, Key, Lock, ArrowLeft, Copy, RefreshCw, AlertTriangle, Link2, FileText, Trash2, PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Campaign, CampaignStatus } from '../../types';
import { cn } from '../../lib/utils';
import Chart from 'chart.js/auto';
import { db, auth } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import { collection, addDoc, updateDoc, doc, deleteDoc, query, where, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';

export default function CampaignsPage() {
  const { data, campaignsList, clients, updates, briefs, workspaceFiles, workspace, clipMetrics: globalClipMetrics, activeWorkspaceId } = useAppContext();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  
  const [clipUrl, setClipUrl] = useState('');
  const [isAddingClip, setIsAddingClip] = useState(false);
  const [clipError, setClipError] = useState('');

  const campaignClipMetrics = useMemo(() => {
    if (!selectedCampaign) return [];
    return globalClipMetrics.filter(m => m.campaignId === selectedCampaign.id);
  }, [globalClipMetrics, selectedCampaign]);

  const handlePasteClip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clipUrl || !selectedCampaign) return;
    setIsAddingClip(true);
    setClipError('');
    try {
      // Manual add without scraping - just create the entry
      const clipRef = doc(collection(db, 'clipMetrics'));
      await addDoc(collection(db, 'clipMetrics'), {
        clipLinkId: clipRef.id,
        url: clipUrl,
        campaignId: selectedCampaign.id,
        userId: auth.currentUser?.uid,
        workspaceId: activeWorkspaceId || auth.currentUser?.uid,
        status: 'active',
        views: 0,
        likes: 0,
        comments: 0,
        engagementRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setClipUrl('');
      addToast('Clip added manually. Update metrics via CSV upload.', 'success');
    } catch (err: any) {
      setClipError(err.message);
    } finally {
      setIsAddingClip(false);
    }
  };

  const [isCreating, setIsCreating] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({ name: '', clientId: '', status: 'Active' as CampaignStatus, budget: undefined, cpm: undefined, maxPayout: undefined });

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const forClient = params.get('new_for_client');
    if (forClient && clients.length > 0) {
      const selectedClient = clients.find(c => c.id === forClient);
      setNewCampaign(prev => ({ ...prev, name: '', clientId: forClient, status: 'Active', budget: undefined, cpm: undefined, maxPayout: undefined, revenue: selectedClient?.retainer || undefined }));
      setIsCreating(true);
      window.history.replaceState(null, '', window.location.pathname + '#campaigns');
    } else if (params.get('new') === 'true') {
      setIsCreating(true);
      window.history.replaceState(null, '', window.location.pathname + '#campaigns');
    }
  }, [clients]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.clientId) return;
    try {
      const payload: any = {
        ...newCampaign,
        userId: auth.currentUser?.uid,
        workspaceId: activeWorkspaceId || auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      
      await addDoc(collection(db, 'campaigns'), payload);
      setIsCreating(false);
      setNewCampaign({ name: '', clientId: '', status: 'Active' as CampaignStatus, budget: undefined, cpm: undefined, maxPayout: undefined, revenue: undefined });
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
      // Check for direct ID match
      if (r._campaignId === campaignId || r.Campaign === campaignId) return true;
      
      // Check for name match (case-insensitive) if Campaign is a string name
      const rowCampaign = String(r.Campaign || '').toLowerCase();
      if (rowCampaign === campaignName) return true;
      
      return false;
    });
  }, [selectedCampaign, data]);

  const campaignStats = useMemo(() => {
    if (!selectedCampaign) return { views: 0, likes: 0, assets: 0, payout: 0, csvUrls: new Set<string>() };
    
    const csvUrls = new Set(campaignData.map(r => r["Submission URL"]).filter(Boolean));
    
    let totalViews = 0;
    let totalLikes = 0;
    let totalPayout = 0;

    const cpm = selectedCampaign.cpm || 0;
    const maxPayout = selectedCampaign.maxPayout;
    
    // Process CSV data
    campaignData.forEach(r => {
      const v = r.Views || 0;
      totalViews += v;
      totalLikes += (r.Likes || 0);
      
      let pItem = (v / 1000) * cpm;
      if (maxPayout !== undefined && maxPayout > 0 && pItem > maxPayout) {
        pItem = maxPayout;
      }
      totalPayout += pItem;
    });
    
    // Process standalone clips
    const standaloneClips = campaignClipMetrics.filter(c => !c.url || !csvUrls.has(c.url));
    standaloneClips.forEach(c => {
      const v = c.views || 0;
      totalViews += v;
      totalLikes += (c.likes || 0);
      
      let pItem = (v / 1000) * cpm;
      if (maxPayout !== undefined && maxPayout > 0 && pItem > maxPayout) {
        pItem = maxPayout;
      }
      totalPayout += pItem;
    });
    
    const totalAssets = campaignData.length + standaloneClips.length;
    
    return { views: totalViews, likes: totalLikes, assets: totalAssets, payout: totalPayout, csvUrls };
  }, [campaignData, campaignClipMetrics, selectedCampaign]);

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
        workspaceId: activeWorkspaceId || auth.currentUser?.uid,
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
        revenue: selectedCampaign.revenue || 0,
        budget: selectedCampaign.budget || 0,
        cpm: selectedCampaign.cpm || 0,
        maxPayout: selectedCampaign.maxPayout || undefined,
        startDate: selectedCampaign.startDate || '',
        endDate: selectedCampaign.endDate || ''
      });
    }
  }, [selectedCampaign]);

  const handleUpdateRegistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !localCampaign.name) return;
    try {
      const payload: any = { ...localCampaign, updatedAt: new Date().toISOString() };
      if (payload.maxPayout === undefined) {
        payload.maxPayout = null;
      }
      if (payload.cpm === undefined) {
        payload.cpm = 0;
      }
      await updateDoc(doc(db, 'campaigns', selectedCampaign.id), payload);
      addToast("Campaign settings updated", "success");
      
      const updatedCampaign = { ...selectedCampaign, ...localCampaign };
      if (localCampaign.maxPayout === undefined) {
         delete updatedCampaign.maxPayout;
      }
      setSelectedCampaign(updatedCampaign as Campaign);
    } catch (err) {
      addToast("Settings update failed", "error");
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteCampaign = async (id: string) => {
    // We already confirmed if this is called and confirmDeleteId is null
    setConfirmDeleteId(null);
    setDeletingId(id);
    console.log("Starting deletion for campaign:", id);
    addToast("Deleting campaign and related data...", "info");
    try {
      // 1. Cleanup related data
      const relatedCollections = [
        'campaign_updates',
        'clipMetrics',
        'campaign_briefs',
        'workspaceFiles',
        'submissions'
      ];

      const cleanupPromises = relatedCollections.map(async (colName) => {
        try {
          const q = query(collection(db, colName), where('campaignId', '==', id));
          const snap = await getDocs(q);
          console.log(`[Cleanup] Found ${snap.size} documents in ${colName} for campaignId: ${id}`);
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.docs.forEach(d => {
              console.log(`[Cleanup] Deleting doc: ${d.id} from ${colName}`);
              batch.delete(d.ref);
            });
            await batch.commit();
            console.log(`[Cleanup] Deleted ${snap.size} documents from ${colName}`);
          }
        } catch (e) {
          console.warn(`Cleanup partially failed for ${colName}`, e);
        }
      });

      await Promise.all(cleanupPromises);
      
      // 2. Delete campaign document itself
      await deleteDoc(doc(db, 'campaigns', id));
      console.log("Main campaign document deleted");
      
      addToast("Campaign deleted permanently", "success");
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null);
      }
    } catch (err: any) {
      console.error("Delete campaign failed:", err);
      addToast(`Failed to delete campaign: ${err.message || 'Unknown error'}`, "error");
    } finally {
      setDeletingId(null);
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

  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [refreshingClipId, setRefreshingClipId] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string>('All');
  const [expandedAuthors, setExpandedAuthors] = useState<Set<string>>(new Set());

  const toggleAuthor = (author: string) => {
    const next = new Set(expandedAuthors);
    if (next.has(author)) next.delete(author);
    else next.add(author);
    setExpandedAuthors(next);
  };

  const refreshClip = async (clip: any) => {
    setRefreshingClipId(clip.id);
    try {
      await updateDoc(doc(db, 'clipMetrics', clip.id), {
        updatedAt: new Date().toISOString(),
        status: 'pending'
      });
      addToast("Refresh requested", "success");
    } catch (err) {
      addToast("Refresh failed", "error");
    } finally {
      setRefreshingClipId(null);
    }
  };

  const handleRefreshAll = async () => {
    if (campaignClipMetrics.length === 0) {
      addToast("No clips to refresh", "info");
      return;
    }
    
    setIsRefreshingAll(true);
    try {
      for (const clip of campaignClipMetrics) {
        await updateDoc(doc(db, 'clipMetrics', clip.id), {
          updatedAt: new Date().toISOString(),
          status: 'pending'
        });
      }
      addToast("Batch refresh requested", "success");
    } catch (err) {
      addToast("Batch refresh failed", "error");
    } finally {
      setIsRefreshingAll(false);
    }
  };

  useEffect(() => {
    if (selectedCampaign && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      const viewsByDate: Record<string, number> = {};
      
      const allActivity = [
        ...campaignData.map(r => ({ date: r["Submission Date"], views: r.Views || 0 })),
        ...campaignClipMetrics
          .filter(c => !c.url || !campaignStats.csvUrls.has(c.url))
          .map(c => ({ 
            date: c.createdAt?.toDate ? c.createdAt.toDate().toISOString().split('T')[0] : (c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]), 
            views: c.views || 0 
          }))
      ];

      allActivity.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(item => {
        const d = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        viewsByDate[d] = (viewsByDate[d] || 0) + item.views;
      });

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
  }, [selectedCampaign, campaignData, campaignClipMetrics, campaignStats.csvUrls]);


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
                          <div className="flex items-center justify-end gap-2">
                            {confirmDeleteId === camp.id ? (
                              <div className="flex items-center gap-1 bg-[var(--color-red-dim)] rounded-md p-1 border border-[rgba(255,0,0,0.2)]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCampaign(camp.id);
                                  }}
                                  className="px-2 py-1 text-[10px] font-bold text-[var(--color-red)] hover:bg-red-500/20 rounded transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 text-[10px] font-bold text-muted hover:text-[var(--color-text-main)] transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log("[Campaigns] Confirming delete for ID:", camp.id);
                                  setConfirmDeleteId(camp.id);
                                }}
                                disabled={deletingId === camp.id}
                                className={cn(
                                  "w-8 h-8 rounded-md flex items-center justify-center transition-all active:scale-95",
                                  deletingId === camp.id ? "text-faint bg-[var(--color-surface3)]" : "text-muted hover:bg-red-500/10 hover:text-red-500"
                                )}
                                title="Delete Campaign"
                              >
                                {deletingId === camp.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin pointer-events-none" />
                                ) : (
                                  <Trash2 className="w-4 h-4 pointer-events-none" />
                                )}
                              </button>
                            )}
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[var(--color-surface2)] text-muted hover:bg-[var(--color-cyan-dim)] hover:text-[var(--color-cyan)] transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </div>
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
                     <div className="text-xs text-muted font-medium">{clients.find(c => c.id === selectedCampaign.clientId)?.name || 'Legacy Client'} • {selectedCampaign.status}</div>
                   </div>
                 </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                   onClick={handleRefreshAll}
                   disabled={isRefreshingAll}
                   className="btn btn-primary btn-sm"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isRefreshingAll && "animate-spin")} /> Update All Metrics
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Stats Row */}
              {(() => {
                const totalViews = campaignStats.views;
                const totalLikes = campaignStats.likes;
                const totalAssets = campaignStats.assets;
                const payout = campaignStats.payout;
                const budget = selectedCampaign.budget || 0;
                const budgetPercent = budget > 0 ? (payout / budget) * 100 : 0;

                return (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                       <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
                          <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Views</div>
                          <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)] tabular-nums">{formatViews(totalViews)}</div>
                       </div>
                       <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
                          <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Assets</div>
                          <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)] tabular-nums">{totalAssets}</div>
                       </div>
                       <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
                          <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Likes</div>
                          <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)] tabular-nums">{formatViews(totalLikes)}</div>
                       </div>
                       <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
                          <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Avg. per Clip</div>
                          <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)] tabular-nums">
                            {totalAssets > 0 ? formatViews(Math.round(totalViews / totalAssets)) : '0'}
                          </div>
                       </div>
                    </div>
                    
                    {(budget > 0 || selectedCampaign.cpm) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {selectedCampaign.cpm && (
                            <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                               <div>
                                 <div className="text-[10px] font-bold text-[var(--color-green)] uppercase tracking-widest mb-1">Total Payout Calculated</div>
                                 <div className="font-display text-2xl font-extrabold text-[var(--color-green)] tabular-nums">${payout.toFixed(2)}</div>
                               </div>
                               <div className="text-right">
                                 <div className="text-sm font-semibold text-[var(--color-text-main)]">${selectedCampaign.cpm.toFixed(2)} CPM</div>
                                 <div className="text-[10px] text-muted">Cost per thousand views</div>
                               </div>
                            </div>
                         )}
                         {budget > 0 && (
                            <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
                              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Campaign Budget Tracking</div>
                              <div className="flex items-end justify-between mb-2">
                                <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)] tabular-nums">${payout.toFixed(2)} <span className="text-sm text-muted font-medium ml-1">/ ${budget.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                              </div>
                              <div className="h-2 w-full bg-[var(--color-surface2)] rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all duration-500", budgetPercent > 100 ? "bg-red-500" : budgetPercent > 80 ? "bg-amber-500" : "bg-[var(--color-green)]")} style={{width: `${Math.min(budgetPercent, 100)}%`}}></div>
                              </div>
                            </div>
                         )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Analytics & Assets */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Chart */}
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                    <div className="font-display text-md font-bold text-[var(--color-text-main)] mb-6">Views Over Time</div>
                    {campaignData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-[var(--color-surface2)] rounded-xl border border-[var(--color-border-subtle)]">
                          <BarChart2 className="w-8 h-8 text-faint mb-3" />
                          <div className="text-sm font-semibold text-[var(--color-text-main)]">No Performance Data</div>
                          <div className="text-xs text-muted max-w-xs mx-auto mt-1">Upload a CSV down below or add clip links to start tracking views and engagement here.</div>
                        </div>
                    ) : (
                        <div className="relative h-[240px]">
                          <canvas ref={chartRef}></canvas>
                        </div>
                    )}
                  </div>

                  {/* Assets List */}
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                      <div className="font-display text-md font-bold text-[var(--color-text-main)]">Campaign Content Assets</div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-muted uppercase tracking-widest whitespace-nowrap">Filter Creator:</label>
                        <select 
                          value={selectedAuthor} 
                          onChange={(e) => setSelectedAuthor(e.target.value)}
                          className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)]"
                        >
                          <option value="All">All Creators</option>
                          {Array.from(new Set([
                            ...campaignClipMetrics.map(c => c.author),
                            ...campaignData.map(r => r.Creator)
                          ].filter(Boolean))).sort().map(author => (
                            <option key={author} value={author}>{author}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {campaignStats.assets === 0 ? (
                        <div className="text-sm text-faint py-12 text-center border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-surface2)]/50">
                           <PlayCircle className="w-8 h-8 text-faint mx-auto mb-3 opacity-20" />
                           No content assets tracked yet. Upload a CSV or add clip links.
                        </div>
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
                                  timestamp: r.Timestamp || r.Date
                                } as any);
                              }
                            });

                            let filteredList = displayList;
                            if (selectedAuthor !== 'All') {
                              filteredList = displayList.filter(item => item.author === selectedAuthor);
                            }

                            // Group by author
                            const groups: Record<string, any[]> = {};
                            filteredList.forEach(item => {
                              const author = item.author || 'Unknown';
                              if (!groups[author]) groups[author] = [];
                              groups[author].push(item);
                            });

                            return Object.entries(groups).sort((a, b) => b[1].length - a[1].length).map(([author, clips]) => {
                              const isExpanded = expandedAuthors.has(author);
                              const creatorViews = clips.reduce((sum, c) => sum + (c.views || 0), 0);
                              const creatorPayout = clips.reduce((sum, c) => {
                                let p = ((c.views || 0) / 1000 * (selectedCampaign.cpm || 0));
                                if (selectedCampaign.maxPayout !== undefined && selectedCampaign.maxPayout > 0 && p > selectedCampaign.maxPayout) {
                                  p = selectedCampaign.maxPayout;
                                }
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
                                        <div className="text-[10px] text-muted uppercase tracking-widest font-bold mt-0.5">{clips.length} Clips Contributed</div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                      <div className="text-right hidden sm:block">
                                        <div className="text-[10px] font-bold text-muted uppercase tracking-tighter">Views</div>
                                        <div className="text-sm font-extrabold text-[var(--color-text-main)] tabular-nums">{formatViews(creatorViews)}</div>
                                      </div>
                                      <div className="text-right hidden sm:block">
                                        <div className="text-[10px] font-bold text-muted uppercase tracking-tighter">Earnings</div>
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
                                            <div key={clip.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border-subtle)] gap-4 hover:border-[var(--color-cyan-dim)]/50 transition-all">
                                              <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-12 h-12 rounded-lg bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 text-muted">
                                                  {clip.url ? (
                                                    <a href={clip.url} target="_blank" rel="noreferrer" className="hover:text-[var(--color-cyan)] transition-colors"><ExternalLink className="w-5 h-5" /></a>
                                                  ) : (
                                                    <PlayCircle className="w-6 h-6 opacity-40" />
                                                  )}
                                                </div>
                                                <div className="min-w-0">
                                                  <div className="text-sm font-bold text-[var(--color-text-main)] truncate max-w-full flex items-center gap-2">
                                                    <span className={cn("capitalize truncate", !clip.title && "opacity-60")}>
                                                      {clip.title || 'Untitled Asset'}
                                                    </span>
                                                    {clip.isCSV && <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">CSV</span>}
                                                  </div>
                                                  <div className="text-[10px] text-muted flex items-center gap-x-2 mt-1 font-medium">
                                                    <span className="bg-[var(--color-surface2)] px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">{clip.platform || 'Clip'}</span>
                                                    <span>•</span>
                                                    <span>{clip.timestamp ? new Date(clip.timestamp).toLocaleDateString() : 'Active'}</span>
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-8 shrink-0">
                                                <div className="text-left md:text-right">
                                                  <div className="font-display font-black text-sm tabular-nums text-[var(--color-text-main)]">{formatViews(clip.views)}</div>
                                                  <div className="text-[9px] text-muted font-bold uppercase tracking-widest">Views</div>
                                                </div>
                                                {selectedCampaign.cpm !== undefined && (
                                                  <div className="text-left md:text-right">
                                                    <div className="font-display font-black text-sm tabular-nums text-[var(--color-green)]">
                                                      ${(() => {
                                                        let p = ((clip.views || 0) / 1000 * selectedCampaign.cpm!);
                                                        if (selectedCampaign.maxPayout !== undefined && selectedCampaign.maxPayout > 0 && p > selectedCampaign.maxPayout) {
                                                          p = selectedCampaign.maxPayout;
                                                        }
                                                        return p.toFixed(2);
                                                      })()}
                                                    </div>
                                                    <div className="text-[9px] text-[var(--color-green)] opacity-80 font-bold uppercase tracking-widest">Payout</div>
                                                  </div>
                                                )}
                                                {!clip.isCSV && (
                                                  <button 
                                                    onClick={() => refreshClip(clip)}
                                                    disabled={refreshingClipId === clip.id}
                                                    className="p-2.5 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] text-muted hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan-dim)] transition-all disabled:opacity-50"
                                                  >
                                                    <RefreshCw className={cn("w-4 h-4", refreshingClipId === clip.id && "animate-spin")} />
                                                  </button>
                                                )}
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

                  {/* Workspace Files */}
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="font-display text-md font-bold text-[var(--color-text-main)]">Workspace Files</div>
                      <a href={`#workspace-files`} className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-cyan)] hover:opacity-80 transition-opacity flex items-center gap-1">
                        View all <ChevronRight className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {!workspaceFiles || workspaceFiles.filter(f => f.campaignId === selectedCampaign.id).length === 0 ? (
                        <div className="text-sm text-faint py-4 text-center border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-surface2)] col-span-2">No files attached to this campaign.</div>
                      ) : workspaceFiles.filter(f => f.campaignId === selectedCampaign.id).map(file => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-[var(--color-surface2)] rounded-xl border border-[var(--color-border-subtle)]">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0">
                              {file.type === 'link' ? <Link2 className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-purple-400" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{file.name}</div>
                              <div className="text-[10px] text-[#888] capitalize">{file.type}</div>
                            </div>
                          </div>
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-colors shrink-0">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Sidebar (Info, Log, Portal, Settings) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Campaign Log */}
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-display text-md font-bold text-[var(--color-text-main)]">Campaign Log</div>
                      <Bell className="w-4 h-4 text-muted" />
                    </div>

                    <form onSubmit={handleAddUpdate} className="mb-6">
                      <textarea 
                        required 
                        value={updateContent} 
                        onChange={e => setUpdateContent(e.target.value)} 
                        className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-sm focus:border-[var(--color-cyan)] outline-none min-h-[80px] mb-2 transition-all resize-none" 
                        placeholder="Post a new update..."
                      ></textarea>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-muted hover:text-[var(--color-text-main)]">
                          <input type="checkbox" checked={isPublicUpdate} onChange={e => setIsPublicUpdate(e.target.checked)} className="accent-[var(--color-cyan)] w-3 h-3" />
                          Public
                        </label>
                        <button type="submit" disabled={!updateContent || isSavingUpdate} className="btn btn-primary btn-sm px-3 text-[11px]">Post</button>
                      </div>
                    </form>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                      {campaignUpdates.length === 0 ? (
                        <div className="text-sm text-faint py-4 text-center">No updates found.</div>
                      ) : campaignUpdates.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(u => (
                        <div key={u.id} className="relative pl-4 border-l-2 border-[var(--color-border-subtle)] py-1">
                          <div className={cn("absolute -left-[5px] top-2 w-2 h-2 rounded-full", u.clientVisible ? "bg-[var(--color-green)]" : "bg-muted")}></div>
                          <div className="text-[10px] text-muted font-bold flex items-center justify-between gap-2 mb-1 uppercase tracking-tight">
                            <span>{u.authorName}</span>
                            <span>{new Date(u.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs text-[var(--color-text-main)] leading-relaxed">{u.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Settings / Registry */}
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                    <div className="font-display text-md font-bold text-[var(--color-text-main)] mb-4">Edit Campaign</div>
                    <form onSubmit={handleUpdateRegistry} className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Name</label>
                           <input value={localCampaign.name||''} onChange={e=>setLocalCampaign({...localCampaign, name: e.target.value})} className="input-field py-2 text-xs" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Budget ($)</label>
                           <input type="number" step="0.01" value={localCampaign.budget || ''} onChange={e=>setLocalCampaign({...localCampaign, budget: parseFloat(e.target.value) || 0})} className="input-field py-2 text-xs" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-muted">CPM ($)</label>
                           <input type="number" step="0.01" value={localCampaign.cpm || ''} onChange={e=>setLocalCampaign({...localCampaign, cpm: parseFloat(e.target.value) || 0})} className="input-field py-2 text-xs" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Max Payout ($)</label>
                           <input type="number" step="0.01" value={localCampaign.maxPayout || ''} onChange={e=>setLocalCampaign({...localCampaign, maxPayout: parseFloat(e.target.value) || undefined})} className="input-field py-2 text-xs" placeholder="No limit" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Status</label>
                           <select value={localCampaign.status||'Active'} onChange={e=>setLocalCampaign({...localCampaign, status: e.target.value as CampaignStatus})} className="input-field py-2 text-xs cursor-pointer">
                             <option value="Active">Active</option>
                             <option value="Draft">Draft</option>
                             <option value="Complete">Complete</option>
                           </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="btn btn-primary flex-1 btn-sm">Update Settings</button>
                        {confirmDeleteId === selectedCampaign.id ? (
                          <div className="flex items-center gap-1 bg-[var(--color-red-dim)] rounded-md p-1 border border-[rgba(255,0,0,0.2)]">
                            <button
                              type="button"
                              onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                              className="px-2 py-1 text-xs font-bold text-[var(--color-red)] hover:bg-red-500/20 rounded transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-xs font-bold text-muted hover:text-[var(--color-text-main)] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => setConfirmDeleteId(selectedCampaign.id)}
                            disabled={deletingId === selectedCampaign.id}
                            className={cn(
                              "btn btn-ghost px-3 transition-colors",
                              deletingId === selectedCampaign.id ? "text-faint bg-[var(--color-surface3)]" : "text-red-500 hover:bg-red-500/10"
                            )}
                            title="Delete Campaign"
                          >
                            {deletingId === selectedCampaign.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                      <select required value={newCampaign.clientId} onChange={e => {
                        const clientId = e.target.value;
                        const selectedClient = clients.find(c => c.id === clientId);
                        setNewCampaign({
                          ...newCampaign, 
                          clientId: clientId,
                          revenue: selectedClient?.retainer || undefined
                        });
                      }} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all cursor-pointer">
                        <option value="">Select a Client...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                   </div>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                     <div className="flex flex-col gap-[5px]">
                        <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Budget ($)</label>
                        <input type="number" step="0.01" min="0" value={newCampaign.budget || ''} onChange={e=>setNewCampaign({...newCampaign, budget: parseFloat(e.target.value) || undefined})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" placeholder="e.g. 5000" />
                     </div>
                     <div className="flex flex-col gap-[5px]">
                        <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Cost per 1k Views (CPM) ($)</label>
                        <input type="number" step="0.01" min="0" value={newCampaign.cpm || ''} onChange={e=>setNewCampaign({...newCampaign, cpm: parseFloat(e.target.value) || undefined})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" placeholder="e.g. 2.50" />
                     </div>
                     <div className="flex flex-col gap-[5px] col-span-2">
                        <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Max Payout ($) <span className="opacity-60 normal-case ml-1">- Optional</span></label>
                        <input type="number" step="0.01" min="0" value={newCampaign.maxPayout || ''} onChange={e=>setNewCampaign({...newCampaign, maxPayout: parseFloat(e.target.value) || undefined})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" placeholder="e.g. 1500" />
                     </div>
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
