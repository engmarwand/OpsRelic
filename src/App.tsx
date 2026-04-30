import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  ArrowRight, ArrowLeft, Check, ChevronRight, Menu, X, 
  FileText, CreditCard, Layout, Calendar, MessageSquare, 
  Settings, Zap, Users, Star, ArrowUp, Activity, CheckCircle2,
  Clock, ShieldCheck, Play, Lock
} from 'lucide-react';

const BrandLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img src="/logo.png" alt="OpsRelic Logo" className={className} />
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 flex justify-center ${scrolled ? 'py-4' : 'py-6'}`}>
      <div className={`absolute inset-0 transition-all duration-500 ${scrolled ? 'bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl' : 'bg-transparent'}`} />
      <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between relative z-10">
        <div className="md:hidden flex items-center w-1/3">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-zinc-400 hover:text-white transition-colors p-2 -ml-2" aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <div className="flex items-center gap-2 group cursor-pointer justify-center md:justify-start w-1/3 md:w-auto" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }}>
          <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(69,243,255,0.5)]">
            <BrandLogo className="w-full h-full" />
          </div>
          <span className="text-lg md:text-xl font-bold text-white tracking-wide">OpsRelic</span>
        </div>

        <div className="hidden md:flex items-center justify-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How it works</a>
          <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
          <a href="#testimonials" className="hover:text-cyan-400 transition-colors">Testimonials</a>
          <a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
        </div>

        <div className="flex justify-end w-1/3 md:w-auto">
          <a href="#onboarding" onClick={() => setMobileMenuOpen(false)} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/40 via-blue-500/40 to-cyan-400/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-[pulse_3s_ease-in-out_infinite]"></div>
            <div className="relative bg-white text-zinc-950 font-bold px-4 py-2 md:px-6 md:py-2.5 rounded-full transition-all duration-300 hover:scale-[1.02] flex items-center gap-2 text-[11px] md:text-sm whitespace-nowrap shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
              <span>Start free week</span>
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-zinc-950 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-zinc-950/95 border-b border-white/5 shadow-2xl backdrop-blur-lg">
          <div className="flex flex-col px-6 py-4 gap-4 text-sm font-medium text-zinc-400">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-cyan-400 transition-colors py-2 border-b border-white/5">How it works</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-cyan-400 transition-colors py-2 border-b border-white/5">Features</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="hover:text-cyan-400 transition-colors py-2 border-b border-white/5">Testimonials</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-cyan-400 transition-colors py-2 border-b border-white/5">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-cyan-400 transition-colors py-2">FAQ</a>
          </div>
        </div>
      )}
    </header>
  );
};

const MockUICard = ({ delay, icon: Icon, title, status, index }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 1, type: "spring", stiffness: 100 }}
    className="absolute bg-zinc-900/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex items-center gap-4 w-full left-0 hover:bg-zinc-900/80 hover:border-white/10 transition-colors cursor-default"
    style={{ top: `${index * 80}px`, zIndex: 10 - index }}
  >
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
      <Icon className="w-4 h-4 text-cyan-400" />
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-semibold text-zinc-100 tracking-tight">{title}</h4>
      <p className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 mt-0.5">
         {status}
      </p>
    </div>
    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />
  </motion.div>
);

const Hero = () => {
  return (
    <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-32 overflow-hidden bg-zinc-950">
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-cyan-600/10 blur-[150px] rounded-full -z-10" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[150px] rounded-full -z-10" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-300 text-xs font-semibold tracking-wider mb-8 shadow-lg">
              <div className="flex gap-0.5 text-amber-400">
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="h-3 w-px bg-white/10 mx-1"></span>
              Trusted by 100+ agencies
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
              Automate your client onboarding in <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 drop-shadow-sm">7 days.</span><br />
              <span className="text-zinc-600">First week is free.</span>
            </h1>
            <p className="text-lg lg:text-xl text-zinc-400 mb-10 max-w-lg leading-relaxed font-light">
              OpsRelic builds done-for-you workflows that turn your messy client intake into a flawless, instant, and automated process.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <a href="#onboarding" className="w-full sm:w-auto relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-400/50 via-blue-500/50 to-cyan-400/50 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-[pulse_3s_ease-in-out_infinite]"></div>
                <div className="relative bg-white text-zinc-950 font-bold px-8 py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 text-lg hover:scale-[1.02] shadow-xl">
                  Start free week <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </a>
              <a href="#demo" className="w-full sm:w-auto text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-3 font-semibold px-4 py-4 rounded-full border border-transparent hover:bg-zinc-900/50 hover:border-white/5">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shadow-inner group-hover:bg-zinc-800 transition-colors">
                  <Play className="w-4 h-4 text-cyan-400 ml-0.5" />
                </div>
                Watch a 60-second demo
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 pt-8 border-t border-white/5">
              <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Bank-grade security
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                <Users className="w-4 h-4 text-emerald-400" /> Built for service teams
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                <Zap className="w-4 h-4 text-emerald-400" /> Fast deployment
              </div>
            </div>
          </motion.div>

          <div className="relative h-[550px] hidden lg:flex items-center justify-center w-full lg:col-span-6">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-3xl" />
            <div className="relative w-full h-[450px] max-w-[320px]">
              <MockUICard index={0} delay={0.2} icon={FileText} title="Service Contract" status="Auto-sent & Signed" />
              <MockUICard index={1} delay={0.4} icon={CreditCard} title="First Invoice" status="Paid via Stripe" />
              <MockUICard index={2} delay={0.6} icon={Layout} title="Intake Form" status="Completed successfully" />
              <MockUICard index={3} delay={0.8} icon={Activity} title="Project Board" status="Created from template" />
              <MockUICard index={4} delay={1.0} icon={Calendar} title="Kickoff Call" status="Booked automatically" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SocialProof = () => (
  <section className="py-16 border-y border-white/5 bg-zinc-950/80 backdrop-blur-md relative z-20">
    <div className="max-w-7xl mx-auto px-6 text-center">
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-10">Trusted by modern scaling agencies</p>
      <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
        <div className="text-2xl font-bold tracking-tighter flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div> Acme Agency</div>
        <div className="text-2xl font-semibold tracking-wide flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div> GrowthLabs</div>
        <div className="text-2xl font-black italic flex items-center gap-3"><div className="w-7 h-7 rotate-45 bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div> NEXUS</div>
        <div className="text-2xl font-medium tracking-tight flex items-center gap-3"><div className="w-7 h-7 rounded-tr-2xl bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div> Altitude</div>
      </div>
    </div>
  </section>
);

const HowItWorks = () => {
  const steps = [
    { icon: MessageSquare, title: "Answer questions", desc: "Fill out a quick brief about your ideal workflow." },
    { icon: Settings, title: "We build it in 7 days", desc: "Our team constructs the entire automation stack." },
    { icon: Users, title: "Onboard instantly", desc: "Test it live with your next new client." },
    { icon: ShieldCheck, title: "Keep if you love it", desc: "Stay on for the month if it saves you time." },
  ];

  return (
    <section id="how-it-works" className="py-32 bg-zinc-950 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">How the magic happens</h2>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-light">From messy onboarding to total automation in four simple steps.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-[2.25rem] left-10 right-10 h-px bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 opacity-50 -z-10" />
          
          {steps.map((step, i) => (
            <div key={i} className="bg-transparent relative group">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-8 relative z-10 group-hover:border-white/10 group-hover:bg-zinc-800 transition-colors shadow-xl">
                 <div className="absolute -top-3 w-6 h-6 rounded-full bg-zinc-950 text-xs font-bold flex items-center justify-center text-zinc-500 border border-white/5">{i+1}</div>
                <step.icon className="w-6 h-6 text-zinc-300 group-hover:text-white transition-colors" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-[200px] mx-auto font-medium">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const OnboardingWizard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessType: '',
    businessTypeOther: '',
    volume: '',
    tools: [] as string[],
    annoyingPart: '',
    priority: '',
    firstName: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 6;

  const handleNext = () => setStep(s => Math.min(s + 1, totalSteps + 1));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const toggleTool = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(tool) 
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Placeholder for actual webhook logic
    // await fetch('https://hook.us2.make.com/your-webhook-id', { method: 'POST', body: JSON.stringify(formData) });
    setTimeout(() => {
      setIsSubmitting(false);
      handleNext();
    }, 1500);
  };

  const OptionButton = ({ value, stateKey, label }: { value: string, stateKey: 'businessType' | 'volume' | 'priority', label?: string }) => {
    const isSelected = formData[stateKey] === value;
    return (
      <button
        onClick={() => {
          setFormData(prev => ({ ...prev, [stateKey]: value }));
          setTimeout(handleNext, 300);
        }}
        className={`w-full text-left p-4 rounded-xl border ${isSelected ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'bg-zinc-900 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:border-white/20'} transition-all`}
      >
        <span className="font-medium">{label || value}</span>
      </button>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6">What type of business do you run?</h3>
            <div className="space-y-3">
              <OptionButton value="Agency" stateKey="businessType" />
              <OptionButton value="Coach/Consultant" stateKey="businessType" />
              <OptionButton value="Service Business" stateKey="businessType" />
              <button
                onClick={() => setFormData(prev => ({ ...prev, businessType: 'Other' }))}
                className={`w-full text-left p-4 rounded-xl border ${formData.businessType === 'Other' ? 'bg-zinc-800 border-cyan-500/50' : 'bg-zinc-900 border-white/10'} text-zinc-300 transition-all`}
              >
                Other
              </button>
              {formData.businessType === 'Other' && (
                <input
                  type="text"
                  autoFocus
                  placeholder="Tell us more..."
                  value={formData.businessTypeOther}
                  onChange={e => setFormData(p => ({ ...p, businessTypeOther: e.target.value }))}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 mt-2"
                />
              )}
            </div>
            {formData.businessType === 'Other' && formData.businessTypeOther && (
               <div className="flex justify-end mt-6">
                 <button onClick={handleNext} className="bg-cyan-500 text-zinc-950 px-6 py-2 rounded-full font-semibold hover:bg-cyan-400">Next</button>
               </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6">How many new clients do you onboard per month on average?</h3>
            <div className="space-y-3">
              <OptionButton value="1-5" stateKey="volume" />
              <OptionButton value="6-10" stateKey="volume" />
              <OptionButton value="11-20" stateKey="volume" />
              <OptionButton value="20+" stateKey="volume" />
            </div>
          </div>
        );
      case 3:
        const toolsList = ["Stripe", "Notion", "Trello", "Asana", "Google Sheets", "Calendly", "HubSpot", "Slack"];
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6">Which tools do you currently use? <span className="text-zinc-500 text-sm font-normal block mt-1">(Select all that apply)</span></h3>
            <div className="flex flex-wrap gap-3">
              {toolsList.map(t => {
                const isSelected = formData.tools.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTool(t)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${isSelected ? 'bg-cyan-500 border-cyan-400 text-zinc-950 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-zinc-900 border-white/10 text-zinc-300 hover:border-white/30'}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end pt-8">
               <button onClick={handleNext} className="bg-white text-zinc-950 px-6 py-2.5 rounded-full font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2">Next <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6">What's the most annoying part of your current onboarding process?</h3>
            <textarea
              rows={4}
              value={formData.annoyingPart}
              onChange={e => setFormData(p => ({ ...p, annoyingPart: e.target.value }))}
              placeholder="e.g., chasing clients for info, setting up folders manually..."
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-cyan-500 resize-none transition-colors"
            />
            <div className="flex justify-end pt-4">
               <button onClick={handleNext} disabled={!formData.annoyingPart} className="bg-white text-zinc-950 px-6 py-2.5 rounded-full font-bold disabled:opacity-50 hover:bg-zinc-200 transition-colors">Next</button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6">What's your priority?</h3>
            <div className="space-y-3">
              <OptionButton value="Save time" stateKey="priority" />
              <OptionButton value="Look more professional" stateKey="priority" />
              <OptionButton value="Reduce mistakes" stateKey="priority" />
              <OptionButton value="All of the above" stateKey="priority" />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6">Where should we send your custom setup plan?</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 ml-1 mb-1 block">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 ml-1 mb-1 block">Best Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div className="flex justify-end pt-6">
               <button 
                onClick={handleSubmit} 
                disabled={!formData.firstName || !formData.email || isSubmitting}
                className="bg-gradient-to-r from-cyan-400 to-blue-500 text-zinc-950 px-8 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50 hover:scale-105 transition-all flex items-center gap-2"
               >
                 {isSubmitting ? 'Submitting...' : 'Claim Free Week'}
                 {!isSubmitting && <ArrowRight className="w-4 h-4" />}
               </button>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Got it.</h3>
            <p className="text-zinc-400 text-lg max-w-md mx-auto mb-6">
              We'll review your answers and send you a personalized setup plan for your free first week.
            </p>
            <p className="text-sm text-zinc-500 block p-4 bg-white/5 rounded-xl border border-white/10 inline-block">
              You'll also get a short Loom showing what your onboarding could look like inside your custom tools.
            </p>
          </div>
        );
    }
  };

  return (
    <section id="onboarding" className="py-32 bg-zinc-950 relative z-20">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
           <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Let's build your blueprint.</h2>
           <p className="text-zinc-400">Answer 6 quick questions to see if we're a fit.</p>
        </div>
        <div className="relative bg-zinc-900 border border-white/5 rounded-[2rem] p-8 shadow-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          {step <= totalSteps && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {step > 1 ? (
                  <button onClick={handlePrev} className="text-zinc-400 hover:text-white flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
                ) : <div />}
                <span className="text-xs font-medium text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">Step {step} of {totalSteps}</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out" style={{ width: `${(step / totalSteps) * 100}%` }} />
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[300px]"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    {
      title: "Contracts → Paid → Ready",
      desc: "Auto-send your contract, generate a Stripe invoice, and trigger your intake form in one seamless flow.",
      icon: Layout
    },
    {
      title: "Zero manual copying",
      desc: "Automatically creates a Notion, Trello, or Asana board and fills it with the client's information instantly.",
      icon: Clock
    },
    {
      title: "Autopilot scheduling",
      desc: "Automatically sends a customized Calendly or cal.com scheduling link specifically after payment and form completion.",
      icon: Calendar
    },
    {
      title: "Works with your existing tools",
      desc: "Stripe, Notion, Trello, Asana, Google Sheets, Calendly, Slack, HubSpot. If it has an API, we connect it.",
      icon: Zap
    }
  ];

  return (
    <section id="features" className="py-32 bg-zinc-950 border-t border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 text-xs font-semibold tracking-wider mb-6">
            <Zap className="w-4 h-4 text-cyan-400" /> Seamless stack integration
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Everything automated.<br className="hidden md:block"/> Everything connected.</h2>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-light">We build the plumbing so you can focus entirely on fulfillment and sales.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2rem] hover:bg-zinc-900/80 hover:border-white/10 transition-all duration-500 group shadow-lg">
              <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-all shadow-inner">
                <f.icon className="w-6 h-6 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 tracking-tight">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-32 bg-zinc-950 border-t border-white/5 relative z-10 overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 text-xs font-semibold tracking-wider mb-6">
            <Star className="w-4 h-4 text-cyan-400 fill-cyan-400" /> Rated 4.9/5 by founders
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Results that speak <br className="hidden md:block"/> for themselves.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 p-10 rounded-[2rem] relative shadow-lg">
            <div className="flex justify-between items-start mb-8">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400 opacity-90" />)}
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 flex items-center gap-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" /> Verified
              </div>
            </div>
            <p className="text-lg text-zinc-300 mb-10 font-medium leading-relaxed">"We went from 2 days to 15 minutes to onboard a new client. It feels like magic, honestly."</p>
            <div className="flex items-center gap-4 border-t border-white/5 pt-6">
              <div className="w-12 h-12 bg-zinc-800 rounded-full border border-white/10"></div>
              <div>
                <p className="text-white font-bold text-sm">Marcus K.</p>
                <p className="text-zinc-500 text-xs font-medium">Agency Owner</p>
              </div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 p-10 rounded-[2rem] relative shadow-lg">
            <div className="flex justify-between items-start mb-8">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400 opacity-90" />)}
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 flex items-center gap-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" /> Verified
              </div>
            </div>
            <p className="text-lg text-zinc-300 mb-10 font-medium leading-relaxed">"Our clients used to complain about the 10 emails it took to start working. Now it's one smooth flow."</p>
            <div className="flex items-center gap-4 border-t border-white/5 pt-6">
              <div className="w-12 h-12 bg-zinc-800 rounded-full border border-white/10"></div>
              <div>
                <p className="text-white font-bold text-sm">Sarah L.</p>
                <p className="text-zinc-500 text-xs font-medium">Sales Coach</p>
              </div>
            </div>
          </div>
          {/* Card 3 */}
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 p-10 rounded-[2rem] relative shadow-lg">
            <div className="flex justify-between items-start mb-8">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400 opacity-90" />)}
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 flex items-center gap-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" /> Verified
              </div>
            </div>
            <p className="text-lg text-zinc-300 mb-10 font-medium leading-relaxed">"OpsRelic saved us from having to hire a full-time admin assistant just to handle forms and folders."</p>
            <div className="flex items-center gap-4 border-t border-white/5 pt-6">
              <div className="w-12 h-12 bg-zinc-800 rounded-full border border-white/10"></div>
              <div>
                <p className="text-white font-bold text-sm">James R.</p>
                <p className="text-zinc-500 text-xs font-medium">Consultant</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const PricingSection = () => {
  return (
    <section id="pricing" className="py-32 bg-zinc-950 border-t border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 text-xs font-semibold tracking-wider mb-6">
             <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Risk-Free Guarantee
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Simple, transparent pricing.</h2>
          <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto mb-4 font-light">First week is always free. You only pay if you decide to keep it running.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter */}
          <div className="bg-zinc-900/30 border border-white/5 p-10 rounded-[2rem] flex flex-col pt-12">
            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
            <div className="text-5xl font-bold text-white mb-8 tracking-tight"><span className="text-2xl text-zinc-500 mr-1">$</span>400<span className="text-lg text-zinc-500 font-medium tracking-normal">/mo</span></div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-start gap-3 text-zinc-300 text-sm font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> 1 complete onboarding workflow</li>
              <li className="flex items-start gap-3 text-zinc-300 text-sm font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Basic maintenance</li>
              <li className="flex items-start gap-3 text-zinc-300 text-sm font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Email support</li>
            </ul>
            <a href="#onboarding" className="w-full text-center py-4 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors font-semibold border border-white/10 shadow-sm">Start Free Week</a>
          </div>

          {/* Growth */}
          <div className="bg-zinc-900 border border-white/10 p-10 rounded-[2rem] flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.5)] transform md:-translate-y-4 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-blue-500 text-zinc-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl border border-white/20">Recommended</div>
            <h3 className="text-xl font-bold text-white mb-2 mt-4">Growth</h3>
            <div className="text-5xl font-bold text-white mb-8 tracking-tight"><span className="text-2xl text-cyan-500 mr-1">$</span>750<span className="text-lg text-zinc-500 font-medium tracking-normal">/mo</span></div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-start gap-3 text-zinc-100 text-sm font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> 2-3 connected workflows</li>
              <li className="flex items-start gap-3 text-zinc-100 text-sm font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Monthly proactive optimization</li>
              <li className="flex items-start gap-3 text-zinc-100 text-sm font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Priority 24hr support</li>
            </ul>
            <a href="#onboarding" className="w-full text-center py-4 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 transition-all transform hover:scale-[1.02] font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">Claim Free Week</a>
          </div>

          {/* Scale */}
          <div className="bg-zinc-900/30 border border-white/5 p-10 rounded-[2rem] flex flex-col pt-12">
            <h3 className="text-xl font-bold text-white mb-2">Scale</h3>
            <div className="text-5xl font-bold text-white mb-8 tracking-tight"><span className="text-2xl text-zinc-500 mr-1">$</span>1,500<span className="text-lg text-zinc-500 font-medium tracking-normal">/mo</span></div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-start gap-3 text-zinc-300 text-sm font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Fully custom automation stack</li>
              <li className="flex items-start gap-3 text-zinc-300 text-sm font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Dedicated operations architect</li>
              <li className="flex items-start gap-3 text-zinc-300 text-sm font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Private Slack channel</li>
            </ul>
            <a href="#onboarding" className="w-full text-center py-4 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors font-semibold border border-white/10 shadow-sm">Talk to Sales</a>
          </div>
        </div>
        
        <div className="mt-12 flex justify-center">
           <div className="bg-zinc-900 rounded-full px-6 py-3 border border-white/5 flex items-center justify-center gap-8 text-xs font-semibold text-zinc-500">
             <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-emerald-400/70" /> SEPA & Stripe Secure</span>
             <span className="h-4 w-px bg-white/5"></span>
             <span className="flex items-center gap-2">Cancel anytime. No lock-in.</span>
           </div>
        </div>
      </div>
    </section>
  );
};

const FAQAccordion = () => {
  const faqs = [
    { q: "What happens during the free week?", a: "We audit your current process, design a custom workflow, and set it up live. You test it out on real clients for a week to see the value before paying." },
    { q: "Do you need access to my accounts?", a: "Only the tools we are connecting (like your Calendly API key or Zapier acc). Security is our top priority, and we use secure integration methods." },
    { q: "What tools do you integrate with?", a: "Everything that has an API. Native apps we love include Stripe, Notion, ClickUp, Asana, Monday, HubSpot, Gmail, Slack, and AirTable." },
    { q: "What if I don't like the result?", a: "You don't pay. It's completely risk-free. If the automation doesn't save you time, we disconnect it." },
    { q: "Can you build more than onboarding?", a: "Yes. Once you're on a paid plan, we can automate offboarding, content distribution, lead capture, and internal reporting." }
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32 bg-zinc-950 border-t border-white/5 relative z-10">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-white mb-16 text-center tracking-tight">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-white/5 rounded-2xl bg-zinc-900/30 overflow-hidden hover:bg-zinc-900/60 transition-colors">
              <button 
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-8 py-6 flex items-center justify-between text-left transition-colors"
              >
                <span className="font-semibold text-white tracking-tight">{faq.q}</span>
                <ChevronRight className={`w-5 h-5 text-cyan-400 transition-transform duration-300 ${open === i ? 'rotate-90' : ''}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-8 pb-6 text-zinc-400 text-sm leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SimpleFooter = () => (
  <footer className="bg-zinc-950 border-t border-white/5 py-12 relative z-10">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <BrandLogo className="w-8 h-8 opacity-80 grayscale" />
        <p className="text-zinc-500 text-sm">Automation systems for modern service businesses.</p>
      </div>
      <div className="flex gap-6 text-sm text-zinc-500">
        <a href="#" className="hover:text-white transition">Home</a>
        <a href="#how-it-works" className="hover:text-white transition">How it works</a>
        <a href="#pricing" className="hover:text-white transition">Pricing</a>
        <a href="#faq" className="hover:text-white transition">FAQ</a>
      </div>
      <div className="text-sm text-zinc-600">
        © 2024 OpsRelic.
      </div>
    </div>
  </footer>
);

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 font-sans selection:bg-cyan-500/30">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <HowItWorks />
        <OnboardingWizard />
        <Features />
        <TestimonialsSection />
        <PricingSection />
        <FAQAccordion />
      </main>
      <SimpleFooter />
    </div>
  );
}
