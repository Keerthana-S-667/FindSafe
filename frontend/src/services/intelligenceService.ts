import { apiClient } from './api';

export interface CandidateInsight {
  candidate_group_id: string;
  evidence_score: number;
  evidence_level: string;
  review_status: string;
  camera_count: number;
  record_count: number;
  visual_evidence: string;
  attribute_evidence: string;
  temporal_evidence: string;
  spatial_evidence: string;
  cross_camera_evidence: string;
  cross_source_evidence: string;
  supporting_evidence: string[];
  limitations: string[];
  why_appeared: string[];
  attribute_matrix: {
    attribute: string;
    reference: string;
    sightings: { camera: string; value: string; status: 'Match' | 'Partial' | 'Unknown' | 'Mismatch' }[];
  }[];
  human_verification_required: boolean;
}

export interface ChainNode {
  id: string;
  type: 'reference' | 'camera_sighting' | 'record_match';
  source: string;
  timestamp: string;
  location: string;
  evidence_score: number;
  status: string;
  label: string;
  image_path?: string;
  transition_time?: number;
  transition_distance?: number;
}

export interface EvidenceChainData {
  candidate_group_id: string;
  title: string;
  disclaimer: string;
  nodes: ChainNode[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  category: string;
  detail: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
}

export interface EvidenceGraphData {
  case_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface InvestigationTask {
  id: string;
  case_id: string;
  candidate_group_id?: string;
  record_match_id?: string;
  title: string;
  description?: string;
  assigned_to?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_by?: string;
  created_at: string;
  completed_at?: string;
  updated_at?: string;
}

export const intelligenceService = {
  getCandidateInsights: async (candidateId: string): Promise<CandidateInsight> => {
    const res = await apiClient.get(`/candidates/${candidateId}/insights`);
    return res.data;
  },

  getCandidateEvidenceChain: async (candidateId: string): Promise<EvidenceChainData> => {
    const res = await apiClient.get(`/candidates/${candidateId}/evidence-chain`);
    return res.data;
  },

  compareCandidates: async (candidateIds: string[]): Promise<CandidateInsight[]> => {
    const res = await apiClient.post('/candidates/compare', { candidate_ids: candidateIds });
    return res.data;
  },

  getCaseEvidenceGraph: async (caseId: string, filterType?: string): Promise<EvidenceGraphData> => {
    const res = await apiClient.get(`/cases/${caseId}/evidence-graph`, {
      params: { filter_type: filterType }
    });
    return res.data;
  },

  getSearchHistory: async (caseId: string) => {
    const res = await apiClient.get(`/cases/${caseId}/search-history`);
    return res.data;
  },

  getCaseTasks: async (caseId: string, status?: string): Promise<InvestigationTask[]> => {
    const res = await apiClient.get(`/cases/${caseId}/tasks`, {
      params: { status }
    });
    return res.data;
  },

  createTask: async (caseId: string, task: {
    title: string;
    description?: string;
    candidate_group_id?: string;
    record_match_id?: string;
    assigned_to?: string;
  }): Promise<InvestigationTask> => {
    const res = await apiClient.post(`/cases/${caseId}/tasks`, task);
    return res.data;
  },

  updateTaskStatus: async (taskId: string, status: 'pending' | 'completed' | 'cancelled'): Promise<InvestigationTask> => {
    const res = await apiClient.patch(`/tasks/${taskId}`, { status });
    return res.data;
  },

  getExportCsvUrl: (caseId: string) => {
    return `${apiClient.defaults.baseURL || '/api'}/cases/${caseId}/evidence/export`;
  }
};
