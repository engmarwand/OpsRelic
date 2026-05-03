import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppState, CsvRow, WorkspaceSettings } from '../types';
import { auth, db } from './firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PLANS, Tier, Plan, PlanFeatures, PlanLimits } from './plans';

interface AppContextType extends AppState {
  setData: (data: CsvRow[]) => void;
  clearData: () => void;
  setWorkspace: (settings: WorkspaceSettings) => void;
  setCurrentTier: (tier: Tier) => void;
  hasFeature: (featureName: keyof PlanFeatures) => boolean;
  getLimit: (limitName: keyof PlanLimits) => number | string;
  getUsage: (metricName: string) => number;
  trackUsage: (metricName: string, amount?: number) => boolean;
  campaignsList: any[];
  plan: Plan;
}

const defaultWorkspace: WorkspaceSettings = {
  brand: { name: "Your Agency", tagline: "Clipping Agency Operations", logo: null, logoUrl: null },
  color: { primary: "#00D4FF", preset: "Electric Blue" },
  reports: { coverPage: true, defaultDateRange: "Last 30 days", defaultPlatforms: ["TikTok", "Instagram", "YouTube", "Other"], template: {}, emailSignature: "", fromName: "", replyTo: "" },
  layout: { theme: "dark", layout: "Standard", chartStyle: "Line" },
  clients: [], 
  metrics: { customLabels: {} },
  notifications: { budgetAlerts: true, flagsPending: true, weeklySummary: false },
  rollingDates: false
};

const defaultState: AppState = {
  data: [],
  budgets: [],
  onboarding: [],
  workspace: defaultWorkspace,
  currentTier: 'agency', // Default to agency for full demo access
  reportsGeneratedMonth: 0
};

declare global {
  interface Window {
    OpsRelicData: any;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [userId, setUserId] = useState<string | null>(null);
  const [campaignsList, setCampaignsList] = useState<any[]>([]);

  useEffect(() => {
    // Configure window.OpsRelicData with plans and initial workspace state
    window.OpsRelicData = {
      ...window.OpsRelicData,
      plans: PLANS,
      workspace: state.workspace
    };
  }, []);

  useEffect(() => {
    // Apply primary color as a CSS variable globally whenever it changes
    if (state.workspace?.color?.primary) {
      document.documentElement.style.setProperty('--color-brand-primary', state.workspace.color.primary);
      document.documentElement.style.setProperty('--primary-color', state.workspace.color.primary);
      
      // Simple logic to create lighter/darker shades for variables if needed:
      document.documentElement.style.setProperty('--color-brand-primary-hover', state.workspace.color.primary); 
    }
    
    // Theme application (if needed down the line, although body class could do it)
    if (state.workspace?.layout?.theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [state.workspace?.color?.primary, state.workspace?.layout?.theme]);

  useEffect(() => {
    return auth.onAuthStateChanged(user => {
      setUserId(user ? user.uid : null);
    });
  }, []);

  useEffect(() => {
    if (!userId) {
      setState(defaultState);
      setCampaignsList([]);
      return;
    }

    const qSubmissions = query(collection(db, 'submissions'), where('userId', '==', userId));
    const unsubscribeSubmissions = onSnapshot(qSubmissions, (snapshot) => {
      const data: CsvRow[] = [];
      snapshot.forEach(doc => {
        const row = doc.data() as any;
        const createdAtDate = row.createdAt?.toDate ? row.createdAt.toDate() : (row.createdAt ? new Date(row.createdAt) : null);
        data.push({
          "Submission Date": createdAtDate ? createdAtDate.toISOString().split('T')[0] : "",
          Creator: row.creatorId ? row.creatorId.replace('id_creator_', '') : "",
          "Content Title": row.url || "",
          Platform: "TikTok", // Simplification since creator platform isn't immediately available here via JOIN
          Campaign: row.campaignId ? row.campaignId.replace('id_camp_', '') : "",
          Status: row.status === 'paid' ? 'Paid' : row.status === 'approved' ? 'Approved' : 'Pending',
          Views: row.views || 0,
          "Amount Paid": row.payout || 0,
        });
      });
      setState(prev => ({ ...prev, data }));
    });

    const qCampaigns = query(collection(db, 'campaigns'), where('userId', '==', userId));
    const unsubscribeCampaigns = onSnapshot(qCampaigns, (snapshot) => {
       const list: any[] = [];
       snapshot.forEach(doc => {
         list.push({ id: doc.id, ...doc.data() });
       });
       setCampaignsList(list);
    });

    return () => {
       unsubscribeSubmissions();
       unsubscribeCampaigns();
    };
  }, [userId]);

  const setData = React.useCallback(async (newData: CsvRow[]) => {
    setState(prev => ({ ...prev, data: newData }));
  }, []);

  const clearData = React.useCallback(() => {
    setState(prev => ({ ...prev, data: [] }));
    window.OpsRelicData = undefined;
  }, []);

  const setWorkspace = React.useCallback((newWorkspace: WorkspaceSettings) => {
    setState(prev => {
      const newState = { ...prev, workspace: newWorkspace };
      window.OpsRelicData = { ...window.OpsRelicData, workspace: newWorkspace };
      return newState;
    });
  }, []);

  const setCurrentTier = React.useCallback((tier: Tier) => {
    setState(prev => ({ ...prev, currentTier: tier }));
  }, []);

  const currentPlan = PLANS[state.currentTier || 'starter'];

  const hasFeature = React.useCallback((featureName: keyof PlanFeatures) => {
    return PLANS[state.currentTier || 'starter'].features[featureName];
  }, [state.currentTier]);

  const getLimit = React.useCallback((limitName: keyof PlanLimits) => {
    return PLANS[state.currentTier || 'starter'].limits[limitName];
  }, [state.currentTier]);

  const getUsage = React.useCallback((metricName: string) => {
    if (metricName === 'reportsPerMonth') {
      return state.reportsGeneratedMonth || 0;
    }
    return 0;
  }, [state.reportsGeneratedMonth]);

  const trackUsage = React.useCallback((metricName: string, amount: number = 1): boolean => {
    if (metricName === 'reportsPerMonth') {
      const limit = PLANS[state.currentTier || 'starter'].limits.reportsPerMonth;
      const current = state.reportsGeneratedMonth || 0;
      if (limit !== Infinity) {
        if (current + amount > limit) {
          return false; // Limit exceeded
        }
      }
      setState(prev => ({ ...prev, reportsGeneratedMonth: (prev.reportsGeneratedMonth || 0) + amount }));
      return true;
    }
    return true;
  }, [state.currentTier, state.reportsGeneratedMonth]);

  const contextValue = React.useMemo(() => ({ 
    ...state, 
    setData, 
    clearData, 
    setWorkspace, 
    setCurrentTier, 
    hasFeature, 
    getLimit, 
    getUsage, 
    trackUsage, 
    campaignsList, 
    plan: currentPlan 
  }), [state, setData, clearData, setWorkspace, setCurrentTier, hasFeature, getLimit, getUsage, trackUsage, campaignsList, currentPlan]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
