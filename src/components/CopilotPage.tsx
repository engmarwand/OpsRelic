import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Send, 
  Zap, 
  Sparkles, 
  Wand2, 
  MessageSquare,
  AlertCircle,
  History,
  Layout,
  ArrowRight,
  CheckCircle2,
  BrainCircuit,
  Terminal
} from 'lucide-react';
import { useAppContext } from '../lib/store';
import { AI_ACTIONS } from '../lib/aiConfig';
import { chatWithCopilot, runAIAction } from '../services/aiService';
import { useToast } from '../lib/toast';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  actionResult?: any;
}

export default function CopilotPage() {
  const { workspace, deductCredits, campaignsList, clients, data } = useAppContext();
  const { addToast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      content: "Welcome to the OpsRelic AI Workspace. I'm connected to your agency's data and ready to assist with campaign strategy, performance analysis, and client communications.", 
      timestamp: new Date().toISOString() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customMessage?: string) => {
    const text = (customMessage || input).trim();
    if (!text) return;

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({ 
        role: m.role, 
        parts: [{ text: m.content }] 
      }));
      
      const appContext = {
        credits: workspace?.credits,
        campaignCount: campaignsList.length,
        clientCount: clients.length,
        recentDataPoints: data.length,
        activeCampaigns: campaignsList.filter(c => c.status === 'Active').map(c => c.name)
      };

      const response = await chatWithCopilot(text, history, appContext);
      const botMessage: Message = { role: 'model', content: response, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setIsTyping(false);
    }
  };

  const executeAction = async (actionId: string, campaignId?: string) => {
    const action = AI_ACTIONS[actionId];
    if (!action) return;

    if ((workspace?.credits || 0) < action.creditCost) {
      addToast("Insufficient AI credits.", "error");
      return;
    }

    const confirmed = confirm(`Run "${action.label}"? This will consume ${action.creditCost} credits.`);
    if (!confirmed) return;

    setIsTyping(true);
    try {
      const campaign = campaignId ? campaignsList.find(c => c.id === campaignId) : campaignsList[0];
      
      let result;
      if (actionId === 'CREATE_DRAFT' && campaign?.intake) {
        result = await runAIAction(actionId, { intake: campaign.intake });
        const briefData = JSON.parse(result);
        await updateDoc(doc(db, 'campaigns', campaign.id), { 
          brief: briefData,
          status: 'Review',
          updatedAt: new Date().toISOString()
        });
        addToast("Campaign draft generated!", "success");
      } else if (actionId === 'CLIENT_UPDATE') {
        const campaignData = data.filter(r => r.Campaign === (campaignId || ''));
        result = await runAIAction(actionId, { data: campaignData });
        const updateId = `upd_${Date.now()}`;
        await setDoc(doc(db, 'updates', updateId), {
          id: updateId,
          campaignId: campaignId || 'All',
          content: result,
          authorId: 'ai-copilot',
          authorName: 'AI Copilot',
          timestamp: new Date().toISOString(),
          clientVisible: false
        });
        addToast("Draft update saved to Updates panel.", "success");
      } else {
        result = await runAIAction(actionId, { message: action.label, appContext: {} });
      }

      await deductCredits(action.creditCost);
      
      const botMessage: Message = { 
        role: 'model', 
        content: `Applied Action: ${action.label}`,
        actionResult: result,
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
       addToast("Action failed: " + err.message, "error");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] lg:flex-row gap-8">
      {/* Sidebar - Context & Actions */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] space-y-6">
          <div>
            <h3 className="text-[10px] font-black text-[#555] uppercase tracking-widest mb-4">Credit Balance</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-500 fill-current" />
              </div>
              <div>
                <p className="text-xl font-black text-white italic">{workspace?.credits || 0}</p>
                <p className="text-[8px] font-black text-[#444] uppercase tracking-widest">Available Credits</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <h3 className="text-[10px] font-black text-[#555] uppercase tracking-widest mb-4">Quick Strategies</h3>
            <div className="space-y-2">
              {Object.values(AI_ACTIONS).map(action => (
                <button
                  key={action.id}
                  onClick={() => executeAction(action.id)}
                  className="w-full group flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all text-left"
                >
                  <div className="mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-white mb-0.5">{action.label}</h4>
                    <p className="text-[9px] text-[#555]">{action.creditCost} Credit</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-[32px]">
           <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="w-4 h-4 text-blue-500" />
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Current Scope</h3>
           </div>
           <ul className="space-y-3">
             {[
               'Campaign Analysis',
               'Brief Optimization',
               'Client Communications',
               'Workflow Automation'
             ].map(item => (
               <li key={item} className="flex items-center gap-2 text-[10px] font-bold text-[#555]">
                 <div className="w-1 h-1 bg-blue-500 rounded-full" />
                 {item}
               </li>
             ))}
           </ul>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col bg-white/[0.01] border border-white/5 rounded-[40px] overflow-hidden">
        {/* Workspace Header */}
        <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white italic uppercase tracking-tighter">Mission Control</h1>
              <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest">Connected to {campaignsList.length} active campaigns</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">System Online</span>
          </div>
        </div>

        {/* Console / Chat */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar"
        >
          {messages.map((m, i) => (
            <div key={i} className={cn(
              "flex flex-col gap-2",
              m.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "max-w-[80%] rounded-[32px] p-6 text-sm leading-relaxed",
                m.role === 'user' 
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-600/10 rounded-tr-none" 
                  : "bg-white/[0.03] text-[#CCC] border border-white/5 rounded-tl-none"
              )}>
                {m.content.split('\n').map((line, li) => (
                  <p key={li} className={li > 0 ? 'mt-3' : ''}>{line}</p>
                ))}
                
                {m.actionResult && (
                  <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-[10px] text-blue-400 overflow-x-auto">
                    {typeof m.actionResult === 'string' ? m.actionResult : JSON.stringify(m.actionResult, null, 2)}
                  </div>
                )}
                
                <div className="mt-4 flex items-center gap-2">
                   <p className={cn(
                     "text-[9px] font-black uppercase tracking-widest",
                     m.role === 'user' ? "text-blue-200" : "text-[#444]"
                   )}>
                     {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </p>
                   {m.role === 'model' && (
                     <div className="flex items-center gap-2 ml-auto">
                        <button className="p-1.5 hover:bg-white/5 rounded-lg text-[#333] hover:text-[#666] transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                     </div>
                   )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/[0.03] border border-white/5 rounded-[32px] rounded-tl-none p-6">
                <div className="flex gap-1.5">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Dock */}
        <div className="p-8 border-t border-white/5 bg-white/[0.01]">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[36px] blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3 p-3 bg-[#0F0F0F] border border-white/10 rounded-[32px] focus-within:border-blue-500/50 transition-all">
              <div className="pl-5 pr-2">
                <Sparkles className="w-5 h-5 text-[#333]" />
              </div>
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Request campaign drafts, analysis, or strategic support..."
                className="flex-1 bg-transparent py-4 text-sm text-white focus:outline-none placeholder:text-[#222]"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setInput("Can you summarize our most active campaign performance?")}
                  className="text-[10px] font-bold text-[#444] hover:text-blue-500 transition-colors uppercase tracking-widest border-b border-[#111] hover:border-blue-500/30 pb-0.5"
                >
                  "Summarize Active Performance"
                </button>
                <button 
                  onClick={() => setInput("What are our top 3 campaign angles right now?")}
                  className="text-[10px] font-bold text-[#444] hover:text-blue-500 transition-colors uppercase tracking-widest border-b border-[#111] hover:border-blue-500/30 pb-0.5"
                >
                  "Top Campaign Angles"
                </button>
             </div>
             
             <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-[#222]" />
                <p className="text-[10px] font-bold text-[#222] uppercase tracking-[0.2em]">OpsRelic Copilot v2.1 • Operational Intelligence</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
