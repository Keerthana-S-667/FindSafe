import { apiClient } from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SearchSession, VideoFrame, CandidateGroup } from '../types';

export const searchService = {
  /**
   * Upload multiple CCTV camera videos and create multi-video search session via FastAPI backend
   */
  async createMultiVideoSearch(
    formData: FormData,
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
  ): Promise<SearchSession> {
    const response = await apiClient.post<SearchSession>('/multi-video-search', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          onUploadProgress({ loaded: progressEvent.loaded, total: progressEvent.total });
        }
      },
    });
    return response.data;
  },

  /**
   * Upload single video and create search session via FastAPI backend
   */
  async createVideoSearch(
    formData: FormData,
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
  ): Promise<SearchSession> {
    const response = await apiClient.post<SearchSession>('/video-search', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          onUploadProgress({ loaded: progressEvent.loaded, total: progressEvent.total });
        }
      },
    });
    return response.data;
  },

  /**
   * Fetch all generated candidate groups across sessions with optional case filter
   */
  async getAllCandidateGroups(caseId?: string): Promise<CandidateGroup[]> {
    try {
      const response = await apiClient.get<CandidateGroup[]>('/candidate-groups', {
        params: { case_id: caseId && caseId !== 'ALL' ? caseId : undefined },
        timeout: 8000,
      });
      return response.data || [];
    } catch (err) {
      if (isSupabaseConfigured && supabase) {
        let query = supabase
          .from('candidate_groups')
          .select('*, candidate_group_tracks(*, person_tracks(*))')
          .order('overall_score', { ascending: false });
        if (caseId && caseId !== 'ALL') {
          query = query.eq('case_id', caseId);
        }
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const formatCropUrl = (path: string | null | undefined) => {
          if (!path) return null;
          if (path.startsWith('http')) return path;
          if (supabaseUrl) return `${supabaseUrl}/storage/v1/object/public/evidence-frames/${path}`;
          return path;
        };

        const { data } = await query;
        return (data || []).map((g: any) => ({
          ...g,
          sightings: (g.candidate_group_tracks || []).map((t: any, idx: number) => ({
            sequence_order: t.sequence_order || idx + 1,
            camera_name: t.person_tracks?.camera_name || 'CCTV Camera',
            first_seen_seconds: t.person_tracks?.first_seen_seconds || 0,
            last_seen_seconds: t.person_tracks?.last_seen_seconds || 0,
            frame_count: t.person_tracks?.frame_count || 1,
            visual_similarity: t.visual_similarity || 0,
            transition_time_seconds: t.transition_time_seconds || 0,
            transition_distance_meters: t.transition_distance_meters || 0,
            transition_score: t.transition_score || 0,
            signed_crop_url: formatCropUrl(t.person_tracks?.best_crop_path),
          })),
        })) as CandidateGroup[];
      }
      return [];
    }
  },

  /**
   * Fetch generated multi-camera candidate groups for a search session
   */
  async getCandidateGroups(sessionId: string): Promise<CandidateGroup[]> {
    try {
      const response = await apiClient.get<CandidateGroup[]>(`/search-sessions/${sessionId}/candidate-groups`, { timeout: 8000 });
      return response.data || [];
    } catch (err) {
      if (isSupabaseConfigured && supabase) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const formatCropUrl = (path: string | null | undefined) => {
          if (!path) return null;
          if (path.startsWith('http')) return path;
          if (supabaseUrl) return `${supabaseUrl}/storage/v1/object/public/evidence-frames/${path}`;
          return path;
        };

        const { data } = await supabase
          .from('candidate_groups')
          .select('*, candidate_group_tracks(*, person_tracks(*))')
          .eq('search_session_id', sessionId)
          .order('overall_score', { ascending: false });
        return (data || []).map((g: any) => ({
          ...g,
          sightings: (g.candidate_group_tracks || []).map((t: any, idx: number) => ({
            sequence_order: t.sequence_order || idx + 1,
            camera_name: t.person_tracks?.camera_name || 'CCTV Camera',
            first_seen_seconds: t.person_tracks?.first_seen_seconds || 0,
            last_seen_seconds: t.person_tracks?.last_seen_seconds || 0,
            frame_count: t.person_tracks?.frame_count || 1,
            visual_similarity: t.visual_similarity || 0,
            transition_time_seconds: t.transition_time_seconds || 0,
            transition_distance_meters: t.transition_distance_meters || 0,
            transition_score: t.transition_score || 0,
            signed_crop_url: formatCropUrl(t.person_tracks?.best_crop_path),
          })),
        })) as CandidateGroup[];
      }
      return [];
    }
  },


  /**
   * Fetch single search session status and details
   */
  async getSearchSession(sessionId: string): Promise<SearchSession> {
    try {
      const response = await apiClient.get<SearchSession>(`/search-sessions/${sessionId}`);
      return response.data;
    } catch (err) {
      // Fallback directly to Supabase if API endpoint fails
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('search_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
        if (data && !error) return data as SearchSession;
      }
      throw err;
    }
  },

  /**
   * Fetch search sessions list for a case or recent history
   */
  async getSearchSessions(caseId?: string): Promise<SearchSession[]> {
    try {
      const response = await apiClient.get<SearchSession[]>('/search-sessions', {
        params: { case_id: caseId },
      });
      return response.data;
    } catch (err) {
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('search_sessions').select('*').order('created_at', { ascending: false });
        if (caseId) query = query.eq('case_id', caseId);
        const { data } = await query;
        return (data || []) as SearchSession[];
      }
      return [];
    }
  },

  /**
   * Cancel in-progress processing
   */
  async cancelSearchSession(sessionId: string): Promise<SearchSession> {
    const response = await apiClient.post<SearchSession>(`/search-sessions/${sessionId}/cancel`);
    return response.data;
  },

  /**
   * Fetch extracted frames for a search session
   */
  async getSessionFrames(sessionId: string, limit = 100, offset = 0): Promise<VideoFrame[]> {
    try {
      const response = await apiClient.get<VideoFrame[]>(`/search-sessions/${sessionId}/frames`, {
        params: { limit, offset },
      });
      return response.data;
    } catch (err) {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase
          .from('video_frames')
          .select('*')
          .eq('search_session_id', sessionId)
          .order('frame_index', { ascending: true })
          .range(offset, offset + limit - 1);
        return (data || []) as VideoFrame[];
      }
      return [];
    }
  },

  /**
   * Legacy method for backward compatibility
   */
  async getRecentSessions(): Promise<SearchSession[]> {
    return this.getSearchSessions();
  }
};
