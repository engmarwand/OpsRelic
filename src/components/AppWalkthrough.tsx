import { useEffect, useState } from "react";
import {
  Joyride,
  EventHandler,
  STATUS,
  Step,
  TooltipRenderProps,
} from "react-joyride";
import { useAppContext } from "../lib/store";
import { cn } from "../lib/utils";
import { X } from "lucide-react";

function CustomTooltip({
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-[380px] max-w-[95vw] overflow-hidden flex flex-col"
    >
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-3">
          {step.title && (
            <h3 className="font-display text-lg font-bold text-[var(--color-text-main)] leading-tight">
              {step.title}
            </h3>
          )}
          <button
            {...skipProps}
            className="text-muted hover:text-[var(--color-text-main)] bg-[var(--color-surface2)] hover:bg-[var(--color-surface-hover)] transition-colors p-1.5 rounded-lg -mt-1 -mr-1"
            title="End Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[var(--color-text-muted)] text-[15px] leading-relaxed mb-6">
          {step.content}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: size }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === i
                    ? "w-5 bg-[var(--color-cyan)] shadow-[0_0_8px_rgba(0,212,232,0.6)]"
                    : "w-1.5 bg-[var(--color-surface2)]",
                )}
              />
            ))}
          </div>

          <div className="flex gap-2 ml-auto items-center">
            {index > 0 && (
              <button
                {...backProps}
                className="text-sm font-semibold text-muted hover:text-[var(--color-text-main)] px-3 py-2 transition-colors"
              >
                Back
              </button>
            )}
            <button
              {...primaryProps}
              className="bg-[var(--color-cyan)] text-[#111] hover:bg-[#00e5ff] transition-all px-4 py-2 rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(0,212,232,0.3)] active:scale-95"
            >
              {isLastStep ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
      {!isLastStep && (
        <div className="bg-[var(--color-surface2)] p-3 px-6 border-t border-[var(--color-border-subtle)] flex justify-between items-center">
          <span className="text-xs font-medium text-muted">
            You can restart this anytime.
          </span>
          <button
            {...skipProps}
            className="text-xs font-bold text-[var(--color-text-main)] hover:text-red-400 transition-colors"
          >
            Skip & Don't Show Again
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppWalkthrough() {
  const [run, setRun] = useState(false);
  const { userRole } = useAppContext();

  useEffect(() => {
    // Only run the tour for agency users
    if (userRole === "client") return;

    // We only want to run it once
    const hasSeenTour = localStorage.getItem("opsrelic-tour-seen");
    if (!hasSeenTour) {
      // Small delay to let the entire UI and layout settle
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [userRole]);

  const handleJoyrideCallback: EventHandler = (data) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // Status can be finished (user clicked last next button) or skipped (user closed tour)
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem("opsrelic-tour-seen", "true");
    }
  };

  const steps: Step[] = [
    {
      target: "body",
      content:
        "Welcome to OpsRelic! Let me show you around your new Agency OS. We built this to end your clipping operational chaos.",
      placement: "center",
      title: "Welcome 👋",
      skipBeacon: true,
    },
    {
      target: "#tour-overview",
      content:
        "This is your Agency Dashboard. See active campaigns, aggregate views, and items that need attention at a glance.",
      placement: "right",
      title: "Command Center",
    },
    {
      target: "#tour-clients",
      content:
        "Manage all your agency clients here. One client can have multiple tracking campaigns.",
      placement: "right",
      title: "Client CRM",
    },
    {
      target: "#tour-campaigns",
      content:
        "This is the core. Manage active campaigns, drop clip links, check performance, and adjust budgets in dedicated hubs.",
      placement: "right",
      title: "Campaign Hubs",
    },
    {
      target: "#tour-uploads",
      content:
        "Got a CSV from your clippers? Mass-upload and map the links here to update campaign performance instantly.",
      placement: "right",
      title: "Mass Data Upload",
    },
    {
      target: "#tour-reports",
      content:
        "View holistic agency performance across all clients and export PDF reports here.",
      placement: "right",
      title: "Global Analytics",
    },
    {
      target: "#tour-portal",
      content:
        "Stop sending manual updates. Configure secure, whitelabel portals for your clients so they can see live metrics.",
      placement: "right",
      title: "Client Portals",
    },
    {
      target: "#tour-new-campaign",
      content:
        "Ready to start? You can quickly spin up a new campaign for any client using this button.",
      placement: "bottom-end",
      title: "Create Your First",
    },
    {
      target: "body",
      content:
        "That's the tour! We recommend setting up your workspace branding in Settings, or creating your first Campaign. Time to reclaim your ops.",
      placement: "center",
      title: "You're All Set!",
    },
  ];

  if (userRole === "client") return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      options={{
        zIndex: 10000,
        primaryColor: "#00d4e8",
        overlayColor: "rgba(0, 0, 0, 0.7)",
        overlayClickAction: false,
        showProgress: true,
      }}
    />
  );
}
