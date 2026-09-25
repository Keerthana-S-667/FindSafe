import { apiClient } from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  RecordMatch,
  FoundPersonRecord,
  CrossSourceAssociation,
  TimelineEvent,
  CSVImportResult,
} from '../types';

export interface RecordSearchFilter {
  case_id: string;
  source_types?: string[];
  search_radius_km?: number;
  time_window_hours?: number;
}

export interface SearchEverywhereFilter {
  case_id: string;
  video_ids?: string[];
  source_types?: string[];
  search_radius_km?: number;
  time_window_hours?: number;
}

export const recordService = {
  /**
   * Execute institutional record search against Police, Hospital, Shelter, Public Reports
   */
  async executeRecordSearch(params: RecordSearchFilter): Promise<{
    search_session_id: string;
    status: string;
    total_records_searched: number;
    total_matches_found: number;
    matches: RecordMatch[];
  }> {
    const response = await apiClient.post('/record-search', params);
    return response.data;
  },

  /**
   * List record matches with optional filtering
   */
  async getRecordMatches(caseId?: string, matchStatus?: string, sourceType?: string): Promise<RecordMatch[]> {
    try {
      const response = await apiClient.get<{ total: number; matches: RecordMatch[] }>('/record-matches', {
        params: {
          case_id: caseId,
          match_status: matchStatus,
          source_type: sourceType,
        },
      });
      return response.data.matches || [];
    } catch (err) {
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('record_matches').select('*, found_person_records(*)').order('overall_score', { ascending: false });
        if (caseId) query = query.eq('missing_person_id', caseId);
        if (matchStatus) query = query.eq('match_status', matchStatus);
        const { data } = await query;
        return (data || []) as RecordMatch[];
      }
      return [];
    }
  },

  /**
   * Get single record match detail
   */
  async getRecordMatch(matchId: string): Promise<RecordMatch> {
    try {
      const response = await apiClient.get<RecordMatch>(`/record-matches/${matchId}`);
      return response.data;
    } catch (err) {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('record_matches').select('*, found_person_records(*), missing_persons(*)').eq('id', matchId).single();
        if (data) return data as RecordMatch;
      }
      throw err;
    }
  },

  /**
   * Import synthetic demonstration dataset CSV
   */
  async importCSVRecords(file: File): Promise<CSVImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<CSVImportResult>('/records/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Execute Search Everywhere pipeline (Camera Crowd Search + Record Search + Evidence Association)
   */
  async executeSearchEverywhere(params: SearchEverywhereFilter): Promise<{
    search_session_id: string;
    status: string;
    camera_candidate_groups: any[];
    record_matches: RecordMatch[];
    cross_source_associations: CrossSourceAssociation[];
  }> {
    const response = await apiClient.post('/search-everywhere', params);
    return response.data;
  },

  /**
   * Get Search Everywhere session results
   */
  async getSearchEverywhereResults(sessionId: string): Promise<{
    session: any;
    record_matches: RecordMatch[];
    cross_source_associations: CrossSourceAssociation[];
  }> {
    const response = await apiClient.get(`/search-everywhere/${sessionId}`);
    return response.data;
  },

  /**
   * Get unified chronological investigation timeline
   */
  async getInvestigationTimeline(sessionId: string): Promise<{
    session_id: string;
    case: any;
    total_events: number;
    timeline: TimelineEvent[];
  }> {
    const response = await apiClient.get(`/investigations/${sessionId}/timeline`);
    return response.data;
  },

  /**
   * Get investigation map marker data
   */
  async getInvestigationMap(sessionId: string): Promise<{
    session_id: string;
    markers: any[];
    path_sequence: any[];
    case: any;
  }> {
    const response = await apiClient.get(`/investigations/${sessionId}/map`);
    return response.data;
  },

  /**
   * Review a record match (potential_match, rejected, under_review)
   */
  async reviewRecordMatch(matchId: string, status: string, note?: string): Promise<RecordMatch> {
    const response = await apiClient.post(`/record-matches/${matchId}/review`, { status, note });
    return response.data.updated_match;
  },

  /**
   * Review a cross-source association
   */
  async reviewCrossSourceAssociation(assocId: string, status: string, note?: string): Promise<CrossSourceAssociation> {
    const response = await apiClient.post(`/cross-source-associations/${assocId}/review`, { status, note });
    return response.data.updated_association;
  },
};
