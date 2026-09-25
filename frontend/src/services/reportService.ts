import { apiClient } from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { MissingPersonCase, CandidateGroup, RecordMatch, CrossSourceAssociation, TimelineEvent } from '../types';

export interface InvestigationReportItem {
  id: string;
  case_id: string;
  report_id: string;
  report_version: number;
  storage_path?: string;
  status: 'generating' | 'completed' | 'failed';
  generated_by?: string;
  generated_at: string;
  updated_at?: string;
  error_message?: string;
}

export interface WorkspacePayload {
  case: MissingPersonCase;
  summary: {
    search_sessions_count: number;
    candidate_groups_count: number;
    record_matches_count: number;
    cross_source_count: number;
    reports_count: number;
    pending_reviews_count: number;
  };
  sessions: any[];
  candidate_groups: CandidateGroup[];
  record_matches: RecordMatch[];
  cross_source_associations: CrossSourceAssociation[];
  timeline: TimelineEvent[];
  map_markers: any[];
  map_path_sequence: any[];
  reports: InvestigationReportItem[];
  audit_logs: any[];
}

export const reportService = {
  /**
   * Fetch full aggregated payload for the Final Investigation Workspace
   */
  async getInvestigationWorkspace(caseId: string): Promise<WorkspacePayload> {
    const response = await apiClient.get<WorkspacePayload>(`/cases/${caseId}/investigation-workspace`);
    return response.data;
  },

  /**
   * Trigger PDF investigation report generation
   */
  async generateReport(caseId: string): Promise<InvestigationReportItem> {
    const response = await apiClient.post<InvestigationReportItem>(`/cases/${caseId}/reports`);
    return response.data;
  },

  /**
   * Fetch all reports across all cases or for a specific case
   */
  async getAllReports(caseId?: string): Promise<InvestigationReportItem[]> {
    try {
      const response = await apiClient.get<{ total: number; reports: InvestigationReportItem[] }>('/reports', {
        params: { case_id: caseId && caseId !== 'ALL' ? caseId : undefined },
        timeout: 8000,
      });
      return response.data.reports || [];
    } catch (err) {
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('investigation_reports').select('*, missing_persons(*)').order('generated_at', { ascending: false });
        if (caseId && caseId !== 'ALL') {
          query = query.eq('case_id', caseId);
        }
        const { data } = await query;
        return (data || []) as InvestigationReportItem[];
      }
      return [];
    }
  },

  /**
   * Fetch report history for a case
   */
  async getCaseReports(caseId: string): Promise<InvestigationReportItem[]> {
    return this.getAllReports(caseId);
  },

  /**
   * Download PDF report binary file
   */
  async downloadReport(reportId: string): Promise<Blob> {
    const response = await apiClient.get(`/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Update case investigation outcome status
   */
  async updateInvestigationOutcome(
    caseId: string,
    outcome: 'open' | 'under_review' | 'potential_match_identified' | 'verified_by_reviewer' | 'no_match_identified' | 'closed',
    notes?: string
  ): Promise<MissingPersonCase> {
    const response = await apiClient.post(`/cases/${caseId}/outcome`, {
      investigation_outcome: outcome,
      outcome_notes: notes,
    });
    return response.data.case;
  },
};
