import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppState, CsvRow, WorkspaceSettings } from '../types';
import { auth, db } from './firebase';
import { collection, query, where, onSnapshot, doc, setDoc, getDocFromServer, or } from 'firebase/firestore';
import { PLANS, Tier, Plan, PlanFeatures, PlanLimits } from './plans';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  const jsonError = JSON.stringify(errInfo);
  console.error('Firestore Error context:', jsonError);
  // We don't throw here to avoid crashing the entire AppProvider/App tree
  // Instead we log it so it can be fixed or displayed via other means.
}

interface AppContextType extends AppState {
  setData: (data: CsvRow[]) => void;
  clearData: () => void;
  setWorkspace: (settings: WorkspaceSettings) => void;
  saveWorkspace: (settings: WorkspaceSettings) => Promise<void>;
  setCurrentTier: (tier: Tier) => void;
  hasFeature: (featureName: keyof PlanFeatures) => boolean;
  getLimit: (limitName: keyof PlanLimits) => number | string;
  getUsage: (metricName: string) => number;
  trackUsage: (metricName: string, amount?: number) => boolean;
  campaignsList: any[];
  plan: Plan;
  getCampaignName: (id: string) => string;
  showPricing: boolean;
  setShowPricing: (show: boolean) => void;
  activeWorkspaceId: string | null;
  portalContext: { active: boolean; campaignId: string | null; ownerId: string | null; authorized: boolean; authorize: (pw: string) => Promise<boolean>; loading: boolean };
}

const defaultWorkspace: WorkspaceSettings = {
  brand: { name: "Your Agency", tagline: "Clipping Agency Operations", logo: null, logoUrl: null },
  color: { primary: "#00D4FF", preset: "Electric Blue" },
  reports: { coverPage: true, defaultDateRange: "Last 30 days", defaultPlatforms: ["TikTok", "Instagram", "YouTube", "Other"], template: {}, emailSignature: "", fromName: "", replyTo: "" },
  layout: { theme: "dark", layout: "Standard", chartStyle: "Line" },
  clients: [], 
  metrics: { customLabels: {} },
  notifications: { flagsPending: true, weeklySummary: false },
  rollingDates: false,
};

const defaultState: AppState = {
  data: [],
  onboarding: [],
  clients: [],
  briefs: [],
  updates: [
    {
      id: "upd1",
      campaignId: "All",
      authorId: "system",
      authorName: "System",
      content: "Welcome to your new Campaign Dashboard!",
      timestamp: new Date().toISOString(),
      clientVisible: true
    }
  ],
  workspace: defaultWorkspace,
  activeWorkspace: null,
  workspaceMembers: [],
  workspaceFiles: [],
  clipMetrics: [],
  currentTier: undefined, 
  reportsGeneratedMonth: 0,
  userRole: 'agency'
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
  const [showPricing, setShowPricing] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [portalContext, setPortalContext] = useState<{ active: boolean; campaignId: string | null; ownerId: string | null; authorized: boolean; loading: boolean }>({
    active: false,
    campaignId: null,
    ownerId: null,
    authorized: false,
    loading: false
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const portalIdParam = params.get('portal');
    const campaignIdParam = params.get('c') || params.get('campaignId');
    let portalId = portalIdParam;
    let campaignId = campaignIdParam;
    
    if (!portalId && window.location.pathname.startsWith('/portal')) {
      const parts = window.location.pathname.split('/');
      // Path is /portal/TOKEN or /portal/TOKEN/
      // parts would be ['', 'portal', 'TOKEN'] or ['', 'portal', 'TOKEN', '']
      portalId = parts.filter(p => !!p && p !== 'portal').pop() || null;
    }

    const idToLookup = portalId || campaignId;

    if (idToLookup) {
      setPortalContext(prev => ({ ...prev, active: true, campaignId: idToLookup, loading: true }));
      
      // Try looking up by portalToken OR campaign ID (if enabled)
      const qToken = query(collection(db, 'campaigns'), where('portalToken', '==', idToLookup), where('portalEnabled', '==', true));
      
      const unsubscribe = onSnapshot(qToken, async (snapshot) => {
        if (!snapshot.empty) {
          const campSnap = snapshot.docs[0];
          const data = campSnap.data();
          setPortalContext(prev => ({ 
            ...prev, 
            authorized: !data.portalPassword, 
            ownerId: data.userId, 
            campaignId: campSnap.id, 
            loading: false,
            _expectedPassword: data.portalPassword
          } as any));
        } else {
          // Try looking up by exact campaign ID if possible
          try {
            const campDoc = await getDocFromServer(doc(db, 'campaigns', idToLookup));
            if (campDoc.exists()) {
              const data = campDoc.data();
              if (data.portalEnabled) {
                setPortalContext(prev => ({ 
                  ...prev, 
                  authorized: !data.portalPassword, 
                  ownerId: data.userId, 
                  campaignId: campDoc.id, 
                  loading: false,
                  _expectedPassword: data.portalPassword
                } as any));
                return;
              }
            }
          } catch (err) {
            console.warn("Direct campaign ID lookup failed:", err);
          }
          setPortalContext(prev => ({ ...prev, loading: false }));
        }
      }, (error) => {
        console.error("Portal snapshot error:", error);
        setPortalContext(prev => ({ ...prev, loading: false }));
      });
      return () => unsubscribe();
    }
  }, []);

  const authorizePortal = async (pw: string): Promise<boolean> => {
    // We already stored _expectedPassword in the state via onSnapshot 
    const expectedPw = (portalContext as any)._expectedPassword;
    if (pw === expectedPw) {
      setPortalContext(prev => ({ ...prev, authorized: true }));
      return true;
    }
    return false;
  };

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
  }, [state.workspace?.color?.primary]);

  useEffect(() => {
    return auth.onAuthStateChanged(user => {
      setUserId(user ? user.uid : null);
    });
  }, []);

  useEffect(() => {
    const effectiveUserId = userId || portalContext.ownerId;
    if (!effectiveUserId) {
      if (!portalContext.active || !portalContext.ownerId) {
        setState(defaultState);
        setCampaignsList([]);
        return;
      }
    }

    // Connection Test
    if (!activeWorkspaceId && effectiveUserId) {
        setActiveWorkspaceId(effectiveUserId);
    }

    const testConnection = async () => {
      try {
        // Small delay to ensure auth is settled
        await getDocFromServer(doc(db, 'users', effectiveUserId));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration or connection.");
        }
      }
    };
    testConnection();

    // Fetch user profile and plan
    const userDocRef = doc(db, 'users', effectiveUserId);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        const userEmail = auth.currentUser?.email;
        const isMasterAdmin = userEmail === 'engmarwand@gmail.com';

        if (isMasterAdmin && !portalContext.active) {
            setState(prev => ({ ...prev, currentTier: 'agency', userRole: 'agency', reportsGeneratedMonth: 0 }));
        } else if (docSnap.exists()) {
            const userData = docSnap.data();
            
            const wId = userData.workspaceId || effectiveUserId;
            if (activeWorkspaceId !== wId) {
                setActiveWorkspaceId(wId);
            }
            
            setState(prev => ({ 
              ...prev, 
              currentTier: userData.plan, 
              reportsGeneratedMonth: userData.reportsGeneratedMonth || 0,
              userRole: portalContext.active ? 'client' : (userData.role || 'agency'),
              userDoc: userData 
            }));
        } else {
            // No plan set for user
            if (activeWorkspaceId !== effectiveUserId) {
                setActiveWorkspaceId(effectiveUserId);
            }
            setState(prev => ({ ...prev, currentTier: undefined, userRole: portalContext.active ? 'client' : 'agency', reportsGeneratedMonth: 0 }));
        }
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${effectiveUserId}`);
    });

    // Fetch workspace settings
    const wId = activeWorkspaceId || effectiveUserId;
    
    // Also fetch Workspace metadata, WorkspaceMembers, and WorkspaceFiles
    const unsubscribeWorkspaceFiles = onSnapshot(
      query(collection(db, 'workspaceFiles'), where('workspaceId', '==', wId)),
      (snapshot) => {
        const files: any[] = [];
        snapshot.forEach(doc => files.push({ id: doc.id, ...doc.data() }));
        setState(prev => ({ ...prev, workspaceFiles: files }));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'workspaceFiles')
    );

    const unsubscribeWorkspaceMembers = onSnapshot(
      query(collection(db, 'workspaceMembers'), where('workspaceId', '==', wId)),
      (snapshot) => {
        const members: any[] = [];
        snapshot.forEach(doc => members.push({ id: doc.id, ...doc.data() }));
        setState(prev => ({ ...prev, workspaceMembers: members }));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'workspaceMembers')
    );

    const unsubscribeActiveWorkspace = onSnapshot(
      doc(db, 'workspaces_metadata', wId),
      (docSnap) => {
        if (docSnap.exists()) {
          setState(prev => ({ ...prev, activeWorkspace: { id: docSnap.id, ...docSnap.data() } as any }));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `workspaces_metadata/${wId}`)
    );

    const workspaceDocRef = doc(db, 'workspaces', wId);
    const unsubscribeWorkspace = onSnapshot(workspaceDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as WorkspaceSettings;
            // If credits is missing, we initialize it later once the plan is known
            setState(prev => ({ ...prev, workspace: data }));
        }
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, `workspaces/${effectiveUserId}`);
    });

    const qCampaigns = !portalContext.active && userId
      ? query(collection(db, 'campaigns'), or(where('workspaceId', '==', wId), where('userId', '==', wId)))
      : null;

    const unsubscribeCampaigns = qCampaigns ? onSnapshot(qCampaigns, (snapshot) => {
       const list: any[] = [];
       snapshot.forEach(doc => {
         list.push({ id: doc.id, ...doc.data() });
       });
       setCampaignsList(list);
    }, (error) => {
       handleFirestoreError(error, OperationType.LIST, 'campaigns');
    }) : () => {};

    const qClients = !portalContext.active && userId
      ? query(collection(db, 'clients'), or(where('workspaceId', '==', wId), where('userId', '==', wId)))
      : null;

    const unsubscribeClients = qClients ? onSnapshot(qClients, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setState(prev => ({ ...prev, clients: list }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clients');
    }) : () => {};

    const qBriefs = portalContext.active && portalContext.campaignId
      ? query(collection(db, 'campaign_briefs'), where('campaignId', '==', portalContext.campaignId))
      : query(collection(db, 'campaign_briefs'), or(where('workspaceId', '==', wId), where('userId', '==', wId)));

    const unsubscribeBriefs = onSnapshot(qBriefs, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setState(prev => ({ ...prev, briefs: list }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'campaign_briefs');
    });

    const qSubmissions = portalContext.active && portalContext.campaignId
      ? query(collection(db, 'submissions'), where('userId', '==', effectiveUserId), where('campaignId', '==', portalContext.campaignId))
      : query(collection(db, 'submissions'), or(where('workspaceId', '==', wId), where('userId', '==', wId)));

    const qUpdates = portalContext.active && portalContext.campaignId
      ? query(collection(db, 'campaign_updates'), where('campaignId', 'in', ['All', portalContext.campaignId]), where('clientVisible', '==', true))
      : query(collection(db, 'campaign_updates'), or(where('workspaceId', '==', wId), where('authorId', '==', wId)));

    const unsubscribeUpdates = onSnapshot(qUpdates, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort by timestamp descending
      list.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setState(prev => ({ ...prev, updates: list.length > 0 ? list : defaultState.updates }));
    }, (error) => {
       handleFirestoreError(error, OperationType.LIST, 'campaign_updates');
    });

    const unsubscribeSubmissions = onSnapshot(qSubmissions, (snapshot) => {
      const data: CsvRow[] = [];
      console.log(`[AppProvider] Snapshot: submissions, size: ${snapshot.size}`); 
      snapshot.forEach(doc => {
        const row = doc.data() as any;
        
        let dateStr = "";
        if (row.submissionDate) {
           const d = new Date(row.submissionDate);
           if (!isNaN(d.getTime())) {
              dateStr = d.toISOString().split('T')[0];
           }
        }
        if (!dateStr) {
           dateStr = row.createdAt?.toDate ? row.createdAt.toDate().toISOString().split('T')[0] : (row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        }

        data.push({
          "Submission Date": dateStr,
          Creator: row.creatorId ? row.creatorId.replace(/^(id_)?creator_/, '') : "",
          "Content Title": row.title || row.url || "",
          Platform: row.platform ? row.platform.charAt(0).toUpperCase() + row.platform.slice(1) : "Tiktok",
          Campaign: row.Campaign || row.campaignId || "",
          Status: row.status === 'paid' ? 'Paid' : row.status === 'approved' ? 'Approved' : 'Pending',
          Views: row.views || 0,
          "Amount Paid": row.payout || 0,
          Likes: row.likes || 0,
          Comments: row.comments || 0,
          Shares: row.shares || 0,
          "Submission URL": row.url || "",
          _campaignId: row.campaignId || "",
        });
      });
      setState(prev => ({ ...prev, data }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'submissions');
    });

    const qMetrics = portalContext.active && portalContext.campaignId
      ? query(collection(db, 'clipMetrics'), where('campaignId', '==', portalContext.campaignId))
      : query(collection(db, 'clipMetrics'), or(where('workspaceId', '==', wId), where('userId', '==', wId)));

    const unsubscribeMetrics = onSnapshot(qMetrics, (snapshot) => {
      const metrics: any[] = [];
      console.log(`[AppProvider] Snapshot: clipMetrics, size: ${snapshot.size}`);
      snapshot.forEach(doc => {
        metrics.push({ id: doc.id, ...doc.data() });
      });
      // Sort by updatedAt descending
      metrics.sort((a,b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
      setState(prev => ({ ...prev, clipMetrics: metrics }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clipMetrics');
    });

    return () => {
       unsubscribeUpdates();
       unsubscribeBriefs();
       unsubscribeSubmissions();
       unsubscribeMetrics();
       unsubscribeCampaigns();
       unsubscribeClients();
       unsubscribeUser();
       unsubscribeWorkspace();
       unsubscribeWorkspaceFiles();
       unsubscribeWorkspaceMembers();
       unsubscribeActiveWorkspace();
    };
  }, [userId, portalContext.active, portalContext.ownerId, portalContext.authorized, portalContext.campaignId, activeWorkspaceId]);

  const setData = async (newData: CsvRow[]) => {
    setState(prev => ({ ...prev, data: newData }));
  };

  const clearData = () => {
    setState(prev => ({ ...prev, data: [] }));
    window.OpsRelicData = undefined;
  };

  const setWorkspace = (newWorkspace: WorkspaceSettings) => {
    setState(prev => {
      const newState = { ...prev, workspace: newWorkspace };
      window.OpsRelicData = { ...window.OpsRelicData, workspace: newWorkspace };
      return newState;
    });
  };

  const saveWorkspace = async (newWorkspace: WorkspaceSettings) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, 'workspaces', userId), newWorkspace);
      setWorkspace(newWorkspace);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workspaces/${userId}`);
    }
  };

  const setCurrentTier = (tier: Tier) => {
    const userEmail = auth.currentUser?.email;
    const isMasterAdmin = userEmail === 'engmarwand@gmail.com';
    setState(prev => ({ ...prev, currentTier: isMasterAdmin ? 'agency' : tier }));
  };

  const currentPlan = state.currentTier ? PLANS[state.currentTier] : null;

  const hasFeature = (featureName: keyof PlanFeatures) => {
    return currentPlan ? currentPlan.features[featureName] : false;
  };

  const getLimit = (limitName: keyof PlanLimits) => {
    return currentPlan ? currentPlan.limits[limitName] : 0;
  };


  const getUsage = (metricName: string) => {
    if (metricName === 'reportsPerMonth') {
      return state.reportsGeneratedMonth || 0;
    }
    return 0;
  };

  const trackUsage = (metricName: string, amount: number = 1): boolean => {
    if (metricName === 'reportsPerMonth') {
      const limit = getLimit('reportsPerMonth');
      const current = getUsage('reportsPerMonth');
      if (limit !== Infinity && typeof limit === 'number') {
        if (current + amount > limit) {
          return false; // Limit exceeded
        }
      }
      
      const newCount = (state.reportsGeneratedMonth || 0) + amount;
      setState(prev => ({ ...prev, reportsGeneratedMonth: newCount }));
      
      // Persist to Firestore
      if (userId) {
        setDoc(doc(db, 'users', userId), { reportsGeneratedMonth: newCount }, { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
      }
      
      return true;
    }
    return true;
  };

  const getCampaignName = (id: string): string => {
     const c = campaignsList.find((camp) => camp.id === id);
     if (c && c.name) return c.name;
     // fallback
     return id.replace(/^(id_)?camp_/, '');
  };

  const contextValue = React.useMemo(() => ({
    ...state,
    setData,
    clearData,
    setWorkspace,
    saveWorkspace,
    setCurrentTier,
    hasFeature,
    getLimit,
    getUsage,
    trackUsage,
    campaignsList,
    plan: currentPlan,
    getCampaignName,
    showPricing,
    setShowPricing,
    activeWorkspaceId,
    portalContext: { ...portalContext, authorize: authorizePortal }
  }), [
    state,
    campaignsList,
    currentPlan,
    showPricing,
    activeWorkspaceId,
    portalContext
  ]);

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
