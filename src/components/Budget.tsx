import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../lib/store';
import { formatMoney } from '../lib/data';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../lib/toast';
import { AlertTriangle, CheckCircle, TrendingUp, Save, Lock } from 'lucide-react';
import { PLANS, getFeatureMinTier } from '../lib/plans';

export default function Budget() {
  const { data, campaignsList, workspace, hasFeature, plan } = useAppContext();
  const primaryColor = workspace?.color?.primary || '#3B82F6';
  const { addToast } = useToast();

  if (!hasFeature('budgetTracker')) {
    const minTier = getFeatureMinTier('budgetTracker');
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
          <Lock className="w-8 h-8 text-[#555]" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Budget Tracker Locked</h2>
        <p className="text-[#888] max-w-md mx-auto mb-6">
          Your current <span className="font-bold text-white capitalize">{plan.name}</span> plan does not include the Budget Tracker. 
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

  if (data.length === 0) {
    return <div className="text-center p-12 text-[#888]">No data available. Please upload a CSV.</div>;
  }

  // Check for critical budgets to show alert
  const criticalCampaigns = campaigns.filter(c => {
    const spent = campaignSpending[c] || 0;
    const allocated = budgets[c] || 0;
    return allocated > 0 && spent / allocated >= 0.8;
  });

  return (
    <div className="space-y-6">
      {/* 4D. Alert banner */}
      {criticalCampaigns.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-500 font-bold mb-1 tracking-wide">Budget Alert</h3>
            <p className="text-red-200 text-sm">
              Multiple campaigns are nearing their budget limits: {criticalCampaigns.join(', ')}. 
              Review pending clips to prevent overspending.
            </p>
          </div>
        </div>
      )}

      {/* 4A. Budget setup form */}
      <div className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl p-6">
        <h3 className="font-semibold text-lg mb-4">Set Campaign Budget</h3>
        <form onSubmit={handleSaveBudget} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full relative">
            <label className="block text-xs font-medium text-[#888] mb-1.5">Select Campaign</label>
            <select 
              value={setupForm.campaign}
              onChange={e => setSetupForm({...setupForm, campaign: e.target.value})}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="" disabled>Select...</option>
              {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1 w-full relative">
            <label className="block text-xs font-medium text-[#888] mb-1.5">Budget Cap ($)</label>
            <input 
              type="number" 
              placeholder="10000"
              value={setupForm.budget}
              onChange={e => setSetupForm({...setupForm, budget: e.target.value})}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
            />
          </div>
          <div className="flex-1 w-full relative">
            <label className="block text-xs font-medium text-[#888] mb-1.5">Reward Rate ($ / 1k views)</label>
            <input 
              type="number" 
              placeholder="5.00"
              value={setupForm.rate}
              onChange={e => setSetupForm({...setupForm, rate: e.target.value})}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
            />
          </div>
          <button type="submit" disabled={!setupForm.campaign || !setupForm.budget} className="shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-opacity flex items-center justify-center gap-2 h-[42px] whitespace-nowrap" style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}33` }}>
            <Save className="w-4 h-4" /> Save Budget
          </button>
        </form>
      </div>

      <div className="flex justify-between items-center bg-[#111] p-6 rounded-2xl border border-white/[0.05] shadow-lg">
        <h2 className="font-bold text-lg tracking-wide">Budget Overview</h2>
        <div className="text-sm font-medium text-[#888]">
          Total Allocation: <span className="text-white text-lg tabular-nums border-l border-white/10 pl-3 ml-2">{formatMoney(totalAllocated)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map(c => {
          const spent = campaignSpending[c] || 0;
          const pending = campaignPending[c] || 0;
          const allocated = budgets[c] || 0;
          const pct = allocated > 0 ? Math.min(100, (spent / allocated) * 100) : 0;
          const projectedPct = allocated > 0 ? Math.min(100, ((spent + pending) / allocated) * 100) : 0;
          
          let alertLevel = 0; // 0 normal, 1 warning, 2 critical
          let statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
          let ringColor = "#10B981"; // emerald-500
          
          if (pct >= 90) {
            alertLevel = 2;
            statusColor = "text-red-500 bg-red-500/10 border-red-500/20";
            ringColor = "#EF4444"; // red-500
          } else if (pct >= 75) {
            alertLevel = 1;
            statusColor = "text-orange-500 bg-orange-500/10 border-orange-500/20";
            ringColor = "#F97316"; // orange-500
          }

          // SVG geometry for the progress ring
          const radius = 50;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (pct / 100) * circumference;

          return (
            <div key={c} className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl p-8 flex flex-col relative group hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-semibold text-white mb-1 truncate max-w-[180px]" title={c}>{c}</h3>
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex flex-col gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${statusColor}`}>
                      {alertLevel === 2 ? 'Action Required' : alertLevel === 1 ? 'Approaching Limit' : 'On Track'}
                    </div>
                    {rates[c] && (
                      <div className="inline-flex flex-col gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border" style={{ color: primaryColor, backgroundColor: `${primaryColor}1A`, borderColor: `${primaryColor}33` }}>
                        {formatMoney(rates[c])} / 1k views
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4B. Progress Ring */}
              <div className="flex flex-col items-center justify-center py-4 relative">
                 <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                   {/* Background track */}
                   <circle 
                     cx="60" cy="60" r="50" fill="transparent" 
                     stroke="#2A2A2A" strokeWidth="12" 
                   />
                   {/* Progress track */}
                   <circle 
                     cx="60" cy="60" r="50" fill="transparent" 
                     stroke={ringColor} strokeWidth="12"
                     strokeDasharray={circumference}
                     strokeDashoffset={strokeDashoffset}
                     strokeLinecap="round"
                     className="transition-all duration-1000 ease-out"
                   />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold tabular-nums" style={{ color: ringColor }}>{pct.toFixed(0)}%</span>
                 </div>
                 
                 <div className="text-center mt-4 space-y-1">
                   <p className="font-semibold text-white tabular-nums tracking-wide">{formatMoney(spent)} <span className="text-[#555] text-xs font-normal">of</span> {formatMoney(allocated)}</p>
                   <p className="text-[#888] text-xs tabular-nums tracking-wide">{formatMoney(allocated - spent)} remaining</p>
                 </div>
              </div>

              {/* 4C. Projections */}
              <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#888]">Pending Approvals:</span>
                   <span className="text-white font-medium tabular-nums text-orange-400">{formatMoney(pending)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#888]">Projected Total:</span>
                   <span className="text-white font-medium tabular-nums">{formatMoney(spent + pending)}</span>
                 </div>
                 
                 <div className="flex gap-2 mt-4 pt-2">
                   {projectedPct > 100 ? (
                     <button className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors hover:bg-red-500/20">Pause Approvals</button>
                   ) : alertLevel >= 1 ? (
                     <button className="flex-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors hover:bg-orange-500/20">Increase Budget</button>
                   ) : (
                     <button className="flex-1 bg-white/5 text-[#888] border border-white/10 py-1.5 rounded text-xs font-bold uppercase tracking-wider cursor-default">On Track</button>
                   )}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
