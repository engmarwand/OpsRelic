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
  campaignsList?: any[]; // Keep the existing context
}
