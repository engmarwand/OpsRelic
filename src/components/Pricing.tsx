import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';

const PLANS = [
  { id: 'plan_E5ffPT5SleRuU', name: 'Starter', price: 47, features: ['CSV Upload', 'Campaign Reports'] },
  { id: 'plan_3abAVC0tgumce', name: 'Pro', price: 97, features: ['Everything in Starter', 'AI Insights', 'Budget Tracker'], popular: true },
  { id: 'plan_5bnzRrzNEhrt7', name: 'Agency', price: 297, features: ['Everything in Pro', 'Custom Domains', 'Report Reordering'] },
];

export default function Pricing({ onClose, requiresAuth, onAuthRequired }: { onClose?: () => void, requiresAuth?: boolean, onAuthRequired?: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleGetStarted = (planId: string) => {
    if (requiresAuth && onAuthRequired) {
      onAuthRequired();
      return;
    }
    setSelectedPlan(planId);
  };

  const closeModal = () => {
    setSelectedPlan(null);
    if (onClose) onClose();
  };

  return (
    <div className="py-24 px-6 bg-[#050505] text-white">
      <h2 className="text-4xl md:text-5xl font-black tracking-tight text-center mb-16">Choose Your Plan</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {PLANS.map((plan) => (
          <motion.div 
            key={plan.name}
            className={`relative bg-[#0A0A0A] p-8 rounded-3xl border ${plan.popular ? 'border-blue-500' : 'border-white/10'} flex flex-col`}
            whileHover={{ y: -10 }}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-400 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                Most Popular
              </div>
            )}
            <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
            <div className="text-4xl font-black mb-8">${plan.price}<span className="text-sm font-medium text-[#555]">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map(f => (
                <li key={f} className="text-[#888] flex items-center gap-2"><Check className="w-5 h-5 text-blue-500" /> {f}</li>
              ))}
            </ul>
            <button 
              className={`w-full py-4 rounded-xl font-bold transition-all ${plan.popular ? 'bg-blue-600 hover:bg-blue-500' : 'bg-white/5 hover:bg-white/10'}`}
              onClick={() => handleGetStarted(plan.id)}
            >
              Get Started
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPlan && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={closeModal}
          >
            <div 
              className="bg-[#0A0A0A] p-6 rounded-3xl w-full max-w-md relative"
              onClick={e => e.stopPropagation()}
            >
              <button className="absolute top-4 right-4 text-[#555] hover:text-white" onClick={closeModal}><X /></button>
              <div data-whop-checkout-plan-id={selectedPlan} data-whop-checkout-theme="dark"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
