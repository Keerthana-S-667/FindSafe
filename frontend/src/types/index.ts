export type CaseStatus = 
  | 'ACTIVE' | 'RESOLVED' | 'PENDING_REVIEW' | 'CLOSED' | 'ARCHIVED'
  | 'active' | 'under_review' | 'resolved' | 'closed' | 'archived';

export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL' | 'critical' | 'high' | 'medium' | 'low';
export type CandidateStatus = 'UNVERIFIED' | 'CONFIRMED' | 'REJECTED' | 'UNDER_REVIEW' | 'under_review' | 'potential_match' | 'verified';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  badge_number?: string;
  agency?: string;
  role: 'OPERATOR' | 'INVESTIGATOR' | 'ADMIN' | 'operator' | 'reviewer' | 'admin' | 'viewer';
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
}

export interface MissingPersonCase {
  id: string;
  case_id?: string;
  case_number?: string;
  reference_name?: string;
  full_name?: string;
  age?: number;
  age_range?: string;
  gender?: string;
  upper_clothing?: string;
  lower_clothing?: string;
  bag?: string;
  accessories?: string;
  last_seen_date?: string;
  last_seen_location: string;
  last_seen_lat?: number;
  last_seen_lng?: number;
  last_seen_timestamp?: string;
  search_radius_km?: number;
  notes?: string;
  reference_image_path?: string;
  reference_image_url?: string;
  status: CaseStatus;
  investigation_outcome?: 'open' | 'under_review' | 'potential_match_identified' | 'verified_by_reviewer' | 'no_match_identified' | 'closed' | string;
  outcome_notes?: string;
  outcome_updated_at?: string;
  priority?: PriorityLevel;
  assigned_to?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FoundPersonRecord {
  id: string;
  record_id: string;
  source_type: 'police' | 'hospital' | 'shelter' | 'public_report';
  reference_name?: string;
  reference_image_path?: string;
  reference_image_url?: string;
  age_range?: string;
  upper_clothing?: string;
  lower_clothing?: string;
  bag?: string;
  accessories?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  record_timestamp?: string;
  notes?: string;
  status?: string;
  created_at?: string;
}

export interface MatchCandidate {
  id: string;
  search_session_id?: string;
  case_id?: string;
  case_number?: string;
  found_record_id?: string;
  track_id?: string;
  evidence_image_path?: string;
  evidence_image_url?: string;
  visual_similarity?: number;
  clothing_score?: number;
  accessory_score?: number;
  location_score?: number;
  time_score?: number;
  overall_score?: number;
  match_score?: number;
  status?: CandidateStatus;
  verification_status?: CandidateStatus;
  detected_at?: string;
  location?: string;
  thumbnail_url?: string;
}

export type SearchSessionStatus = 
  | 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled'
  | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type ProcessingStage = 
  | 'uploading' | 'reading_video' | 'extracting_metadata' 
  | 'sampling_frames' | 'storing_frames' | 'finalizing' 
  | 'completed' | 'failed' | 'pending';

export interface SearchSessionVideo {
  id: string;
  search_session_id: string;
  camera_id?: string;
  camera_name: string;
  video_filename: string;
  video_path: string;
  video_size_bytes?: number;
  video_duration_seconds?: number;
  video_fps?: number;
  video_width?: number;
  video_height?: number;
  total_frames?: number;
  sampled_frames?: number;
  latitude?: number;
  longitude?: number;
  processing_status: string;
  processing_stage: string;
  processing_progress: number;
  signed_video_url?: string;
  created_at: string;
}

export interface SearchSession {
  id: string;
  case_id: string;
  search_type?: 'crowd' | 'records' | 'everywhere' | 'CROWD' | 'RECORDS' | 'EVERYWHERE';
  status: SearchSessionStatus;
  processing_stage?: ProcessingStage;
  processing_progress?: number;
  video_filename?: string;
  video_path?: string;
  video_size_bytes?: number;
  video_duration_seconds?: number;
  video_fps?: number;
  video_width?: number;
  video_height?: number;
  total_frames?: number;
  sampled_frames?: number;
  camera_name?: string;
  location_name?: string;
  error_message?: string;
  signed_video_url?: string;
  videos?: SearchSessionVideo[];
  created_by?: string;
  initiated_by?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}


export interface VideoFrame {
  id: string;
  search_session_id: string;
  frame_index: number;
  timestamp_seconds: number;
  frame_path: string;
  signed_frame_url?: string;
  width?: number;
  height?: number;
  created_at: string;
}

export interface CameraFeed {
  id: string;
  camera_name: string;
  description?: string;
  video_file: File | null;
  video_preview_url?: string | null;
  location_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  recording_start_time?: string;
  recording_end_time?: string;
}

export interface CandidateTrackSighting {
  sequence_order: number;
  camera_name: string;
  first_seen_seconds: number;
  last_seen_seconds: number;
  frame_count: number;
  latitude?: number;
  longitude?: number;
  visual_similarity: number;
  transition_time_seconds: number;
  transition_distance_meters: number;
  transition_score: number;
  signed_crop_url?: string;
}

export interface CandidateGroup {
  id: string;
  search_session_id: string;
  case_id?: string;
  overall_score: number;
  visual_score?: number;
  attribute_score?: number;
  time_score?: number;
  location_score?: number;
  cross_camera_score?: number;
  evidence_level: 'high' | 'moderate' | 'low';
  status: 'under_review' | 'potential_match' | 'rejected' | 'verified';
  camera_count: number;
  sightings: CandidateTrackSighting[];
  explanation?: Record<string, any>;
  disclaimer?: string;
  created_at: string;
}




export interface InvestigationReport {
  id: string;
  title: string;
  case_id?: string;
  created_at: string;
  generated_by?: string;
}

export interface RecordMatch {
  id: string;
  search_session_id?: string;
  missing_person_id?: string;
  record_id: string;
  visual_similarity: number;
  attribute_score: number;
  location_score: number;
  time_score: number;
  age_score: number;
  overall_score: number;
  match_status: 'under_review' | 'potential_match' | 'rejected' | 'verified';
  evidence_details?: {
    has_record_image: boolean;
    visual_similarity: number;
    attribute_score: number;
    location_score: number;
    time_score: number;
    age_score: number;
    distance_meters: number;
    time_diff_hours: number;
    attribute_breakdown: Array<{
      attribute_type: string;
      reference_value: string;
      candidate_value: string;
      match_status: string;
      score: number;
    }>;
  };
  found_person_records?: FoundPersonRecord;
  missing_persons?: MissingPersonCase;
  created_at: string;
  updated_at?: string;
}

export interface CrossSourceAssociation {
  id: string;
  search_session_id?: string;
  candidate_group_id?: string;
  record_match_id?: string;
  visual_consistency: number;
  attribute_consistency: number;
  time_consistency: number;
  location_consistency: number;
  overall_score: number;
  status: 'under_review' | 'potentially_related' | 'rejected' | 'verified';
  evidence_summary?: {
    group_label?: string;
    record_source?: string;
    record_id?: string;
    description?: string;
  };
  candidate_group?: CandidateGroup;
  record_match?: RecordMatch;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  event_type: 'last_known_sighting' | 'camera_sighting' | 'record_match';
  source: string;
  source_label: string;
  timestamp: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  description: string;
  evidence_score: number;
  match_status?: string;
  verification_status?: string;
  badge_color?: string;
  icon_type?: string;
}

export interface CSVImportResult {
  total_found: number;
  valid_count: number;
  invalid_count: number;
  inserted_count: number;
  invalid_rows: Array<{ row: number; data: any; errors: string[] }>;
}

export interface HealthResponse {
  status: string;
  service: string;
  supabase?: {
    configured: boolean;
    status: string;
    message: string;
  };
}
