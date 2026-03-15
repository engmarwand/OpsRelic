import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Play, ArrowRight, Upload, Scissors, Calendar, Check, Star, TrendingUp, Zap, BarChart3, Users, Eye, Sparkles, ChevronRight, ShieldCheck, PlayCircle, MessageCircle, Video, Smartphone, CheckCircle2, ArrowUp } from 'lucide-react';

const BrandLogo = ({ className = "w-8 h-8" }: { className?: string }) => {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img 
        src="/logo.png" 
        alt="Opsrelic Logo" 
        className={`${className} object-contain drop-shadow-[0_0_15px_rgba(69,243,255,0.3)]`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback SVG until the image is uploaded
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brand-logo-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#45f3ff" />
          <stop offset="100%" stopColor="#0078d7" />
        </linearGradient>
      </defs>
      <g fill="url(#brand-logo-grad)">
        <circle cx="50" cy="50" r="4" />
        <path d="M50 42C45.5817 42 42 45.5817 42 50C42 54.4183 45.5817 58 50 58C54.4183 58 58 54.4183 58 50C58 45.5817 54.4183 42 50 42ZM50 54C47.7909 54 46 52.2091 46 50C46 47.7909 47.7909 46 50 46C52.2091 46 54 47.7909 54 50C54 52.2091 52.2091 54 50 54Z" />
        <path d="M48 16.1V20.3C33.6 21.4 22 32.8 20.3 47H16.1C17.8 30.5 31.5 17.8 48 16.1Z" />
        <path d="M52 16.1C68.5 17.8 82.2 30.5 83.9 47H79.7C78 32.8 66.4 21.4 52 20.3V16.1Z" />
        <path d="M48 83.9C31.5 82.2 17.8 69.5 16.1 53H20.3C22 67.2 33.6 78.6 48 79.7V83.9Z" />
        <path d="M52 83.9V79.7C66.4 78.6 78 67.2 79.7 53H75.5C73.8 65 64.2 74.6 52 75.7V83.9Z" />
        <path d="M30 47C31.5 37.2 39.2 29.5 49 28V34C42.5 35.3 37.3 40.5 36 47H30Z" />
        <path d="M70 47H64C62.7 40.5 57.5 35.3 51 34V28C60.8 29.5 68.5 37.2 70 47Z" />
        <path d="M30 53H36C37.3 59.5 42.5 64.7 49 66V72C39.2 70.5 31.5 62.8 30 53Z" />
        <path d="M70 53C68.5 62.8 60.8 70.5 51 72V66C57.5 64.7 62.7 59.5 64 53H70Z" />
        <circle cx="50" cy="20" r="2.5" />
        <path d="M50 16C47.7909 16 46 17.7909 46 20C46 22.2091 47.7909 24 50 24C52.2091 24 54 22.2091 54 20C54 17.7909 52.2091 16 50 16ZM50 22C48.8954 22 48 21.1046 48 20C48 18.8954 48.8954 18 50 18C51.1046 18 52 18.8954 52 20C52 21.1046 51.1046 22 50 22Z" />
        <circle cx="75" cy="53" r="2.5" />
        <path d="M75 49C72.7909 49 71 50.7909 71 53C71 55.2091 72.7909 57 75 57C77.2091 57 79 55.2091 79 53C79 50.7909 77.2091 49 75 49ZM75 55C73.8954 55 73 54.1046 73 53C73 51.8954 73.8954 51 75 51C76.1046 51 77 51.8954 77 53C77 54.1046 76.1046 55 75 55Z" />
        <rect x="79" y="52" width="5" height="2" />
      </g>
    </svg>
  );
};

// --- UI Components ---

const NoiseOverlay = () => (
  <div 
    className="fixed inset-0 opacity-[0.03] pointer-events-none z-50 mix-blend-normal" 
    style={{ 
      backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
      transform: 'translateZ(0)'
    }}
  />
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-zinc-950/85 backdrop-blur-xl border-b border-white/5 py-4 shadow-2xl' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 group cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="relative flex items-center justify-center w-10 h-10 transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(69,243,255,0.5)]">
            <BrandLogo className="w-full h-full" />
          </div>
          <span className="text-xl font-display font-bold text-white tracking-wide text-left not-italic no-underline">OpsRelic</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#calculator" className="hover:text-cyan-400 transition-colors">ROI Calculator</a>
          <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How it Works</a>
          <a href="#testimonials" className="hover:text-cyan-400 transition-colors">Wall of Love</a>
          <a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
        </div>
        <button 
          data-cal-link="engmarwan/free-content-strategy-call"
          data-cal-namespace="free-content-strategy-call"
          data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"dark"}'
          className="relative group overflow-hidden rounded-full p-[1px] animate-[pulse_3s_ease-in-out_infinite]"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 rounded-full opacity-70 group-hover:opacity-100 animate-[spin_3s_linear_infinite]" />
          <div className="relative bg-zinc-950 text-white font-medium px-4 py-2 md:px-6 md:py-2.5 rounded-full transition-all duration-300 group-hover:bg-zinc-900 flex items-center gap-2 text-xs md:text-sm">
            <span className="hidden sm:inline">Book strategy call</span>
            <span className="sm:hidden">Book call</span>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </header>
  );
};

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-24 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-zinc-950 -z-20" />
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-600/15 blur-3xl md:blur-[100px] rounded-full -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/15 blur-3xl md:blur-[100px] rounded-full -z-10" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none -z-10" />
      
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          
          {/* Top Column: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium mb-8 backdrop-blur-md shadow-2xl"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-semibold">Voted #1 Repurposing Agency</span>
              <span className="w-1 h-1 rounded-full bg-zinc-600 mx-1" />
              2026 Edition
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-5xl lg:text-7xl font-display font-bold text-white leading-[1.05] tracking-tight mb-6"
            >
              Turn one video into a <br />
              <span className="relative inline-block mt-2">
                <span className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl rounded-full" />
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300">
                  month of content
                </span>
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed font-light"
            >
              We transform your long-form videos into highly-engaging, viral-ready clips for Shorts, Reels, and TikTok. <strong className="text-white font-medium">You create. We distribute.</strong>
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-12 w-full"
            >
              <button 
                data-cal-link="engmarwan/free-content-strategy-call"
                data-cal-namespace="free-content-strategy-call"
                data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"dark"}'
                className="w-full sm:w-auto bg-white text-zinc-950 hover:bg-zinc-200 font-semibold px-8 py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:-translate-y-1"
              >
                Start scaling today <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 border-t border-white/10 w-full max-w-2xl mx-auto"
            >
              <div className="flex -space-x-3">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80"
                ].map((src, i) => (
                  <img key={i} src={src} alt={`Creator ${i + 1}`} className="w-10 h-10 rounded-full border-2 border-zinc-950 relative z-10 hover:z-20 transition-transform hover:scale-110 object-cover" />
                ))}
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-cyan-400 text-cyan-400" />)}
                  <span className="text-white font-bold ml-2">4.9/5</span>
                </div>
                <p className="text-sm text-zinc-400">Trusted by <strong className="text-white">140+</strong> creators generating <strong className="text-cyan-400">25M+</strong> views</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom Column: Video Player */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex w-full items-center justify-center mt-16 lg:mt-24"
          >
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.15)] border border-cyan-500/20 bg-zinc-950">
              {/* The Video */}
              <iframe 
                src="https://player.vimeo.com/video/1173717978?h=4e306303cf&autoplay=1&loop=1&muted=1" 
                className="absolute inset-0 w-full h-full z-10 rounded-2xl"
                frameBorder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowFullScreen
              ></iframe>
              
              {/* Decorative Frame */}
              <div className="absolute inset-0 border border-white/10 rounded-2xl z-20 pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const SocialProofLogos = () => {
  const logos = [
    {
      name: "YouTube Shorts",
      color: "group-hover:text-[#FF0000] drop-shadow-[0_0_15px_rgba(255,0,0,0)] group-hover:drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]",
      icon: (
        <svg className="w-8 h-8 transition-all duration-300" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      name: "TikTok",
      color: "group-hover:text-[#00f2fe] drop-shadow-[0_0_15px_rgba(0,242,254,0)] group-hover:drop-shadow-[0_0_15px_rgba(0,242,254,0.5)]",
      icon: (
        <svg className="w-8 h-8 transition-all duration-300" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      )
    },
    {
      name: "Instagram Reels",
      color: "group-hover:text-[#E1306C] drop-shadow-[0_0_15px_rgba(225,48,108,0)] group-hover:drop-shadow-[0_0_15px_rgba(225,48,108,0.5)]",
      icon: (
        <svg className="w-8 h-8 transition-all duration-300" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.822a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      )
    },
    {
      name: "LinkedIn Video",
      color: "group-hover:text-[#0A66C2] drop-shadow-[0_0_15px_rgba(10,102,194,0)] group-hover:drop-shadow-[0_0_15px_rgba(10,102,194,0.5)]",
      icon: (
        <svg className="w-8 h-8 transition-all duration-300" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    }
  ];

  const LogoSet = () => (
    <div className="flex items-center gap-16 px-8 flex-none">
      {logos.map((logo, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 text-2xl font-bold text-white/40 hover:text-white transition-all duration-300 cursor-pointer group whitespace-nowrap"
        >
          <div className={`transition-colors duration-300 ${logo.color}`}>
            {logo.icon}
          </div>
          <span>{logo.name}</span>
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-12 border-y border-white/5 bg-zinc-950/50 backdrop-blur-sm relative z-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-8">
        <p className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-500 font-medium uppercase tracking-widest">Publishing millions of views across</p>
      </div>
      
      <div className="flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <motion.div 
          className="flex flex-none w-max will-change-transform"
          animate={{ x: "-33.333333%" }}
          transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
        >
          <LogoSet />
          <LogoSet />
          <LogoSet />
          <LogoSet />
          <LogoSet />
          <LogoSet />
        </motion.div>
      </div>
    </section>
  );
};

const FeaturesBento = () => {
  return (
    <section id="features" className="py-32 relative z-20 overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <Zap className="w-4 h-4" /> Powerful Features
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-6">Engineered for retention</h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-light">We don't just cut videos. We engineer them for maximum retention and algorithmic success.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[350px]">
          {/* Feature 1: AI Hook Extraction */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="md:col-span-2 relative rounded-[2rem] bg-zinc-900/40 border border-white/10 p-10 overflow-hidden group hover:bg-zinc-900/60 transition-all duration-500 shadow-xl hover:shadow-2xl hover:border-cyan-500/30"
          >
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-2xl md:blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-colors duration-700 pointer-events-none" 
            />
            <h3 className="text-3xl font-display font-bold text-white mb-4 relative z-10 group-hover:text-cyan-400 transition-colors">Viral Hook Extraction</h3>
            <p className="text-lg text-zinc-400 max-w-md relative z-10 font-light leading-relaxed">Our AI analyzes your video and identifies the highest-retention moments to use as hooks, ensuring viewers stop scrolling.</p>
            
            {/* Visual Mockup */}
            <motion.div 
              animate={{ y: [0, -10, 0], x: [0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-10 -right-5 w-[85%] sm:w-[60%] h-[60%] sm:h-[70%] bg-zinc-950/80 backdrop-blur-md rounded-tl-2xl border-t border-l border-white/10 p-4 sm:p-6 shadow-2xl"
            >
               <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                 <span className="text-sm font-medium text-white">Analysis Complete</span>
                 <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full">3 Hooks Found</span>
               </div>
               <div className="space-y-3">
                 <div className="flex items-center gap-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                   <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                     <Star className="w-4 h-4 text-cyan-400" />
                   </div>
                   <div className="flex-1">
                     <div className="h-2 w-3/4 bg-cyan-400/50 rounded-full mb-2" />
                     <div className="h-2 w-1/2 bg-cyan-400/30 rounded-full" />
                   </div>
                   <span className="text-xs font-bold text-cyan-400">99%</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl opacity-50">
                   <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                     <Play className="w-4 h-4 text-white/50" />
                   </div>
                   <div className="flex-1">
                     <div className="h-2 w-2/3 bg-white/20 rounded-full mb-2" />
                     <div className="h-2 w-1/3 bg-white/10 rounded-full" />
                   </div>
                   <span className="text-xs font-bold text-white/50">85%</span>
                 </div>
               </div>
            </motion.div>
          </motion.div>

          {/* Feature 2: Dynamic Captions */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="relative rounded-[2rem] bg-zinc-900/40 border border-white/10 p-10 overflow-hidden group hover:bg-zinc-900/60 transition-all duration-500 shadow-xl hover:shadow-2xl hover:border-purple-500/30 flex flex-col justify-end"
          >
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-2xl md:blur-[80px] rounded-full group-hover:bg-purple-500/20 transition-colors duration-700 pointer-events-none" 
            />
            
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 right-10 w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.1)] group-hover:scale-110 transition-transform duration-500 group-hover:border-purple-500/50"
            >
              <MessageCircle className="w-8 h-8 text-purple-400" />
            </motion.div>

            <div className="relative z-10">
              <h3 className="text-2xl font-display font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">Dynamic Captions</h3>
              <p className="text-zinc-400 leading-relaxed font-light">Bold, animated captions that highlight keywords and keep viewers glued to the screen.</p>
            </div>
          </motion.div>

          {/* Feature 3: B-Roll & Assets */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative rounded-[2rem] bg-zinc-900/40 border border-white/10 p-10 overflow-hidden group hover:bg-zinc-900/60 transition-all duration-500 shadow-xl hover:shadow-2xl hover:border-blue-500/30 flex flex-col justify-end"
          >
            <motion.div 
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-2xl md:blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-colors duration-700 pointer-events-none" 
            />
            
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-10 right-10 w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.1)] group-hover:scale-110 transition-transform duration-500 group-hover:border-blue-500/50"
            >
              <Video className="w-8 h-8 text-blue-400" />
            </motion.div>

            <div className="relative z-10">
              <h3 className="text-2xl font-display font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">B-Roll & Sound FX</h3>
              <p className="text-zinc-400 leading-relaxed font-light">We add relevant B-roll, sound effects, and visual hooks to maintain pacing and eliminate dead air.</p>
            </div>
          </motion.div>

          {/* Feature 4: Multi-Platform Export */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="md:col-span-2 relative rounded-[2rem] bg-zinc-900/40 border border-white/10 p-10 overflow-hidden group hover:bg-zinc-900/60 transition-all duration-500 shadow-xl hover:shadow-2xl hover:border-green-500/30"
          >
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 blur-2xl md:blur-[80px] rounded-full group-hover:bg-green-500/20 transition-colors duration-700 pointer-events-none" 
            />
            <h3 className="text-3xl font-display font-bold text-white mb-4 relative z-10 group-hover:text-green-400 transition-colors">Multi-Platform Ready</h3>
            <p className="text-lg text-zinc-400 max-w-md relative z-10 font-light leading-relaxed">Optimized aspect ratios, safe zones, and metadata for TikTok, Instagram Reels, and YouTube Shorts.</p>
            
            {/* Visual Mockup */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-10 right-0 sm:right-10 flex gap-2 sm:gap-4 scale-75 sm:scale-100 origin-bottom-right"
            >
               <div className="w-32 h-48 bg-zinc-950/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl flex flex-col items-center justify-center gap-2">
                 <Smartphone className="w-8 h-8 text-zinc-500" />
                 <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">TikTok</span>
               </div>
               <div className="w-32 h-48 bg-zinc-950/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl flex flex-col items-center justify-center gap-2 -translate-y-8">
                 <Smartphone className="w-8 h-8 text-zinc-500" />
                 <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Reels</span>
               </div>
               <div className="w-32 h-48 bg-zinc-950/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl flex flex-col items-center justify-center gap-2">
                 <Smartphone className="w-8 h-8 text-zinc-500" />
                 <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Shorts</span>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ContentMultiplier = () => {
  const shorts = [
    { title: "The 1% Rule", views: "842K", subs: "+4.2K", clients: 12, color: "cyan", thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1080&q=80" },
    { title: "Morning Routine", views: "1.2M", subs: "+8.5K", clients: 28, color: "blue", thumbnail: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1080&q=80" },
    { title: "Avoid This Mistake", views: "450K", subs: "+1.8K", clients: 5, color: "purple", thumbnail: "https://images.unsplash.com/photo-1486825586573-7131f7991bdd?auto=format&fit=crop&w=1080&q=80" },
    { title: "My $10k Framework", views: "2.1M", subs: "+12K", clients: 45, color: "green", thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1080&q=80" },
    { title: "Productivity Hack", views: "320K", subs: "+900", clients: 2, color: "yellow", thumbnail: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1080&q=80" },
    { title: "Scaling Fast", views: "680K", subs: "+3.1K", clients: 8, color: "pink", thumbnail: "https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=1080&q=80" },
  ];

  return (
    <section className="py-32 relative z-20 overflow-hidden bg-zinc-950 border-y border-white/5">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <TrendingUp className="w-4 h-4" /> The Multiplier Effect
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-6">One video. Infinite ROI.</h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-light">See how a single long-form podcast transforms into an entire month of high-converting content.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24">
          {/* Left: Long Form */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/3 relative"
          >
            <div className="absolute inset-0 bg-cyan-500/20 blur-2xl md:blur-[80px] rounded-full" />
            <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="aspect-video bg-zinc-950 rounded-xl mb-6 relative overflow-hidden group flex items-center justify-center border border-white/5">
                <img src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1920&q=80" alt="Podcast Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                <PlayCircle className="w-16 h-16 text-white/80 group-hover:text-cyan-400 transition-colors duration-300 relative z-10 drop-shadow-lg group-hover:scale-110 transform" />
                <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-xs font-mono text-white z-10">45:20</div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Full Podcast Episode #42</h3>
              <p className="text-zinc-400 text-sm mb-6">"How to scale your agency to $1M/ARR"</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/50 rounded-xl p-4 border border-white/5">
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Views</div>
                  <div className="text-2xl font-display font-bold text-white">124K</div>
                </div>
                <div className="bg-zinc-950/50 rounded-xl p-4 border border-white/5">
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">New Subs</div>
                  <div className="text-2xl font-display font-bold text-white">1.2K</div>
                </div>
              </div>
            </div>
            
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-1/2 -right-24 w-24 h-[2px] bg-gradient-to-r from-cyan-500/50 to-transparent" />
          </motion.div>

          {/* Right: Shorts Grid */}
          <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            {/* Connecting Lines (Mobile) */}
            <div className="block lg:hidden absolute -top-8 left-1/2 w-[2px] h-8 bg-gradient-to-b from-cyan-500/50 to-transparent" />
            
            {shorts.map((short, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all duration-300 group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${short.color}-500/10 blur-xl md:blur-[50px] rounded-full group-hover:bg-${short.color}-500/20 transition-colors duration-500`} />
                
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-16 bg-zinc-950 rounded-lg border border-white/10 flex items-center justify-center shrink-0 group-hover:border-cyan-500/30 transition-colors relative overflow-hidden">
                    <img src={short.thumbnail} alt={short.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                    <Play className="w-5 h-5 text-white/80 group-hover:text-cyan-400 relative z-10 drop-shadow-md group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold truncate mb-1">{short.title}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-mono text-white">{short.views}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-green-400">
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-mono">{short.subs}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded text-xs font-bold">
                        {short.clients} Clients
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Total Impact */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-white/10 rounded-3xl p-8 max-w-4xl mx-auto text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
          <h3 className="text-zinc-400 uppercase tracking-widest text-sm font-bold mb-6">Total Multiplied Impact</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold text-white mb-2">5.6M+</div>
              <div className="text-zinc-500 font-medium">Extra Views</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-white/10" />
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold text-green-400 mb-2">+30.5K</div>
              <div className="text-zinc-500 font-medium">New Subscribers</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-white/10" />
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold text-cyan-400 mb-2">100+</div>
              <div className="text-zinc-500 font-medium">New Clients</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const CalculatorDashboard = () => {
  const [longViews, setLongViews] = useState(15000);
  const [subscribers, setSubscribers] = useState(50000);
  const [videosPerMonth, setVideosPerMonth] = useState(4);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => {
      setIsCalculating(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [longViews, subscribers, videosPerMonth]);

  const conversionRate = 0.01; // Industry average view-to-client conversion rate
  
  const shortsPerMonth = videosPerMonth * 4;
  const viewsPerShort = Math.floor((longViews * 0.8) + (subscribers * 0.15));
  const missedViewsPerVideo = viewsPerShort * 4;
  const monthlyMissedViews = missedViewsPerVideo * videosPerMonth;
  const potentialSubscribers = Math.floor(monthlyMissedViews * 0.005);
  const potentialClients = Math.floor(monthlyMissedViews * (conversionRate / 100));

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: string, max: number) => {
    const num = parseInt(value.replace(/,/g, ''), 10);
    if (isNaN(num)) {
      setter(0);
    } else {
      setter(Math.min(num, max));
    }
  };

  return (
    <section id="calculator" className="py-32 relative z-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative rounded-[2.5rem] bg-zinc-900/40 border border-white/10 backdrop-blur-2xl p-8 md:p-12 overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-2xl md:blur-[80px] rounded-full -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-2xl md:blur-[80px] rounded-full -z-10 pointer-events-none" />

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                <BarChart3 className="w-4 h-4" /> The Cost of Inaction
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-[1.1]">
                Calculate the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">money you're leaving on the table.</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed font-light">
                Short-form content is the highest-leverage marketing asset today. See exactly how many views, subscribers, and paying clients you're losing every month.
              </p>
              
              <div className="flex items-center gap-2 text-sm text-zinc-500 mb-10 bg-zinc-950/50 w-fit px-4 py-2 rounded-lg border border-white/5">
                <ShieldCheck className="w-4 h-4 text-cyan-500" />
                <span>Data backed by analysis of 50M+ YouTube Shorts</span>
              </div>

              <div className="space-y-8 bg-zinc-950/80 p-8 rounded-3xl border border-white/5 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                
                {/* Sliders and Inputs */}
                <div className="space-y-5 relative z-10">
                  <div className="flex justify-between items-center">
                    <label className="text-zinc-300 font-medium flex items-center gap-2 text-sm">
                      <Play className="w-4 h-4 text-cyan-500" /> Avg. Views per Long-form
                    </label>
                    <input 
                      type="text" 
                      value={longViews.toLocaleString()} 
                      onChange={(e) => handleInputChange(setLongViews, e.target.value, 10000000)}
                      className="w-24 text-right text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                  </div>
                  <input type="range" min="1000" max="500000" step="1000" value={longViews} onChange={(e) => setLongViews(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all" />
                </div>

                <div className="space-y-5 relative z-10">
                  <div className="flex justify-between items-center">
                    <label className="text-zinc-300 font-medium flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-cyan-500" /> Total Subscribers
                    </label>
                    <input 
                      type="text" 
                      value={subscribers.toLocaleString()} 
                      onChange={(e) => handleInputChange(setSubscribers, e.target.value, 10000000)}
                      className="w-24 text-right text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                  </div>
                  <input type="range" min="1000" max="1000000" step="5000" value={subscribers} onChange={(e) => setSubscribers(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all" />
                </div>
                
                <div className="space-y-5 relative z-10">
                  <div className="flex justify-between items-center">
                    <label className="text-zinc-300 font-medium flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-cyan-500" /> Long-form Videos / Month
                    </label>
                    <input 
                      type="text" 
                      value={videosPerMonth.toString()} 
                      onChange={(e) => handleInputChange(setVideosPerMonth, e.target.value, 100)}
                      className="w-16 text-right text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                  </div>
                  <input type="range" min="1" max="20" step="1" value={videosPerMonth} onChange={(e) => setVideosPerMonth(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all" />
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-7 relative h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-600/10 to-transparent blur-2xl rounded-3xl -z-10" />
              <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-8 lg:p-10 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] h-full flex flex-col justify-center relative overflow-hidden">
                {/* Decorative grid background */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                <h3 className="text-zinc-400 font-medium mb-10 flex items-center gap-2 uppercase tracking-wider text-sm relative z-10">
                  <Eye className="w-4 h-4 text-cyan-400" /> Your Monthly Missed Opportunity
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-6 mb-8 relative z-10">
                  <div className="bg-zinc-900/80 rounded-2xl p-6 border border-white/5 hover:border-cyan-500/30 transition-all duration-300 group shadow-lg">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 group-hover:animate-ping" /> Missed Views
                    </p>
                    <div className="flex items-baseline gap-2 h-12">
                      {isCalculating ? (
                        <div className="h-10 w-32 bg-zinc-800 rounded-lg animate-pulse" />
                      ) : (
                        <span className="text-5xl font-display font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                          {formatNumber(monthlyMissedViews)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-3 font-mono bg-zinc-950 px-2 py-1 rounded inline-block">From {shortsPerMonth} repurposed shorts</p>
                  </div>
                  
                  <div className="bg-zinc-900/80 rounded-2xl p-6 border border-white/5 hover:border-cyan-500/30 transition-all duration-300 group shadow-lg">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 group-hover:animate-ping" /> Lost Subscribers
                    </p>
                    <div className="flex items-baseline gap-2 h-12">
                      {isCalculating ? (
                        <div className="h-10 w-24 bg-zinc-800 rounded-lg animate-pulse" />
                      ) : (
                        <span className="text-5xl font-display font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                          {formatNumber(potentialSubscribers)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-3 font-mono bg-zinc-950 px-2 py-1 rounded inline-block">Estimated 0.5% conversion</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent rounded-2xl p-8 border border-cyan-500/30 relative overflow-hidden group shadow-[0_0_30px_rgba(34,211,238,0.1)] z-10">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-400/20 blur-xl md:blur-[60px] rounded-full group-hover:bg-cyan-400/40 transition-colors duration-500" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 blur-xl md:blur-[50px] rounded-full" />
                  
                  <p className="text-xs text-cyan-300 uppercase tracking-widest font-bold mb-3 relative z-10 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Potential New Clients / Month
                  </p>
                  <div className="flex items-baseline gap-3 relative z-10 h-20">
                    {isCalculating ? (
                      <div className="h-16 w-24 bg-cyan-500/20 rounded-xl animate-pulse" />
                    ) : (
                      <span className="text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 tracking-tight drop-shadow-sm">
                        {potentialClients}
                      </span>
                    )}
                    <span className="text-cyan-400/80 font-medium text-xl">clients</span>
                  </div>
                  <p className="text-xs text-cyan-300/50 mt-2 relative z-10">
                    *Based on a conservative 0.01% industry average view-to-client conversion rate.
                  </p>
                  
                  <div className="mt-6 pt-6 border-t border-cyan-500/20 relative z-10">
                    <p className="text-sm text-cyan-100/80 max-w-md leading-relaxed">
                      If your average client LTV is $1,000, you are losing <strong className="text-white font-bold bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                        {isCalculating ? (
                          <span className="inline-block w-16 h-4 bg-cyan-500/30 rounded animate-pulse align-middle" />
                        ) : (
                          `$${formatNumber(potentialClients * 1000)}/mo`
                        )}
                      </strong> by not repurposing your content.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-end relative z-10">
                  <button 
                    data-cal-link="engmarwan/free-content-strategy-call"
                    data-cal-namespace="free-content-strategy-call"
                    data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"dark"}'
                    className="bg-white text-zinc-950 hover:bg-zinc-200 font-bold px-8 py-4 rounded-full transition-all duration-300 flex items-center gap-2 text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:-translate-y-1"
                  >
                    Stop losing money <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const BentoHowItWorks = () => {
  return (
    <section id="how-it-works" className="py-32 relative z-20">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <Sparkles className="w-4 h-4" /> The Workflow
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-6">The Content Engine</h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-light">A seamless, hands-off workflow designed for creators who value their time.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 auto-rows-[350px]">
          {/* Step 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 relative rounded-[2rem] bg-zinc-900/40 border border-white/10 p-10 overflow-hidden group hover:bg-zinc-900/60 transition-all duration-500 shadow-xl hover:shadow-2xl hover:border-cyan-500/30"
          >
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 blur-2xl md:blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-colors duration-700" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-500 group-hover:border-cyan-500/50">
                <Upload className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="mt-auto">
                <h3 className="text-3xl font-display font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">1. Drop your raw file</h3>
                <p className="text-lg text-zinc-400 max-w-md leading-relaxed font-light">
                  Upload your long-form podcast, interview, or vlog into our secure portal. No timestamps or instructions needed.
                </p>
              </div>
            </div>

            {/* Decorative Upload UI */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 w-64 h-48 bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-xl p-4 hidden lg:flex flex-col items-center justify-center gap-4 shadow-2xl transform group-hover:-translate-y-1/2 group-hover:scale-105 transition-all duration-500">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-cyan-500/50 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">Uploading Podcast.mp4</p>
                <div className="w-48 h-1.5 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                  <motion.div 
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="h-full bg-cyan-400"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative rounded-[2rem] bg-zinc-900/40 border border-white/10 p-10 overflow-hidden group hover:bg-zinc-900/60 transition-all duration-500 shadow-xl hover:shadow-2xl hover:border-purple-500/30 flex flex-col justify-end"
          >
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="absolute top-10 right-10 w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.1)] group-hover:scale-110 transition-transform duration-500 group-hover:border-purple-500/50 group-hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]">
              <Scissors className="w-8 h-8 text-purple-400" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-display font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">2. AI + Human Edit</h3>
              <p className="text-zinc-400 leading-relaxed font-light">
                We extract the most viral hooks, add dynamic captions, B-roll, and format perfectly for every platform.
              </p>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-3 relative rounded-[2rem] bg-zinc-900/40 border border-white/10 p-10 overflow-hidden group hover:bg-zinc-900/60 transition-all duration-500 shadow-xl hover:shadow-2xl hover:border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-10"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-500/10 blur-3xl md:blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-colors duration-700 pointer-events-none" />
            
            <div className="relative z-10 max-w-xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:border-blue-500/50">
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-3xl font-display font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">3. Auto-Scheduled & Published</h3>
              <p className="text-lg text-zinc-400 leading-relaxed font-light">
                Review the clips in your dashboard. Approve them with one click, and our system automatically posts them to YouTube Shorts, Instagram Reels, and TikTok at peak times.
              </p>
            </div>
            
            <div className="relative z-10 w-full md:w-auto flex-1 flex justify-end">
              <div className="w-full max-w-md bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl rotate-2 group-hover:rotate-0 transition-all duration-500 group-hover:shadow-[0_20px_60px_rgba(59,130,246,0.2)]">
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-xs font-mono text-zinc-500">Publishing Queue</div>
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Viral Hook - Ep 42", time: "Today, 5:00 PM", platform: "TikTok" },
                    { title: "The Secret Strategy", time: "Tomorrow, 12:00 PM", platform: "YouTube" },
                    { title: "Stop doing this...", time: "Wed, 3:00 PM", platform: "Instagram" }
                  ].map((item, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/5 group-hover:border-white/10 transition-colors"
                    >
                      <div className="w-12 h-16 bg-zinc-800 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20" />
                        <Play className="absolute inset-0 m-auto w-4 h-4 text-white/50" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white mb-1">{item.title}</div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Calendar className="w-3 h-3" /> {item.time}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 bg-zinc-800 px-2 py-1 rounded">{item.platform}</div>
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Jenkins",
      handle: "@sarahjtech",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
      quote: "Opsrelic completely changed my workflow. I record one 40-minute podcast a week, and they turn it into 15 shorts that drive thousands of new listeners. It feels like I cloned myself.",
      metrics: { views: "+145%", watchTime: "+40%" }
    },
    {
      name: "Marcus Chen",
      handle: "@marcusfit",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      quote: "The quality of the edits is insane. The captions are perfect, the pacing is fast, and I don't have to spend 10 hours a week in Premiere Pro anymore. Best ROI for my channel.",
      metrics: { views: "+210%", subGrowth: "2.5k/mo" }
    },
    {
      name: "Elena Rodriguez",
      handle: "@elenainvests",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
      quote: "I was skeptical about AI editing, but the human touch Opsrelic adds makes the videos feel 100% authentic. My lead generation has doubled since we started.",
      metrics: { leads: "+65%", views: "450k/mo" }
    }
  ];

  return (
    <section id="testimonials" className="py-32 relative overflow-hidden bg-zinc-950 border-y border-white/5 z-20">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <ShieldCheck className="w-4 h-4" /> Verified Results
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-6">Creators are scaling faster</h2>
          <p className="text-xl text-zinc-400 font-light">Join top creators who automated their growth engine.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: "easeOut" }}
              className="relative bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl hover:border-cyan-500/30 transition-all duration-500 group flex flex-col hover:-translate-y-2 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-xl md:blur-[50px] rounded-full group-hover:bg-cyan-500/10 transition-colors duration-500 pointer-events-none" />
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <img src={t.image} alt={t.name} className="w-14 h-14 rounded-full object-cover border-2 border-zinc-800 group-hover:border-cyan-500 transition-colors shadow-lg" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="text-white font-bold text-lg">{t.name}</h4>
                  <p className="text-sm text-zinc-500">{t.handle}</p>
                </div>
              </div>
              
              <div className="relative z-10 flex-1">
                <svg className="absolute -top-4 -left-4 w-10 h-10 text-white/5 transform -scale-x-100" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                <p className="text-base text-zinc-300 mb-8 leading-relaxed font-light relative z-10 pl-4">"{t.quote}"</p>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-white/5 relative z-10">
                {Object.entries(t.metrics).map(([key, value], idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl px-3 py-3 flex-1 text-center group-hover:bg-white/10 transition-colors">
                    <div className="text-cyan-400 font-display font-bold text-xl mb-1">{value}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "$400",
      description: "Perfect for creators just starting to repurpose.",
      features: [
        "2 long-form videos/mo",
        "10 optimized clips",
        "Dynamic captions",
        "Platform formatting",
        "48-hour turnaround"
      ]
    },
    {
      name: "Growth",
      price: "$750",
      description: "For consistent creators looking to scale.",
      popular: true,
      features: [
        "4 long-form videos/mo",
        "24 optimized clips",
        "Dynamic captions & B-roll",
        "Platform formatting",
        "Auto-scheduling included",
        "24-hour turnaround"
      ]
    },
    {
      name: "Scale",
      price: "$1,500",
      description: "Full-service content engine for top creators.",
      features: [
        "8 long-form videos/mo",
        "60 optimized clips",
        "Custom branding & animations",
        "Dedicated account manager",
        "Auto-scheduling included",
        "12-hour turnaround"
      ]
    }
  ];

  return (
    <section id="pricing" className="py-32 relative z-20">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-6">Simple, transparent pricing</h2>
          <p className="text-xl text-zinc-400 mb-6 font-light">Choose the plan that fits your content schedule. Cancel anytime.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 text-sm font-medium shadow-lg">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            14-Day Money-Back Guarantee. No questions asked.
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: "easeOut" }}
              className={`relative bg-zinc-950/80 backdrop-blur-xl border ${plan.popular ? 'border-cyan-500/50 shadow-[0_0_50px_rgba(34,211,238,0.15)] md:-translate-y-4' : 'border-white/10'} p-8 rounded-[2.5rem] flex flex-col group hover:border-white/20 transition-all duration-500`}
            >
              {plan.popular && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-[2.5rem] pointer-events-none" />
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-blue-500 text-zinc-950 text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                    Most Popular
                  </div>
                </>
              )}
              <h3 className="text-2xl font-display font-bold text-white mb-3">{plan.name}</h3>
              <p className="text-zinc-400 text-sm mb-8 h-10 leading-relaxed font-light">{plan.description}</p>
              
              <div className="mb-8 pb-8 border-b border-white/5">
                <span className="text-5xl font-display font-bold text-white tracking-tight">{plan.price}</span>
                <span className="text-zinc-500 font-medium">/mo</span>
              </div>
              
              <ul className="space-y-5 mb-10 flex-1">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? 'bg-cyan-500/20' : 'bg-white/10'}`}>
                      <Check className={`w-3 h-3 ${plan.popular ? 'text-cyan-400' : 'text-white'}`} />
                    </div>
                    <span className="text-zinc-300 font-light">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                data-cal-link="engmarwan/free-content-strategy-call"
                data-cal-namespace="free-content-strategy-call"
                data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"dark"}'
                className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                  plan.popular 
                    ? 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:-translate-y-1' 
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 hover:border-white/20'
                }`}
              >
                Get started <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQ = () => {
  const faqs = [
    {
      question: "How long does it take to get my clips?",
      answer: "Depending on your plan, turnaround times range from 12 to 48 hours after you upload your raw footage."
    },
    {
      question: "Do I need to provide timestamps?",
      answer: "No! Our AI and human editors analyze your entire video to find the most engaging hooks and moments automatically."
    },
    {
      question: "What platforms do you format for?",
      answer: "We optimize every clip for YouTube Shorts, Instagram Reels, and TikTok, ensuring safe zones and aspect ratios are perfect."
    },
    {
      question: "Can I request revisions?",
      answer: "Yes, all plans include unlimited revisions to ensure the final clips match your brand's voice and style perfectly."
    },
    {
      question: "Do you post the videos for me?",
      answer: "Yes! Our Growth and Scale plans include auto-scheduling, meaning we handle the publishing across all your connected platforms."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32 relative z-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <MessageCircle className="w-4 h-4" /> Got Questions?
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-6">Frequently asked questions</h2>
          <p className="text-xl text-zinc-400 font-light">Everything you need to know about the product and billing.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === i ? 'bg-zinc-900/80 border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.05)]' : 'bg-zinc-950/50 hover:bg-zinc-900/50 hover:border-white/10'}`}
            >
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-6 flex items-center justify-between text-left focus:outline-none group"
              >
                <span className={`text-lg font-medium transition-colors duration-300 ${openIndex === i ? 'text-cyan-400' : 'text-white group-hover:text-zinc-200'}`}>{faq.question}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${openIndex === i ? 'bg-cyan-500/20 rotate-180' : 'bg-white/5 group-hover:bg-white/10'}`}>
                  <svg className={`w-4 h-4 transition-colors duration-300 ${openIndex === i ? 'text-cyan-400' : 'text-zinc-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-zinc-400 font-light leading-relaxed">{faq.answer}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FinalCTA = () => (
  <section className="py-32 relative z-20 overflow-hidden border-t border-white/5">
    <div className="absolute inset-0 bg-zinc-950" />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{ 
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-3xl md:blur-[120px] rounded-full pointer-events-none" 
    />
    
    <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight">
          Ready to scale your <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">content empire?</span>
        </h2>
        <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          Stop spending hours editing and start focusing on what you do best: creating. Let our engine handle the rest.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button 
            data-cal-link="engmarwan/free-content-strategy-call"
            data-cal-namespace="free-content-strategy-call"
            data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"dark"}'
            className="w-full sm:w-auto bg-white text-zinc-950 hover:bg-zinc-200 font-bold px-10 py-5 rounded-full transition-all duration-300 flex items-center justify-center gap-2 text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:-translate-y-1"
          >
            Book your strategy call <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-8 text-sm text-zinc-500 font-medium">No commitment. 100% free consultation.</p>
      </motion.div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-12 border-t border-white/5 bg-zinc-950 relative z-20">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-cyan-400" />
        <span className="text-lg font-display font-bold text-white tracking-wider text-left not-italic no-underline">OpsRelic</span>
      </div>
      <p className="text-zinc-500 text-sm">
        © {new Date().getFullYear()} OpsRelic. All rights reserved.
      </p>
      <div className="flex gap-8 text-sm font-medium text-zinc-500">
        <a href="#" className="hover:text-white transition-colors">Terms</a>
        <a href="#" className="hover:text-white transition-colors">Privacy</a>
        <a href="#" className="hover:text-white transition-colors">Twitter</a>
      </div>
    </div>
  </footer>
);

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 origin-left z-[60]"
      style={{ scaleX }}
    />
  );
};

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        scale: isVisible ? 1 : 0.5,
        pointerEvents: isVisible ? "auto" : "none"
      }}
      transition={{ duration: 0.3 }}
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-zinc-800 hover:border-cyan-500/50 hover:text-cyan-400 transition-all duration-300 group"
      aria-label="Back to top"
    >
      <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300" />
    </motion.button>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden relative">
      <ScrollProgress />
      <NoiseOverlay />
      <Navbar />
      <main>
        <Hero />
        <SocialProofLogos />
        <FeaturesBento />
        <ContentMultiplier />
        <CalculatorDashboard />
        <BentoHowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
