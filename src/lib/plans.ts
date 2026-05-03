export type Tier = 'starter' | 'pro' | 'agency';

export interface PlanFeatures {
  csvUpload: boolean;
  campaignReports: boolean;
  clipperLeaderboard: boolean;
  platformBreakdown: boolean;
  pdfExport: boolean;
  reportTemplates: boolean;
  dashboardKPIs: boolean;
  dataExport: boolean;
  
  // PRO-ONLY
  budgetTracker: boolean;
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
  savedTemplates: number;
  clipperInvites: number;
  dataRetentionDays: number;
  exportFrequency: string;
  clientProfiles: number;
  scheduledReportTriggers: number;
}

export interface Plan {
  id: Tier;
  name: string;
  price: number;
  features: PlanFeatures;
  limits: PlanLimits;
}

export const PLANS: Record<Tier, Plan> = {
  starter: {
    id: 'starter',
    name: "Starter",
    price: 47,
    features: {
      csvUpload: true,
      campaignReports: true,
      clipperLeaderboard: true,
      platformBreakdown: true,
      pdfExport: true,
      reportTemplates: true,
      dashboardKPIs: true,
      dataExport: true,
      budgetTracker: false,
      onboardingPipeline: true,
      whiteLabelBranding: false,
      unlimitedReports: false,
      historicalAnalytics: false,
      aiInsights: false,
      messageTemplates: false,
      prioritySupport: false,
      workspaceCustomization: true,
      colorSchemePresets: false,
      clientProfiles: false,
      reportReordering: false,
      metricLabelCustomization: false,
      scheduledReports: false,
      customDomains: false,
      notificationPreferences: false,
      layoutStyles: false,
      emailBranding: false,
      reportCoverPage: true,
      livePreviewPanel: false,
      perClientBranding: false,
      rollingDateRanges: false,
      savedTemplates: true,
    },
    limits: {
      reportsPerMonth: 5,
      campaigns: 2,
      savedTemplates: 1,
      clipperInvites: 10,
      dataRetentionDays: 90,
      exportFrequency: "Once per session",
      clientProfiles: 0,
      scheduledReportTriggers: 0,
    },
  },
  pro: {
    id: 'pro',
    name: "Pro",
    price: 97,
    features: {
      csvUpload: true,
      campaignReports: true,
      clipperLeaderboard: true,
      platformBreakdown: true,
      pdfExport: true,
      reportTemplates: true,
      dashboardKPIs: true,
      dataExport: true,
      budgetTracker: true,
      onboardingPipeline: true,
      whiteLabelBranding: true,
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
      emailBranding: true,
      reportCoverPage: true,
      livePreviewPanel: true,
      perClientBranding: false,
      rollingDateRanges: true,
      savedTemplates: true,
    },
    limits: {
      reportsPerMonth: 50,
      campaigns: 10,
      savedTemplates: 5,
      clipperInvites: 50,
      dataRetentionDays: 365,
      exportFrequency: "Unlimited",
      clientProfiles: 0,
      scheduledReportTriggers: 0,
    },
  },
  agency: {
    id: 'agency',
    name: "Agency",
    price: 197,
    features: {
      csvUpload: true,
      campaignReports: true,
      clipperLeaderboard: true,
      platformBreakdown: true,
      pdfExport: true,
      reportTemplates: true,
      dashboardKPIs: true,
      dataExport: true,
      budgetTracker: true,
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
      savedTemplates: Infinity,
      clipperInvites: Infinity,
      dataRetentionDays: Infinity,
      exportFrequency: "Unlimited",
      clientProfiles: Infinity,
      scheduledReportTriggers: Infinity,
    },
  }
};

export const getFeatureMinTier = (featureName: keyof PlanFeatures): Tier => {
  if (PLANS.starter.features[featureName]) return 'starter';
  if (PLANS.pro.features[featureName]) return 'pro';
  return 'agency';
};
