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
      <div className="w-full bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] p-5 flex flex-col gap-3">
        {step.title && <h3 className="text-[16px] font-bold text-white tracking-tight">{step.title}</h3>}
        
        <div className="text-[14px] text-[#A1A1AA] leading-relaxed">
          {step.content}
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <button 
            {...closeProps} 
            className="text-[13px] font-medium text-[#71717A] hover:text-white transition-colors"
          >
            Skip for now
          </button>
          
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button {...backProps} className="text-[13px] font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">
                Back
              </button>
            )}
            <button {...primaryProps} className="text-[13px] font-medium px-4 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              {isLastStep ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-1">
        <button 
          onClick={(e) => {
            localStorage.setItem('opsrelic_walkthrough_completed_v2', 'true');
            if (closeProps.onClick) {
              closeProps.onClick(e);
            }
          }} 
          className="text-[12px] font-semibold text-[#52525B] hover:text-[#FF6B35] transition-colors px-4 py-1.5 rounded-full bg-[#0A0A0A]/50 backdrop-blur-md border border-white/5"
        >
          Don't show again
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
      target: 'a[href="#upload"]',
      content: 'Start here to import your CSV data. The Upload tool parses it automatically to compute payouts based on views.',
      placement: 'right',
    },
    {
      target: 'a[href="#budget"]',
      content: 'Track campaign budgets, allocate funds, and monitor your spending across all active campaigns.',
      placement: 'right',
    },
    {
      target: 'a[href="#onboarding"]',
      content: 'Manage creator funnels. Send invitations, set guidelines, and handle test assignments easily.',
      placement: 'right',
    },
    {
      target: 'a[href="#reports"]',
      content: 'Generate stunning client reports and deep-dive into campaign analytics to showcase performance.',
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

