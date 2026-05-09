import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Mail, Calendar, MessageSquare, Plus, ChevronRight, BarChart2, Trash2 } from 'lucide-react';
import { ClientAccount, Campaign, ClientStage } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '../lib/toast';

interface ClientDrawerProps {
  client: ClientAccount | null;
  onClose: () => void;
  onCreateCampaign: (client: ClientAccount) => void;
}

const STAGES: ClientStage[] = ['Lead', 'Onboarding', 'Briefing', 'Active'];

export default function ClientDrawer({ client, onClose, onCreateCampaign }: ClientDrawerProps) {
  const { addToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!client) return;
    const q = query(collection(db, 'campaigns'), where('clientId', '==', client.id));
    return onSnapshot(q, (snapshot) => {
      setCampaigns(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
    }, (error) => {
      console.error("ClientDrawer: snapshot error", error);
    });
  }, [client]);

  const updateClient = async (updates: Partial<ClientAccount>) => {
    if (!client) return;
    try {
      await updateDoc(doc(db, 'clients', client.id), { ...updates, updatedAt: new Date().toISOString() });
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const handleDelete = async () => {
    if (!client || !confirm("Permanently remove this client and all their records?")) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'clients', client.id));
      onClose();
      addToast("Client removed", "success");
    } catch (err: any) {
      addToast(err.message, "error");
      setIsDeleting(false);
    }
  };

  if (!client) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex justify-end">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-xl bg-[#080808] border-l border-white/5 shadow-2xl h-full overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                  <BarChart2 className="w-6 h-6 text-blue-500" />
               </div>
               <div>
                 <h2 className="text-xl font-black text-white italic uppercase tracking-tight">{client.name}</h2>
                 <p className="text-[10px] text-[#444] font-black uppercase tracking-[0.3em] mt-1">Client Profile</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <X className="w-5 h-5 text-[#444] hover:text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
            {/* Pipeline Stage Control */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#333] uppercase tracking-widest ml-1">Relationship Stage</label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map(s => (
                  <button
                    key={s}
                    onClick={() => updateClient({ stage: s })}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      client.stage === s 
                        ? 'bg-blue-600 text-white border border-blue-500 shadow-lg shadow-blue-600/20' 
                        : 'bg-white/[0.02] text-[#444] border border-white/5 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#333] uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email Address
                </label>
                <input 
                  defaultValue={client.email}
                  onBlur={(e) => updateClient({ email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#333] uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Website
                </label>
                <input 
                  defaultValue={client.website}
                  onBlur={(e) => updateClient({ website: e.target.value })}
                  placeholder="company.com"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" 
                />
              </div>
            </div>

            {/* Tasks / Next Step */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#333] uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Next Step / Follow up
              </label>
              <input 
                defaultValue={client.nextStep}
                onBlur={(e) => updateClient({ nextStep: e.target.value })}
                placeholder="e.g. Follow up on Tuesday..."
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" 
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#333] uppercase tracking-widest ml-1 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Internal Relationship Notes
              </label>
              <textarea 
                defaultValue={client.notes}
                onBlur={(e) => updateClient({ notes: e.target.value })}
                placeholder="Add context about the client, deal structure, or preferences..."
                className="w-full h-32 bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all resize-none" 
              />
            </div>

            {/* Linked Campaigns */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-[#333] uppercase tracking-widest ml-1">Linked Campaigns</label>
                <button 
                  onClick={() => onCreateCampaign(client)}
                  className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
                >
                  <Plus className="w-3 h-3" /> New Campaign
                </button>
              </div>

              <div className="space-y-3">
                {campaigns.map(camp => (
                  <div key={camp.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                        <BarChart2 className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white mb-0.5">{camp.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase text-[#444]">{camp.status}</span>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const link = `https://${camp.id}.opsrelic.com/intake`;
                                navigator.clipboard.writeText(link);
                                addToast("Intake link copied!", "success");
                              }}
                              className="bg-white/5 hover:bg-blue-600/20 text-[#666] hover:text-blue-400 px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all flex items-center gap-1"
                              title="Copy Intake Form Link"
                            >
                              <Plus className="w-2 h-2" /> Intake
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Using the actual portal URL format
                                const link = `https://${camp.id}.opsrelic.com`;
                                navigator.clipboard.writeText(link);
                                addToast("Client Portal link copied!", "success");
                              }}
                              className="bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all flex items-center gap-1"
                              title="Copy Portal Link"
                            >
                              <Globe className="w-2 h-2" /> Portal
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-lg transition-all">
                      <ChevronRight className="w-4 h-4 text-[#444]" />
                    </button>
                  </div>
                ))}
                
                {campaigns.length === 0 && (
                  <div className="py-10 border-2 border-dashed border-white/[0.02] rounded-3xl flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-20">
                      <BarChart2 className="w-4 h-4 text-[#444]" />
                    </div>
                    <p className="text-[9px] font-black uppercase text-[#222] tracking-widest">No Campaigns Created</p>
                    <button 
                      onClick={() => onCreateCampaign(client)}
                      className="px-6 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
                    >
                      Initialize Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 border-t border-white/5 flex items-center justify-between bg-black/50 backdrop-blur-xl">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-[#444] uppercase tracking-widest">Active File</span>
             </div>
             <button 
               onClick={handleDelete}
               disabled={isDeleting}
               className="p-3 bg-red-500/5 hover:bg-red-500 text-red-900 hover:text-white rounded-2xl transition-all group"
             >
               <Trash2 className="w-5 h-5" />
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
