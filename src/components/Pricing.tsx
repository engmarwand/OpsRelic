import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, X } from 'lucide-react';
import { PLANS as APP_PLANS } from '../lib/plans';
import { useAppContext } from '../lib/store';

const DISPLAY_PLANS = [
  { 
    id: APP_PLANS.starter.id, 
    name: 'Free', 
    price: 0, 
    description: 'Perfect for small creators starting their agency.',
    features: [
      '1 Active Campaign', 
      '500 Records per Month', 
      'Core Dashboard Analytics',
      'CSV Bulk Upload Tracking',
      'Standard Leaderboards'
    ],
    cta: 'Start Free Forever',
    color: '#888'
  },
  { 
    id: APP_PLANS.pro.id, 
    name: 'Pro', 
    price: 47, 
    description: 'For growing agencies managing multiple campaigns.',
    features: [
      '10 Active Campaigns', 
      '5,000 Records per Campaign',
      'Smart Sync (Deduplication)',
      'Custom Report Builder',
      'PDF & CSV Exporting',
      'Client White-Labeling'
    ], 
    popular: true,
    cta: 'Go Pro Now',
    color: '#3B82F6'
  },
  { 
    id: APP_PLANS.agency.id, 
    name: 'Agency', 
    price: 247, 
    description: 'The ultimate tool for high-volume clipping agencies.',
    features: [
      'Unlimited Campaigns', 
      'Unlimited Data Records',
      'Full Onboarding CRM',
      'White-label Brand Portal',
      'Custom Metric Labeling',
      'Dedicated Priority Sync'
    ],
    cta: 'Scale to Agency',
    color: '#F59E0B'
  },
];

export default function Pricing({ onClose, requiresAuth, onAuthRequired }: { onClose?: () => void, requiresAuth?: boolean, onAuthRequired?: () => void }) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { currentTier } = useAppContext();

  const handleGetStarted = (planId: string) => {
    if (requiresAuth && onAuthRequired) {
      onAuthRequired();
      return;
    }
    
    // Just close the modal or show a message if they try to upgrade from the modal
    if (onClose) onClose();
  };

  return (
    <div className="py-24 px-6 bg-[#050505] text-white overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[120px] translate-y-1/2"></div>

      <div className="max-w-xl mx-auto text-center mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-[#888] mb-6"
        >
          Simple Pricing
        </motion.div>
        <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">Scale Your Agency</h2>
        <p className="text-[#888] font-medium leading-relaxed text-lg">Choose the perfect plan to automate your clipper management and stop wasting hours on spreadsheets.</p>
        
        <div className="mt-10 flex items-center justify-center gap-4">
           <span className={`text-sm font-bold transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-[#444]'}`}>Monthly</span>
           <button 
             onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
             className="w-12 h-6 bg-white/10 rounded-full relative p-1 transition-colors hover:bg-white/20"
           >
             <motion.div 
               animate={{ x: billingCycle === 'monthly' ? 0 : 24 }}
               className="w-4 h-4 bg-white rounded-full shadow-lg"
             />
           </button>
           <span className={`text-sm font-bold transition-colors ${billingCycle === 'yearly' ? 'text-white' : 'text-[#444]'}`}>Yearly <span className="text-emerald-500 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full ml-1">SAVE 20%</span></span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto relative z-10">
        {DISPLAY_PLANS.map((plan, i) => {
          const isCurrentPlan = currentTier === plan.id;
          
          return (
          <motion.div 
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative bg-[#0A0A0A] p-10 rounded-[48px] border transition-all duration-500 ${plan.popular && !isCurrentPlan ? 'border-blue-500 shadow-[0_0_80px_-20px_rgba(37,99,235,0.15)] ring-1 ring-blue-500/50' : isCurrentPlan ? 'border-emerald-500/50 shadow-[0_0_40px_-10px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/30' : 'border-white/5 hover:border-white/20'}`}
          >
            {isCurrentPlan ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-xl z-20">
                Current Plan
              </div>
            ) : plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-xl z-20">
                Recommended
              </div>
            )}
            
            <div className="mb-10">
              <div className="text-xs font-black mb-4 uppercase tracking-[0.2em]" style={{ color: isCurrentPlan ? '#10B981' : plan.popular ? '#3B82F6' : '#555' }}>{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-6xl font-black tracking-tighter">
                  ${billingCycle === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price}
                </span>
                <span className="text-sm font-medium text-[#444]">/mo</span>
              </div>
              <p className="text-sm text-[#666] font-medium leading-relaxed">{plan.description}</p>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mb-8"></div>

            <ul className="space-y-4 mb-10">
              {plan.features.map(f => (
                <li key={f} className="text-[#888] flex items-start gap-3 group transition-colors hover:text-white">
                  <div className={`mt-1.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isCurrentPlan ? 'bg-emerald-500/20' : plan.popular ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                    <Check className={`w-2.5 h-2.5 ${isCurrentPlan ? 'text-emerald-500' : plan.popular ? 'text-blue-500' : 'text-[#444]'}`} />
                  </div>
                  <span className="text-sm font-medium tracking-tight">{f}</span>
                </li>
              ))}
            </ul>

            <button 
              className={`w-full py-5 rounded-[24px] font-black uppercase tracking-[0.15em] text-[10px] transition-all flex items-center justify-center gap-3 active:scale-95 ${isCurrentPlan ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default shadow-none pointer-events-none' : plan.popular ? 'bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-600/30 text-white' : 'bg-white text-black hover:bg-gray-200 shadow-xl'}`}
              onClick={() => { if (!isCurrentPlan) handleGetStarted(plan.id) }}
              disabled={isCurrentPlan}
            >
              {isCurrentPlan ? 'Current Plan' : plan.cta} {isCurrentPlan ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </motion.div>
        )})}
      </div>
      
      <div className="mt-20 text-center max-w-2xl mx-auto">
        <p className="text-[#444] text-[11px] font-bold uppercase tracking-[0.1em]">Trusted by 500+ clipping agencies worldwide</p>
      </div>
    </div>
  );
}
