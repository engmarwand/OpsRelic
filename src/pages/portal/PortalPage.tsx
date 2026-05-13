import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../lib/store';
import { 
  Globe, Shield, Key, Copy, ExternalLink, Eye, EyeOff, 
  Search, ChevronRight, Lock, Unlock, AlertCircle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../../lib/toast';
import ClientDashboardPage from '../client-portal/ClientDashboardPage';

export default function PortalPage() {
  const { campaignsList, clients } = useAppContext();
  const { addToast } = useToast();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const selectedCampaign = useMemo(() => 
    campaignsList.find(c => c.id === selectedCampaignId) || null
  , [campaignsList, selectedCampaignId]);

  const filteredCampaigns = useMemo(() => 
    campaignsList.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clients.find(cl => cl.id === c.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  , [campaignsList, clients, searchTerm]);

  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleTogglePortal = async () => {
    if (!selectedCampaign) return;
    setIsSaving(true);
    try {
      const isEnabling = !selectedCampaign.portalEnabled;
      const token = selectedCampaign.portalToken || Math.random().toString(36).substring(2, 16) + Date.now().toString(36);
      await updateDoc(doc(db, 'campaigns', selectedCampaign.id), {
        portalEnabled: isEnabling,
        portalToken: token,
        updatedAt: new Date().toISOString()
      });
      addToast(`Portal ${isEnabling ? 'enabled' : 'disabled'}`, 'success');
    } catch (err) {
      addToast("Failed to update portal status", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'campaigns', selectedCampaign.id), {
        portalPassword: password,
        updatedAt: new Date().toISOString()
      });
      addToast(password ? "Password set successfully" : "Password removed", "success");
      setPassword('');
    } catch (err) {
      addToast("Failed to update portal password", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRotateToken = async () => {
    if (!selectedCampaign || !window.confirm("Rotating the token will break all existing links. Continue?")) return;
    setIsSaving(true);
    try {
      const newToken = Math.random().toString(36).substring(2, 16) + Date.now().toString(36);
      await updateDoc(doc(db, 'campaigns', selectedCampaign.id), {
        portalToken: newToken,
        updatedAt: new Date().toISOString()
      });
      addToast("Portal link rotated", "success");
    } catch (err) {
      addToast("Failed to rotate token", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPreviewing && selectedCampaignId) {
    return (
      <div className="relative">
        <div className="sticky top-0 z-[100] bg-[var(--color-surface2)] border-b border-[var(--color-border-subtle)] p-3 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
             <div className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-red-500/20">Preview Mode</div>
             <div className="text-xs font-bold text-[var(--color-text-main)]">Viewing: {selectedCampaign?.name}</div>
          </div>
          <button onClick={() => setIsPreviewing(false)} className="btn btn-primary btn-sm flex items-center gap-2">
            <EyeOff className="w-3.5 h-3.5" /> Exit Preview
          </button>
        </div>
        <ClientDashboardPage campaignId={selectedCampaignId} />
      </div>
    );
  }

  return (
    <div className="page active p-6 md:p-8 min-h-[calc(100vh-var(--topbar-h))]">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        
        {/* Sidebar: Campaign List */}
        <div className="space-y-6">
          <div className="space-y-1">
             <h2 className="font-display text-xl font-extrabold text-[var(--color-text-main)] tracking-tight">Portals</h2>
             <p className="text-xs text-muted font-medium">Select a campaign to manage portal</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl pl-9 pr-4 py-2 text-sm focus:border-[var(--color-cyan)] outline-none transition-all"
              placeholder="Search campaigns..."
            />
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-320px)] no-scrollbar pr-1">
            {filteredCampaigns.map(camp => {
              const isActive = selectedCampaignId === camp.id;
              const hasPortal = camp.portalEnabled;
              const client = clients.find(cl => cl.id === camp.clientId);

              return (
                <div 
                  key={camp.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedCampaignId(camp.id);
                    setIsPreviewing(false);
                    setPassword(camp.portalPassword || '');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedCampaignId(camp.id);
                      setIsPreviewing(false);
                      setPassword(camp.portalPassword || '');
                    }
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all relative group cursor-pointer outline-none",
                    isActive 
                      ? "bg-[var(--color-cyan-dim)] border-[var(--color-cyan)] shadow-glow-sm" 
                      : "bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-cyan-dim)] focus:border-[var(--color-cyan-dim)]"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-xs font-bold uppercase tracking-wider", isActive ? "text-[var(--color-cyan)]" : "text-muted")}>
                      {client?.name || 'Client'}
                    </span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const isEnabling = !camp.portalEnabled;
                        const token = camp.portalToken || Math.random().toString(36).substring(2, 16) + Date.now().toString(36);
                        await updateDoc(doc(db, 'campaigns', camp.id), {
                          portalEnabled: isEnabling,
                          portalToken: token,
                          updatedAt: new Date().toISOString()
                        });
                        addToast(`Portal ${isEnabling ? 'enabled' : 'disabled'}`, 'success');
                      }}
                      className={cn(
                        "relative inline-flex h-4 w-7 items-center rounded-full transition-colors",
                        hasPortal ? "bg-[var(--color-green)]" : "bg-[var(--color-surface3)]"
                      )}
                    >
                      <span className={cn("inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform", hasPortal ? "translate-x-4" : "translate-x-0.5")} />
                    </button>
                  </div>
                  <div className={cn("font-bold text-sm truncate mb-0.5", isActive ? "text-[var(--color-text-main)]" : "text-muted group-hover:text-[var(--color-text-main)]")}>
                    {camp.name}
                  </div>
                </div>
              );
            })}
            {filteredCampaigns.length === 0 && (
               <div className="text-center py-10 text-muted italic text-xs">No campaigns found.</div>
            )}
          </div>
        </div>

        {/* Main Content: Portal Settings */}
        <div className="space-y-8">
          {!selectedCampaign ? (
            <div className="h-full flex flex-col items-center justify-center py-32 bg-[var(--color-surface2)]/30 border border-dashed border-[var(--color-border-subtle)] rounded-[32px]">
               <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface2)] flex items-center justify-center border border-[var(--color-border-subtle)] mb-6">
                 <Globe className="w-8 h-8 text-faint" />
               </div>
               <h3 className="font-display text-lg font-bold text-[var(--color-text-main)] mb-1">Manage Client Portals</h3>
               <p className="text-sm text-muted">Select a campaign from the sidebar to configure its portal settings.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedCampaign.id}
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-6"
              >
                {/* Status Hero */}
                <div className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-[32px] p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-cyan)] opacity-[0.03] blur-[100px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
                   
                   <div className="space-y-4 relative z-10">
                      <div className="flex items-center gap-3">
                         <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", selectedCampaign.portalEnabled ? "bg-[var(--color-green-dim)] text-[var(--color-green)] border-[rgba(0,229,160,0.2)]" : "bg-[var(--color-surface3)] text-muted border-[var(--color-border-subtle)]")}>
                            {selectedCampaign.portalEnabled ? 'Portal Active' : 'Portal Disabled'}
                         </div>
                         {selectedCampaign.portalPassword && (
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                             <Shield className="w-3 h-3" /> Password Protected
                           </div>
                         )}
                      </div>
                      <h2 className="font-display text-3xl font-black text-[var(--color-text-main)] tracking-tight italic uppercase">
                        {selectedCampaign.name} <span className="opacity-30">Portal</span>
                      </h2>
                      <div className="flex items-center gap-6">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5">Campaign ID</span>
                            <span className="text-sm font-mono text-[var(--color-text-main)] font-semibold">{selectedCampaign.id.substring(0, 10)}...</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5">Last Updated</span>
                            <span className="text-sm font-semibold text-[var(--color-text-main)]">{new Date(selectedCampaign.updatedAt || Date.now()).toLocaleDateString()}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 shrink-0">
                      <button 
                        onClick={handleTogglePortal}
                        disabled={isSaving}
                        className={cn("btn w-full sm:w-auto px-8 h-12 flex items-center justify-center gap-2", selectedCampaign.portalEnabled ? "btn-secondary text-red-500 hover:bg-red-500/10 border-red-500/20" : "btn-primary")}
                      >
                         {selectedCampaign.portalEnabled ? (
                           <><EyeOff className="w-4 h-4" /> Disable Portal</>
                         ) : (
                           <><Globe className="w-4 h-4" /> Enable Portal</>
                         )}
                      </button>
                      {selectedCampaign.portalEnabled && (
                        <button onClick={() => setIsPreviewing(true)} className="btn btn-secondary w-full sm:w-auto px-8 h-12 flex items-center justify-center gap-2">
                           <Eye className="w-4 h-4" /> Live Preview
                        </button>
                      )}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Access Management */}
                   <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="w-10 h-10 rounded-xl bg-[var(--color-surface2)] flex items-center justify-center text-[var(--color-cyan)] border border-[var(--color-border-subtle)]">
                            <Globe className="w-5 h-5" />
                         </div>
                         <h3 className="font-display text-md font-bold text-[var(--color-text-main)]">Access Link</h3>
                      </div>

                      <div className="space-y-4">
                        <p className="text-xs text-muted leading-relaxed">
                          This is the unique link for this campaign portal. Share it with your client to give them access to their performance data.
                        </p>
                        
                        <div className={cn("p-4 rounded-xl border transition-opacity", !selectedCampaign.portalEnabled && "opacity-40 grayscale pointer-events-none")}>
                           <div className="flex flex-col gap-1.5 mb-4">
                              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Public URL</label>
                              <div className="flex items-center gap-2 bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-lg p-2.5">
                                 <input 
                                   readOnly 
                                   value={selectedCampaign.portalEnabled ? `${window.location.origin}/portal/${selectedCampaign.portalToken}` : 'Portal Disabled'}
                                   className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-[var(--color-text-main)] truncate"
                                 />
                                 <button 
                                   onClick={() => {
                                      navigator.clipboard.writeText(`${window.location.origin}/portal/${selectedCampaign.portalToken}`);
                                      addToast("Link copied!", "success");
                                   }}
                                   className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-md text-muted transition-colors"
                                 >
                                    <Copy className="w-3.5 h-3.5" />
                                 </button>
                              </div>
                           </div>
                           <div className="flex gap-3">
                              <button 
                                onClick={() => window.open(`${window.location.origin}/portal/${selectedCampaign.portalToken}`, '_blank')}
                                className="flex-1 btn btn-secondary btn-sm flex items-center justify-center gap-2"
                              >
                                 <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                              </button>
                              <button 
                                onClick={handleRotateToken}
                                title="Rotate Link Token"
                                className="w-10 flex items-center justify-center btn btn-secondary btn-sm p-0"
                              >
                                 <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                           </div>
                        </div>
                        
                        {!selectedCampaign.portalEnabled && (
                          <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                             <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                             <p className="text-[10px] text-blue-400/80 font-medium leading-relaxed">
                               Portal is currently disabled. Clients accessing the link will see a "Portal Unavailable" message.
                             </p>
                          </div>
                        )}
                      </div>
                   </div>

                   {/* Security Settings */}
                   <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="w-10 h-10 rounded-xl bg-[var(--color-surface2)] flex items-center justify-center text-amber-500 border border-[var(--color-border-subtle)]">
                            <Shield className="w-5 h-5" />
                         </div>
                         <h3 className="font-display text-md font-bold text-[var(--color-text-main)]">Portal Security</h3>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                 <div className="text-sm font-bold text-[var(--color-text-main)]">Password Protection</div>
                                 <p className="text-[11px] text-muted">Require a password for client access</p>
                              </div>
                              {selectedCampaign.portalPassword ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-muted" />}
                           </div>

                           <form id="security-form" onSubmit={handleUpdatePassword} className="space-y-4">
                              <div className="flex flex-col gap-1.5">
                                 <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Client Password</label>
                                 <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                                    <input 
                                      type="text"
                                      value={password}
                                      onChange={e => setPassword(e.target.value)}
                                      autoComplete="off"
                                      className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[var(--color-cyan)] outline-none transition-all placeholder:text-faint"
                                      placeholder="Leave blank for no password"
                                    />
                                 </div>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  type="submit" 
                                  disabled={isSaving || password === (selectedCampaign.portalPassword || '')} 
                                  className="btn btn-primary btn-sm flex-1"
                                >
                                   {isSaving ? 'Saving...' : 'Update Password'}
                                </button>
                                {selectedCampaign.portalPassword && (
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setPassword('');
                                      // Trigger update immediately to clear
                                      const el = document.getElementById('security-form') as HTMLFormElement;
                                      if (el) el.requestSubmit();
                                    }}
                                    className="btn btn-secondary btn-sm"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                           </form>
                        </div>

                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                           <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                           <div className="space-y-1">
                              <p className="text-xs font-bold text-amber-500">Important Note</p>
                              <p className="text-[10px] text-amber-500/80 leading-relaxed">
                                 Passwords are stored in plain-text for portal access verification. 
                                 For highly sensitive data, recommend rotating the portal token regularly.
                              </p>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>

                {/* What Clients See */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-3xl p-8 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,212,232,0.05)_0%,transparent_70%)]">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <h3 className="font-display text-lg font-black text-[var(--color-text-main)] italic uppercase">Portal Visibility Control</h3>
                        <p className="text-sm text-muted max-w-lg">
                          Clients can see performance metrics, approved logs, and campaign assets. 
                          Internal agency notes and unverified CSV uploads remain hidden.
                        </p>
                      </div>
                      <button onClick={() => setIsPreviewing(true)} className="btn btn-primary px-8 h-12 flex items-center justify-center gap-2 group">
                         <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" /> Enter Live Preview
                      </button>
                   </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
