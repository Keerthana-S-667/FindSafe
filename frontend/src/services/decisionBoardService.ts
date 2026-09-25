import { apiClient } from './api';

export interface DecisionBoardHeader {
  case_id: string;
  candidate_id: string;
  reference_name: string;
  case_status: string;
  priority: string;
  review_status: string;
  assigned_investigator: string;
  assigned_reviewer: string;
  disclaimer: string;
}

export interface SummaryMetrics {
  evidence_score: number;
  evidence_score_display: string;
  camera_sources_count: number;
  record_associations_count: number;
  cross_source_associations_count: number;
  supporting_evidence_count: number;
  limitations_count: number;
  review_status: string;
}

export interface EvidenceBreakdownItem {
  dimension: string;
  score: number;
  contribution: number;
  status: string;
}

export interface SupportingEvidenceItem {
  id: string;
  category: string;
  source: string;
  timestamp: string;
  location: string;
  explanation: string;
}

export interface LimitationItem {
  id: string;
  category: string;
  source: string;
  explanation: string;
}

export interface AttributeMatrixRow {
  attribute: string;
  reference: string;
  cam_01: string;
  cam_02: string;
  cam_04: string;
  record: string;
}

export interface CrossCameraSeqItem {
  camera: string;
  time: string;
  location: string;
  upper: string;
  lower: string;
  status: string;
}

export interface CrossSourceAssocItem {
  id: string;
  source_a: string;
  source_b: string;
  time_difference: string;
  distance: string;
  consistency: string;
  status: string;
}

export interface DecisionBoardPayload {
  header: DecisionBoardHeader;
  summary_metrics: SummaryMetrics;
  evidence_breakdown: EvidenceBreakdownItem[];
  supporting_evidence: SupportingEvidenceItem[];
  limitations: LimitationItem[];
  attribute_matrix: AttributeMatrixRow[];
  cross_camera_sequence: CrossCameraSeqItem[];
  cross_source_associations: CrossSourceAssocItem[];
  timeline: any[];
  map_locations: any[];
  human_review: {
    reviewer: string;
    review_status: string;
    decision: string;
    last_updated: string;
    notes: string;
    allowed_actions: string[];
  };
  what_we_know: string[];
  what_remains_uncertain: string[];
  what_needs_review: string[];
}

export const decisionBoardService = {
  getCandidateDecisionBoard: async (candidateId: string): Promise<DecisionBoardPayload> => {
    const res = await apiClient.get(`/candidates/${candidateId}/decision-board`);
    return res.data;
  },

  getCaseDecisionBoard: async (caseId: string): Promise<DecisionBoardPayload> => {
    const res = await apiClient.get(`/cases/${caseId}/decision-board`);
    return res.data;
  },

  updateReviewDecision: async (candidateId: string, review_status: string, notes: string): Promise<any> => {
    const res = await apiClient.post(`/candidates/${candidateId}/review`, { review_status, notes });
    return res.data;
  }
};
