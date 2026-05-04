import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Database, Users, TrendingUp, Zap, CheckCircle2, DollarSign, LayoutDashboard, Mail, Lock, User, ArrowRight, XCircle, X, Wallet, FileText, Activity, PieChart } from 'lucide-react';
import { cn } from '../lib/utils';
import Pricing from './Pricing';

export default function Landing() {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [showChaos, setShowChaos] = useState(true);

  // Animated background lines
  const BackgroundLines = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />
      <div className="absolute top-0 left-2/4 w-[1px] h-full bg-gradient-to-b from-transparent via-blue-600/50 to-transparent" />
      <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />
    </div>
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setShowChaos(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 overflow-x-hidden">
      <BackgroundLines />

      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="OpsRelic Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-blue-500/20" />
            <span className="font-bold text-xl tracking-tight">OpsRelic</span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setAuthMode('login')}
              className="text-sm font-semibold text-[#888] hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => setAuthMode('signup')}
              className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:scale-105 transition-transform"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 z-10 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            OpsRelic 2.0 is live
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-8">
            Stop Managing Creators in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-700">Spreadsheets.</span>
          </h1>
          <p className="text-xl md:text-2xl text-[#888] mb-12 max-w-2xl mx-auto font-medium">
            Automate clip tracking, payout calculation, and onboarding so you can scale your short-form agency without the chaos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => setAuthMode('signup')}
              className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-[0_0_40px_rgba(37,99,235,0.4)] active:scale-95 w-full sm:w-auto"
            >
              Get Started <ArrowRight className="w-6 h-6" />
            </button>
            <button 
              onClick={() => {
                 document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-10 py-5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 w-full sm:w-auto"
            >
              View System Demo
            </button>
          </div>

          <div className="mt-20 pt-10 border-t border-white/5 max-w-4xl mx-auto">
            <p className="text-[10px] font-black text-[#333] uppercase tracking-[0.4em] mb-10 text-center">Engineered for Fast Growing Clipping Agencies</p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-20 items-center opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
               <div className="flex items-center gap-2 font-black text-xl text-white tracking-tighter"><Zap className="w-7 h-7 text-blue-500" /> VIRAL<span>OPS</span></div>
               <div className="flex items-center gap-2 font-black text-xl text-white tracking-widest uppercase"><TrendingUp className="w-7 h-7 text-emerald-500" /> SCALER</div>
               <div className="flex items-center gap-2 font-black text-2xl tracking-tight text-white italic">NEXUS<span>CORE</span></div>
               <div className="flex items-center gap-1 font-black text-xl text-white"><Users className="w-7 h-7 text-purple-500" /> SOCIAL<span>GROW</span></div>
            </div>
          </div>
        </motion.div>

        {/* Interactive Features Hero Bento Grid */}
        <div id="demo-section" className="mt-32 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-20">
          
          {/* Box 1: Data Chaos to Order (Toggle) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="col-span-1 lg:col-span-2 bg-[#0A0A0A] rounded-[48px] border border-white/5 overflow-hidden shadow-2xl relative h-[480px] group cursor-pointer hover:border-blue-500/30 transition-colors"
            onClick={() => setShowChaos(!showChaos)}
          >
            <div className="p-10 absolute inset-0 z-40 pointer-events-none flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-500 mb-4">Auto Tracking</div>
                <h3 className="text-white font-black text-4xl tracking-tighter leading-none mb-4">Eliminate Spreadsheet Chaos</h3>
                <p className="text-[#555] font-bold text-sm tracking-tight max-w-sm">Stop fighting broken formulas and manual entry. OpsRelic auto-detects patterns and keeps your data accurate.</p>
              </div>
              <div className="self-end bg-blue-600/10 backdrop-blur-xl border border-blue-500/20 text-blue-500 text-[10px] px-6 py-3 rounded-full font-black tracking-widest uppercase shadow-2xl pointer-events-auto hover:bg-blue-600 hover:text-white transition-all shadow-blue-600/20">
                {showChaos ? 'Fix My Data ✨' : 'See The Mess 💥'}
              </div>
            </div>

            <div className="absolute inset-0 pt-32 px-10 pb-10">
              <AnimatePresence mode="wait">
                {showChaos ? (
                    <motion.div 
                      key="chaos"
                      initial={{ opacity: 0, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                      className="h-full bg-white rounded-3xl p-6 flex flex-col font-mono text-[10px] overflow-hidden shadow-inner relative border border-gray-200"
                    >
                      <div className="absolute inset-0 bg-red-500/5 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all">
                        <span className="bg-red-500/10 backdrop-blur-md text-red-500 border border-red-500/20 px-8 py-4 rounded-2xl font-black text-2xl shadow-xl flex items-center gap-3 animate-pulse uppercase tracking-tight">
                          <XCircle className="w-8 h-8" /> Data Overflow
                        </span>
                      </div>
                      <div className="flex border-b border-gray-300 bg-gray-100 text-gray-500 h-10 items-center">
                        <div className="w-8 border-r border-gray-300 bg-gray-200"></div>
                        {['Campaign_ID', 'Creator_Ref', 'Metric_A', 'Status_Bit', 'Calculated'].map(c => <div key={c} className="flex-1 px-4 border-r border-gray-300 font-black truncate text-[9px] uppercase">{c}</div>)}
                      </div>
                      {Array.from({length: 8}).map((_, i) => (
                        <div key={i} className="flex border-b border-gray-200 text-black h-10 whitespace-nowrap items-center">
                          <div className="w-8 border-r border-gray-300 bg-gray-100 text-center text-gray-400 font-bold">{i+1}</div>
                          <div className="flex-1 px-4 border-r border-gray-200 truncate opacity-40">NODE_{Math.random().toString(36).substr(2, 5).toUpperCase()}</div>
                          <div className="flex-1 px-4 border-r border-gray-200 text-red-500 font-black bg-red-50">#VALUE!</div>
                          <div className="flex-1 px-4 border-r border-gray-200 text-blue-600 underline truncate italic opacity-30">ERR_UNDEFINED</div>
                          <div className="flex-1 px-4 border-r border-gray-200 bg-yellow-50">{Math.floor(Math.random() * 50000)}</div>
                          <div className="flex-1 px-4 border-r border-gray-200 truncate font-black text-red-600">NULL</div>
                        </div>
                      ))}
                    </motion.div>
                ) : (
                  <motion.div 
                      key="opsrelic"
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5, ease: "circOut" }}
                      className="h-full bg-[#0F0F0F] border border-white/10 rounded-3xl p-8 flex flex-col font-sans relative shadow-inner overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                      <div className="flex justify-between items-center mb-8 z-20">
                        <div className="bg-[#0A0A0A] border border-blue-600/30 rounded-2xl py-3 px-6 shadow-2xl flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                             <Wallet className="w-5 h-5 text-blue-500" />
                           </div>
                           <div>
                            <p className="text-[9px] text-[#3B82F6] font-black uppercase tracking-[0.2em] mb-0.5">Total Payouts</p>
                            <p className="text-2xl font-black text-white tabular-nums tracking-tighter">$14,250.00</p>
                           </div>
                        </div>
                      </div>

                      <div className="flex-1 border border-white/5 rounded-2xl overflow-hidden flex flex-col bg-black/40 backdrop-blur-md">
                        <div className="flex items-center h-12 border-b border-white/5 text-[#333] text-[9px] font-black uppercase tracking-[0.2em] px-6">
                          <div className="w-8"></div>
                          <div className="flex-[2]">Creator</div>
                          <div className="flex-1 text-right">Views</div>
                          <div className="flex-1 text-right">Payout</div>
                        </div>
                        <div className="flex-1 space-y-1 p-2">
                          {Array.from({length: 4}).map((_, i) => (
                              <div key={i} className="flex items-center h-14 border border-transparent hover:border-blue-500/20 hover:bg-blue-500/5 rounded-xl px-4 text-xs group/row transition-all duration-300">
                                <div className="w-8 flex items-center justify-center opacity-30 group-hover/row:opacity-100"><Database className="w-4 h-4 text-blue-500" /></div>
                                <div className="flex-[2] font-black text-white truncate tracking-tight uppercase">@Clipper_0{i + 1}</div>
                                <div className="flex-1 text-right font-black text-[#555] group-hover/row:text-white transition-colors">{Math.floor(Math.random() * 100)}K Views</div>
                                <div className="flex-1 text-right text-emerald-500 font-black tracking-tighter text-sm">${Math.floor(Math.random() * 500)}.00</div>
                              </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="absolute inset-0 bg-blue-600/5 backdrop-blur-[2px] flex items-center justify-center pointer-events-none rounded-3xl z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black text-xl shadow-[0_0_50px_rgba(37,99,235,0.4)] flex items-center gap-4 active:scale-95 transition-transform">
                          <CheckCircle2 className="w-8 h-8" /> Sync Complete
                        </div>
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Box 2: Budget Tracker (Interactive progress bars) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="col-span-1 bg-[#0A0A0A] rounded-[48px] border border-white/5 p-10 shadow-2xl relative h-[480px] overflow-hidden group cursor-pointer hover:border-emerald-500/30 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-600/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-6 w-fit">Budget Control</div>
              <h3 className="text-white font-black text-3xl tracking-tighter mb-4 group-hover:text-emerald-400 transition-colors leading-none">
                Expense Alerts
              </h3>
              <p className="text-[#555] font-bold text-sm mb-10 tracking-tight">Real-time depletion alerts prevent over-payouts before they trigger.</p>
              
              <div className="space-y-6 flex-1">
                {[
                  { name: 'Campaign A', total: '$10k', percent: 88, color: 'bg-red-500' },
                  { name: 'Campaign B', total: '$50k', percent: 42, color: 'bg-emerald-500' },
                  { name: 'Campaign C', total: '$25k', percent: 68, color: 'bg-blue-500' },
                ].map((budget, i) => (
                  <div key={i} className="bg-black/40 border border-white/5 p-5 rounded-2xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all">
                    <div className="flex justify-between items-center mb-3">
                       <span className="text-xs font-black text-white uppercase tracking-widest group-hover:text-emerald-300">{budget.name}</span>
                       <span className="text-[10px] font-black text-[#333] tabular-nums">{budget.total}</span>
                    </div>
                    <div className="h-2 w-full bg-black rounded-full overflow-hidden">
                      <motion.div 
                         initial={{ width: 0 }}
                         whileInView={{ width: `${budget.percent}%` }}
                         transition={{ duration: 1.2, delay: 0.5 + (i * 0.2), ease: "circOut" }}
                         className={`h-full ${budget.color} rounded-full transition-all group-hover:shadow-[0_0_15px_${budget.color.replace('bg-', '')}]`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Box 3: Campaign Performance Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="col-span-1 bg-[#0A0A0A] rounded-3xl border border-white/10 p-6 shadow-2xl relative h-[300px] overflow-hidden group cursor-pointer"
          >
             <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="relative z-10 flex flex-col h-full">
                <h3 className="text-white font-bold text-xl flex items-center gap-2 mb-2 group-hover:text-orange-400 transition-colors">
                  <Activity className="w-5 h-5 text-orange-500" /> ROI Tracking
                </h3>
                <p className="text-[#888] text-sm mb-6">Real-time aggregate view costs.</p>
                
                <div className="flex-1 flex items-end gap-2 px-2 pb-2">
                  {[40, 65, 30, 85, 55, 95, 70].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + (i * 0.1), type: 'spring' }}
                      className="flex-1 bg-white/10 rounded-t-sm group-hover:bg-orange-500/50 hover:bg-orange-400 transition-colors relative"
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                         {Math.floor(h * 2.5)}k
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-[#555] font-bold uppercase mt-2 border-t border-white/10 pt-2">
                   <span>Mon</span>
                   <span>Sun</span>
                </div>
             </div>
          </motion.div>

          {/* Box 4: PDF Generation */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="col-span-1 lg:col-span-2 bg-[#0A0A0A] rounded-3xl border border-white/10 p-6 shadow-2xl relative h-[300px] overflow-hidden group cursor-pointer"
          >
            <div className="flex flex-col h-full relative z-20">
               <div>
                 <h3 className="text-white font-bold text-xl flex items-center gap-2 mb-2 group-hover:text-blue-400 transition-colors">
                   <FileText className="w-5 h-5 text-blue-500" /> Automated Reporting
                 </h3>
                 <p className="text-[#888] text-sm">Generate beautiful, white-labeled client PDFs in one click.</p>
               </div>
            </div>

            {/* Mock flying PDF elements */}
            <motion.div 
              className="absolute right-4 -bottom-10 w-64 h-80 bg-white rounded-xl shadow-2xl p-4 rotate-12 flex flex-col border border-gray-200 z-10 origin-bottom-right"
              whileHover={{ rotate: 5, y: -20, scale: 1.05 }}
              transition={{ type: "spring" }}
            >
               <div className="w-1/2 h-4 bg-gray-200 rounded mb-4"></div>
               <div className="w-full h-16 bg-gray-100 rounded mb-2"></div>
               <div className="w-3/4 h-16 bg-gray-100 rounded mb-4"></div>
               <div className="flex-1 bg-blue-50 rounded border border-blue-100 flex items-center justify-center text-blue-400 font-bold uppercase text-[10px]">
                 Campaign Overview
               </div>
            </motion.div>

            <motion.div 
              className="absolute right-24 -bottom-5 w-64 h-80 bg-gray-50 rounded-xl shadow-2xl p-4 rotate-[25deg] flex flex-col border border-gray-200 z-0 origin-bottom-right opacity-50"
              whileHover={{ rotate: 15, y: -10 }}
              transition={{ type: "spring" }}
            >
               <div className="w-1/3 h-4 bg-gray-300 rounded mb-4"></div>
               <div className="w-full h-24 bg-gray-200 rounded mb-2"></div>
            </motion.div>
            
            <div className="absolute bottom-6 left-6 z-20">
               <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                 Download Report <ArrowRight className="w-4 h-4" />
               </span>
            </div>
          </motion.div>

        </div>
        <div className="max-w-6xl mx-auto mt-6 text-center">
          <p className="text-[#555] text-sm font-bold uppercase tracking-widest">Interactive Bento Demo</p>
        </div>
      </section>

      {/* Feature 1: Upload & Parse */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 mb-2 uppercase tracking-widest">
              Feature 01
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Automated Submission<br />Tracking.</h2>
            <p className="text-[#888] text-xl leading-relaxed">Pasting video links and manually tracking views breaks at scale. Upload raw data from your preferred form, and we do the rest.</p>
            <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl">
              <p className="text-blue-400 font-bold text-lg">We automatically organize submissions by creator and campaign—saving you hours of work.</p>
            </div>
          </div>
          <div className="flex-1 w-full perspective-[1000px] cursor-pointer group">
            <motion.div 
               initial={{ opacity: 0, x: 20, rotateY: -10 }}
               whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               whileHover={{ scale: 1.02 }}
               className="bg-[#111] p-6 rounded-3xl border border-white/10 shadow-2xl relative transition-transform"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm">2</div>
                <h2 className="text-xl font-bold text-white tracking-wide">Map Your CSV Columns</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { name: 'Date', mapped: 'Timestamp', req: true },
                   { name: 'Creator', mapped: 'Username', req: true },
                   { name: 'Platform', mapped: 'Network', req: true },
                   { name: 'Views', mapped: 'View Count', req: false },
                 ].map((c, i) => (
                   <motion.div 
                     key={i} 
                     whileHover={{ y: -2, scale: 1.05 }}
                     className="bg-white/[0.02] border border-blue-500/30 rounded-xl p-4 transition-transform cursor-grab active:cursor-grabbing"
                   >
                     <div className="flex justify-between items-center mb-4">
                       <span className="font-bold text-sm text-white">{c.name}</span>
                       {c.req && <span className="text-[8px] uppercase tracking-widest font-black bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Required</span>}
                     </div>
                     <div className="bg-black/40 p-2 rounded border-t border-blue-500/20">
                       <p className="text-[8px] text-[#888] font-bold uppercase mb-1">Maps to</p>
                       <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse group-hover:bg-blue-400"></span> {c.mapped}</p>
                     </div>
                   </motion.div>
                 ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 2: Payouts */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 mb-2 uppercase tracking-widest">
              Feature 02
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Instant Payout<br />Calculation.</h2>
            <p className="text-[#888] text-xl leading-relaxed">Stop wasting hours at month-end building complex formulas to calculate who gets paid for which campaign.</p>
            <div className="p-4 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r-xl">
              <p className="text-emerald-400 font-bold text-lg">Define your RPM structure. Our platform instantly processes payouts accurately and readies them for export.</p>
            </div>
          </div>
          <div className="flex-1 w-full perspective-[1000px] cursor-pointer group">
            <motion.div 
               initial={{ opacity: 0, x: -20, rotateY: 10 }}
               whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               whileHover={{ scale: 1.02 }}
               className="bg-[#111] p-6 rounded-3xl border border-white/10 shadow-2xl relative"
            >
               <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 group-hover:text-emerald-400 transition-colors"><DollarSign className="w-5 h-5 text-emerald-500"/> Payout Breakdown</h3>
               <div className="space-y-3">
                 {[
                   { user: '@clip_master99', views: '1.2M', paid: '$6,000.00', w: 'w-[100%]' },
                   { user: '@viral_shorts', views: '840K', paid: '$4,200.00', w: 'w-[75%]' },
                   { user: '@daily_hustle', views: '450K', paid: '$2,250.00', w: 'w-[45%]' },
                   { user: '@new_creator1', views: '120K', paid: '$600.00', w: 'w-[15%]' },
                 ].map((row, i) => (
                   <div key={i} className="flex flex-col gap-1.5 p-3 hover:bg-emerald-500/10 rounded-xl border border-transparent hover:border-emerald-500/20 transition-colors group/row cursor-pointer">
                     <div className="flex justify-between items-center">
                       <span className="font-bold text-sm text-white group-hover/row:text-emerald-400 transition-colors">{row.user}</span>
                       <span className="font-black text-emerald-400 group-hover/row:scale-110 transition-transform origin-right">{row.paid}</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="h-1.5 flex-1 bg-black rounded-full overflow-hidden">
                         <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: row.w.replace('w-[', '').replace(']', '') }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className={`h-full bg-emerald-500 rounded-full group-hover/row:bg-emerald-400`} 
                          />
                       </div>
                       <span className="text-xs text-[#888] font-medium w-12 text-right">{row.views}</span>
                     </div>
                   </div>
                 ))}
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 3: Onboarding */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 mb-2 uppercase tracking-widest">
              Feature 03
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Streamlined Creator<br />Onboarding.</h2>
            <p className="text-[#888] text-xl leading-relaxed">Stop managing creators via scattered Discord messages. Consolidate your onboarding instructions and assets.</p>
            <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl">
              <p className="text-blue-400 font-bold text-lg">Create branded onboarding pages containing secure asset links, guidelines, and an automated tracker.</p>
            </div>
          </div>
          <div className="flex-1 w-full perspective-[1000px] cursor-pointer group">
             <motion.div 
               initial={{ opacity: 0, x: 20, rotateY: -10 }}
               whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               whileHover={{ scale: 1.02 }}
               className="bg-[#111] p-6 rounded-3xl border border-white/10 shadow-2xl relative"
             >
               <div className="absolute inset-0 bg-gradient-to-t from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none"></div>
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="text-lg font-bold text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors"><LayoutDashboard className="w-5 h-5 text-blue-500"/> Creator Onboarding</h3>
                   <p className="text-xs text-[#888]">Spring Push 2026</p>
                 </div>
                 <div className="px-3 py-1 bg-white/10 rounded text-xs font-bold text-white border border-white/10 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">12 Total</div>
               </div>
               
               <div className="flex gap-4 overflow-hidden">
                 <div className="flex-1 bg-black/40 rounded-xl p-3 border border-white/5 hover:border-blue-500/30 transition-colors">
                   <div className="flex justify-between items-center mb-3">
                     <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest group-hover:text-white transition-colors">Pending</span>
                     <span className="text-[10px] bg-white/10 px-1.5 rounded text-white font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors">2</span>
                   </div>
                   <div className="bg-[#1A1A1A] p-2.5 rounded-lg border border-white/5 mb-2 text-xs font-bold text-white shadow-md hover:bg-white/10 transition-colors cursor-grab active:cursor-grabbing">
                     @new_clipper
                     <div className="text-[9px] text-[#666] mt-1">Applied: Today</div>
                   </div>
                   <div className="bg-[#1A1A1A] p-2.5 rounded-lg border border-white/5 text-xs font-bold text-white shadow-md hover:bg-white/10 transition-colors cursor-grab active:cursor-grabbing">
                     @viral_maker
                     <div className="text-[9px] text-[#666] mt-1">Applied: Yesterday</div>
                   </div>
                 </div>
                 <div className="flex-1 bg-blue-500/5 rounded-xl p-3 border border-blue-500/20 hover:border-blue-500/50 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                   <div className="flex justify-between items-center mb-3">
                     <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Onboarded</span>
                     <span className="text-[10px] bg-blue-500/20 px-1.5 rounded text-blue-400 font-bold">1</span>
                   </div>
                   <div className="bg-[#1A1A1A] p-2.5 rounded-lg border border-blue-500/20 text-xs font-bold text-white shadow-md hover:bg-blue-500/10 hover:border-blue-500/40 transition-all cursor-pointer">
                     @tiktok_star
                     <div className="text-[9px] text-blue-400 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</div>
                   </div>
                 </div>
               </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 4: Budget Controls */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400 mb-2 uppercase tracking-widest">
              Feature 04
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Real-time Budget<br />Tracking.</h2>
            <p className="text-[#888] text-xl leading-relaxed">Running parallel campaigns across dozens of creators makes it impossible to securely track active spend across teams.</p>
            <div className="p-4 bg-purple-500/10 border-l-4 border-purple-500 rounded-r-xl">
              <p className="text-purple-400 font-bold text-lg">Define strict budget caps. We aggregate real-time estimated payouts and automatically alert you before you exceed your budget.</p>
            </div>
          </div>
          <div className="flex-1 w-full perspective-[1000px] cursor-pointer group">
            <motion.div 
               initial={{ opacity: 0, x: -20, rotateY: 10 }}
               whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               whileHover={{ scale: 1.02 }}
               className="bg-[#111] p-6 rounded-3xl border border-white/10 shadow-2xl relative"
            >
               <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 group-hover:text-purple-400 transition-colors"><PieChart className="w-5 h-5 text-purple-500"/> Active Campaign Budgets</h3>
               <div className="space-y-5">
                 {[
                   { name: 'Spring Launch', spent: '$45,000', total: '$50,000', pct: 90, color: 'bg-red-500', alert: 'Approaching Limit' },
                   { name: 'Summer Push', spent: '$12,000', total: '$30,000', pct: 40, color: 'bg-emerald-500', alert: 'On Track' },
                   { name: 'Micro-influencers', spent: '$4,500', total: '$5,000', pct: 90, color: 'bg-yellow-500', alert: 'Near Limit' },
                 ].map((campaign, i) => (
                   <div key={i} className="bg-white/[0.02] p-4 rounded-xl border border-white/5 hover:bg-white/5 hover:border-purple-500/30 transition-all group/budget cursor-pointer relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover/budget:opacity-100 transition-opacity"></div>
                     <div className="flex justify-between items-center mb-2 relative z-10">
                       <span className="font-bold text-white text-sm group-hover/budget:text-purple-400 transition-colors">{campaign.name}</span>
                       <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded bg-black/50 ${campaign.pct === 40 ? 'text-emerald-400' : 'text-red-400'}`}>
                         {campaign.alert}
                       </span>
                     </div>
                     <div className="flex justify-between items-end mb-2 relative z-10">
                       <span className="text-2xl font-black text-white">{campaign.spent} <span className="text-sm text-[#555] font-medium group-hover/budget:text-white/60 transition-colors">/ {campaign.total}</span></span>
                     </div>
                     <div className="h-2 w-full bg-black rounded-full overflow-hidden relative z-10">
                       <div className={`h-full ${campaign.color} rounded-full`} style={{ width: `${campaign.pct}%` }}></div>
                     </div>
                   </div>
                 ))}
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 5: Real-time Agency ROI */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-400 mb-2 uppercase tracking-widest">
              Feature 05
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Agency-wide<br />Analytics.</h2>
            <p className="text-[#888] text-xl leading-relaxed">Strategic growth is hampered when your performance metrics are siloed across scattered spreadsheets and disconnected tools.</p>
            <div className="p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-xl">
              <p className="text-orange-400 font-bold text-lg">Consolidate your data. Immediately identify high-return creators, costs per view, and overall profit margins.</p>
            </div>
          </div>
          <div className="flex-1 w-full perspective-[1000px] cursor-pointer group">
             <motion.div 
               initial={{ opacity: 0, x: 20, rotateY: -10 }}
               whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               whileHover={{ scale: 1.02 }}
               className="bg-[#111] p-6 rounded-3xl border border-white/10 shadow-2xl relative"
             >
               <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 group-hover:text-orange-500 transition-colors"><TrendingUp className="w-5 h-5 text-orange-500"/> Agency Snapshot</h3>
               
               <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="bg-black/50 border border-white/5 rounded-xl p-4 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all">
                   <p className="text-[10px] text-[#888] uppercase tracking-widest font-bold mb-1">Total Views</p>
                   <p className="text-2xl font-black text-white group-hover:text-orange-400 transition-colors">45.2M <span className="text-xs text-emerald-500 ml-1">↑ 12%</span></p>
                 </div>
                 <div className="bg-black/50 border border-white/5 rounded-xl p-4 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all">
                   <p className="text-[10px] text-[#888] uppercase tracking-widest font-bold mb-1">Total Payouts</p>
                   <p className="text-2xl font-black text-white group-hover:text-orange-400 transition-colors">$226K <span className="text-xs text-emerald-500 ml-1">↑ 5%</span></p>
                 </div>
               </div>
               
               <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-xl p-5 relative overflow-hidden hover:from-orange-500/20 transition-all">
                 <div className="flex justify-between items-start mb-4 relative z-10">
                   <div>
                     <p className="text-xs text-orange-500 font-bold uppercase tracking-widest">Top Performer</p>
                     <p className="text-lg font-bold text-white mt-1">@viral_hustle</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs text-[#888]">eCPV</p>
                     <p className="text-white font-black">$0.005</p>
                   </div>
                 </div>
                 <p className="text-sm text-[#aaa] relative z-10">Driven <strong className="text-white">4.2M views</strong> this month with a highly efficient payout structure.</p>
                 <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-orange-500/10 group-hover:text-orange-500/20 transition-all group-hover:scale-110" />
               </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 6: Client Reports */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-bold text-pink-400 mb-2 uppercase tracking-widest">
              Feature 06
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">White-labeled<br />Client Reporting.</h2>
            <p className="text-[#888] text-xl leading-relaxed">Clients expect polished presentations detailing what they paid for. Building these manually drains hours of productive agency time.</p>
            <div className="p-4 bg-pink-500/10 border-l-4 border-pink-500 rounded-r-xl">
              <p className="text-pink-400 font-bold text-lg">Export stunning, white-labeled PDF performance wrap-ups in a single click to show your agency's exact ROI.</p>
            </div>
          </div>
          <div className="flex-1 w-full perspective-[1000px] cursor-pointer group">
            <motion.div 
               initial={{ opacity: 0, x: -20, rotateY: 10 }}
               whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               whileHover={{ scale: 1.02, rotateY: -5 }}
               className="bg-white p-6 rounded-xl border border-white/10 shadow-2xl relative text-black aspect-[1/1.2] flex flex-col transition-all"
            >
               {/* Mock PDF Header */}
               <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6 relative z-10">
                 <div>
                   <h3 className="text-2xl font-black tracking-tight group-hover:text-pink-600 transition-colors">Campaign Wrap-up</h3>
                   <p className="text-gray-500 font-medium">Prepared for: ACME Corp</p>
                 </div>
                 <div className="w-10 h-10 bg-black rounded-lg group-hover:bg-pink-600 transition-colors"></div>
               </div>
               
               {/* Mock PDF Content */}
               <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                 <div className="bg-gray-100 p-4 rounded-lg hover:bg-pink-50 transition-colors">
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Reach</p>
                   <p className="text-3xl font-black tracking-tight text-gray-900">12.5M</p>
                 </div>
                 <div className="bg-gray-100 p-4 rounded-lg hover:bg-pink-50 transition-colors">
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Creators Activated</p>
                   <p className="text-3xl font-black tracking-tight text-gray-900">45</p>
                 </div>
               </div>
               
               <div className="flex-1 relative z-10">
                 <p className="text-sm font-bold border-b border-gray-200 pb-2 mb-3">Top Performing Assets</p>
                 {[1, 2, 3].map(i => (
                   <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 text-sm hover:bg-pink-50 px-2 rounded-lg transition-colors cursor-pointer">
                     <span className="font-medium text-gray-700">TikTok #{i} - Viral Trend</span>
                     <span className="font-bold text-gray-900">{Math.floor(Math.random() * 5)}.{Math.floor(Math.random() * 9)}M views</span>
                   </div>
                 ))}
               </div>
               
               <div className="mt-auto flex justify-between items-center pt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest relative z-10">
                 <span>Generated via OpsRelic</span>
                 <span>Page 1 of 4</span>
               </div>
               
               {/* Decorative Download overlay */}
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.5 }}
                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold shadow-2xl shadow-blue-500/50 flex items-center gap-3 whitespace-nowrap scale-110 z-20 transition-colors cursor-pointer group/btn"
               >
                 <FileText className="w-6 h-6 group-hover/btn:scale-110 transition-transform" /> <span className="group-hover/btn:mr-2 transition-all">Export Client PDF</span>
               </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative z-10 text-center border-t border-white/5 bg-gradient-to-b from-[#0A0A0A] to-[#000000]">
         <div className="max-w-3xl mx-auto">
           <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">Systemize your agency. <br />Scale your profit.</h2>
           <p className="text-xl text-[#888] mb-10 font-medium">Join top creator agencies who have fully automated their tracking, payouts, and client reporting with OpsRelic.</p>
           <button 
             onClick={() => setAuthMode('signup')}
             className="px-12 py-5 bg-blue-600 text-white hover:bg-blue-500 rounded-2xl font-black text-xl flex items-center justify-center gap-3 mx-auto transition-all hover:scale-105 shadow-[0_0_40px_rgba(37,99,235,0.4)]"
           >
             Get Started <ArrowRight className="w-6 h-6" />
           </button>
         </div>
      </section>

      <Pricing requiresAuth={true} onAuthRequired={() => setAuthMode('signup')} />

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {authMode && (
          <AuthModal 
            mode={authMode} 
            onClose={() => setAuthMode(null)} 
            onSwitchMode={(m) => setAuthMode(m)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../lib/firebase';

function AuthModal({ mode, onClose, onSwitchMode }: { 
  mode: 'login' | 'signup', 
  onClose: () => void,
  onSwitchMode: (m: 'login' | 'signup') => void
}) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  const checkPasswordStrength = (pass: string) => {
    if (pass.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "Password must contain at least one special character.";
    return null;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
           throw new Error("Passwords do not match.");
        }
        const strengthError = checkPasswordStrength(password);
        if (strengthError) throw new Error(strengthError);

        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("Email is already in use.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else {
        setError(err.message || 'Failed to authenticate. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // On success, Firebase onAuthStateChanged will update App.tsx state and unmount Landing
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0A0A0A] border border-white/10 rounded-[48px] p-10 md:p-14 w-full max-w-lg relative z-10 shadow-[0_0_80px_-20px_rgba(37,99,235,0.2)] max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-[#333] hover:text-white transition-colors p-2"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-12">
          <motion.div 
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            className="w-20 h-20 bg-blue-600 rounded-[32px] mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-blue-600/30 text-white"
          >
            <Zap className="w-10 h-10" />
          </motion.div>
          <h2 className="text-4xl font-display font-black mb-3 tracking-tighter text-white uppercase">{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
          <p className="text-[#444] text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed px-4">
            {mode === 'login' ? 'Sign in to your account.' : 'Create your account to get started.'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center"
          >
            Error: {error}
          </motion.div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-6">
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#222] uppercase tracking-[0.3em] ml-1">Agency Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333] group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="ACME MEDIA"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-all placeholder:text-[#222] uppercase tracking-widest"
                  required={mode === 'signup'}
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#222] uppercase tracking-[0.3em] ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333] group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="AGENCY@EXAMPLE.COM"
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-all placeholder:text-[#222] uppercase tracking-widest"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#222] uppercase tracking-[0.3em] ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333] group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-all placeholder:text-[#222]"
                required
              />
            </div>
          </div>
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#222] uppercase tracking-[0.3em] ml-1">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333] group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-all placeholder:text-[#222]"
                  required={mode === 'signup'}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-black uppercase tracking-[0.3em] text-[10px] py-5 rounded-2xl hover:bg-blue-500 transition-all active:scale-[0.98] mt-6 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(37,99,235,0.3)] disabled:opacity-20 disabled:grayscale"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="relative my-10">
           <div className="absolute inset-0 flex items-center">
             <div className="w-full border-t border-white/5"></div>
           </div>
           <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.4em]">
             <span className="bg-[#0A0A0A] px-4 text-[#222]">Or continue with</span>
           </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={(e) => { e.preventDefault(); handleGoogleLogin(); }}
            disabled={loading}
            className="w-full bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] py-5 rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-4 active:scale-[0.98] shadow-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sync with Google
          </button>
        </div>

        <div className="mt-10 text-center border-t border-white/5 pt-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#333]">
            {mode === 'login' ? "Unauthorized? " : "Provisioned? "}
            <button 
              onClick={() => { setError(''); onSwitchMode(mode === 'login' ? 'signup' : 'login'); }}
              className="text-blue-500 hover:text-blue-400 transition-colors ml-1"
            >
              {mode === 'login' ? 'Create Node' : 'Authenticate Access'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
