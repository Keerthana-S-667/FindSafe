import { apiClient } from './api';

export interface OperationsSummary {
  active_searches_count: number;
  recently_completed_count: number;
  partial_searches_count: number;
  failed_searches_count: number;
  pending_reviews_count: number;
  open_tasks_count: number;
  active_searches: any[];
  recent_evidence: any[];
  failed_searches: any[];
}

export interface SearchStageEvent {
  id: string;
  search_session_id: string;
  stage: string;
  status: 'queued' | 'processing' | 'completed' | 'partial' | 'failed';
  message?: string;
  processed_count?: number;
  total_count?: number;
}

export interface SearchSessionDetail {
  session: any;
  events: SearchStageEvent[];
}

export interface ReviewQueueItem {
  id: string;
  type: 'candidate_group' | 'record_match';
  case_id: string;
  case_name: string;
  case_code: string;
  title: string;
  evidence_score: number;
  status: string;
  created_at: string;
  assigned_reviewer?: string | null;
  is_locked: boolean;
}

export interface SystemStatusData {
  timestamp: string;
  overall_status: 'Operational' | 'Degraded' | 'Unavailable';
  subsystems: {
    backend_api: { status: string; detail: string };
    database: { status: string; detail: string };
    storage: { status: string; detail: string };
    ai_engine: { status: string; detail: string };
  };
}

export interface HandoffSummaryData {
  case_id: string;
  full_name: string;
  case_code: string;
  status: string;
  priority: string;
  assigned_investigator: string;
  searches_completed: number;
  candidates_detected: number;
  open_tasks_count: number;
  outcome: string;
  last_seen_location?: string;
  last_seen_timestamp?: string;
  summary_bullets: string[];
}

export const operationsService = {
  getSummary: async (): Promise<OperationsSummary> => {
    const res = await apiClient.get('/operations/summary');
    return res.data;
  },

  getSystemStatus: async (): Promise<SystemStatusData> => {
    const res = await apiClient.get('/operations/system-status');
    return res.data;
  },

  getSessionDetail: async (sessionId: string): Promise<SearchSessionDetail> => {
    const res = await apiClient.get(`/search-sessions/${sessionId}/status`);
    return res.data;
  },

  cancelSession: async (sessionId: string) => {
    const res = await apiClient.post(`/search-sessions/${sessionId}/cancel`);
    return res.data;
  },

  getReviewQueue: async (status?: string): Promise<ReviewQueueItem[]> => {
    const res = await apiClient.get('/review-queue', { params: { status } });
    return res.data;
  },

  claimReviewItem: async (entityType: string, entityId: string, reviewerEmail: string) => {
    const res = await apiClient.post(`/reviews/${entityId}/claim`, {
      entity_type: entityType,
      entity_id: entityId,
      reviewer_email: reviewerEmail
    });
    return res.data;
  },

  releaseReviewItem: async (entityId: string) => {
    const res = await apiClient.post(`/reviews/${entityId}/release`);
    return res.data;
  },

  getCaseHandoff: async (caseId: string): Promise<HandoffSummaryData> => {
    const res = await apiClient.get(`/cases/${caseId}/handoff`);
    return res.data;
  }
};
