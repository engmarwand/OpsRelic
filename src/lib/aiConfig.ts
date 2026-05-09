import { Tier } from './plans';

export interface AIAction {
  id: string;
  label: string;
  description: string;
}

export const AI_ACTIONS: Record<string, AIAction> = {
  CREATE_DRAFT: {
    id: 'CREATE_DRAFT',
    label: 'Generate Campaign Draft',
    description: 'Creates a full campaign structure from intake data.',
  },
  REWRITE_BRIEF: {
    id: 'REWRITE_BRIEF',
    label: 'Optimize Campaign Brief',
    description: 'Refines and professionalizes a brief section.',
  },
  CLIENT_UPDATE: {
    id: 'CLIENT_UPDATE',
    label: 'Generate Client Update',
    description: 'Creates a professional status update from performance data.',
  },
  PERFORMANCE_SUMMARY: {
    id: 'PERFORMANCE_SUMMARY',
    label: 'Pro Performance Summary',
    description: 'Full strategic analysis of campaign metrics.',
  },
  STRATEGY_COACH: {
    id: 'STRATEGY_COACH',
    label: 'AI Strategy Session',
    description: 'In-depth chat about campaign direction and next steps.',
  }
};
