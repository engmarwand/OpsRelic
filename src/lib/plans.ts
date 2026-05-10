export type Tier = 'starter' | 'pro' | 'agency';

export interface PlanFeatures {
  csvUpload: boolean;
  smartSync: boolean; // Added
  campaignReports: boolean;
  clipperLeaderboard: boolean;
  platformBreakdown: boolean;
  pdfExport: boolean;
  reportTemplates: boolean;
  dashboardKPIs: boolean;
  dataExport: boolean;
  
  // PRO-ONLY
  onboardingPipeline: boolean;
  whiteLabelBranding: boolean;
  unlimitedReports: boolean;
  historicalAnalytics: boolean;
  aiInsights: boolean;
  messageTemplates: boolean;
  prioritySupport: boolean;
  workspaceCustomization: boolean;
  colorSchemePresets: boolean;
  clientProfiles: boolean;
  reportReordering: boolean;
  metricLabelCustomization: boolean;
  scheduledReports: boolean;
  customDomains: boolean;
  notificationPreferences: boolean;
  layoutStyles: boolean;
  emailBranding: boolean;
  reportCoverPage: boolean;
  livePreviewPanel: boolean;
  perClientBranding: boolean;
  rollingDateRanges: boolean;
  savedTemplates: boolean;
}

export interface PlanLimits {
  reportsPerMonth: number;
  campaigns: number;
  recordsPerCampaign: number; // Added
  savedTemplates: number;
  clipperInvites: number;
  dataRetentionDays: number;
  exportFrequency: string;
  clientProfiles: number;
  scheduledReportTriggers: number;
  aiCredits: number; // Added for Phase 2
}

export interface Plan {
  id: Tier;
  whopPlanId?: string;
  name: string;
  price: number;
  features: PlanFeatures;
  limits: PlanLimits;
}

export const PLANS: Record<Tier, Plan> = {
  starter: {
    id: 'starter',
    name: "Free",
    price: 0,
    features: {
      csvUpload: true,
      smartSync: false,
      campaignReports: true, 
      clipperLeaderboard: true,
      platformBreakdown: true,
      pdfExport: true,
      reportTemplates: false,
      dashboardKPIs: true,
      dataExport: true,
      onboardingPipeline: false,
      whiteLabelBranding: false,
      unlimitedReports: false,
      historicalAnalytics: false,
      aiInsights: false,
      messageTemplates: false,
      prioritySupport: false,
      workspaceCustomization: false,
      colorSchemePresets: false,
      clientProfiles: false,
      reportReordering: false,
      metricLabelCustomization: false,
      scheduledReports: false,
      customDomains: false,
      notificationPreferences: false,
      layoutStyles: false,
      emailBranding: false,
      reportCoverPage: false,
      livePreviewPanel: false,
      perClientBranding: false,
      rollingDateRanges: false,
      savedTemplates: false,
    },
    limits: {
      reportsPerMonth: 3,
      campaigns: 1,
      recordsPerCampaign: 500,
      savedTemplates: 0,
      clipperInvites: 0,
      dataRetentionDays: 30,
      exportFrequency: "None",
      clientProfiles: 0,
      scheduledReportTriggers: 0,
      aiCredits: 0,
    },
  },
  pro: {
    id: 'pro',
    whopPlanId: 'plan_3abAVC0tgumce',
    name: "Pro",
    price: 47,
    features: {
      csvUpload: true,
      smartSync: true,
      campaignReports: true,
      clipperLeaderboard: true,
      platformBreakdown: true,
      pdfExport: true,
      reportTemplates: true,
      dashboardKPIs: true,
      dataExport: true,
      onboardingPipeline: false,
      whiteLabelBranding: false,
      unlimitedReports: true,
      historicalAnalytics: true,
      aiInsights: true,
      messageTemplates: true,
      prioritySupport: true,
      workspaceCustomization: true,
      colorSchemePresets: true,
      clientProfiles: false,
      reportReordering: false,
      metricLabelCustomization: false,
      scheduledReports: false,
      customDomains: false,
      notificationPreferences: false,
      layoutStyles: false,
      emailBranding: false,
      reportCoverPage: true,
      livePreviewPanel: true,
      perClientBranding: false,
      rollingDateRanges: true,
      savedTemplates: true,
    },
    limits: {
      reportsPerMonth: Infinity,
      campaigns: 10,
      recordsPerCampaign: 5000,
      savedTemplates: 5,
      clipperInvites: 50,
      dataRetentionDays: 365,
      exportFrequency: "Unlimited",
      clientProfiles: 0,
      scheduledReportTriggers: 5,
      aiCredits: 100,
    },
  },
  agency: {
    id: 'agency',
    whopPlanId: 'plan_5bnzRrzNEhrt7',
    name: "Agency",
    price: 247,
    features: {
      csvUpload: true,
      smartSync: true,
      campaignReports: true,
      clipperLeaderboard: true,
      platformBreakdown: true,
      pdfExport: true,
      reportTemplates: true,
      dashboardKPIs: true,
      dataExport: true,
      onboardingPipeline: true,
      whiteLabelBranding: true,
      unlimitedReports: true,
      historicalAnalytics: true,
      aiInsights: true,
      messageTemplates: true,
      prioritySupport: true,
      workspaceCustomization: true,
      colorSchemePresets: true,
      clientProfiles: true,
      reportReordering: true,
      metricLabelCustomization: true,
      scheduledReports: true,
      customDomains: true,
      notificationPreferences: true,
      layoutStyles: true,
      emailBranding: true,
      reportCoverPage: true,
      livePreviewPanel: true,
      perClientBranding: true,
      rollingDateRanges: true,
      savedTemplates: true,
    },
    limits: {
      reportsPerMonth: Infinity,
      campaigns: Infinity,
      recordsPerCampaign: Infinity,
      savedTemplates: Infinity,
      clipperInvites: Infinity,
      dataRetentionDays: Infinity,
      exportFrequency: "Unlimited",
      clientProfiles: Infinity,
      scheduledReportTriggers: Infinity,
      aiCredits: 500,
    },
  }
};

export const getFeatureMinTier = (featureName: keyof PlanFeatures): Tier => {
  if (PLANS.starter.features[featureName]) return 'starter';
  if (PLANS.pro.features[featureName]) return 'pro';
  return 'agency';
};
