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
  [key: string]: any;
}

export interface WorkspaceRole {
  role: 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER';
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string | null;
  email?: string;
  name?: string;
  fullName?: string;
  role: WorkspaceRole['role'];
  status?: 'active' | 'pending';
  createdAt?: string;
}

export interface WorkspaceFile {
  id: string;
  workspaceId: string;
  clientId?: string;
  campaignId?: string;
  title?: string;
  name?: string;
  type: 'FILE' | 'LINK' | 'file' | 'link';
  fileUrl?: string | null;
  linkUrl?: string | null;
  url?: string;
  description?: string;
  uploadedBy?: string;
  createdByUserId?: string;
  createdAt: string | any;
  updatedAt?: string;
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
export type ClientStage = 'Lead' | 'Onboarding' | 'Briefing' | 'Active';

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
  workspaceId?: string;
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
  workspaceId?: string;
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
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  budget?: number; // This can be used for the campaign specific retainer
  revenue?: number; // How much the client paid
  cpm?: number; // Cost per 1000 views
  retainer?: number; // Explicit retainer field
  maxPayout?: number; // Maximum amount a creator can earn
  portalEnabled?: boolean;
  portalToken?: string;
  portalPassword?: string;
}

export interface CampaignBrief {
  id: string;
  campaignId: string;
  content: string; // The markdown/text content for agency editing
  summary?: string;
  objective?: string;
  angle?: string;
  nextSteps?: string;
  updatedAt: string;
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

export interface ClipMetric {
  id: string;
  url: string;
  platform: string;
  campaignId: string;
  userId: string;
  creatorId?: string;
  author?: string;
  title?: string;
  clipLinkId?: string;
  views: number;
  likes: number;
  comments: number;
  shares?: number;
  engagementRate?: number;
  status: 'active' | 'pending' | 'error';
  error?: string;
  updatedAt: any;
  createdAt: any;
}

export interface WorkspaceSettings {
  brand: { name: string; tagline: string; logo: string | null; logoUrl: string | null; email?: string; timezone?: string; };
  color: { primary: string; preset: string };
  reports: { coverPage: boolean; fullReportBranding?: boolean; defaultDateRange: string; defaultPlatforms: string[]; template: Record<string, boolean>; emailSignature: string; fromName: string; replyTo: string };
  layout: { theme: string; layout: string; chartStyle: string; defaultView?: string; };
  clients: any[]; // Array of client profile objects
  metrics: { customLabels: Record<string, string> };
  notifications: { flagsPending: boolean; weeklySummary: boolean; uploadAlerts?: boolean; clientPortalViews?: boolean; };
  rollingDates: boolean;
}

export interface AppState {
  data: CsvRow[];
  clients: ClientAccount[];
  briefs: CampaignBrief[];
  updates: CampaignUpdate[];
  onboarding: InvitedClipper[];
  workspace?: WorkspaceSettings;
  activeWorkspace?: Workspace | null;
  workspaceMembers?: WorkspaceMember[];
  workspaceFiles?: WorkspaceFile[];
  clipMetrics: ClipMetric[];
  currentTier?: import('./lib/plans').Tier;
  reportsGeneratedMonth?: number;
  userRole?: 'agency' | 'client'; // Added
  campaignsList?: Campaign[]; // Updated to use Campaign type
  userDoc?: any;
}
