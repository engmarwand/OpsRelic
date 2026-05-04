import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../lib/store';
import { formatMoney } from '../lib/data';
import { cn } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../lib/toast';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle, TrendingUp, Save, Lock } from 'lucide-react';
import { PLANS, getFeatureMinTier } from '../lib/plans';

export default function Budget() {
  const { data, campaignsList, workspace, hasFeature, plan, setShowPricing } = useAppContext();
  const primaryColor = workspace?.color?.primary || '#3B82F6';
  const { addToast } = useToast();

  const isLocked = !hasFeature('budgetTracker');
  const minTier = 'pro';

  const campaigns: string[] = Array.from(new Set<string>(data.map(r => r.Campaign).filter(Boolean))).sort();

  // Aggregate spending by campaign
  const campaignSpending = useMemo(() => {
    const spending: Record<string, number> = {};
    data.filter(r => r.Status === 'Paid' || r.Status === 'Approved').forEach(r => {
      let amount = typeof r["Amount Paid"] === 'number' ? r["Amount Paid"] : parseFloat(String(r["Amount Paid"]).replace(/[^0-9.-]+/g,"")) || 0;
      spending[r.Campaign] = (spending[r.Campaign] || 0) + amount;
    });
    return spending;
  }, [data]);

  const campaignPending = useMemo(() => {
    const pending: Record<string, number> = {};
    data.filter(r => r.Status === 'Pending').forEach(r => {
      let amount = typeof r["Amount Paid"] === 'number' ? r["Amount Paid"] : parseFloat(String(r["Amount Paid"]).replace(/[^0-9.-]+/g,"")) || 0;
      pending[r.Campaign] = (pending[r.Campaign] || 0) + amount;
    });
    return pending;
  }, [data]);

  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [rates, setRates] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const b: Record<string, number> = {};
    const r: Record<string, number> = {};
    campaignsList.forEach(c => {
      b[c.name] = c.budget || 0;
      r[c.name] = c.rewardRate || 5;
    });
    setBudgets(b);
    setRates(r);
  }, [campaignsList]);

  const [setupForm, setSetupForm] = useState({ campaign: campaigns[0] || '', budget: '', rate: '' });

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupForm.campaign || !setupForm.budget) return;
    
    // Find campaign id
    const cObj = campaignsList.find(c => c.name === setupForm.campaign);
    if (!cObj) {
      addToast("Failed to find campaign to update.", "error");
      return;
    }

    try {
      await updateDoc(doc(db, 'campaigns', cObj.id), {
        budget: parseFloat(setupForm.budget),
        rewardRate: setupForm.rate ? parseFloat(setupForm.rate) : 5
      });
      addToast("Budget saved successfully.", "success");
      setSetupForm({ ...setupForm, budget: '', rate: '' });
    } catch (e: any) {
      addToast(e.message || "Failed to update budget.", "error");
    }
  };

  const totalAllocated = (Object.values(budgets) as number[]).reduce((a: number, b: number) => a + (Number(b) || 0), 0);

  if (data.length === 0 && !isLocked) {
    return <div className="text-center p-12 text-[#888]">No data available. Please upload a CSV.</div>;
  }

  // Check for critical budgets to show alert
  const criticalCampaigns = campaigns.filter(c => {
    const spent = campaignSpending[c] || 0;
    const allocated = budgets[c] || 0;
    return allocated > 0 && spent / allocated >= 0.8;
  });

  return (
    <div className="space-y-8 relative">
      {/* Locked Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-start pt-32 text-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto bg-[#0F0F0F] p-12 rounded-[48px] border border-white/5 shadow-2xl max-w-lg mx-6 group transition-all hover:scale-[1.02] hover:border-emerald-500/20"
          >
            <div className="w-24 h-24 bg-emerald-500/10 rounded-[32px] flex items-center justify-center mb-8 border border-emerald-500/20 mx-auto group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <TrendingUp className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-display font-black text-white tracking-tight mb-4">Budget Management</h2>
            <p className="text-[#666] font-bold leading-relaxed mb-10 text-sm uppercase tracking-tight">
              Keep your agency profitable with automated budget tracking. 
              <span className="text-emerald-500 block mt-2 mt-1">Pro users get real-time overspend alerts.</span>
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setShowPricing(true)}
                className="w-full py-5 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/30 active:scale-95"
              >
                Unlock Pro Features
              </button>
              <p className="text-[9px] text-[#444] font-black uppercase tracking-[0.3em]">Scalable tools for high-growth agencies</p>
            </div>
          </motion.div>
        </div>
      )}

      <div className={`${isLocked ? 'opacity-20 grayscale-[0.8] blur-[4px] pointer-events-none select-none' : ''}`}>
      {/* 4D. Alert banner */}
      {criticalCampaigns.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/20 rounded-[32px] p-6 flex items-start gap-5 relative overflow-hidden backdrop-blur-sm"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2"></div>
          <div className="shrink-0 w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-red-500 font-black uppercase tracking-widest text-xs mb-2">Budget Alert</h3>
            <p className="text-red-300/80 text-sm font-bold tracking-tight leading-relaxed max-w-2xl">
              Some campaigns are nearing their budget limit: <span className="text-white font-black">{criticalCampaigns.join(', ')}</span>. 
              Review your settings to avoid going over.
            </p>
          </div>
        </motion.div>
      )}

      {/* 4A. Budget setup form */}
      <div className="bg-[#0A0A0A] border border-white/5 shadow-2xl rounded-[40px] p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="flex items-center gap-3 mb-8">
           <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
             <Save className="w-4 h-4 text-blue-500" />
           </div>
           <h3 className="font-black text-xs uppercase tracking-[0.3em] text-[#555]">Set Campaign Budgets</h3>
        </div>
        <form onSubmit={handleSaveBudget} className="grid grid-cols-1 md:grid-cols-4 items-end gap-6">
          <div className="relative">
            <label className="block text-[10px] font-black text-[#444] uppercase tracking-widest mb-3">Select Campaign</label>
            <select 
              value={setupForm.campaign}
              onChange={e => setSetupForm({...setupForm, campaign: e.target.value})}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <option value="" disabled className="bg-[#0A0A0A]">Choose Campaign...</option>
              {campaigns.map(c => <option key={c} value={c} className="bg-[#0A0A0A]">{c}</option>)}
            </select>
          </div>
          <div className="relative">
            <label className="block text-[10px] font-black text-[#444] uppercase tracking-widest mb-3">Budget Cap ($)</label>
            <input 
              type="number" 
              placeholder="10000"
              value={setupForm.budget}
              onChange={e => setSetupForm({...setupForm, budget: e.target.value})}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/[0.05] transition-all"
            />
          </div>
          <div className="relative">
            <label className="block text-[10px] font-black text-[#444] uppercase tracking-widest mb-3">Reward Rate ($/1k)</label>
            <input 
              type="number" 
              placeholder="5.00"
              value={setupForm.rate}
              onChange={e => setSetupForm({...setupForm, rate: e.target.value})}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 hover:bg-white/[0.05] transition-all"
            />
          </div>
          <button type="submit" disabled={!setupForm.campaign || !setupForm.budget} className="w-full bg-blue-600 shadow-xl shadow-blue-600/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3">
            <Save className="w-4 h-4" /> Save Budget
          </button>
        </form>
      </div>

      <div className="flex justify-between items-center bg-[#0A0A0A] px-10 py-10 rounded-[48px] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-600/10 transition-colors"></div>
        <h2 className="font-display font-black text-4xl tracking-tighter text-white uppercase italic leading-none">Campaign Budgets</h2>
        <div className="flex items-center gap-10">
          <div className="h-16 w-px bg-white/5 mx-2"></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#333] mb-2">Total Allocated</p>
            <span className="text-white text-4xl font-display font-black tabular-nums tracking-tighter italic">{formatMoney(totalAllocated)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {campaigns.map(c => {
          const spent = campaignSpending[c] || 0;
          const pending = campaignPending[c] || 0;
          const allocated = budgets[c] || 0;
          const pct = allocated > 0 ? Math.min(100, (spent / allocated) * 100) : 0;
          const projectedPct = allocated > 0 ? Math.min(100, ((spent + pending) / allocated) * 100) : 0;
          
          let alertLevel = 0; // 0 normal, 1 warning, 2 critical
          let ringColor = "#3B82F6"; // blue-500
          
          if (pct >= 90) {
            alertLevel = 2;
            ringColor = "#EF4444"; // red-500
          } else if (pct >= 75) {
            alertLevel = 1;
            ringColor = "#F59E0B"; // amber-500
          }

          // SVG geometry for the progress ring
          const radius = 60;
          const strokeWidth = 14;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (pct / 100) * circumference;

          return (
            <div key={c} className="bg-[#0A0A0A] border border-white/5 shadow-2xl rounded-[48px] p-10 flex flex-col relative group hover:bg-[#0F0F0F] transition-all duration-500 hover:border-white/10 hover:-translate-y-2">
              <div className="flex justify-between items-start mb-10">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-display font-black text-2xl text-white mb-2 truncate tracking-tight group-hover:text-blue-500 transition-colors" title={c}>{c}</h3>
                  <div className="flex flex-wrap gap-2">
                    {rates[c] && (
                      <div className="px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-blue-500">
                        {formatMoney(rates[c])} / 1k
                      </div>
                    )}
                    <div className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                      alertLevel === 2 ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                      alertLevel === 1 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    )}>
                      {alertLevel === 2 ? 'High Spend' : alertLevel === 1 ? 'Approaching Cap' : 'Optimized'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4B. Progress Ring */}
              <div className="flex flex-col items-center justify-center p-6 relative">
                 <svg className="w-48 h-48 -rotate-90" viewBox="0 0 150 150">
                   {/* Glow Layer */}
                   <circle 
                     cx="75" cy="75" r={radius} fill="transparent" 
                     stroke={ringColor} strokeWidth={strokeWidth} 
                     className="opacity-10 blur-md"
                   />
                   {/* Background track */}
                   <circle 
                     cx="75" cy="75" r={radius} fill="transparent" 
                     stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} 
                     strokeLinecap="round"
                   />
                   {/* Progress track */}
                   <motion.circle 
                     initial={{ strokeDashoffset: circumference }}
                     animate={{ strokeDashoffset }}
                     cx="75" cy="75" r={radius} fill="transparent" 
                     stroke={ringColor} strokeWidth={strokeWidth}
                     strokeDasharray={circumference}
                     strokeLinecap="round"
                     transition={{ duration: 1.5, ease: "circOut" }}
                   />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-display font-black tracking-tighter tabular-nums" style={{ color: ringColor }}>{pct.toFixed(0)}%</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#333] mt-2 group-hover:text-[#555] transition-colors">Budget Used</span>
                 </div>
              </div>
              
              <div className="mt-8 space-y-2 text-center">
                <p className="font-black text-white tabular-nums tracking-tighter text-xl">
                  {formatMoney(spent)} <span className="text-[#333] font-black text-sm uppercase align-middle mx-1">/</span> {formatMoney(allocated)}
                </p>
                <div className="flex items-center justify-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   <p className="text-[#555] text-[10px] font-black uppercase tracking-[0.1em]">{formatMoney(allocated - spent)} remaining budget</p>
                </div>
              </div>

              {/* 4C. Projections */}
              <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
                 <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                   <span className="text-[#444]">Projected Drain</span>
                   <span className="text-white tabular-nums">{formatMoney(spent + pending)}</span>
                 </div>
                 
                 <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${projectedPct}%` }}
                      className={cn("h-full rounded-full transition-all duration-1000", projectedPct > 90 ? "bg-red-500" : "bg-blue-500/40")}
                    ></motion.div>
                 </div>
                 
                 <div className="pt-4">
                   {projectedPct > 100 ? (
                     <button className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-red-500 hover:text-white active:scale-95">Stop Approvals</button>
                   ) : alertLevel >= 1 ? (
                     <button className="w-full bg-blue-600/10 text-blue-500 border border-blue-600/20 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-600 hover:text-white active:scale-95">Add Budget</button>
                   ) : (
                     <div className="w-full bg-white/[0.03] text-[#333] border border-white/5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">Budget OK</div>
                   )}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
     </div>
    </div>
  );
}
