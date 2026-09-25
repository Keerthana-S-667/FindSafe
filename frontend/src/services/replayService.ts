import { apiClient } from './api';

export interface ReplayEvent {
  sequence_number: number;
  event_type: string;
  title: string;
  timestamp: string;
  description: string;
  related_entity_type?: string;
  related_entity_id?: string;
  evidence_score?: number | null;
  location_name?: string;
  lat?: number;
  lng?: number;
}

export interface ReplayData {
  session: any;
  events: ReplayEvent[];
  total_events: number;
  disclaimer: string;
}

export interface ScenarioItem {
  id: string;
  name: string;
  description: string;
  scenario_type: string;
  status: string;
  reference_profile: {
    name: string;
    case_code: string;
    upper_clothing: string;
    lower_clothing: string;
    bag: string;
    last_seen: string;
  };
  events_count: number;
}

export interface ScenarioDetailData {
  scenario: ScenarioItem;
  events: ReplayEvent[];
  total_events: number;
  privacy_notice: string;
}

export const replayService = {
  getSessionReplay: async (sessionId: string): Promise<ReplayData> => {
    const res = await apiClient.get(`/search-sessions/${sessionId}/replay`);
    return res.data;
  },

  getScenarios: async (): Promise<ScenarioItem[]> => {
    const res = await apiClient.get('/scenarios');
    return res.data;
  },

  getScenarioDetail: async (scenarioId: string): Promise<ScenarioDetailData> => {
    const res = await apiClient.get(`/scenarios/${scenarioId}`);
    return res.data;
  }
};
