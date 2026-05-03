import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../lib/store';
import { useToast } from '../lib/toast';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Users, Mail, Link as LinkIcon, CheckCircle, Clock, 
  ChevronRight, Search, FileText, Trash2, Copy, 
  ArrowUpRight, ArrowDownRight, Video, Target, User, Send, Settings, UserPlus
} from 'lucide-react';

export type PipelineStage = 'Invited' | 'Guidelines Sent' | 'Test Submitted' | 'In Review' | 'Approved' | 'Active' | 'Rejected';

export interface CreatorInvite {
  id: string;
  email: string;
  campaign: string;
  stage: PipelineStage;
  testClipUrl?: string;
  testScore?: 'Pass' | 'Fail';
  dateJoined: string;
  lastActivity: string;
  rejectionReason?: string;
}

export interface CampaignGuideline {
  campaign: string;
  documentUrl: string;
  lastUpdated: string;
  requireTest?: boolean;
  testDescription: string;
  minViewsThreshold: number;
  autoApprove: boolean;
  testDuration: string;
  inviteLink?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  { id: 't1', name: 'Welcome Message', isDefault: true, content: "Hey {creator_name}! Welcome to the {campaign_name} campaign. Here's how it works:\n1) Review the guidelines at {guidelines_url}\n2) Submit your test clip\n3) Once approved, start submitting!\nYour reward is ${reward_rate} per 1K views. Let me know if you have questions." },
  { id: 't2', name: 'Guideline Reminder', isDefault: true, content: "Hey {creator_name}, quick reminder to review the campaign guidelines before submitting your next clips. Here's the link: {guidelines_url}. Following these keeps your clips approved and you in on the campaign!" },
  { id: 't3', name: 'Test Clip Review - Pass', isDefault: true, content: "Congratulations {creator_name}! Your test clip has been approved. You now have unlimited submission access for the {campaign_name} campaign. Good luck!" },
  { id: 't4', name: 'Test Clip Review - Fail', isDefault: true, content: "Hey {creator_name}, thank you for submitting your test clip for {campaign_name}. Unfortunately, it didn't meet our quality standards this time ({rejection_reason}). Please review the guidelines at {guidelines_url} and try again if you'd like!" },
  { id: 't5', name: 'Campaign Completion + Payout', isDefault: true, content: "Hey {creator_name}, the {campaign_name} campaign has ended. Thank you for your contributions! You earned ${total_earned} for {total_clips} clips with {total_views} views. Your payout will be processed within 5-7 business days. Hope to work with you on the next campaign!" },
];

const STAGE_ORDER: PipelineStage[] = [
  'Invited', 'Guidelines Sent', 'Test Submitted', 'In Review', 'Approved', 'Active'
];

const STAGE_COLORS: Record<PipelineStage, string> = {
  'Invited': '#3B82F6',
  'Guidelines Sent': '#F59E0B',
  'Test Submitted': '#F97316',
  'In Review': '#8B5CF6',
  'Approved': '#10B981',
  'Active': '#4CAF50',
  'Rejected': '#EF4444'
};

export default function Onboarding() {
  const { data: globalData, hasFeature, plan } = useAppContext();
  const { addToast } = useToast();

  if (!hasFeature('onboardingPipeline')) {
    const minTier = 'pro'; // Hardcoding or you can import getFeatureMinTier
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
          <Target className="w-8 h-8 text-[#555]" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Onboarding Pipeline Locked</h2>
        <p className="text-[#888] max-w-md mx-auto mb-6">
          Your current <span className="font-bold text-white capitalize">{plan?.name || 'No'}</span> plan does not include the Creator Onboarding Pipeline. 
          Upgrade to <span className="capitalize font-bold text-emerald-400">{minTier}</span> or higher to access this feature.
        </p>
        <button 
          onClick={() => window.location.hash = '#workspace'}
          className="px-6 py-3 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors"
        >
          Upgrade Plan
        </button>
      </div>
    );
  }
  
  const [activeTab, setActiveTab] = useState<'recruit' | 'pipeline' | 'guidelines' | 'templates'>('recruit');
  
  const [invites, setInvites] = useState<CreatorInvite[]>([]);
  const [guidelines, setGuidelines] = useState<CampaignGuideline[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!isLoaded) {
    return <div className="flex items-center justify-center p-20 text-[#888]">Loading pipeline...</div>;
  }

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
        setIsLoaded(true);
        return;
    }
    
    const configRef = doc(db, 'user_config', user.uid);
    const unsubscribe = onSnapshot(configRef, (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            if (data.invites) setInvites(data.invites);
            if (data.guidelines) setGuidelines(data.guidelines);
            if (data.templates) setTemplates(data.templates);
        } else {
            // Setup defaults if not exists
            setDoc(configRef, {
                invites: [],
                guidelines: [],
                templates: DEFAULT_TEMPLATES
            });
        }
        setIsLoaded(true);
    });
    
    return () => unsubscribe();
  }, []);

  const saveToFirebase = async (newInvites: CreatorInvite[], newGuidelines: CampaignGuideline[], newTemplates: MessageTemplate[]) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await setDoc(doc(db, 'user_config', user.uid), {
            invites: newInvites,
            guidelines: newGuidelines,
            templates: newTemplates
        }, { merge: true });
    } catch(e) {
        console.error(e);
    }
  };

  const handleUpdateInvites = (newInvites: CreatorInvite[]) => {
      setInvites(newInvites);
      saveToFirebase(newInvites, guidelines, templates);
  };
  
  const handleUpdateGuidelines = (newGuidelines: CampaignGuideline[]) => {
      setGuidelines(newGuidelines);
      saveToFirebase(invites, newGuidelines, templates);
  };
  
  const handleUpdateTemplates = (newTemplates: MessageTemplate[]) => {
      setTemplates(newTemplates);
      saveToFirebase(invites, guidelines, newTemplates);
  };

  // Read CSV Creators into Active stage automatically
  useEffect(() => {
    if (!isLoaded || globalData.length === 0) return;
    
    const creatorMap = new Map();
    globalData.forEach(r => {
        if (r.Creator && !creatorMap.has(r.Creator)) {
            creatorMap.set(r.Creator, r.Campaign);
        }
    });

    let changed = false;
    const newInvites = [...invites];

    creatorMap.forEach((campaign, creatorEmail) => {
        const exists = newInvites.find(i => i.email === creatorEmail);
        if (!exists) {
        newInvites.push({
            id: Math.random().toString(36).substr(2, 9),
            email: creatorEmail,
            campaign: campaign,
            stage: 'Active',
            dateJoined: new Date().toISOString().split('T')[0],
            lastActivity: new Date().toISOString().split('T')[0]
        });
        changed = true;
        }
    });
    
    if (changed) {
        handleUpdateInvites(newInvites);
    }
  }, [globalData, isLoaded]); // intentional missing invites to avoid infinite loops since we update invites

  const campaigns = Array.from(new Set(globalData.map(r => r.Campaign))).sort();

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto hide-scrollbar">
        {[
          { id: 'recruit', label: 'Recruit', icon: UserPlus },
          { id: 'pipeline', label: 'Pipeline', icon: Target },
          { id: 'guidelines', label: 'Guidelines', icon: FileText },
          { id: 'templates', label: 'Templates', icon: Copy }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === t.id 
                ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' 
                : 'text-[#888] hover:text-white border-b-2 border-transparent hover:border-white/20'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl">
        {activeTab === 'recruit' && (
          <TabRecruit 
            campaigns={campaigns} 
            invites={invites} 
            guidelines={guidelines}
            addInvite={(inv: CreatorInvite) => {
              handleUpdateInvites([inv, ...invites]);
              addToast(`Invite sent to ${inv.email}`, "success");
            }} 
            addToast={addToast}
          />
        )}
        {activeTab === 'pipeline' && (
          <TabPipeline 
            invites={invites} 
            campaigns={campaigns}
            guidelines={guidelines}
            updateInvite={(id: string, updates: Partial<CreatorInvite>) => handleUpdateInvites(invites.map((i: CreatorInvite) => i.id === id ? { ...i, ...updates } : i))}
            removeInvite={(id: string) => handleUpdateInvites(invites.filter((i: CreatorInvite) => i.id !== id))}
          />
        )}
        {activeTab === 'guidelines' && (
          <TabGuidelines 
            campaigns={campaigns} 
            guidelines={guidelines} 
            saveGuideline={(g: CampaignGuideline) => {
              const ex = guidelines.findIndex((x: CampaignGuideline) => x.campaign === g.campaign);
              if (ex >= 0) {
                const nw = [...guidelines];
                nw[ex] = g;
                handleUpdateGuidelines(nw);
              } else {
                handleUpdateGuidelines([...guidelines, g]);
              }
              addToast("Guidelines saved", "success");
            }} 
            invites={invites}
          />
        )}
        {activeTab === 'templates' && (
          <TabTemplates 
            templates={templates} 
            setTemplates={handleUpdateTemplates}
            addToast={addToast}
          />
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB 1: RECRUIT
// ----------------------------------------------------------------------
function TabRecruit({ campaigns, invites, guidelines, addInvite, addToast }: any) {
  const [email, setEmail] = useState('');
  const [campaign, setCampaign] = useState(campaigns[0] || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [note, setNote] = useState("Hey {creator_name}! You've been selected to join the {campaign_name} campaign on Whop. Click the link to get started. Reward: ${reward_rate} per 1K views. Let me know if you have any questions.");

  const totalInvitesCount = invites.filter((i:any) => i.stage === 'Invited').length;
  const activeCount = invites.filter((i:any) => i.stage === 'Active').length;
  const pendingCount = invites.filter((i:any) => ['Guidelines Sent', 'Test Submitted', 'In Review', 'Approved'].includes(i.stage)).length;
  const rejectedCount = invites.filter((i:any) => i.stage === 'Rejected').length;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (!campaign && campaigns.length === 0) {
      addToast("Add data with a campaign first to invite creators.", "error");
      return;
    }
    
    addInvite({
      id: Math.random().toString(36).substr(2, 9),
      email,
      campaign: campaign || campaigns[0] || 'Unknown',
      stage: 'Invited',
      dateJoined: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0]
    });
    setEmail('');
  };

  const copyLink = () => {
    const activeGuideline = guidelines.find((g: any) => g.campaign === campaign);
    const linkToCopy = activeGuideline?.inviteLink || "https://whop.com/checkout/plan_xxx";

    navigator.clipboard.writeText(linkToCopy);
    setCopiedLink(true);
    addToast("Link copied!", "success");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyNote = () => {
    navigator.clipboard.writeText(note);
    addToast("Notes copied!", "success");
  };

  const renderHighlightedNote = (text: string) => {
    return text.split(/(\{.*?\})/).map((part, i) => 
      part.startsWith('{') && part.endsWith('}') 
        ? <span key={i} className="text-[#FF6B35] font-semibold">{part}</span> 
        : part
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl p-4 flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <label className="block text-xs font-semibold text-[#888] mb-1.5 uppercase tracking-wider">Active Campaign Context</label>
          <select 
            value={campaign} 
            onChange={(e) => setCampaign(e.target.value)} 
            className="w-full bg-[#0F0F0F] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#3B82F6]"
          >
            {campaigns.length === 0 && <option value="">No campaigns available</option>}
            {campaigns.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="bg-[#111] border border-white/[0.05] shadow-sm rounded-full px-5 py-2.5 flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></div>
          <span className="text-[#888] font-medium tracking-wide">Total Invited:</span> <span className="font-bold text-white tabular-nums">{totalInvitesCount}</span>
        </div>
        <div className="bg-[#111] border border-white/[0.05] shadow-sm rounded-full px-5 py-2.5 flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4CAF50]"></div>
          <span className="text-[#888] font-medium tracking-wide">Active:</span> <span className="font-bold text-white tabular-nums">{activeCount}</span>
        </div>
        <div className="bg-[#111] border border-white/[0.05] shadow-sm rounded-full px-5 py-2.5 flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></div>
          <span className="text-[#888] font-medium tracking-wide">Pending:</span> <span className="font-bold text-white tabular-nums">{pendingCount}</span>
        </div>
        <div className="bg-[#111] border border-white/[0.05] shadow-sm rounded-full px-5 py-2.5 flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></div>
          <span className="text-[#888] font-medium tracking-wide">Rejected:</span> <span className="font-bold text-white tabular-nums">{rejectedCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl p-8">
          <div className="w-10 h-10 bg-[#FF6B35]/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <h3 className="font-semibold mb-2">Single Creator Invite</h3>
          <p className="text-sm text-[#888] mb-6">Send email directly to individual creators with campaign selection.</p>
          
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] mb-1.5 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                placeholder="creator@email.com" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
            <button type="submit" className="w-full bg-[#3B82F6] text-white hover:bg-[#2563EB] font-medium py-3 rounded-lg text-sm transition-colors flex justify-center items-center gap-2">
              <Send className="w-4 h-4" /> Send Invite
            </button>
            <p className="text-[11px] text-[#888] text-center">To send real emails, connect this to Make.com webhook</p>
          </form>
        </div>

        <div className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl p-8 flex flex-col">
          <div className="w-10 h-10 bg-[#FF6B35]/10 rounded-full flex items-center justify-center mb-4">
            <LinkIcon className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <h3 className="font-semibold mb-2">Mass Invite Link</h3>
          <p className="text-sm text-[#888] mb-6">Share this link in DMs, Discord, or mass outreach.</p>
          
          <button 
            onClick={copyLink}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-colors border ${
              copiedLink 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                : 'bg-[#242424] text-white hover:bg-[#2A2A2A] border-white/5'
            }`}
          >
            {copiedLink ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedLink ? 'Copied Link!' : 'Copy Invite Link'}
          </button>
          
          <div className="mt-3 text-center text-xs font-medium text-[#888] bg-white/5 py-1.5 rounded-full w-max mx-auto px-4 border border-white/5">
            <span className="text-white">{activeCount} creators</span> joined via link
          </div>

          <div className="mt-8 flex-1 flex flex-col">
            <label className="block text-xs font-semibold text-[#888] mb-1.5 uppercase tracking-wider">Invite Notes</label>
            <div className="relative flex-1 group">
               <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-full min-h-[120px] bg-[#0F0F0F] border border-white/10 rounded-lg p-4 text-sm text-transparent caret-white focus:outline-none focus:border-[#FF6B35] resize-none relative z-10 font-mono leading-relaxed bg-transparent"
               />
               <div className="absolute inset-0 pointer-events-none p-4 text-sm text-[#888] font-mono leading-relaxed z-0 bg-[#0F0F0F] rounded-lg border border-transparent whitespace-pre-wrap break-words">
                  {renderHighlightedNote(note)}
               </div>
            </div>
            <button onClick={copyNote} className="mt-3 text-sm text-[#FF6B35] hover:text-[#E55A25] font-medium flex items-center gap-1.5 self-start transition-colors">
              <Copy className="w-3.5 h-3.5" /> Copy Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB 2: PIPELINE
// ----------------------------------------------------------------------
function TabPipeline({ invites, campaigns, guidelines, updateInvite, removeInvite }: any) {
  const [filterCampaign, setFilterCampaign] = useState('All');
  const [filterStage, setFilterStage] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = invites.filter((i: any) => {
    if (filterCampaign !== 'All' && i.campaign !== filterCampaign) return false;
    if (filterStage !== 'All' && i.stage !== filterStage && !(filterStage === 'Pipeline' && i.stage !== 'Rejected')) return false;
    if (search && !i.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a:any, b:any) => new Date(b.dateJoined).getTime() - new Date(a.dateJoined).getTime());

  const advanceStage = (id: string, current: PipelineStage, campaignName: string) => {
    let idx = STAGE_ORDER.indexOf(current);
    if (idx < STAGE_ORDER.length - 1) {
      let nextStage = STAGE_ORDER[idx + 1];
      
      const guideline = guidelines.find((g: any) => g.campaign === campaignName);
      const isTestOptional = guideline && guideline.requireTest === false;
      
      if (isTestOptional && (nextStage === 'Test Submitted' || nextStage === 'In Review')) {
        nextStage = 'Approved';
      }
      
      updateInvite(id, { stage: nextStage, lastActivity: new Date().toISOString().split('T')[0] });
    }
  };

  const handleReject = (id: string) => {
    const reason = window.prompt("Rejection reason:");
    if (reason !== null) {
      updateInvite(id, { stage: 'Rejected', rejectionReason: reason, lastActivity: new Date().toISOString().split('T')[0] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Visual Bar */}
      <div className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl p-8 overflow-x-auto hide-scrollbar">
        <div className="flex items-center min-w-[700px] justify-between relative px-4">
          <div className="absolute top-1/2 left-8 right-8 h-1 bg-white/5 -translate-y-1/2 rounded-full z-0"></div>
          {STAGE_ORDER.map((stage, i) => {
            const count = invites.filter((inv:any) => inv.stage === stage).length;
            const hasItems = count > 0;
            return (
              <div key={stage} className="relative z-10 flex flex-col items-center gap-3">
                <div 
                  className={`w-4 h-4 rounded-full border-4 border-[#1A1A1A] transition-all ${hasItems ? 'scale-125' : ''}`}
                  style={{ backgroundColor: STAGE_COLORS[stage], boxShadow: hasItems ? `0 0 15px ${STAGE_COLORS[stage]}80` : '' }}
                />
                <div className="text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#888] mb-0.5">{stage}</p>
                  <p className="text-sm font-semibold text-white">{count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input 
                type="text" placeholder="Search email..." 
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#111] border border-white/[0.05] rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] shadow-inner"
              />
           </div>
           <select 
             value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}
             className="bg-[#111] border border-white/[0.05] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] shadow-inner"
           >
             <option value="All">All Campaigns</option>
             {campaigns.map((c:string) => <option key={c} value={c}>{c}</option>)}
           </select>
           <select 
             value={filterStage} onChange={e => setFilterStage(e.target.value)}
             className="bg-[#111] border border-white/[0.05] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] shadow-inner"
           >
             <option value="All">All Stages</option>
             <option value="Pipeline">In Pipeline (Hide Rejected)</option>
             {[...STAGE_ORDER, 'Rejected'].map((c:string) => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl overflow-hidden">
        <div className="overflow-x-auto min-w-[900px]">
          <table className="w-full text-left">
            <thead className="bg-[#0F0F0F] border-b border-white/[0.05]">
              <tr className="text-[11px] font-bold uppercase tracking-widest text-[#666]">
                <th className="p-4 font-medium">Creator</th>
                <th className="p-4 font-medium">Campaign</th>
                <th className="p-4 font-medium">Stage</th>
                <th className="p-4 font-medium text-center">Test Clip</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filtered.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 text-sm font-semibold text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <User className="w-4 h-4 text-[#888]" />
                      </div>
                      <div>
                        {inv.email}
                        {inv.stage === 'Rejected' && inv.rejectionReason && (
                           <p className="text-[10px] text-red-400 mt-0.5">Reason: {inv.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-[#888]">{inv.campaign}</td>
                  <td className="p-4">
                    <span 
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm"
                      style={{ 
                        backgroundColor: `${STAGE_COLORS[inv.stage]}15`, 
                        color: STAGE_COLORS[inv.stage],
                        borderColor: `${STAGE_COLORS[inv.stage]}30` 
                      }}
                    >
                      {inv.stage}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {inv.testClipUrl ? (
                      <a href={inv.testClipUrl} className="text-[#FF6B35] hover:underline text-sm font-medium flex items-center justify-center gap-1">
                         <Video className="w-3.5 h-3.5" /> View
                      </a>
                    ) : <span className="text-[#555]">—</span>}
                  </td>
                  <td className="p-4 text-sm text-[#888] tabular-nums whitespace-nowrap">
                    {inv.dateJoined}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 text-sm">
                      {STAGE_ORDER.indexOf(inv.stage) < STAGE_ORDER.length - 1 && inv.stage !== 'Rejected' && (
                        <button 
                          onClick={() => advanceStage(inv.id, inv.stage, inv.campaign)}
                          className="bg-[#242424] hover:bg-[#333] border border-white/10 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
                        >
                          Advance
                        </button>
                      )}
                      {inv.stage !== 'Rejected' && inv.stage !== 'Active' && (
                        <button 
                          onClick={() => handleReject(inv.id)}
                          className="border border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-md font-medium transition-colors"
                        >
                          Reject
                        </button>
                      )}
                      <button 
                        onClick={() => { if(window.confirm('Delete this creator from pipeline?')) removeInvite(inv.id) }}
                        className="p-1.5 text-[#555] hover:text-red-400 transition-colors rounded-md hover:bg-white/5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-[#888]">No creators found in pipeline.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB 3: GUIDELINES
// ----------------------------------------------------------------------
function TabGuidelines({ campaigns, guidelines, saveGuideline, invites }: any) {
  const [campaign, setCampaign] = useState(campaigns[0] || '');
  const [docUrl, setDocUrl] = useState('');
  const [requireTest, setRequireTest] = useState(true);
  const [testDesc, setTestDesc] = useState('Before you start submitting clips, please submit 1 test clip to this campaign. This helps us ensure quality and brand alignment. Once your test clip is approved, you\'ll have unlimited submission access.');
  const [threshold, setThreshold] = useState("20000");
  const [duration, setDuration] = useState("24 hours");
  const [autoApprove, setAutoApprove] = useState(false);

  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (campaign) {
      const existing = guidelines.find((g:any) => g.campaign === campaign);
      if (existing) {
        setDocUrl(existing.documentUrl);
        setRequireTest(existing.requireTest ?? true);
        setTestDesc(existing.testDescription);
        setThreshold(existing.minViewsThreshold.toString());
        setDuration(existing.testDuration);
        setAutoApprove(existing.autoApprove);
        setInviteLink(existing.inviteLink || '');
      } else {
        setDocUrl('');
        setRequireTest(true);
        setTestDesc('Before you start submitting clips, please submit 1 test clip to this campaign...');
        setThreshold("20000");
        setDuration("24 hours");
        setAutoApprove(false);
        setInviteLink('');
      }
    }
  }, [campaign, guidelines]);

  const handleSave = () => {
    if (!campaign) return;
    saveGuideline({
      campaign,
      documentUrl: docUrl,
      requireTest,
      testDescription: testDesc,
      minViewsThreshold: parseInt(threshold || "0", 10),
      autoApprove,
      testDuration: duration,
      inviteLink,
      lastUpdated: new Date().toISOString().split('T')[0]
    });
  };

  const inReviewCount = invites.filter((i:any) => i.stage === 'In Review').length;
  const pendingCount = invites.filter((i:any) => i.stage === 'Guidelines Sent' || i.stage === 'Test Submitted').length;

  return (
    <div className="space-y-6">
      {/* Mini dashboard stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl p-6">
           <p className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Clips in Review</p>
           <p className="text-3xl font-black text-white">{inReviewCount}</p>
        </div>
        <div className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl p-6">
           <p className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Pending Test</p>
           <p className="text-3xl font-black text-white">{pendingCount}</p>
        </div>
        <div className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl p-6">
           <p className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Rejection Rate</p>
           <p className="text-3xl font-black text-[#FF6B35]">14%</p>
        </div>
        <div className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl p-6">
           <p className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Avg Wait Time</p>
           <p className="text-3xl font-black text-white">4.2h</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-[#888] mb-2 uppercase tracking-widest">Select Campaign Settings</label>
          <select 
            value={campaign} onChange={e => setCampaign(e.target.value)}
            className="w-full max-w-sm bg-[#111] border border-white/[0.05] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] font-semibold text-white shadow-inner"
          >
            {campaigns.length === 0 && <option value="">No campaigns available</option>}
            {campaigns.map((c:string) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl p-8 space-y-8">
          <section>
            <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2"><FileText className="w-5 h-5 text-[#3B82F6]" /> Core Guidelines</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Campaign Invite Link</label>
                <input 
                  type="url" placeholder="e.g. https://whop.com/checkout/plan_xxx" 
                  value={inviteLink} onChange={e => setInviteLink(e.target.value)}
                  className="w-full bg-[#0F0F0F] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Guidelines Document URL</label>
                <input 
                  type="url" placeholder="Paste link to Google Doc, Notion, or PDF" 
                  value={docUrl} onChange={e => setDocUrl(e.target.value)}
                  className="w-full bg-[#0F0F0F] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>
          </section>

          <hr className="border-white/5" />

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2"><Target className="w-5 h-5 text-[#3B82F6]" /> Test Assignment</h3>
              <label className="flex items-center gap-2 cursor-pointer bg-[#0F0F0F] border border-white/10 px-3 py-1.5 rounded-full hover:border-white/20 transition-colors">
                <input type="checkbox" checked={requireTest} onChange={e => setRequireTest(e.target.checked)} className="peer sr-only" />
                <div className="w-8 h-4 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#3B82F6] relative"></div>
                <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">{requireTest ? 'Required' : 'Optional'}</span>
              </label>
            </div>
            
            {requireTest ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Assignment Description</label>
                  <textarea 
                    value={testDesc} onChange={e => setTestDesc(e.target.value)}
                    className="w-full min-h-[100px] bg-[#0F0F0F] border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#FF6B35] resize-y"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Min Views Threshold</label>
                    <input 
                      type="number" value={threshold} onChange={e => setThreshold(e.target.value)}
                      className="w-full bg-[#0F0F0F] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Test Duration</label>
                    <select 
                      value={duration} onChange={e => setDuration(e.target.value)}
                      className="w-full bg-[#0F0F0F] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35]"
                    >
                      <option>24 hours</option>
                      <option>48 hours</option>
                      <option>1 week</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider">Review Pipeline</label>
                  <label className="flex items-center gap-3 p-4 border border-white/5 rounded-lg bg-[#0F0F0F] cursor-pointer hover:border-white/10 transition-colors">
                    <input type="checkbox" checked={autoApprove} onChange={e => setAutoApprove(e.target.checked)} className="w-4 h-4 accent-[#FF6B35]" />
                    <span className="text-sm font-medium">Auto-approve if test clip exceeds threshold</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="bg-[#0F0F0F] border border-white/5 rounded-lg p-6 text-center text-sm text-[#888]">
                Creators will bypass the test assignment stage and go straight to Approved.
              </div>
            )}
          </section>

          <div className="pt-4 flex justify-end">
            <button onClick={handleSave} className="bg-[#10B981] hover:bg-[#059669] text-white px-8 py-3 rounded-lg font-bold text-sm tracking-wide transition-colors">
               Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB 4: TEMPLATES
// ----------------------------------------------------------------------
function TabTemplates({ templates, setTemplates, addToast }: any) {
  const [activeTpl, setActiveTpl] = useState(templates[0]?.id);

  const tpl = templates.find((t:any) => t.id === activeTpl);

  const handleUpdate = (content: string) => {
    setTemplates(templates.map((t:any) => t.id === activeTpl ? { ...t, content } : t));
  };

  const copyToClipboard = () => {
    if(tpl) {
      navigator.clipboard.writeText(tpl.content);
      addToast("Template copied!", "success");
    }
  };

  const renderHighlighted = (text: string) => {
    return text.split(/(\{.*?\})/).map((part, i) => 
      part.startsWith('{') && part.endsWith('}') 
        ? <span key={i} className="text-[#FF6B35] font-semibold">{part}</span> 
        : part
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <div className="md:col-span-1 space-y-2 sticky top-24">
        {templates.map((t:any) => (
          <button
            key={t.id}
            onClick={() => setActiveTpl(t.id)}
            className={`w-full text-left px-5 py-4 rounded-xl text-sm font-semibold transition-all border ${
              activeTpl === t.id 
                ? 'bg-[#111] border-[#FF6B35] text-[#FF6B35] shadow-lg shadow-[#FF6B35]/10' 
                : 'bg-white/[0.02] border-white/[0.05] text-[#888] hover:text-white hover:bg-white/5'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="md:col-span-2">
        {tpl && (
          <div className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl p-8 flex flex-col min-h-[500px]">
             <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.05]">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#FF6B35]" /> {tpl.name}
                </h3>
                <button onClick={copyToClipboard} className="flex items-center gap-2 bg-[#FF6B35]/10 text-[#FF6B35] hover:bg-[#FF6B35]/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  <Copy className="w-4 h-4" /> Copy Content
                </button>
             </div>
             
             <div className="relative flex-1 group mb-6">
               <textarea 
                  value={tpl.content}
                  onChange={(e) => handleUpdate(e.target.value)}
                  className="w-full h-full min-h-[300px] bg-[#0F0F0F] border border-white/10 rounded-xl p-6 text-sm text-transparent caret-white focus:outline-none focus:border-[#FF6B35] resize-y relative z-10 font-mono leading-loose bg-transparent"
               />
               <div className="absolute inset-0 pointer-events-none p-6 text-sm text-[#888] font-mono leading-loose z-0 bg-[#0F0F0F] rounded-xl border border-transparent whitespace-pre-wrap break-words">
                  {renderHighlighted(tpl.content)}
               </div>
             </div>

             <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-xs text-[#888] leading-relaxed">
               <span className="font-semibold text-white block mb-1">Available Variables:</span>
               Current variables in orange will be automatically replaced when sending from the Pipeline tab. Valid variables: {'{creator_name}'}, {'{campaign_name}'}, {'{reward_rate}'}, {'{guidelines_url}'}, {'{rejection_reason}'}, {'{total_earned}'}.
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
