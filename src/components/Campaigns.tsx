import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../lib/store';
import { formatViews, formatMoney } from '../lib/data';
import { 
  Users, 
  Plus, 
  Search, 
  ChevronRight, 
  Filter, 
  Layout, 
  Settings, 
  FileText, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MoreVertical,
  BarChart2,
  Play,
  CheckCircle,
  TrendingUp,
  Target,
  Zap,
  Trash2,
  Bell,
  LayoutDashboard,
  LineChart as LineChartIcon,
  Wand2,
  DollarSign,
  Link as LinkIcon,
  X,
  Lock,
  Mail,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { auth, db } from '../lib/firebase';
import { writeBatch, query, collection, where, getDocs, deleteDoc, doc, setDoc, onSnapshot, orderBy, updateDoc } from 'firebase/firestore';
import { useToast } from '../lib/toast';
import ClientDashboard from './ClientDashboard';
import { motion, AnimatePresence } from 'motion/react';
import { Campaign, CampaignStatus, ClientAccount, ClientStage } from '../types';
import CampaignIntakeModal from './CampaignIntakeModal';
import ClientDrawer from './ClientDrawer';
import { PageHeader, StatCard } from './ui/Shared';
import { cn } from '../lib/utils';

export default function CampaignWorkspace() {
  const { 
    data, 
    getCampaignName, 
    campaignsList, 
    clients: ctxClients, 
    updates, 
    hasFeature,
    setShowPricing 
  } = useAppContext();
  
  const { addToast } = useToast();
  
  // Navigation State
  const [view, setView] = useState<'operations' | 'pipeline'>('operations');
  
  // Pipeline-specific states
  const [pipelineClients, setPipelineClients] = useState<ClientAccount[]>([]);
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [activeEditingClient, setActiveEditingClient] = useState<ClientAccount | null>(null);
  
  // Operational states
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | 'All'>('All');
  const [activeTab, setActiveTab] = useState<'performance' | 'brief' | 'log' | 'registry'>('performance');
  const [searchTerm, setSearchTerm] = useState('');
  const [showIntake, setShowIntake] = useState(false);
  const [activeIntakeClient, setActiveIntakeClient] = useState<{id: string, name: string, website?: string} | undefined>(undefined);
  const [isIntakeLoading, setIsIntakeLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync Pipeline Data
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'clients'), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setPipelineClients(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClientAccount)));
    });
  }, []);

  // ... (rest remains same but wrapped in view-conditional rendering)

  // Memoized derived data
  const selectedCampaign = useMemo(() => {
    if (selectedCampaignId === 'All') return null;
    return campaignsList.find(c => c.id === selectedCampaignId) || null;
  }, [selectedCampaignId, campaignsList]);

  const campaignsWithData = useMemo(() => {
    const names = Array.from(new Set(data.map(r => r.Campaign))).sort();
    return names.map(name => {
      const camp = campaignsList.find(c => c.name === name);
      return {
        id: camp?.id || name,
        name: name,
        status: camp?.status || 'Active' as CampaignStatus
      };
    });
  }, [data, campaignsList]);

  const filteredCampaigns = useMemo(() => {
    if (!searchTerm) return campaignsWithData;
    return campaignsWithData.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [campaignsWithData, searchTerm]);

  const metrics = useMemo(() => {
    const relevantRows = selectedCampaignId === 'All' 
      ? data 
      : data.filter(r => r.Campaign === selectedCampaign?.name);
    
    const approved = relevantRows.filter(r => r.Status === 'Approved');
    const totalViews = approved.reduce((sum, r) => sum + r.Views, 0);
    const totalPaid = approved.reduce((sum, r) => sum + r["Amount Paid"], 0);
    
    return {
      totalViews,
      totalPaid,
      activeCount: campaignsWithData.length,
      efficiency: "94.2%"
    };
  }, [data, selectedCampaignId, selectedCampaign, campaignsWithData]);

  // Actions
  const handleDelete = async () => {
    if (!selectedCampaign || !auth.currentUser) return;
    if (!confirm(`Are you sure you want to delete ${selectedCampaign.name}? This action is irreversible.`)) return;

    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'campaigns', selectedCampaign.id));
      addToast("Campaign deleted successfully", "success");
      setSelectedCampaignId('All');
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Pipeline Actions
  const handleSubmitClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    
    try {
      if (activeEditingClient) {
        // Edit mode
        await updateDoc(doc(db, 'clients', activeEditingClient.id), {
          name,
          email: formData.get('email') as string,
          website: formData.get('website') as string,
          retainer: Number(formData.get('retainer')) || 0,
          updatedAt: new Date().toISOString(),
        });
        addToast("Client profile updated", "success");
      } else {
        // Add mode
        const clientId = `client_${Date.now()}`;
        const newClient: ClientAccount = {
          id: clientId,
          userId: auth.currentUser.uid,
          name,
          email: formData.get('email') as string,
          website: formData.get('website') as string,
          retainer: Number(formData.get('retainer')) || 0,
          stage: 'Lead',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'clients', clientId), newClient);
        addToast("Client profile registered", "success");
      }
      setIsAddingClient(false);
      setActiveEditingClient(null);
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const updateClientStage = async (id: string, stage: ClientStage) => {
    try {
      await updateDoc(doc(db, 'clients', id), { stage, updatedAt: new Date().toISOString() });
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const STAGES: { id: ClientStage; label: string; icon: any; color: string }[] = [
    { id: 'Lead', label: 'Lead', icon: Users, color: 'text-gray-400' },
    { id: 'Qualified', label: 'Qualified', icon: Search, color: 'text-amber-500' },
    { id: 'Proposal', label: 'Proposal', icon: Mail, color: 'text-purple-500' },
    { id: 'Won/Onboarding', label: 'Onboarding', icon: Play, color: 'text-blue-500' },
    { id: 'Active Client', label: 'Active', icon: CheckCircle2, color: 'text-emerald-500' }
  ];

  return (
    <div className="space-y-12 pb-24">
      <div className="flex items-center gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-2xl w-fit">
        <button 
          onClick={() => setView('operations')}
          className={cn(
            "px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2",
            view === 'operations' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-[#444] hover:text-[#888]"
          )}
        >
          <Zap className="w-3.5 h-3.5" />
          Execution Hub
        </button>
        <button 
          onClick={() => setView('pipeline')}
          className={cn(
            "px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2",
            view === 'pipeline' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-[#444] hover:text-[#888]"
          )}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Growth Engine
        </button>
      </div>

      {view === 'operations' ? (
        <>
          <PageHeader 
            title="Campaigns" 
            description="Monitor and execute active clipping protocols"
            icon={Target}
            badge="Execution Layer"
            actions={
              <button 
                onClick={() => setShowIntake(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-100 transition-all shadow-xl active:scale-95"
              >
                <Plus className="w-4 h-4" />
                New Campaign
              </button>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Live Protocols" value={metrics.activeCount} icon={Play} trend={{ value: "+2", isUp: true }} />
            <StatCard label="Network Reach" value={formatViews(metrics.totalViews)} icon={TrendingUp} />
            <StatCard label="System Payouts" value={formatMoney(metrics.totalPaid)} icon={CheckCircle2} />
            <StatCard label="Operational Health" value={metrics.efficiency} icon={Zap} />
          </div>

          <div className="flex flex-col xl:flex-row gap-8">
            {/* Left: Directory Sidebar */}
            <div className="w-full xl:w-80 shrink-0">
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl sticky top-8">
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
                    <input 
                      type="text" 
                      placeholder="Filter directory..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/30 transition-all font-bold placeholder:text-[#333]"
                    />
                  </div>
                </div>

            <div className="p-3 max-h-[600px] overflow-y-auto no-scrollbar space-y-1">
              <button 
                onClick={() => setSelectedCampaignId('All')}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden",
                  selectedCampaignId === 'All' ? "bg-blue-600/10 text-white" : "text-[#444] hover:bg-white/[0.02] hover:text-[#888]"
                )}
              >
                {selectedCampaignId === 'All' && (
                  <motion.div layoutId="dir-active" className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                )}
                <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-50">Universal</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold tracking-tight">System Global</span>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              {filteredCampaigns.map(camp => (
                <button 
                  key={camp.id}
                  onClick={() => setSelectedCampaignId(camp.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden",
                    selectedCampaignId === camp.id ? "bg-blue-600/10 text-white" : "text-[#444] hover:bg-white/[0.02] hover:text-[#888]"
                  )}
                >
                  {selectedCampaignId === camp.id && (
                    <motion.div layoutId="dir-active" className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-50">{camp.status}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold tracking-tight truncate">{camp.name}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Workspace */}
        <div className="flex-1">
          {selectedCampaignId !== 'All' && selectedCampaign ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Workspace Header */}
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[48px] p-10 lg:p-14 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 border border-white/10">
                        <Target className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Operational Target</span>
                          <span className="text-[10px] font-black text-[#333] uppercase tracking-[0.2em] px-2 py-0.5 border border-white/5 rounded-full">{selectedCampaign.status}</span>
                        </div>
                        <h2 className="text-5xl font-display font-black text-white italic tracking-tighter uppercase leading-none">{selectedCampaign.name}</h2>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pb-1">
                    <button 
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-100 transition-all shadow-xl active:scale-95">
                      Export Report
                    </button>
                  </div>
                </div>

                {/* Local Nav */}
                <div className="flex gap-12 mt-16 border-b border-white/[0.03] overflow-x-auto no-scrollbar">
                  {[
                    { id: 'performance', label: 'Analysis', icon: BarChart2 },
                    { id: 'brief', label: 'Strategy', icon: FileText },
                    { id: 'log', label: 'Updates', icon: Bell },
                    { id: 'registry', label: 'Registry', icon: Settings }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "pb-6 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all relative whitespace-nowrap",
                        activeTab === tab.id ? "text-white" : "text-[#444] hover:text-white"
                      )}
                    >
                      <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-blue-500" : "text-current")} />
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div layoutId="camp-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[500px] animate-in fade-in duration-500">
                {activeTab === 'performance' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-[40px] p-10 space-y-10 group shadow-2xl overflow-hidden relative">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/[0.02] blur-[80px] rounded-full pointer-events-none"></div>
                       <div className="flex items-center justify-between">
                         <h3 className="text-[10px] font-black text-[#444] uppercase tracking-widest italic">Performance Trajectory</h3>
                         <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Real Time</span>
                         </div>
                       </div>
                       
                       <div className="h-[400px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.filter(r => r.Campaign === selectedCampaign.name).slice(-10)}>
                              <defs>
                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="6 6" stroke="#ffffff03" vertical={false} />
                              <XAxis dataKey="Submission Date" stroke="#222" tick={{fontSize: 10, fill: '#333'}} axisLine={false} tickLine={false} />
                              <YAxis stroke="#222" tick={{fontSize: 10, fill: '#333'}} axisLine={false} tickLine={false} tickFormatter={formatViews} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
                                itemStyle={{ color: '#fff', fontSize: '12px' }}
                                cursor={{ stroke: '#3B82F6', strokeWidth: 2 }}
                              />
                              <Area type="monotone" dataKey="Views" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
                            </AreaChart>
                         </ResponsiveContainer>
                       </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] p-10 space-y-10 shadow-2xl flex flex-col items-center justify-center text-center group">
                       <div className="w-20 h-20 bg-white/[0.02] rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          <BarChart2 className="w-10 h-10 text-[#222]" />
                       </div>
                       <div className="space-y-4">
                          <p className="text-[10px] font-black text-[#555] uppercase tracking-[0.4em] max-w-xs leading-relaxed">Detailed network metrics including reach efficiency and contributor ROI.</p>
                          <button className="flex items-center gap-2 mx-auto text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 group/btn">
                             Go to Intelligence Hub
                             <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'brief' && (
                  <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] p-12 lg:p-16 space-y-16 shadow-2xl">
                    <div className="flex items-center justify-between">
                       <div>
                          <h3 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase mb-2">Strategy Protocol</h3>
                          <p className="text-[10px] font-black text-[#444] uppercase tracking-widest leading-none">Last modified {new Date(selectedCampaign.updatedAt).toLocaleDateString()}</p>
                       </div>
                       <button className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                          Edit Framework
                       </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                       <div className="space-y-12">
                          <div className="space-y-4">
                             <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h4 className="text-[10px] font-black text-[#444] uppercase tracking-widest">Global Objective</h4>
                             </div>
                             <p className="text-lg text-white font-medium leading-relaxed italic opacity-80">{selectedCampaign.brief?.objective || 'No objective specified.'}</p>
                          </div>

                          <div className="space-y-4">
                             <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h4 className="text-[10px] font-black text-[#444] uppercase tracking-widest">Creative Angle</h4>
                             </div>
                             <p className="text-sm text-[#888] leading-relaxed">{selectedCampaign.brief?.angle || 'No strategic angle defined.'}</p>
                          </div>
                       </div>

                       <div className="space-y-12">
                          <div className="space-y-4">
                             <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h4 className="text-[10px] font-black text-[#444] uppercase tracking-widest">Operational Summary</h4>
                             </div>
                             <div className="p-8 bg-black/40 border border-white/5 rounded-3xl text-sm text-[#888] leading-relaxed shadow-inner">
                                {selectedCampaign.brief?.summary || 'Protocol awaiting summary generation.'}
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'log' && (
                  <div className="space-y-8">
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] p-10 space-y-10 shadow-2xl">
                       <h3 className="text-[10px] font-black text-[#444] uppercase tracking-widest italic">Protocol Communications</h3>
                       <div className="space-y-6">
                         {updates.filter(u => u.campaignId === selectedCampaign.id).map(update => (
                           <div key={update.id} className="p-8 bg-black/40 border border-white/5 rounded-3xl space-y-4 shadow-inner">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-600/20 rounded-xl flex items-center justify-center text-[10px] font-black text-blue-500">
                                    {update.authorName.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-white">{update.authorName}</p>
                                    <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">{new Date(update.timestamp).toLocaleString()}</p>
                                  </div>
                                </div>
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                  update.clientVisible ? "bg-blue-600/10 text-blue-500 border border-blue-600/20" : "bg-white/5 text-[#444]"
                                )}>
                                  {update.clientVisible ? "Public" : "Internal"}
                                </span>
                              </div>
                              <p className="text-sm text-[#888] leading-relaxed">{update.content}</p>
                           </div>
                         ))}
                         {updates.filter(u => u.campaignId === selectedCampaign.id).length === 0 && (
                           <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/5">
                              <Bell className="w-10 h-10 text-[#151515] mx-auto mb-4" />
                              <p className="text-[10px] font-black text-[#222] uppercase tracking-[0.4em]">No entries in protocol log</p>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'registry' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] p-10 space-y-8 shadow-2xl overflow-hidden relative">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                       <h3 className="text-[10px] font-black text-[#444] uppercase tracking-widest italic relative z-10">Client Association</h3>
                       
                       <div className="space-y-6 relative z-10">
                          <p className="text-[11px] font-black text-[#555] uppercase tracking-widest leading-relaxed">Link this protocol to a client record for unified reporting and portal access.</p>
                          <select className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold">
                             <option value="">No Client Associated</option>
                             {ctxClients?.map((cl: any) => (
                               <option key={cl.id} value={cl.id}>{cl.name}</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] p-10 space-y-8 shadow-2xl overflow-hidden relative">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                       <h3 className="text-[10px] font-black text-[#444] uppercase tracking-widest italic relative z-10">Portal Configuration</h3>
                       
                       <div className="space-y-6 relative z-10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white">Status</span>
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                               <span className="text-[10px] font-black text-[#888] uppercase tracking-widest">Active</span>
                            </div>
                          </div>
                          <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group">
                             <code className="text-[10px] text-blue-500 font-mono tracking-tighter truncate max-w-[200px]">portal/{selectedCampaign.id}</code>
                             <button className="p-2 text-[#444] hover:text-white transition-colors">
                                <Copy className="w-4 h-4" />
                             </button>
                          </div>
                          <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-[#888] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
                             Regenerate Link
                          </button>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-32 space-y-12 bg-[#0A0A0A] border border-white/5 rounded-[64px] relative overflow-hidden group shadow-2xl min-h-[700px]">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
               <div className="relative">
                  <div className="w-40 h-40 bg-white/[0.03] rounded-[48px] flex items-center justify-center mb-10 mx-auto rotate-12 transition-transform group-hover:rotate-0 duration-700 shadow-2xl">
                     <Target className="w-20 h-20 text-[#1A1A1A]" />
                  </div>
                  <h3 className="text-5xl font-display font-black text-white italic tracking-tighter uppercase mb-6 leading-none">Targeting Protocol Offline</h3>
                  <p className="text-[11px] font-black text-[#444] uppercase tracking-[0.5em] max-w-sm mx-auto leading-relaxed">
                     Initialize a campaign from the directory to access operational analysis and strategy execution.
                  </p>
               </div>
               
               <div className="flex gap-4 relative">
                  <div className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl animate-pulse">
                     Waiting for Protocol Input
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

        </>
      ) : (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <PageHeader 
            title="Growth Engine" 
            description="Relationship Architecture & Pipeline Intelligence"
            icon={TrendingUp}
            badge="CRM v3.0"
            actions={
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333] group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    value={pipelineSearch}
                    onChange={e => setPipelineSearch(e.target.value)}
                    placeholder="Search leads..." 
                    className="bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all w-[240px]" 
                  />
                </div>
                <button 
                  onClick={() => { setActiveEditingClient(null); setIsAddingClient(true); }}
                  className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/20"
                >
                   <Plus className="w-5 h-5 text-white" />
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Pipeline Value" value={formatMoney(pipelineClients.reduce((sum, c) => sum + (c.retainer || 0), 0))} icon={DollarSign} trend={{ value: "+15%", isUp: true }} />
            <StatCard label="In Proposal" value={pipelineClients.filter(c => c.stage === 'Proposal').length} icon={Mail} />
            <StatCard label="Conversion Efficiency" value="68.4%" icon={Zap} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 overflow-x-auto no-scrollbar pb-8">
            {STAGES.map(stage => {
              const stageClients = pipelineClients.filter(c => 
                c.stage === stage.id && 
                (c.name.toLowerCase().includes(pipelineSearch.toLowerCase()) || c.email?.toLowerCase().includes(pipelineSearch.toLowerCase()))
              );
              
              return (
                <div key={stage.id} className="space-y-6 min-w-[280px]">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <stage.icon className={cn("w-4 h-4", stage.color)} />
                      <span className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em]">{stage.label}</span>
                    </div>
                    <span className="text-[10px] font-black text-white px-2.5 py-0.5 bg-white/5 rounded-full border border-white/5">{stageClients.length}</span>
                  </div>

                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {stageClients.map(client => (
                        <motion.div 
                          layout
                          key={client.id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => { setActiveEditingClient(client); setIsAddingClient(true); }}
                          className="bg-[#050505] border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all group cursor-pointer relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-950/10"
                        >
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors tracking-tight">{client.name}</h4>
                              <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mt-1">
                                {client.retainer ? formatMoney(client.retainer) : '$0.00'} / Mo
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                               <div className="flex items-center gap-2">
                                  <button onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setActiveIntakeClient({ id: client.id, name: client.name, website: client.website });
                                    setShowIntake(true); 
                                  }} className="w-8 h-8 rounded-lg bg-white/[0.02] flex items-center justify-center text-[#444] hover:bg-blue-600 hover:text-white transition-all">
                                    <Zap className="w-3.5 h-3.5" />
                                  </button>
                                  <button className="w-8 h-8 rounded-lg bg-white/[0.02] flex items-center justify-center text-[#444] hover:text-blue-500 transition-all">
                                    <Mail className="w-3.5 h-3.5" />
                                  </button>
                               </div>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   const next = STAGES[STAGES.findIndex(s => s.id === stage.id) + 1]?.id;
                                   if (next) updateClientStage(client.id, next);
                                 }}
                                 className="w-8 h-8 flex items-center justify-center bg-white/[0.02] hover:bg-white/10 rounded-lg text-[#333] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                               >
                                 <ChevronRight className="w-4 h-4" />
                               </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {stageClients.length === 0 && (
                       <div className="py-20 border-2 border-dashed border-white/[0.02] rounded-[32px] flex flex-col items-center justify-center gap-3 opacity-20">
                          <stage.icon className="w-5 h-5 text-[#333]" />
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#222]">Empty</span>
                       </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shared Modals & Drawers */}
      <AnimatePresence>
        {isAddingClient && (
          <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-[#0A0A0A] border border-white/5 rounded-[56px] p-12 relative shadow-2xl"
            >
              <button onClick={() => { setIsAddingClient(false); setActiveEditingClient(null); }} className="absolute top-10 right-10 text-[#444] hover:text-[#888] transition-colors p-2">
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-5 mb-12">
                <div className="w-14 h-14 rounded-[22px] bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/30">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">New Account</h3>
                  <p className="text-[10px] text-[#555] font-black uppercase tracking-[0.3em] mt-1.5">Lead Generation Entry</p>
                </div>
              </div>

              <form onSubmit={handleSubmitClient} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Legal Brand Name</label>
                  <input name="name" defaultValue={activeEditingClient?.name} required autoFocus placeholder="e.g. Acme Labs" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Business Email</label>
                    <input name="email" defaultValue={activeEditingClient?.email} placeholder="ceo@acme.com" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Proposed Retainer ($)</label>
                    <input name="retainer" defaultValue={activeEditingClient?.retainer} type="number" placeholder="2500" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-3xl uppercase tracking-[0.4em] text-[12px] transition-all shadow-2xl shadow-blue-600/20 active:scale-95">
                  {activeEditingClient ? 'Update Record' : 'Initiate Record'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CampaignIntakeModal 
        isOpen={showIntake} 
        onClose={() => {
          setShowIntake(false);
          setActiveIntakeClient(undefined);
        }}
        isLoading={isIntakeLoading}
        setIsLoading={setIsIntakeLoading}
        clientId={activeIntakeClient?.id}
        clientName={activeIntakeClient?.name}
        clientWebsite={activeIntakeClient?.website}
        onCreated={(cam) => {
          setShowIntake(false);
          setActiveIntakeClient(undefined);
          setView('operations');
          setSelectedCampaignId(cam.id);
        }}
      />
    </div>
  );
}
