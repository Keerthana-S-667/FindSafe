import { apiClient } from './api';

export interface SummaryStrip {
  active_cases: number;
  active_searches: number;
  pending_reviews: number;
  open_tasks: number;
  partial_searches: number;
  reports_count: number;
  system_status: string;
}

export interface CommandCenterSummaryData {
  summary_metrics?: {
    active_cases: number;
    active_searches: number;
    pending_reviews: number;
    open_tasks: number;
    partial_searches: number;
    reports_count: number;
    system_status: string;
  };
  summary_strip?: SummaryStrip;
  case_status_distribution?: { [key: string]: number };
  case_priority_distribution?: { [key: string]: number };
  search_status_distribution?: { [key: string]: number };
  evidence_overview?: {
    camera_evidence: number;
    record_evidence: number;
    cross_source_associations: number;
    candidate_groups: number;
    reports: number;
  };
  source_distribution?: { [key: string]: number };
  case_spotlight?: any;
  cases?: any[];
  review_queue?: any[];
  investigator_workload?: any[];
  task_stats?: {
    open: number;
    completed: number;
    overdue: number;
  };
  recent_activity?: any[];
}

export type CommandCenterSummary = CommandCenterSummaryData;

export interface CameraCoverageItem {
  id: string;
  camera_name?: string;
  location_name?: string;
  name?: string;
  location?: string;
  lat: number;
  lng: number;
  status_label?: string;
  status?: string;
  last_used?: string;
  total_searches?: number;
  searches_count?: number;
}

export const commandCenterService = {
  getSummary: async (): Promise<CommandCenterSummaryData> => {
    const res = await apiClient.get('/command-center/summary');
    const data = res.data;
    // Map backend JSON fields to frontend convenient structure if needed
    return {
      summary_metrics: data.summary_strip || {
        active_cases: data.summary_strip?.active_cases ?? 0,
        active_searches: data.summary_strip?.active_searches ?? 0,
        pending_reviews: data.summary_strip?.pending_reviews ?? 0,
        open_tasks: data.summary_strip?.open_tasks ?? 0,
        partial_searches: data.summary_strip?.partial_searches ?? 0,
        reports_count: data.summary_strip?.reports_count ?? 0,
        system_status: data.summary_strip?.system_status || 'Operational'
      },
      summary_strip: data.summary_strip,
      case_status_distribution: data.case_status_distribution || {},
      case_priority_distribution: data.case_priority_distribution || {},
      search_status_distribution: data.search_status_distribution || {},
      evidence_overview: {
        camera_evidence: data.evidence_overview?.candidate_groups ?? 0,
        record_evidence: data.evidence_overview?.record_matches ?? 0,
        cross_source_associations: data.evidence_overview?.cross_source_associations ?? 0,
        candidate_groups: data.evidence_overview?.candidate_groups ?? 0,
        reports: data.evidence_overview?.reports_generated ?? 0,
      },
      source_distribution: data.evidence_sources || {},
      case_spotlight: data.spotlight_case || null,
      cases: data.cases || [],
      review_queue: data.review_queue || [],
      investigator_workload: data.investigator_workload || [
        { investigator: 'Lead Investigator', role: 'SUPERVISOR', assigned_cases: data.summary_strip?.active_cases || 1, pending_reviews: data.summary_strip?.pending_reviews || 0, open_tasks: data.summary_strip?.open_tasks || 0 }
      ],
      task_stats: data.task_stats || { open: data.summary_strip?.open_tasks || 0, completed: 0, overdue: 0 },
      recent_activity: data.activity_feed || []
    };
  },

  getCameras: async (): Promise<CameraCoverageItem[]> => {
    const res = await apiClient.get('/command-center/cameras');
    return (res.data || []).map((c: any) => ({
      id: c.id,
      name: c.camera_name || c.name || 'Camera Feed',
      location: c.location_name || c.location || 'Location Ground',
      lat: c.lat || 12.9716,
      lng: c.lng || 77.5946,
      status: c.status_label || c.status || 'Available',
      searches_count: c.total_searches ?? c.searches_count ?? 1,
      last_used: c.last_used || new Date().toISOString()
    }));
  }
};

