import React, { useState, useEffect } from 'react';
import { Joyride, Step, STATUS, TooltipRenderProps, ACTIONS } from 'react-joyride';

const CustomTooltip = ({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
}: TooltipRenderProps) => {
  return (
    <div {...tooltipProps} className="flex flex-col gap-2 w-[340px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-200">
        <div className="w-full bg-[#0A0A0A] border border-white/10 rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,1)] p-8 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          {step.title && <h3 className="text-2xl font-display font-black text-white italic tracking-widest uppercase">{step.title}</h3>}
          
          <div className="text-sm font-bold text-[#888] leading-relaxed tracking-tight">
            {step.content}
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-6 border-t border-white/5">
            <button 
              {...closeProps} 
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[#333] hover:text-white transition-colors"
            >
              Terminate
            </button>
            
            <div className="flex items-center gap-4">
              {index > 0 && (
                <button {...backProps} className="text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all">
                  Reverse
                </button>
              )}
              <button {...primaryProps} className="text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                {isLastStep ? 'Initialize' : 'Advancing'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button 
            onClick={(e) => {
              localStorage.setItem('opsrelic_walkthrough_completed_v2', 'true');
              if (closeProps.onClick) {
                closeProps.onClick(e);
              }
            }} 
            className="text-[9px] font-black uppercase tracking-[0.3em] text-[#222] hover:text-blue-500 transition-colors px-6 py-2 rounded-full border border-white/5 group"
          >
            MUTE <span className="group-hover:inline hidden">SYSTEM GUIDANCE</span>
          </button>
        </div>
    </div>
  );
};

export default function Walkthrough() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('opsrelic_walkthrough_completed_v2');
    if (!hasSeen) {
      setRun(true);
    }
  }, []);

  const handleJoyrideCallback = (data: any) => {
    const { status, action } = data;
    
    if (status === STATUS.FINISHED || action === ACTIONS.CLOSE || status === STATUS.SKIPPED) {
      setRun(false);
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      content: 'Welcome to OpsRelic! Let me show you around your new agency command center.',
      placement: 'center',
    },
    {
      target: 'a[href="#dashboard"]',
      content: 'Review high-level agency performance, real-time metrics, and strategic insights at a glance.',
      placement: 'right',
    },
    {
      target: 'a[href="#upload"]',
      content: 'Start here to import your CSV data. The Upload tool parses it automatically to compute payouts based on views.',
      placement: 'right',
    },
    {
      target: 'a[href="#campaigns"]',
      content: 'Manage individual campaigns, view granular performance data, and monitor clippers.',
      placement: 'right',
    },
    {
      target: 'a[href="#workspace"]',
      content: 'Tailor your agency identity, branding, and notification preferences.',
      placement: 'right',
    },
    {
      target: 'body',
      content: 'You are all set! Let\'s get to work.',
      placement: 'center',
    }
  ];

  const JoyrideAny = Joyride as any;

  return (
    <JoyrideAny
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      tooltipComponent={CustomTooltip}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#0F0F0F',
          backgroundColor: '#0F0F0F',
          overlayColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000,
        }
      }}
    />
  );
}

