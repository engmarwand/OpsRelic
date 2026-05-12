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
          --color-surface: #f9f8f5;
          --color-surface-2: #fbfbf9;
          --color-surface-offset: #f0ede7;
          --color-border: rgba(40,37,29,0.12);
          --color-divider: #dcd9d5;
          --color-text: #28251d;
          --color-text-muted: #686660;
          --color-text-faint: #9b988f;
          --color-text-inverse: #f9f8f4;
          --color-primary: #01696f;
          --color-primary-hover: #0c4e54;
          --color-primary-soft: rgba(1,105,111,0.08);
          --color-primary-soft-2: rgba(1,105,111,0.15);
          --color-success: #437a22;
          --color-error: #a12c7b;
        }
        .dark {
          --color-bg: #171614;
          --color-surface: #1d1c1a;
          --color-surface-2: #242320;
          --color-surface-offset: #2a2825;
          --color-border: rgba(255,255,255,0.1);
          --color-divider: #393836;
          --color-text: #e5e1d9;
          --color-text-muted: #b4b0a8;
          --color-text-faint: #8e8a84;
          --color-text-inverse: #171614;
          --color-primary: #4f98a3;
          --color-primary-hover: #6daeb8;
          --color-primary-soft: rgba(79,152,163,0.12);
          --color-primary-soft-2: rgba(79,152,163,0.18);
          --color-success: #7ab356;
          --color-error: #d163a7;
        }

        .dashboard-shell {
          transform: perspective(5000px) rotateY(-0.5deg) rotateX(0deg);
          transition: transform 800ms cubic-bezier(0.16,1,0.3,1);
        }
        .dashboard-shell:hover {
          transform: perspective(5000px) rotateY(0deg) rotateX(0deg) translateY(-4px) scale(1.005);
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

          {/* ... (Visual Stratum) ... */}
          <div className="relative w-full perspective-3000">
            <div className="relative z-10 w-full aspect-[4/5] lg:aspect-square">
              {/* ... (Layer 1, 2, 3) ... */}
            </div>
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
              { icon: Building, title: 'Agency Home & Operations', desc: 'A command center for your entire agency. Get real-time alerts, monitor team activity, and manage workspace settings all in one view.' },
              { icon: Users, title: 'Client & Campaign Management', desc: 'Store campaign briefs, asset libraries, targets, and deliverable status. Keep everything related to a client organized.' },
              { icon: BarChart3, title: 'Real-time Agency Analytics', desc: 'Automatically consolidate performance data across campaigns. Track views, engagement, and KPIs with enterprise precision.' },
              { icon: Globe, title: 'Branded Client Portals', desc: 'Secure, client-facing workspaces. Deliver live-updated performance reports without ever sending another PDF deck.' },
              { icon: Layers, title: 'Centralized Brand Assets', desc: 'A unified library for agency-wide brand assets, logos, and campaign templates for quick access.' },
              { icon: MessageSquare, title: 'Streamlined Intake & Workflow', desc: 'Stop managing campaign updates via email. Use standardized intake and automated status updates to align the team.' }
            ].map((cap, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -10 }}
                className="p-8 rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-primary)] hover:shadow-lg transition-all cursor-pointer group"
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
      <section className="py-24 lg:py-40 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="max-w-[1180px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24">
          <div>
            <span className="eyebrow">Who it's for</span>
            <h2 className="text-4xl lg:text-6xl font-bold tracking-tight mb-10 mt-4 leading-none">Built for the next wave.</h2>
            <div className="space-y-8">
              {[
                { t: "Clipping Agencies", d: "Running multi-client books across TikTok, Reels, Shorts and X." },
                { t: "UGC Teams", d: "Creator-campaign agencies that need to show outcomes, not just deliverables." },
                { t: "Platform Operators", d: "Teams that want to give their power users a serious agency-side workspace." }
              ].map(item => (
                <div key={item.t} className="p-6 rounded-3xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-sm">
                  <h4 className="font-bold text-lg mb-2 text-[var(--color-primary)]">{item.t}</h4>
                  <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 text-[var(--color-text-muted)] italic text-sm">
              If your "ops stack" is currently four Google Sheets, two Notion docs, and a Slack channel called #client-please-stop-asking — you're our user.
            </p>
          </div>

          <div className="lg:pt-20">
            <span className="eyebrow">Why OpsRelic exists</span>
            <h2 className="text-4xl font-bold tracking-tight mb-8 mt-4 leading-tight">Exhausted by the ops? We fixed it.</h2>
            <div className="text-[var(--color-text-muted)] space-y-6 leading-relaxed">
              <p>Most clipping and creator-campaign agencies are excellent at the work and exhausted by the ops.</p>
              <p>The campaign happens fine — clippers post, views land, payouts go out. The problem is what comes after: pulling the numbers from five places, stitching them into a deck, screen-recording a dashboard, sending a screenshot, and waiting for the next "any update?" Slack ping.</p>
              <p className="font-bold text-[var(--color-text)]">OpsRelic exists to give that whole layer back to you. One workspace. One report. One portal. Built by someone who lived the chaos at clipping and UGC agencies and finally decided to fix it instead of working around it.</p>
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
