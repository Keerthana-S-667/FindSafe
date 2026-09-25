import { apiClient } from './api';

export interface DemoChecklistItem {
  component: string;
  status: string;
  details: string;
}

export interface DemoStatusData {
  demo_mode: string;
  is_ready: boolean;
  scenario_id: string;
  scenario_name: string;
  checklist: DemoChecklistItem[];
  total_steps: number;
  last_checked: string;
}

export interface DemoStepDetail {
  step: number;
  title: string;
  category: string;
  description: string;
  presenter_note: string;
  location_name: string;
  lat: number;
  lng: number;
  evidence_score?: number | null;
  details: Record<string, any>;
}

export interface TechStackItem {
  name: string;
  category: string;
  description: string;
}

export interface ArchitectureFlowItem {
  step: string;
  desc: string;
}

export interface PrivacyDiffItem {
  title: string;
  desc: string;
}

export interface DemoScenarioData {
  scenario_id: string;
  scenario_name: string;
  case_id: string;
  steps: DemoStepDetail[];
  total_steps: number;
  tech_stack: TechStackItem[];
  architecture_flow: ArchitectureFlowItem[];
  privacy_differentiators: PrivacyDiffItem[];
  disclaimer: string;
}

export const demoService = {
  getDemoStatus: async (): Promise<DemoStatusData> => {
    const res = await apiClient.get('/demo/status');
    return res.data;
  },

  prepareDemoData: async (): Promise<any> => {
    const res = await apiClient.post('/demo/prepare');
    return res.data;
  },

  getDemoScenario: async (): Promise<DemoScenarioData> => {
    const res = await apiClient.get('/demo/scenario');
    return res.data;
  },

  resetDemoState: async (): Promise<any> => {
    const res = await apiClient.post('/demo/reset');
    return res.data;
  },

  startDemoSession: async (): Promise<any> => {
    const res = await apiClient.post('/demo/start');
    return res.data;
  }
};
