import { Tier } from './plans';

export interface AIAction {
  id: string;
  label: string;
  description: string;
  creditCost: number;
}

export const AI_ACTIONS: Record<string, AIAction> = {
  CREATE_DRAFT: {
    id: 'CREATE_DRAFT',
    label: 'Generate Campaign Draft',
    description: 'Creates a full campaign structure from intake data.',
    creditCost: 1
  },
  REWRITE_BRIEF: {
    id: 'REWRITE_BRIEF',
    label: 'Optimize Campaign Brief',
    description: 'Refines and professionalizes a brief section.',
    creditCost: 1
  },
  CLIENT_UPDATE: {
    id: 'CLIENT_UPDATE',
    label: 'Generate Client Update',
    description: 'Creates a professional status update from performance data.',
    creditCost: 1
  },
  PERFORMANCE_SUMMARY: {
    id: 'PERFORMANCE_SUMMARY',
    label: 'Pro Performance Summary',
    description: 'Full strategic analysis of campaign metrics.',
    creditCost: 2
  },
  STRATEGY_COACH: {
    id: 'STRATEGY_COACH',
    label: 'AI Strategy Session',
    description: 'In-depth chat about campaign direction and next steps.',
    creditCost: 3
  }
};

export const INITIAL_CREDITS: Record<Tier, number> = {
  starter: 0,
  pro: 100,
  agency: 500
};
