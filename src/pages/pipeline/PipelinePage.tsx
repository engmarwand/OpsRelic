import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Plus, ArrowLeft, Mail, Phone, User, Briefcase, Plus as PlusIcon, X } from 'lucide-react';
import { ClientAccount } from '../../types';
import { useToast } from '../../lib/toast';
import { collection, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export default function ClientsPage() {
  const { addToast } = useToast();
  const { campaignsList, clients, data } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientAccount | null>(null);
  const [editingClientData, setEditingClientData] = useState<Partial<ClientAccount>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    if (params.get('new') === 'true') {
      setIsAddingClient(true);
      // Clean up the URL
      window.history.replaceState(null, '', window.location.pathname + '#clients');
    }
  }, []);

  const filteredClients = useMemo(() => {
    return (clients || []).filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    const formData = new FormData(e.currentTarget);
    
    try {
      const newClient = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        website: formData.get('website') as string, // using as company mapping
        retainer: Number(formData.get('retainer')) || 0,
        stage: 'Active',
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'clients'), newClient);
      addToast("Client created successfully", "success");
      setIsAddingClient(false);
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const handleEditClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      await setDoc(doc(db, 'clients', selectedClient.id), {
        ...selectedClient,
        ...editingClientData,
        updatedAt: new Date().toISOString()
      });
      addToast("Client updated successfully", "success");
      setIsEditingClient(false);
      setSelectedClient({ ...selectedClient, ...editingClientData } as ClientAccount);
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedClient.name}? This will also delete all associated campaigns.`)) return;
    try {
      await deleteDoc(doc(db, 'clients', selectedClient.id));
      // Delete associated campaigns
      for (const campaign of selectedClientCampaigns) {
        await deleteDoc(doc(db, 'campaigns', campaign.id));
      }
      addToast("Client deleted successfully", "success");
      setSelectedClient(null);
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const selectedClientCampaigns = useMemo(() => {
    if (!selectedClient) return [];
    return (campaignsList || []).filter(c => c.clientId === selectedClient.id);
  }, [selectedClient, campaignsList]);

  const getClientColor = (idx: number) => {
    const list = [
      { gradient: 'linear-gradient(135deg, #00e5a0, #059669)', glow: 'var(--color-green)' },
      { gradient: 'linear-gradient(135deg, #ffd166, #d97706)', glow: 'var(--color-yellow)' },
      { gradient: 'linear-gradient(135deg, #60a5fa, #2563eb)', glow: 'var(--color-blue)' },
      { gradient: 'linear-gradient(135deg, #c084fc, #7c3aed)', glow: 'var(--color-purple)' },
      { gradient: 'linear-gradient(135deg, #00d4e8, #007b8a)', glow: 'var(--color-cyan)' },
    ];
    return list[idx % list.length];
  };

  const getCampaignStats = (campaigns: any[]) => {
    let totalViews = 0;
    let totalClips = 0;
    campaigns.forEach(camp => {
      const campData = data.filter(d => d._campaignId === camp.id);
      totalViews += campData.reduce((s, r) => s + (r.Views || 0), 0);
      totalClips += campData.length;
    });
    return { views: totalViews, clips: totalClips };
  };

  const formatViews = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toString();
  };

  return (
    <div className="page active p-6 md:p-8 min-h-[calc(100vh-var(--topbar-h))]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[var(--color-text-main)] tracking-[-0.025em]">Clients</h1>
          <p className="text-sm text-muted mt-[3px]">{clients.length} clients · {campaignsList.length} campaigns total</p>
        </div>
        <button onClick={() => setIsAddingClient(true)} className="btn btn-primary">
          <Plus className="w-[13px] h-[13px]" /> New Client
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!selectedClient ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex gap-2 mb-4 items-center flex-wrap">
              <div className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-[8px] flex-1 min-w-[180px] transition-colors focus-within:border-[var(--color-cyan)] focus-within:shadow-[0_0_0_3px_var(--color-cyan-dim)]">
                <Search className="w-[14px] h-[14px] text-faint shrink-0" />
                <input 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  type="text" 
                  placeholder="Search clients…" 
                  className="bg-transparent border-none outline-none text-sm w-full text-[var(--color-text-main)] placeholder:text-faint"
                />
              </div>
            </div>

            {filteredClients.length === 0 ? (
               <div className="text-center py-20 text-muted col-span-2">No active clients found.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredClients.map((client, idx) => {
                  const style = getClientColor(idx);
                  const clientCampaigns = campaignsList.filter(c => c.clientId === client.id);
                  const stats = getCampaignStats(clientCampaigns);
                  
                  return (
                    <div key={client.id} className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm transition-all duration-200 cursor-pointer relative overflow-hidden hover:-translate-y-[2px] hover:shadow-md hover:border-strong" onClick={() => setSelectedClient(client)}>
                      <div className="absolute -top-[30px] -right-[30px] w-[100px] h-[100px] rounded-full opacity-[0.07] blur-[30px] pointer-events-none" style={{ background: style.glow }}></div>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-extrabold text-white text-sm shrink-0" style={{ background: style.gradient }}>
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-display text-md font-bold text-[var(--color-text-main)]">{client.name}</div>
                          <div className="text-xs text-muted">{client.website || 'Company Ltd'}</div>
                        </div>
                        <span className="inline-flex items-center gap-[5px] text-xs font-bold px-[9px] py-[3px] rounded-full bg-[var(--color-green-dim)] text-[var(--color-green)] border border-[rgba(0,229,160,0.2)]">
                          <span className="w-[5px] h-[5px] rounded-full bg-current animate-pulse opacity-100" /> Active
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-[var(--color-surface2)] rounded-[10px] p-[10px] text-center">
                           <div className="text-xs text-muted">Campaigns</div>
                           <div className="font-bold font-display">{clientCampaigns.length}</div>
                        </div>
                        <div className="bg-[var(--color-surface2)] rounded-[10px] p-[10px] text-center">
                           <div className="text-xs text-muted">Total Views</div>
                           <div className="font-bold font-display">{formatViews(stats.views)}</div>
                        </div>
                        <div className="bg-[var(--color-surface2)] rounded-[10px] p-[10px] text-center">
                           <div className="text-xs text-muted">Clips</div>
                           <div className="font-bold font-display">{stats.clips}</div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted">
                        {client.email || 'No email provided'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="btn btn-ghost btn-sm mb-4" onClick={() => setSelectedClient(null)}>
              <ArrowLeft className="w-[13px] h-[13px]" /> All Clients
            </button>
            
            <div className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-2xl p-6 mb-4 flex items-center gap-5 relative overflow-hidden shadow-sm">
               <div className="w-16 h-16 rounded-xl flex items-center justify-center font-display font-extrabold text-white text-lg shrink-0 z-10 shadow-md" style={{ background: getClientColor(clients.findIndex(c => c.id === selectedClient.id)).gradient }}>
                  {selectedClient.name.substring(0, 2).toUpperCase()}
               </div>
               <div className="z-10 relative flex-1">
                 <div className="font-display text-xl font-extrabold text-[var(--color-text-main)] mb-1">{selectedClient.name}</div>
                 <div className="text-sm text-muted">{selectedClient.website || 'Company Profile'}</div>
                 <div className="flex gap-2 mt-2">
                   <span className="inline-flex items-center gap-[5px] text-xs font-bold px-[9px] py-[3px] rounded-full bg-[var(--color-green-dim)] text-[var(--color-green)] border border-[rgba(0,229,160,0.2)]">
                     <span className="w-[5px] h-[5px] rounded-full bg-current animate-pulse opacity-100" /> Active
                   </span>
                   <span className="inline-flex items-center gap-[5px] text-xs font-bold px-[9px] py-[3px] rounded-full bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] border border-[rgba(0,212,232,0.2)]">
                     {selectedClientCampaigns.length} campaigns
                   </span>
                 </div>
               </div>
               <div className="z-10 flex gap-2">
                 <button onClick={() => {
                   setEditingClientData({ ...selectedClient });
                   setIsEditingClient(true);
                 }} className="btn btn-ghost btn-sm bg-[var(--color-surface2)] hover:bg-[var(--color-surface-hover)]">Edit</button>
                 <button onClick={handleDeleteClient} className="btn btn-ghost btn-sm text-[var(--color-red)] bg-[var(--color-red-dim)] hover:bg-[rgba(255,0,0,0.1)] border border-transparent hover:border-[rgba(255,0,0,0.2)]">Delete</button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="font-display text-md font-bold text-[var(--color-text-main)]">Contact Info</div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                     <User className="w-[14px] h-[14px] text-[var(--color-cyan)]" />
                     <div>
                       <div className="text-xs text-muted">Client Contact</div>
                       <div className="text-sm font-semibold">{selectedClient.name}</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Mail className="w-[14px] h-[14px] text-[var(--color-cyan)]" />
                     <div>
                       <div className="text-xs text-muted">Email</div>
                       <div className="text-sm font-semibold">{selectedClient.email || 'N/A'}</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Briefcase className="w-[14px] h-[14px] text-[var(--color-cyan)]" />
                     <div>
                       <div className="text-xs text-muted">Organization</div>
                       <div className="text-sm font-semibold">{selectedClient.website || 'N/A'}</div>
                     </div>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="font-display text-md font-bold text-[var(--color-text-main)]">Campaigns</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => window.location.hash = `#campaigns?new_for_client=${selectedClient.id}`}>
                    <PlusIcon className="w-[11px] h-[11px]" /> New
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {selectedClientCampaigns.length === 0 ? <div className="text-center text-sm text-faint py-4">No campaigns found.</div> : selectedClientCampaigns.map(camp => {
                    const sb = camp.status === 'Active' ? 'b-active' : camp.status === 'Completed' ? 'b-completed' : 'b-draft';
                    return (
                      <div key={camp.id} onClick={() => window.location.hash = '#campaigns'} className="flex items-center justify-between p-[10px] rounded-[10px] cursor-pointer transition-colors duration-150 hover:bg-[var(--color-surface-hover)]">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-[var(--color-text-main)]">{camp.name}</div>
                          <div className="text-xs text-muted">{new Date(camp.createdAt).toLocaleDateString()}</div>
                        </div>
                        <span className={cn("inline-flex items-center gap-[5px] text-xs font-bold px-[9px] py-[3px] rounded-full", sb === 'b-active' && "bg-[var(--color-green-dim)] text-[var(--color-green)] border border-[rgba(0,229,160,0.2)]", sb === 'b-draft' && "bg-[var(--color-surface3)] text-muted border border-[var(--color-border-subtle)]", sb === 'b-completed' && "bg-[var(--color-purple-dim)] text-[var(--color-purple)] border border-[rgba(192,132,252,0.2)]")}>
                          {sb === 'b-active' && <span className="w-[5px] h-[5px] rounded-full bg-current animate-pulse opacity-100" />} {camp.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingClient && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[8px]">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-2xl w-full max-w-[500px] shadow-lg shadow-glow">
               <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)]">
                 <div className="font-display text-md font-bold text-[var(--color-text-main)]">New Client</div>
                 <button onClick={() => setIsAddingClient(false)} className="w-[28px] h-[28px] rounded-md flex items-center justify-center text-muted hover:bg-[var(--color-surface-hover)] hover:text-white transition-all">&times;</button>
               </div>
               <form onSubmit={handleAddClient}>
                 <div className="p-5 px-6 space-y-4">
                   <div className="flex flex-col gap-[5px]">
                      <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Client Name</label>
                      <input name="name" required className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" placeholder="e.g. BrightFeed" />
                   </div>
                   <div className="flex flex-col gap-[5px]">
                      <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Company</label>
                      <input name="website" className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" placeholder="e.g. BrightFeed Media Ltd" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-[5px]">
                        <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Contact Email</label>
                        <input name="email" type="email" className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" placeholder="hello@brightfeed.io" />
                     </div>
                     <div className="flex flex-col gap-[5px]">
                        <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Retainer</label>
                        <input name="retainer" type="number" className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" placeholder="0" />
                     </div>
                   </div>
                 </div>
                 <div className="flex justify-end gap-2 p-4 px-6 border-t border-[var(--color-border-subtle)]">
                   <button type="button" onClick={() => setIsAddingClient(false)} className="btn btn-ghost">Cancel</button>
                   <button type="submit" className="btn btn-primary">Create Client</button>
                 </div>
               </form>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isEditingClient && selectedClient && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[8px]">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-2xl w-full max-w-[500px] shadow-lg shadow-glow">
               <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)]">
                 <div className="font-display text-md font-bold text-[var(--color-text-main)]">Edit Client</div>
                 <button onClick={() => setIsEditingClient(false)} className="w-[28px] h-[28px] rounded-md flex items-center justify-center text-muted hover:bg-[var(--color-surface-hover)] hover:text-white transition-all">&times;</button>
               </div>
               <form onSubmit={handleEditClient}>
                 <div className="p-5 px-6 space-y-4">
                   <div className="flex flex-col gap-[5px]">
                      <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Client Name</label>
                      <input name="name" required value={editingClientData.name || ''} onChange={e => setEditingClientData({...editingClientData, name: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" />
                   </div>
                   <div className="flex flex-col gap-[5px]">
                      <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Company</label>
                      <input name="website" value={editingClientData.website || ''} onChange={e => setEditingClientData({...editingClientData, website: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-[5px]">
                        <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Contact Email</label>
                        <input name="email" type="email" value={editingClientData.email || ''} onChange={e => setEditingClientData({...editingClientData, email: e.target.value})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" />
                     </div>
                     <div className="flex flex-col gap-[5px]">
                        <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Retainer</label>
                        <input name="retainer" type="number" value={editingClientData.retainer || ''} onChange={e => setEditingClientData({...editingClientData, retainer: Number(e.target.value)})} className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all" />
                     </div>
                   </div>
                 </div>
                 <div className="flex justify-end gap-2 p-4 px-6 border-t border-[var(--color-border-subtle)]">
                   <button type="button" onClick={() => setIsEditingClient(false)} className="btn btn-ghost">Cancel</button>
                   <button type="submit" className="btn btn-primary">Save Changes</button>
                 </div>
               </form>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
