export interface CsvRow {
  "Submission Date": string;
  Creator: string;
  "Content Title": string;
  Platform: string;
  Campaign: string;
  Status: string;
  Views: number;
  "Amount Paid": number;
  "Submission URL"?: string;
  Likes?: number;
  Comments?: number;
  Shares?: number;
  _campaignId?: string;
}

export interface InvitedClipper {
  creator: string;
  campaign: string;
  status: "Invited" | "Guidelines Sent" | "Test Submitted" | "Approved" | "Active" | "Rejected";
  invitedDate: string;
  lastUpdated: string;
}

export interface ClientProfile {
  id: string;
  campaignId: string;
  name: string;
  email: string;
  companyName: string;
  status: 'Invited' | 'Onboarding' | 'Active';
}

export type CampaignStatus = 'Draft' | 'Review' | 'Active' | 'Complete';
export type ClientStage = 'Lead' | 'Qualified' | 'Proposal' | 'Won/Onboarding' | 'Active Client';

export interface ClientAccount {
  id: string;
  name: string;
  email?: string;
  website?: string;
  stage: ClientStage;
  notes?: string;
  nextStep?: string;
  retainer?: number; // Custom billing amount
  billingCycle?: 'Monthly' | 'Quarterly' | 'Yearly';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignIntake {
  brandName: string;
  website: string;
  productDescription: string;
  mainOffer: string;
  targetAudience: string;
  campaignGoal: string;
  platforms: string[];
  toneStyle: string;
  constraints: string;
  submittedAt?: string;
}

export interface Campaign {
  id: string;
  userId: string;
  clientId?: string; // Link to ClientAccount
  name: string;
  status: CampaignStatus;
  intakeToken?: string; // For public link access
  intake?: CampaignIntake;
  brief?: {
    summary: string;
    objective: string;
    angle: string;
    nextSteps: string;
    platforms: string[];
  };
  createdAt: string;
  updatedAt: string;
  budget?: number; // This can be used for the campaign specific retainer
  retainer?: number; // Explicit retainer field
  portalPassword?: string;
}

export interface CampaignBrief {
  campaignId: string;
  brandOverview: string;
  offerContent: string;
  goals: string;
  targetAudience: string;
  keyMessages: string;
  assetsUrl?: string;
  status: 'Draft' | 'Final';
}

export interface CampaignUpdate {
  id: string;
  campaignId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
  clientVisible: boolean;
}

export interface WorkspaceSettings {
  brand: { name: string; tagline: string; logo: string | null; logoUrl: string | null };
  color: { primary: string; preset: string };
  reports: { coverPage: boolean; fullReportBranding?: boolean; defaultDateRange: string; defaultPlatforms: string[]; template: Record<string, boolean>; emailSignature: string; fromName: string; replyTo: string };
  layout: { theme: string; layout: string; chartStyle: string };
  clients: any[]; // Array of client profile objects
  metrics: { customLabels: Record<string, string> };
  notifications: { flagsPending: boolean; weeklySummary: boolean };
  rollingDates: boolean;
  credits?: number; // Added for Phase 2
}

export interface AppState {
  data: CsvRow[];
  clients: ClientProfile[];
  briefs: CampaignBrief[];
  updates: CampaignUpdate[];
  onboarding: InvitedClipper[];
  workspace?: WorkspaceSettings;
  currentTier?: import('./lib/plans').Tier;
  reportsGeneratedMonth?: number;
  userRole?: 'agency' | 'client'; // Added
  campaignsList?: Campaign[]; // Updated to use Campaign type
}
