import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Send, 
  FileCheck, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  Search,
  MoreVertical,
  Mail,
  Plus,
  BarChart2,
  Calendar,
  Globe,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { ClientAccount, ClientStage, Campaign } from '../types';
import { useToast } from '../lib/toast';
import { doc, updateDoc, deleteDoc, collection, query, where, onSnapshot, setDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import ClientDrawer from './ClientDrawer';
import CampaignIntakeModal from './CampaignIntakeModal';

const STAGES: { id: ClientStage; label: string; icon: any; color: string }[] = [
  { id: 'Lead', label: 'Lead', icon: Users, color: 'text-gray-400' },
  { id: 'Qualified', label: 'Qualified', icon: Search, color: 'text-amber-500' },
  { id: 'Proposal', label: 'Proposal', icon: Mail, color: 'text-purple-500' },
  { id: 'Won/Onboarding', label: 'Onboarding', icon: Play, color: 'text-blue-500' },
  { id: 'Active Client', label: 'Active', icon: CheckCircle2, color: 'text-emerald-500' }
];

import { PageHeader, StatCard } from './ui/Shared';

export default function Pipeline() {
  const { addToast } = useToast();
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientAccount | null>(null);
  
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeContext, setIntakeContext] = useState<ClientAccount | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'clients'), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClientAccount)));
    });
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    
    try {
      const clientId = `client_${Date.now()}`;
      const newClient: ClientAccount = {
        id: clientId,
        userId: auth.currentUser.uid,
        name,
        email: formData.get('email') as string,
        website: formData.get('website') as string,
        retainer: Number(formData.get('retainer')) || 0,
        billingCycle: 'Monthly',
        stage: 'Lead',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'clients', clientId), newClient);
      addToast("Client profile created", "success");
      setIsAddingClient(false);
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const updateStage = async (id: string, stage: ClientStage) => {
    try {
      await updateDoc(doc(db, 'clients', id), { stage, updatedAt: new Date().toISOString() });
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const openIntakeFromClient = (client: ClientAccount) => {
    setIntakeContext(client);
    setShowIntakeModal(true);
  };

  const stats = {
    totalValue: clients.reduce((sum, c) => sum + (c.retainer || 0), 0),
    activeDeals: clients.filter(c => ['Proposal', 'Won/Onboarding'].includes(c.stage)).length,
    newLeads: clients.filter(c => c.stage === 'Lead').length
  };

  return (
    <div className="space-y-12 pb-20">
      <PageHeader 
        title="Growth Pipeline" 
        description="Relationship Engine & Client Onboarding"
        icon={TrendingUp}
        badge="CRM v2.4"
        actions={
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333] group-focus-within:text-blue-500 transition-colors" />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search database..." 
                className="bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all w-[240px]" 
              />
            </div>
            <button 
              onClick={() => setIsAddingClient(true)}
              className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/20"
            >
               <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Pipeline Value" value={`$${stats.totalValue.toLocaleString()}`} icon={DollarSign} trend={{ value: "+12%", isUp: true }} />
        <StatCard label="In Discussion" value={stats.activeDeals} icon={Mail} />
        <StatCard label="Fresh Leads" value={stats.newLeads} icon={Users} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {clients.length === 0 && !isAddingClient ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-[40px] bg-blue-600/5 border border-blue-500/10 flex items-center justify-center mb-8 relative group">
               <Users className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform" />
               <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-4 border-[#050505]">
                 <Plus className="w-3 h-3 text-white" />
               </div>
            </div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-3">Begin Your Relationship Engine</h3>
            <p className="text-[#555] text-[11px] font-bold uppercase tracking-widest max-w-xs leading-relaxed mb-8">
              Every clipping campaign starts with a client profile. Add your first prospect to initiate the pipeline.
            </p>
            <button 
              onClick={() => setIsAddingClient(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              Add First Client Record
            </button>
          </div>
        ) : STAGES.map(stage => {
          const stageClients = filteredClients.filter(c => c.stage === stage.id);
          
          return (
            <div key={stage.id} className="space-y-4 min-w-[240px]">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <stage.icon className={`w-3.5 h-3.5 ${stage.color}`} />
                  <span className="text-[9px] font-black text-[#444] uppercase tracking-widest">{stage.label}</span>
                </div>
                <span className="text-[10px] font-bold text-[#222] bg-white/[0.02] px-2 py-0.5 rounded-full">{stageClients.length}</span>
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {stageClients.map(client => (
                    <motion.div 
                      layout
                      key={client.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => setSelectedClient(client)}
                      className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-5 hover:border-blue-500/30 transition-all group cursor-pointer relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-[13px] font-bold text-white group-hover:text-blue-400 transition-colors truncate">{client.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                             <Globe className="w-2.5 h-2.5 text-[#222]" />
                             <span className="text-[9px] font-medium text-[#444] truncate">{client.website || 'No website'}</span>
                          </div>
                        </div>

                        {client.nextStep && (
                           <div className="px-3 py-2 bg-white/[0.02] rounded-xl border border-white/5">
                             <p className="text-[9px] font-medium text-[#555] line-clamp-1 italic">
                               <span className="text-blue-500 not-italic mr-1">●</span> {client.nextStep}
                             </p>
                           </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.03]">
                           <div className="flex -space-x-1">
                              {/* Placeholder for campaign indicators */}
                              {[1, 2].map(i => (
                                <div key={i} className="w-5 h-5 rounded-lg bg-[#111] border border-[#000] flex items-center justify-center">
                                  <BarChart2 className="w-2 h-2 text-[#333]" />
                                </div>
                              ))}
                           </div>
                           
                           <div className="flex gap-2">
                            <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               // TODO: Open edit modal
                             }}
                             className="p-1.5 bg-white/[0.02] hover:bg-white/10 rounded-lg text-[#333] hover:text-blue-400 transition-all opacity-0 group-hover:opacity-100"
                           >
                             <Plus className="w-3.5 h-3.5" />
                           </button>
                            <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               const next = STAGES[STAGES.findIndex(s => s.id === stage.id) + 1]?.id;
                               if (next) updateStage(client.id, next);
                             }}
                             className="p-1.5 bg-white/[0.02] hover:bg-white/10 rounded-lg text-[#333] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                           >
                             <ChevronRight className="w-3.5 h-3.5" />
                           </button>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {stageClients.length === 0 && (
                   <div className="py-12 border-2 border-dashed border-white/[0.02] rounded-3xl flex flex-col items-center justify-center gap-2 opacity-20">
                      <stage.icon className="w-4 h-4 text-[#333]" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#222]">Empty</span>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Client Modal */}
      <AnimatePresence>
        {isAddingClient && (
          <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg bg-[#0A0A0A] border border-white/5 rounded-[48px] p-10 relative shadow-2xl"
            >
              <button onClick={() => setIsAddingClient(false)} className="absolute top-8 right-8 text-[#555] hover:text-white transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
              
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">New Client</h3>
                  <p className="text-[9px] text-[#555] font-black uppercase tracking-widest">Entry Registration</p>
                </div>
              </div>

              <form onSubmit={handleAddClient} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#555] uppercase tracking-widest ml-1">Company / Brand Name</label>
                  <input name="name" required autoFocus placeholder="e.g. Acme Corp" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#555] uppercase tracking-widest ml-1">Email</label>
                    <input name="email" placeholder="contact@acme.com" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#555] uppercase tracking-widest ml-1">Website</label>
                    <input name="website" placeholder="acme.com" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#555] uppercase tracking-widest ml-1">Monthly Retainer ($)</label>
                  <input name="retainer" type="number" placeholder="2500" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.3em] text-[10px] transition-all shadow-xl shadow-blue-600/20">
                  Register Account
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ClientDrawer 
        client={selectedClient} 
        onClose={() => setSelectedClient(null)} 
        onCreateCampaign={openIntakeFromClient}
      />

      <CampaignIntakeModal 
        isOpen={showIntakeModal}
        onClose={() => setShowIntakeModal(false)}
        isLoading={intakeLoading}
        setIsLoading={setIntakeLoading}
        onCreated={() => {
          setShowIntakeModal(false);
          addToast("Campaign created & linked!", "success");
        }}
        clientId={intakeContext?.id}
        clientName={intakeContext?.name}
        clientWebsite={intakeContext?.website}
      />
    </div>
  );
}
