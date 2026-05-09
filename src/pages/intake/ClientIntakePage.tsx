import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Wand2, Zap, CheckCircle2, AlertCircle, Terminal } from 'lucide-react';
import { Campaign, CampaignIntake, CampaignStatus } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";

export default function ClientIntake() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campaignId = window.location.pathname.split('/').pop();

  useEffect(() => {
    async function fetchCampaign() {
      if (!campaignId) {
        setError("Invalid link structure.");
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'campaigns', campaignId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Campaign;
          if (data.status === 'Active' || data.status === 'Complete') {
            setError("This intake form has already been finalized.");
          } else {
            setCampaign(data);
          }
        } else {
          setError("Campaign not found. The link may have expired.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load intake form.");
      } finally {
        setLoading(false);
      }
    }

    fetchCampaign();
  }, [campaignId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!campaign) return;
    setSubmitting(true);

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
      submittedAt: new Date().toISOString(),
    };

    try {
      // 1. AI Strategy Generation (Client-Side for simplicity in this turn)
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        You are an expert content marketing strategist. 
        Create a professional campaign brief for: ${intake.brandName}.
        Audience: ${intake.targetAudience}
        Offer: ${intake.mainOffer}
        Goal: ${intake.campaignGoal}
        Tone: ${intake.toneStyle}
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

      // 2. Update Firestore
      const campRef = doc(db, 'campaigns', campaign.id);
      await updateDoc(campRef, {
        intake,
        status: 'Intake Completed',
        name: draft.campaignName || intake.brandName,
        brief: {
          summary: draft.summary,
          objective: draft.objective,
          angle: draft.angle,
          nextSteps: draft.nextSteps,
          platforms: intake.platforms,
        },
        updatedAt: new Date().toISOString()
      });

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-[32px] flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tight">Access Restricted</h1>
          <p className="text-[#555] text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md space-y-8"
        >
          <div className="w-24 h-24 bg-emerald-500/10 rounded-[40px] flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_50px_-10px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Onboarding Confirmed</h1>
            <p className="text-[#666] text-sm leading-relaxed">Our AI strategist is now architecting your campaign roadmap. Your account manager will be in touch shortly with the finalized brief.</p>
          </div>
          <div className="pt-6 border-t border-white/5">
             <p className="text-[10px] text-[#333] font-black uppercase tracking-[0.4em]">OpsRelic | Autonomous Operations</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 py-20 relative overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[600px] h-[600px] bg-emerald-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05)_0,transparent_70%)]"></div>
      </div>
      
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl bg-[#0A0A0A]/40 backdrop-blur-3xl border border-white/5 rounded-[56px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] p-12 lg:p-20 relative z-10"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[28px] bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/30">
              <Terminal className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Campaign Intake</h1>
              <p className="text-[11px] text-[#555] font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                Mission Architecture 
                <span className="w-1 h-1 rounded-full bg-[#222]"></span>
                REF: {campaign?.id.substring(0,8).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] text-[#333] font-black uppercase tracking-widest">Powered by</p>
            <p className="text-[14px] text-[#888] font-black italic tracking-tighter uppercase grayscale opacity-50">OpsRelic AI</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Legal Brand Name</label>
              <input name="brandName" required placeholder="e.g. HyperGrowth Labs" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Website / Primary Social</label>
              <input name="website" required placeholder="e.g. hypergrowth.io" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Product Origin & Value Prop</label>
            <textarea name="productDescription" required placeholder="What are we selling and why does it matter?" className="w-full h-32 bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a] resize-none shadow-inner" />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Primary Market Offer</label>
            <input name="mainOffer" required placeholder="e.g. 14-Day Free Scale Test" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Ideal Customer Profile</label>
              <input name="targetAudience" required placeholder="e.g. DTC Founders, $500k+ /yr" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Primary Campaign KPI</label>
              <input name="campaignGoal" required placeholder="e.g. Direct ROAS 3.0+" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
            </div>
          </div>

          <div className="space-y-4">
             <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Distribution Channels</label>
             <div className="flex flex-wrap gap-4">
                {['TikTok', 'Instagram', 'YouTube', 'X / Twitter'].map(p => (
                  <label key={p} className="flex-1 min-w-[140px] relative group cursor-pointer">
                    <input type="checkbox" name="platforms" value={p} className="peer sr-only" defaultChecked={p === 'TikTok'} />
                    <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-center transition-all peer-checked:border-blue-500/50 peer-checked:bg-blue-600/10 group-hover:bg-white/[0.04]">
                       <span className="text-xs font-bold text-[#444] peer-checked:text-blue-400 group-hover:text-white transition-colors">{p}</span>
                    </div>
                  </label>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Creative Direction / Tone</label>
              <input name="toneStyle" placeholder="e.g. Fast-paced, Brutally Honest" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-[#333] uppercase tracking-widest ml-1">Operational No-Gos</label>
              <input name="constraints" placeholder="e.g. No static images, No AI voiceover" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-[#1a1a1a]" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-3xl text-[12px] font-black uppercase tracking-[0.4em] transition-all shadow-[0_20px_40px_rgba(37,99,235,0.2)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Initializing AI Strategy...
              </>
            ) : (
              <>
                Confirm Intake & Begin Deployment
                <Zap className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-16 text-center">
           <p className="text-[9px] text-[#222] font-black uppercase tracking-[0.5em]">This is a secure military-grade operational portal</p>
        </div>
      </motion.div>
    </div>
  );
}
