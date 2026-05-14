import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Database, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Globe, 
  RefreshCw,
  Mail,
  Building,
  User,
  MessageSquare,
  Loader2,
  X,
  Scissors,
  Eye,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  Shield,
  Moon,
  Sun,
  Play,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { loginWithGoogle, loginWithEmail, registerWithEmail, ALLOWED_EMAILS } from '../../lib/firebase';

export default function Landing() {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [waitlistData, setWaitlistData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistStatus('loading');
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...waitlistData,
          source: 'opsrelic_waitlist',
          submittedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        setWaitlistStatus('success');
        setWaitlistData({ name: '', email: '', company: '', message: '' });
      } else {
        throw new Error('Failed to submit');
      }
    } catch (err) {
      setWaitlistStatus('error');
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans selection:bg-[var(--color-primary-soft-2)] overflow-x-hidden transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[var(--color-primary-soft)] blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[var(--color-primary-soft)] blur-[120px] rounded-full -translate-x-1/3 translate-y-1/3 opacity-40" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --color-bg: #f7f6f2;
          --color-surface: #ffffff;
          --color-surface-2: #fbfbf9;
          --color-surface-offset: #f0ede7;
          --color-border: rgba(0,0,0,0.08);
          --color-divider: rgba(0,0,0,0.06);
          --color-text: #1a1a1a;
          --color-text-muted: #666666;
          --color-text-faint: #999999;
          --color-text-inverse: #ffffff;
          --color-primary: #0077ff;
          --color-primary-hover: #005ce6;
          --color-primary-soft: rgba(0,119,255,0.08);
          --color-primary-soft-2: rgba(0,119,255,0.15);
          --color-success: #00c853;
          --color-error: #ff3d00;
        }
        .dark {
          --color-bg: #09090b;
          --color-surface: #121214;
          --color-surface-2: #18181b;
          --color-surface-offset: #27272a;
          --color-border: rgba(255,255,255,0.08);
          --color-divider: #393836;
          --color-text: #ffffff;
          --color-text-muted: #a1a1aa;
          --color-text-faint: #71717a;
          --color-text-inverse: #09090b;
          --color-primary: #00d4e8;
          --color-primary-hover: #00e0f5;
          --color-primary-soft: rgba(0,212,232,0.15);
          --color-primary-soft-2: rgba(0,212,232,0.25);
          --color-success: #00ff88;
          --color-error: #ff2a5f;
        }

        .dashboard-shell {
          transform: perspective(2000px) rotateY(-8deg) rotateX(4deg);
          transition: transform 800ms cubic-bezier(0.16,1,0.3,1);
        }
        .dashboard-shell:hover {
          transform: perspective(2000px) rotateY(0deg) rotateX(0deg) translateY(-4px) scale(1.02);
        }
        
        .gradient-text {
          background: linear-gradient(to right, #00d4e8, #00ff88, #a020f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% auto;
          animation: shine 5s linear infinite;
        }
        @keyframes shine {
          to { background-position: 200% center; }
        }
      `}} />

      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--color-bg)]/80 border-b border-black/5 dark:border-white/5">
        <div className="max-w-[1180px] mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-12 h-12 flex items-center justify-center transition-all group-hover:scale-110">
              <img src="/logo.png" alt="OpsRelic Logo" className="w-full h-full object-contain drop-shadow-[0_4px_12px_var(--color-primary-soft-2)]" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter text-[var(--color-text)] leading-none">OpsRelic</span>
              <span className="text-[10px] font-black text-[var(--color-primary)] tracking-[0.3em] uppercase mt-1 opacity-80">Clipping & UGC Agency OS</span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--color-text-muted)]">
            <a href="#features" className="hover:text-[var(--color-text)] transition-colors">What it does</a>
            <a href="#workflow" className="hover:text-[var(--color-text)] transition-colors">How it works</a>
            <a href="#visuals" className="hover:text-[var(--color-text)] transition-colors">Product</a>
            <a href="#waitlist" className="hover:text-[var(--color-text)] transition-colors">Waitlist</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-surface)] transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--color-text-muted)]" /> : <Moon className="w-4 h-4 text-[var(--color-text-muted)]" />}
            </button>
            <a 
              href="#waitlist"
              className="px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-semibold hover:brightness-110 transition-all shadow-sm"
            >
              Join waitlist
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 lg:pt-32 pb-24 lg:pb-32 overflow-hidden z-10">
        {/* ... (Atmosphere Background) ... */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-[radial-gradient(circle_at_center,var(--color-primary-soft)_0%,transparent_70%)] opacity-30 blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_center,var(--color-primary-soft)_0%,transparent_70%)] opacity-20 blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] brightness-125 contrast-125 pointer-events-none" />
        </div>

        <div className="max-w-[1440px] mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-[45%_55%] gap-12 lg:gap-24 items-center">
          <div className="w-full relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[var(--color-surface-offset)] border border-[var(--color-border)] text-[var(--color-primary)] text-[10px] font-black uppercase tracking-[0.3em] mb-8 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse shadow-[0_0_8px_var(--color-primary)]" /> 
                  OpsRelic v1: Clipping & UGC Agency OS
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-[76px] font-black tracking-[-0.07em] lg:tracking-[-0.08em] leading-[0.9] mb-8 text-[var(--color-text)]">
                  The Operating System for <br className="hidden lg:block" /> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)]">Clipping Agency & UGC Teams.</span>
                </h1>
                
                <p className="text-lg lg:text-xl text-[var(--color-text-muted)] leading-relaxed mb-12 max-w-lg font-medium opacity-85">
                  Centralize your agency operations. From raw performance metrics to branded client portals, OpsRelic v1 provides the infrastructure for professional clipping and UGC teams to report fast, stay organized, and scale efficiently.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-5 mb-16 lg:mb-20">
                  <a href="#waitlist" className="h-[64px] px-10 rounded-2xl bg-[var(--color-primary)] text-[var(--color-text-inverse)] font-black flex items-center justify-center shadow-[0_16px_32px_-8px_var(--color-primary-soft-2)] hover:scale-[1.02] hover:brightness-110 active:scale-95 transition-all text-xl group relative overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                      Request Access <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
            </motion.div>
          </div>

          <div className="relative w-full lg:h-[600px] flex items-center justify-center mt-12 lg:mt-0 perspective-3000">
             {/* Complex UI Mockup reflecting actual app */}
             <div className="dashboard-shell relative w-full h-auto min-h-[450px] aspect-video max-w-[800px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-none">
                {/* Header */}
                <div className="h-10 border-b border-[var(--color-border)] flex items-center px-4 gap-4 bg-[var(--color-surface-2)] shrink-0">
                   <div className="flex gap-1.5">
                     <div className="w-3 h-3 rounded-full bg-red-500/80" />
                     <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                     <div className="w-3 h-3 rounded-full bg-green-500/80" />
                   </div>
                   <div className="w-64 h-5 rounded-md bg-[var(--color-surface-offset)] mx-auto flex items-center justify-center text-[10px] text-[var(--color-text-muted)] tracking-widest font-mono">opsrelic.com/app</div>
                </div>
                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                   {/* Sidebar */}
                   <div className="hidden sm:flex w-48 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex-col gap-2 opacity-80">
                     <div className="h-6 rounded bg-[var(--color-surface-offset)] w-full mb-4" />
                     <div className="flex items-center gap-2 mb-2"><Layers className="w-4 h-4 text-muted" /><div className="h-4 rounded bg-[var(--color-surface-offset)] w-3/4" /></div>
                     <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-muted" /><div className="h-4 rounded bg-[var(--color-surface-offset)] w-5/6" /></div>
                     <div className="flex items-center gap-2 mb-2"><Database className="w-4 h-4 text-muted" /><div className="h-4 rounded bg-[var(--color-surface-offset)] w-full" /></div>
                     <div className="flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-[var(--color-primary)]" /><div className="h-4 rounded bg-[var(--color-primary-soft-2)] text-[var(--color-primary)] w-4/5" /></div>
                   </div>
                   {/* Main */}
                   <div className="flex-1 p-4 sm:p-6 bg-[var(--color-bg)] flex flex-col gap-4 sm:gap-6 overflow-hidden relative">
                      {/* Gradient ambient light */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00d4e8]/20 to-[#a020f0]/20 blur-3xl rounded-full" />
                      
                      <div className="flex justify-between items-center relative z-10">
                         <div className="space-y-1 sm:space-y-2">
                           <div className="h-4 sm:h-6 rounded bg-[var(--color-text)] w-24 sm:w-40 opacity-90" />
                           <div className="h-3 sm:h-4 rounded bg-[var(--color-text-muted)] w-16 sm:w-24 opacity-60" />
                         </div>
                         <div className="h-8 sm:h-10 rounded-lg bg-[var(--color-primary)] w-24 sm:w-32 opacity-90" />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 relative z-10">
                         <div className="h-20 sm:h-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/80 backdrop-blur-md p-3 sm:p-4 flex flex-col justify-between shadow-sm">
                            <div className="text-[9px] sm:text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Total Views</div>
                            <div className="text-xl sm:text-2xl font-black gradient-text">24.1M</div>
                         </div>
                         <div className="h-20 sm:h-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/80 backdrop-blur-md p-3 sm:p-4 flex flex-col justify-between shadow-sm">
                            <div className="text-[9px] sm:text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Active Campaigns</div>
                            <div className="text-xl sm:text-2xl font-black text-[#00ff88]">12</div>
                         </div>
                         <div className="h-20 sm:h-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/80 backdrop-blur-md p-3 sm:p-4 flex flex-col justify-between hidden md:flex shadow-sm">
                            <div className="text-[9px] sm:text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Saved Time</div>
                            <div className="text-xl sm:text-2xl font-black text-[#0077ff]">140+ hrs</div>
                         </div>
                      </div>
                      <div className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/80 backdrop-blur-md relative z-10 p-4 opacity-70">
                         <div className="flex items-center justify-between mb-4">
                           <div className="h-4 w-1/4 rounded bg-[var(--color-text-muted)] opacity-50" />
                           <div className="h-4 w-8 rounded bg-[var(--color-surface-offset)]" />
                         </div>
                         <div className="space-y-3">
                           {[1,2,3].map(i => (
                             <div key={i} className="flex justify-between items-center pb-3 border-b border-[var(--color-divider)]">
                               <div className="flex gap-3 items-center">
                                 <div className="w-8 h-8 rounded-full bg-[var(--color-surface-offset)]" />
                                 <div className="space-y-1">
                                   <div className="h-3 w-16 rounded bg-[var(--color-text)]" />
                                   <div className="h-2 w-10 rounded bg-[var(--color-text-muted)]" />
                                 </div>
                               </div>
                               <div className="h-4 w-12 rounded bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-mono text-[10px] text-center flex items-center justify-center">+1{i}k</div>
                             </div>
                           ))}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             
             {/* Floating Elements */}
             <motion.div 
               animate={{ y: [0, -10, 0] }} 
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -right-4 sm:-right-8 bottom-8 sm:bottom-12 p-3 sm:p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-xl flex items-center gap-3 sm:gap-4 z-20 backdrop-blur-xl"
             >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#00ff88]/10 text-[#00ff88] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Live Campaign Update</div>
                  <div className="text-lg sm:text-xl font-black">1.2M Views Data Sync</div>
                </div>
             </motion.div>
             <motion.div 
               animate={{ y: [0, 10, 0] }} 
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute -left-4 sm:-left-8 top-12 sm:top-1/4 p-3 sm:p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-xl z-20 backdrop-blur-xl"
             >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <Globe className="w-4 h-4 text-[var(--color-primary)] animate-pulse" />
                  <span className="text-[10px] sm:text-xs font-bold text-[var(--color-text)]">Client Portal Synced</span>
                </div>
                <div className="w-24 sm:w-32 h-1.5 sm:h-2 rounded-full bg-[var(--color-primary)]/20 overflow-hidden">
                   <div className="h-full bg-[var(--color-primary)] w-full" />
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section (NEW) */}
      <section id="capabilities" className="py-24 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="text-center mb-20 max-w-2xl mx-auto">
            <span className="eyebrow">The OpsRelic Suite</span>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 mt-4">One Operating System for your entire agency.</h2>
            <p className="text-lg text-[var(--color-text-muted)]">From intake to final portal delivery, manage every aspect of your agency inside OpsRelic.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Building, title: 'Agency Operations', desc: 'Manage your workspaces, team access, and subscription tiers cleanly.' },
              { icon: Layers, title: 'Dedicated Campaign Instances', desc: 'No more scattered Google Sheets. Each campaign gets a structured hub with integrated clipping targets.' },
              { icon: BarChart3, title: 'Link & Drop Analytics', desc: 'Just paste clip URLs (TikTok, Reels, Shorts) and OpsRelic auto-fetches LIVE views, likes, and engagement metrics.' },
              { icon: RefreshCw, title: 'CSV Mass Injection', desc: 'Got a dump of 500 clips? Drop the CSV. We map it, sum it up, and instantly reflect performance against the campaign KPIs.' },
              { icon: Globe, title: 'Whitelabel Client Portals', desc: 'Stop sending PDF updates. Give your clients a live, secure `opsrelic.com/portal/[token]` link with your branding.' },
              { icon: Database, title: 'Universal Content Database', desc: 'Maintain complete history of every uploaded clip and tracking instance, fully searchable.' }
            ].map((cap, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -10 }}
                className="p-8 rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-primary)] hover:shadow-xl hover:shadow-[var(--color-primary-soft-2)] transition-all cursor-pointer group"
              >
                <cap.icon className="w-10 h-10 text-[var(--color-primary)] mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3 tracking-tight group-hover:text-[var(--color-primary)] transition-colors">{cap.title}</h3>
                <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Benefits */}
      <section id="features" className="section relative py-32 lg:py-48">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="max-w-3xl mb-24">
            <span className="eyebrow">Key Benefits</span>
            <h2 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 mt-4 leading-[0.9]">Everything in one view.</h2>
            <p className="text-xl text-[var(--color-text-muted)]">Scale your agency ops with an infrastructure that handles the density of real-world clipping workflows.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-10 rounded-[48px] border border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-xl relative overflow-hidden group h-full flex flex-col"
            >
              <div className="w-16 h-16 rounded-3xl bg-[var(--color-primary-soft)] border border-[var(--color-primary-soft-2)] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                <Layers className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-2xl font-bold mb-6 tracking-tight">1. Campaign workspace, not another spreadsheet</h3>
              <p className="text-[var(--color-text-muted)] leading-relaxed">Briefs, asset uploads, status, and notes — one place per campaign. No more "where's that doc?" pings on Slack at 11pm.</p>
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[var(--color-primary-soft)] blur-[100px] -z-0 opacity-40" />
            </motion.div>

            {/* Benefit 2 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-10 rounded-[48px] border border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-xl relative overflow-hidden group h-full flex flex-col"
            >
              <div className="w-16 h-16 rounded-3xl bg-[var(--color-primary-soft)] border border-[var(--color-primary-soft-2)] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-2xl font-bold mb-6 tracking-tight">2. Clip CSVs → client-ready reports in one click</h3>
              <p className="text-[var(--color-text-muted)] leading-relaxed">Drop in your CSVs from your clip pages, ad dashboards, or Whop campaigns. OpsRelic turns them into the KPI report you'd otherwise spend three hours rebuilding by hand.</p>
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[var(--color-primary-soft)] blur-[100px] -z-0 opacity-40" />
            </motion.div>

            {/* Benefit 3 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-10 rounded-[48px] border border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-xl relative overflow-hidden group h-full flex flex-col"
            >
              <div className="w-16 h-16 rounded-3xl bg-[var(--color-primary-soft)] border border-[var(--color-primary-soft-2)] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-2xl font-bold mb-6 tracking-tight">3. A client portal you'd actually be proud to share</h3>
              <p className="text-[var(--color-text-muted)] leading-relaxed">A clean, branded view of every campaign — live numbers, deliverables, next steps — so clients stop pinging you for "an update".</p>
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[var(--color-primary-soft)] blur-[100px] -z-0 opacity-40" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who it's for & Why OpsRelic */}
      <section className="py-24 lg:py-40 bg-[var(--color-surface)] border-y border-[var(--color-border)] relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
        
        <div className="max-w-[1180px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 relative z-10">
          <div>
            <span className="eyebrow text-[#00d4e8]">The Current State is Chaos</span>
            <h2 className="text-4xl lg:text-6xl font-bold tracking-tight mb-10 mt-4 leading-none">Exhausted by <br/>the ops?</h2>
            <div className="text-[var(--color-text-muted)] space-y-6 leading-relaxed text-lg">
              <p>Most clipping agencies are incredible at driving virality, but terrible at the infrastructure.</p>
              <p>The campaign works — clippers upload, views spike. <strong className="text-[var(--color-text)]">The nightmare is the reporting.</strong></p>
              <p>Pulling numbers from five social platforms, managing unstructured CSV drops from clippers, stitching them into a Notion page, manually fixing sum totals, screen-recording a makeshift dashboard, and dealing with constant <code className="bg-[var(--color-surface-2)] px-2 py-1 rounded text-sm text-[var(--color-error)] border border-[var(--color-border)]">"hey, any update on my campaign?"</code> Pings.</p>
            </div>
            <p className="mt-10 text-[var(--color-text-muted)] italic text-sm p-6 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl">
              If your "ops stack" is currently four Google Sheets, manual TikTok link scraping, and a Slack channel called #distro-urgent — <strong className="text-[var(--color-text)]">you need this.</strong>
            </p>
          </div>

          <div className="lg:pt-0 flex flex-col justify-center">
            <span className="eyebrow text-[#00ff88]">The OpsRelic Solution</span>
            <h2 className="text-4xl font-bold tracking-tight mb-8 mt-4 leading-tight">We built the <br/>Clipping Agency OS.</h2>
            <div className="space-y-6 lg:space-y-8">
              {[
                { t: "1-Click Metrics Collection", d: "Drop clip links or CSV bundles. We scrape or parse the results natively. No more copy-pasting views.", c: "#00d4e8" },
                { t: "Agency-wide Workspaces", d: "Manage your clients, client limits, billing plans, and data completely isolated in secure workspaces.", c: "#00ff88" },
                { t: "Hands-free Client Portals", d: "Every campaign generates a secure portal. Clients see their live metrics on your branded page. Zero manual deck-building.", c: "#a020f0" }
              ].map(item => (
                <div key={item.t} className="p-8 rounded-[32px] bg-[var(--color-surface-2)] border border-[var(--color-border)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: item.c }} />
                  <h4 className="font-bold text-xl mb-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.c }} />
                    {item.t}
                  </h4>
                  <p className="text-[var(--color-text-muted)] leading-relaxed relative z-10">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="p-10 lg:p-16 rounded-[48px] bg-[var(--color-primary)] text-white relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-6 block">Coming in v2</span>
              <h2 className="text-4xl lg:text-6xl font-bold tracking-tighter mb-8 leading-none">The Campaign Wizard</h2>
              <p className="text-lg opacity-80 mb-10 leading-relaxed">
                Launch a campaign in 10 minutes, not 10 emails. Brief in, target KPIs in, OpsRelic spits out a structured campaign workspace with templates, reporting views, and "what works" insight packs. 
              </p>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-bold">
                <Shield className="w-4 h-4" /> Founding-tier customers get early access
              </div>
            </div>
            <div className="absolute right-[-10%] top-[-10%] w-[50%] h-[120%] bg-white/5 blur-[100px] skew-x-[-20deg]" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 border-t border-[var(--color-border)]">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="text-center mb-16">
            <span className="eyebrow">Common Queries</span>
            <h2 className="text-4xl font-bold mt-4 tracking-tight">Everything you need to know.</h2>
          </div>
          <div className="space-y-6">
            {[
              { q: "Is this another reporting dashboard?", a: "No. Reporting is one slice. The bigger value is the campaign workspace and the branded client portal, purpose-built for clipping and UGC agencies." },
              { q: "Do I have to switch off my existing tools?", a: "No. OpsRelic sits on top. Bring your clips, bring your CSVs, bring your campaign data — OpsRelic gives them a home and a story." },
              { q: "How is this different from generic agency tools?", a: "Generic tools are built for SEO or PPC. They aren't built around clipping campaigns or the high-density way creator-campaign teams report. OpsRelic is." },
              { q: "When can I get in?", a: "Early access is rolling now. Drop your email in the waitlist below and we'll set you up." }
            ].map(faq => (
              <div key={faq.q} className="p-8 rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <h4 className="font-bold text-lg mb-3 tracking-tight">{faq.q}</h4>
                <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-32 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="eyebrow">Operating Protocol</span>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 mt-4">Built for speed.</h2>
            <p className="text-lg text-[var(--color-text-muted)]">From client intake to performance portal in four obvious steps.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Onboard Client', desc: 'Initialize the unique operator workspace with core metadata.' },
              { step: '02', title: 'Launch Campaign', desc: 'Define goals, timelines, and deployment status mapping.' },
              { step: '03', title: 'Harvest Performance', desc: 'Upload CSV data or link performance links to campaign IDs.' },
              { step: '04', title: 'Enable Portal', desc: 'Publish a clean, read-only link for client-side visibility.' }
            ].map((s, i) => (
              <div key={s.title} className="relative group p-8 rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:shadow-xl transition-all">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-[var(--color-text-inverse)] flex items-center justify-center font-bold text-sm mb-6 shadow-lg">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold mb-4">{s.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{s.desc}</p>
                {i < 3 && <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-[var(--color-divider)] z-0" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Deep Dive Visuals */}
      <section id="visuals" className="py-32">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 max-w-xl">
              <span className="eyebrow">Micro-visibility</span>
              <h2 className="text-4xl lg:text-6xl font-bold tracking-tight mb-8 mt-4">Precision reporting.</h2>
              <p className="text-xl text-[var(--color-text-muted)] mb-10">Stop guessing. OpsRelic gives you a microscopic view of every campaign with automated dashboards that move fast.</p>
              
              <div className="space-y-8">
                {[
                  { t: 'Live Campaign Feed', d: 'Every upload updates your internal dashboards and client portals instantly.' },
                  { t: 'Operational Notes', d: 'Capture context on specific clips or campaign pivots within the workspace.' },
                  { t: 'Portal Identity', d: 'Branded links that only show the metrics your clients care about.' }
                ].map(item => (
                  <div key={item.t} className="flex gap-5 group">
                    <div className="w-6 h-6 rounded-full bg-[var(--color-primary-soft)] border border-[var(--color-primary-soft-2)] flex items-center justify-center shrink-0 mt-1 transition-colors group-hover:bg-[var(--color-primary-soft-2)]">
                      <CheckCircle2 className="w-3 h-3 text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{item.t}</h4>
                      <p className="text-[var(--color-text-muted)] text-sm">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full grid gap-8">
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-8 rounded-[40px] border border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-xl relative overflow-hidden"
              >
                <div className="flex justify-between items-center mb-10">
                  <h3 className="font-bold text-xl">Campaign Workspace</h3>
                  <span className="px-3 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-bold text-[var(--color-primary)]">Performance Tab</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {['842k Views', '28 Clips', '7.4% Eng.'].map(stat => (
                    <div key={stat} className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
                      <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1">{stat.split(' ')[1]}</div>
                      <div className="text-lg font-black">{stat.split(' ')[0]}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[
                    { n: 'Creator Sprint Q2', s: 'Active', t: 'Today' },
                    { n: 'UGC Push Week 3', s: 'Active', t: '2h ago' }
                  ].map(row => (
                    <div key={row.n} className="px-5 py-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between transition-all hover:bg-[var(--color-surface-offset)]">
                      <span className="font-bold text-sm tracking-tight">{row.n}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-[var(--color-success)] bg-[var(--color-success)]/10 px-2.5 py-1 rounded-full border border-[var(--color-success)]/20 uppercase tracking-widest">{row.s}</span>
                        <span className="text-[11px] text-[var(--color-text-faint)] font-bold">{row.t}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[var(--color-primary-soft)] blur-3xl opacity-50" />
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="p-8 rounded-[40px] border border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-xl relative overflow-hidden"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl">Client Portal</h3>
                  <span className="px-3 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-bold text-[var(--color-primary)]">Read-only Share</span>
                </div>
                <div className="bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-offset)] border border-[var(--color-border)] rounded-2xl p-6 mb-4">
                  <div className="font-bold text-lg mb-1">VoltNest — April Campaign</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Apr 1 – Apr 30 · Updated Live</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {['1.12M Views', '34 Delivered', '7.1% Eng.', '486k Reach'].map(m => (
                    <div key={m} className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                      <div className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-0.5">{m.split(' ')[1]}</div>
                      <div className="text-lg font-black">{m.split(' ')[0]}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="py-40 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-20 items-center">
            <div>
              <span className="eyebrow">Get Early Access</span>
              <h2 className="text-4xl lg:text-7xl font-bold tracking-tight mb-8 mt-4 leading-none">Get Early Access.</h2>
              <p className="text-xl text-[var(--color-text-muted)] mb-12">First 50 teams get founding pricing + a 1:1 setup session.</p>
              
              <ul className="space-y-6">
                {[
                  'Founding pricing locked in',
                  'Hands-on setup with Marwan (the founder)',
                  'First access to the campaign wizard',
                  'Direct line for feature requests'
                ].map(text => (
                  <li key={text} className="flex gap-4 items-center font-bold text-[var(--color-text-muted)] group">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0 border border-[var(--color-primary-soft-2)] group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[48px] p-10 md:p-14 shadow-2xl relative overflow-hidden"
            >
              <div className="relative z-10">
                {waitlistStatus === 'success' ? (
                  <div className="text-center py-20 px-4">
                    <div className="w-20 h-20 bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-bold mb-4">Request Received.</h3>
                    <p className="text-[var(--color-text-muted)] text-lg">We've added your agency to the priority queue. Stand by for verification.</p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold ml-2">Full Name</label>
                        <input 
                          required
                          type="text" 
                          placeholder="John Doe"
                          className="w-full bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl px-6 py-4 focus:ring-4 placeholder:opacity-50 outline-none"
                          value={waitlistData.name}
                          onChange={e => setWaitlistData({...waitlistData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold ml-2">Work Email</label>
                        <input 
                          required
                          type="email" 
                          placeholder="you@agency.com"
                          className="w-full bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl px-6 py-4 focus:ring-4 placeholder:opacity-50 outline-none"
                          value={waitlistData.email}
                          onChange={e => setWaitlistData({...waitlistData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-2">Agency Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="OpsRelic Studio"
                        className="w-full bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl px-6 py-4 focus:ring-4 placeholder:opacity-50 outline-none"
                        value={waitlistData.company}
                        onChange={e => setWaitlistData({...waitlistData, company: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-2">Context (Optional)</label>
                      <textarea 
                        placeholder="Scale, focus or specific needs..."
                        rows={4}
                        className="w-full bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl px-6 py-4 focus:ring-4 placeholder:opacity-50 outline-none resize-none"
                        value={waitlistData.message}
                        onChange={e => setWaitlistData({...waitlistData, message: e.target.value})}
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={waitlistStatus === 'loading'}
                      className="w-full h-16 rounded-3xl bg-[var(--color-primary)] text-[var(--color-text-inverse)] font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 shadow-xl"
                    >
                      {waitlistStatus === 'loading' ? (
                        <>Processing... <Loader2 className="w-5 h-5 animate-spin" /></>
                      ) : (
                        'Request Early Access'
                      )}
                    </button>
                    {waitlistStatus === 'error' && (
                      <p className="text-sm text-[var(--color-error)] font-bold text-center mt-4 uppercase tracking-widest">Network Error. Please retry.</p>
                    )}
                  </form>
                )}
              </div>
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-[var(--color-primary-soft)] blur-[100px] pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-[var(--color-divider)]">
        <div className="max-w-[1180px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 flex items-center justify-center transition-all group-hover:scale-110">
              <img src="/logo.png" alt="OpsRelic Logo" className="w-full h-full object-contain grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tighter text-[var(--color-text)]">OpsRelic</span>
              <div className="text-[9px] font-black text-[var(--color-text-faint)] uppercase tracking-[0.2em] -mt-1">
                Operational by default
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-xs font-bold text-[var(--color-text-faint)] uppercase tracking-widest">
            <a href="#features" className="hover:text-[var(--color-text)] transition-colors">Features</a>
            <a href="#workflow" className="hover:text-[var(--color-text)] transition-colors">How it works</a>
            <a href="#visuals" className="hover:text-[var(--color-text)] transition-colors">Product</a>
            <button 
              onClick={() => setAuthMode('login')}
              className="hover:text-[var(--color-text)] transition-colors"
            >
              Operator Login
            </button>
          </div>
        </div>
      </footer>

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      setError("This account is not authorized to access OpsRelic.");
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) throw new Error("Passwords mismatch.");
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle();
      if (!user.email || !ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
        setError("This Google account is not authorized.");
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Verification sequence failed.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[40px] p-10 md:p-12 w-full max-w-lg relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          <X className="w-8 h-8" />
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-soft)] border border-[var(--color-primary-soft-2)] mx-auto flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {mode === 'login' ? 'Operator Access' : 'Register Operator'}
          </h2>
          <p className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest px-4">
            {mode === 'login' ? 'Establish secure connection' : 'Initialize workspace protocol'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-[10px] font-bold uppercase tracking-wider text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider ml-2 text-[var(--color-text-muted)]">Operator Identity</label>
              <input required type="text" placeholder="Name" className="w-full h-12 px-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] placeholder:opacity-50 outline-none" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider ml-2 text-[var(--color-text-muted)]">Secure Email</label>
            <input required type="email" placeholder="Email" className="w-full h-12 px-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] placeholder:opacity-50 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider ml-2 text-[var(--color-text-muted)]">Access Key</label>
            <input required type="password" placeholder="Password" className="w-full h-12 px-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] placeholder:opacity-50 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider ml-2 text-[var(--color-text-muted)]">Verify Key</label>
              <input required type="password" placeholder="Confirm" className="w-full h-12 px-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] placeholder:opacity-50 outline-none" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          )}

          <button disabled={loading} className="w-full h-14 rounded-2xl bg-[var(--color-primary)] text-[var(--color-text-inverse)] font-bold uppercase tracking-widest text-xs mt-6 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
            {loading ? 'Initializing...' : mode === 'login' ? 'Execute Login' : 'Launch Workspace'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--color-divider)]"></div></div>
          <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-[0.3em] text-[var(--color-text-faint)]">
            <span className="bg-[var(--color-surface-2)] px-4">Secure SSO Tunnel</span>
          </div>
        </div>

        <button onClick={handleGoogleLogin} disabled={loading} className="w-full h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-[var(--color-surface-offset)] transition-all">
          <svg className="w-4 h-4 grayscale opacity-70" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google Identity
        </button>

        <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)]">
          OpsRelic v1.0.0 — The Clipping Agency OS
        </p>
      </motion.div>
    </div>
  );
}
