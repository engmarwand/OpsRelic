import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wand2, X, Zap, Mail, Link as LinkIcon } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '../lib/toast';
import { Campaign, CampaignIntake, CampaignStatus } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface CampaignIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (campaign: Campaign) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  clientId?: string;
  clientName?: string;
  clientWebsite?: string;
}

export default function CampaignIntakeModal({ 
  isOpen, 
  onClose, 
  onCreated, 
  isLoading, 
  setIsLoading,
  clientId,
  clientName,
  clientWebsite
}: CampaignIntakeModalProps) {
  const { addToast } = useToast();
  const [flow, setFlow] = useState<'internal' | 'client' | null>(null);

  const handleCreateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const brandName = formData.get('brandName') as string;
    const budget = Number(formData.get('budget')) || 0;
    
    try {
      const campaignId = `id_camp_${Date.now()}`;
      const newCampaign: Campaign = {
        id: campaignId,
        userId: auth.currentUser.uid,
        clientId: clientId,
        name: brandName,
        status: 'Draft',
        budget,
        retainer: budget,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'campaigns', campaignId), newCampaign);
      
      const link = `${window.location.origin}/intake/${campaignId}`;
      navigator.clipboard.writeText(link);
      addToast("Intake link copied! Send it to the client.", "success");
      onCreated(newCampaign);
      onClose();
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitInternal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const intake: CampaignIntake = {
      brandName: formData.get('brandName') as string,
      website: formData.get('website') as string,
      productDescription: formData.get('productDescription') as string,
      mainOffer: formData.get('mainOffer') as string,
      targetAudience: formData.get('targetAudience') as string,
      campaignGoal: formData.get('campaignGoal') as string,
      platforms: formData.getAll('platforms') as string[],
      toneStyle: formData.get('toneStyle') as string,
      constraints: formData.get('constraints') as string,
    };
    const budget = Number(formData.get('budget')) || 0;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        You are an expert content marketing strategist.
        Create a professional campaign strategy for: ${intake.brandName}.
        Website: ${intake.website}
        Product: ${intake.productDescription}
        Audience: ${intake.targetAudience}
        Offer: ${intake.mainOffer}
        Goal: ${intake.campaignGoal}
        Platforms: ${intake.platforms.join(', ')}
        Tone: ${intake.toneStyle}

        Return JSON with:
        - campaignName: Reach name
        - objective: Primary kpi
        - summary: Strategy overview
        - angle: Creative hook
        - nextSteps: 3 clear actions (single string)
      `;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              campaignName: { type: Type.STRING },
              objective: { type: Type.STRING },
              summary: { type: Type.STRING },
              angle: { type: Type.STRING },
              nextSteps: { type: Type.STRING }
            },
            required: ["campaignName", "objective", "summary", "angle", "nextSteps"]
          }
        }
      });

      const draft = JSON.parse(aiResponse.text || "{}");
      const campaignId = `id_camp_${Date.now()}`;
      const newCampaign: Campaign = {
        id: campaignId,
        userId: auth.currentUser.uid,
        clientId: clientId, // Link to client
        name: draft.campaignName || intake.brandName,
        status: 'Draft',
        intake,
        budget,
        retainer: budget,
        brief: {
          summary: draft.summary,
          objective: draft.objective,
          angle: draft.angle,
          nextSteps: draft.nextSteps,
          platforms: intake.platforms,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'campaigns', campaignId), newCampaign);
      addToast("AI Strategy Generated!", "success");
      onCreated(newCampaign);
      onClose();
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#0A0A0A] border border-white/5 rounded-[48px] shadow-2xl p-10 relative my-auto"
      >
        <button onClick={() => { setFlow(null); onClose(); }} className="absolute top-8 right-8 text-[#555] hover:text-white p-2">
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-[22px] bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/20">
            <Wand2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">New Campaign {clientName ? `for ${clientName}` : ''}</h2>
            <p className="text-[10px] text-[#555] font-black uppercase tracking-[0.3em] mt-1">Growth Operational System</p>
          </div>
        </div>

        {!flow ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => setFlow('internal')}
              className="p-10 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-blue-500/50 hover:bg-blue-600/5 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <Zap className="w-5 h-5 text-blue-500 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">Architect Strategy</h3>
              <p className="text-[#555] text-xs font-medium leading-relaxed">I have the details. Let AI build the roadmap.</p>
            </button>

            <button 
              onClick={() => setFlow('client')}
              className="p-10 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-blue-500/50 hover:bg-blue-600/5 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <Mail className="w-5 h-5 text-[#444] group-hover:text-white" />
              </div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">Client Link</h3>
              <p className="text-[#555] text-xs font-medium leading-relaxed">Send a public link for the client to fill out.</p>
            </button>
          </div>
        ) : flow === 'client' ? (
          <form onSubmit={handleCreateLead} className="space-y-8">
             <div className="space-y-3">
                <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Client / Brand Name</label>
                <input name="brandName" defaultValue={clientName} required autoFocus placeholder="e.g. Acme Corp" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
             </div>
             <div className="space-y-3">
                <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Campaign Budget / Monthly Retainer ($)</label>
                <input name="budget" type="number" placeholder="2500" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
             </div>
             <button 
               type="submit" 
               disabled={isLoading}
               className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3"
             >
               {isLoading ? "Generating Link..." : "Generate Public Link"}
             </button>
             <button onClick={() => setFlow(null)} className="w-full text-[10px] font-black tracking-widest uppercase text-[#333] hover:text-[#555] transition-colors mt-4">Go Back</button>
          </form>
        ) : (
          <form onSubmit={handleSubmitInternal} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Brand Name</label>
                <input name="brandName" defaultValue={clientName} required placeholder="e.g. Acme Corp" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#222]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Website / Social</label>
                <input name="website" defaultValue={clientWebsite} required placeholder="e.g. acme.com" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#222]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">What do they sell?</label>
              <textarea name="productDescription" required placeholder="Describe product..." className="w-full h-24 bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all resize-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Main Offer</label>
              <input name="mainOffer" required placeholder="e.g. 50% Off First Month" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#222]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Audience</label>
                <input name="targetAudience" required placeholder="Target audience..." className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Goal</label>
                <input name="campaignGoal" required placeholder="Main goal..." className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Tone / Style</label>
                <input name="toneStyle" placeholder="e.g. Bold & Aggressive" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#222]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Constraints</label>
                <input name="constraints" placeholder="e.g. No profanity" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#222]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Campaign Budget ($)</label>
                <input name="budget" type="number" placeholder="2500" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#222]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Platforms</label>
                <div className="flex flex-wrap gap-2 p-2 bg-white/[0.02] border border-white/5 rounded-2xl">
                  {['TikTok', 'Instagram', 'YouTube', 'Twitter'].map(p => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" name="platforms" value={p} className="accent-blue-600 w-3 h-3" defaultChecked={p === 'TikTok'} />
                      <span className="text-[8px] font-bold text-[#444] group-hover:text-white transition-colors">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all"
            >
              {isLoading ? "AI Strategy Architecting..." : "Build Strategy"}
            </button>
            <button onClick={() => setFlow(null)} className="w-full text-[10px] font-black tracking-widest uppercase text-[#333] hover:text-[#555] transition-colors mt-4">Go Back</button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
