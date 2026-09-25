import { apiClient } from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { MissingPersonCase } from '../types';

export interface CaseListParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CaseListResponse {
  items: MissingPersonCase[];
  total: number;
  page: number;
  page_size: number;
}

export interface DashboardStats {
  active_cases: number;
  potential_matches: number;
  search_sessions: number;
  pending_reviews: number;
}

export const caseService = {
  /**
   * Creates a new missing person case.
   * Directly uses Supabase when configured for instant sub-second submission, with automatic API fallback.
   */
  async createCase(formData: FormData): Promise<MissingPersonCase> {
    const refName = (formData.get('reference_name') as string)?.trim() || 'Reference Subject';
    const lastLoc = (formData.get('last_seen_location') as string)?.trim() || 'Unknown Location';
    const ageRange = (formData.get('age_range') as string) || null;
    const upperCloth = (formData.get('upper_clothing') as string) || null;
    const lowerCloth = (formData.get('lower_clothing') as string) || null;
    const bag = (formData.get('bag') as string) || null;
    const accessories = (formData.get('accessories') as string) || null;
    const lat = formData.get('last_seen_lat') ? parseFloat(formData.get('last_seen_lat') as string) : null;
    const lng = formData.get('last_seen_lng') ? parseFloat(formData.get('last_seen_lng') as string) : null;
    const lastSeenTs = (formData.get('last_seen_timestamp') as string) || null;
    const searchRadius = formData.get('search_radius_km') ? parseFloat(formData.get('search_radius_km') as string) : 5.0;
    const notes = (formData.get('notes') as string) || null;
    const file = formData.get('file') as File | null;

    if (isSupabaseConfigured && supabase) {
      try {
        let imagePath: string | null = null;
        let imageUrl: string | null = null;

        if (file) {
          const timestamp = Date.now();
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          imagePath = `operator/draft/ref_${timestamp}_${safeName}`;
          try {
            await supabase.storage.from('missing-person-photos').upload(imagePath, file, { upsert: true });
            const { data: signedData } = await supabase.storage.from('missing-person-photos').createSignedUrl(imagePath, 7200);
            imageUrl = signedData?.signedUrl || null;
          } catch (storageErr) {
            console.warn('Storage upload notice:', storageErr);
          }
        }

        const caseNum = `MP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const payload = {
          case_id: caseNum,
          reference_name: refName,
          age_range: ageRange,
          upper_clothing: upperCloth,
          lower_clothing: lowerCloth,
          bag: bag,
          accessories: accessories,
          last_seen_location: lastLoc,
          last_seen_lat: lat,
          last_seen_lng: lng,
          last_seen_timestamp: lastSeenTs,
          search_radius_km: searchRadius,
          notes: notes,
          reference_image_path: imagePath,
          reference_image_url: imageUrl,
          status: 'active'
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('missing_persons')
          .insert(payload)
          .select()
          .single();

        if (!insertErr && inserted) {
          return inserted as MissingPersonCase;
        }
      } catch (directErr) {
        console.warn('Direct Supabase creation error, attempting API route fallback:', directErr);
      }
    }

    // Fallback to FastAPI backend route
    const response = await apiClient.post<MissingPersonCase>('/missing-persons', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 10000,
    });
    return response.data;
  },

  async getCases(params?: CaseListParams): Promise<CaseListResponse> {
    try {
      const queryParams: Record<string, string | number> = {};
      if (params?.search) queryParams.search = params.search;
      if (params?.status && params.status !== 'ALL') queryParams.status = params.status;
      if (params?.page) queryParams.page = params.page;
      if (params?.pageSize) queryParams.page_size = params.pageSize;

      const response = await apiClient.get<CaseListResponse>('/missing-persons', {
        params: queryParams,
        timeout: 8000,
      });
      return response.data;
    } catch (err) {
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from('missing_persons').select('*', { count: 'exact' });
        if (params?.status && params.status !== 'ALL') {
          query = query.eq('status', params.status);
        }
        if (params?.search) {
          query = query.or(`reference_name.ilike.%${params.search}%,case_id.ilike.%${params.search}%,last_seen_location.ilike.%${params.search}%`);
        }
        const page = params?.page || 1;
        const pageSize = params?.pageSize || 20;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        const { data, count } = await query.order('created_at', { ascending: false }).range(from, to);
        return {
          items: (data || []) as MissingPersonCase[],
          total: count || (data?.length || 0),
          page,
          page_size: pageSize
        };
      }
      return { items: [], total: 0, page: 1, page_size: 20 };
    }
  },

  async getActiveCases(): Promise<MissingPersonCase[]> {
    const res = await this.getCases({ status: 'active', pageSize: 100 });
    return res.items;
  },

  async getCaseById(id: string): Promise<MissingPersonCase | null> {
    try {
      const response = await apiClient.get<MissingPersonCase>(`/missing-persons/${id}`, { timeout: 8000 });
      return response.data;
    } catch (error) {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase
          .from('missing_persons')
          .select('*')
          .or(`id.eq.${id},case_id.eq.${id}`)
          .maybeSingle();
        return (data as MissingPersonCase) || null;
      }
      return null;
    }
  },

  async updateCase(id: string, updateData: Partial<MissingPersonCase>): Promise<MissingPersonCase> {
    try {
      const response = await apiClient.patch<MissingPersonCase>(`/missing-persons/${id}`, updateData, { timeout: 8000 });
      return response.data;
    } catch (err) {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('missing_persons')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as MissingPersonCase;
      }
      throw err;
    }
  },

  async archiveCase(id: string): Promise<MissingPersonCase> {
    return this.updateCase(id, { status: 'archived' });
  },

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>('/dashboard/stats', { timeout: 8000 });
      return response.data;
    } catch (err) {
      if (isSupabaseConfigured && supabase) {
        const { count: activeCount } = await supabase.from('missing_persons').select('*', { count: 'exact', head: true }).eq('status', 'active');
        const { count: sessionCount } = await supabase.from('search_sessions').select('*', { count: 'exact', head: true });
        const { count: candidateCount } = await supabase.from('candidate_groups').select('*', { count: 'exact', head: true });
        return {
          active_cases: activeCount || 0,
          potential_matches: candidateCount || 0,
          search_sessions: sessionCount || 0,
          pending_reviews: candidateCount || 0
        };
      }
      return { active_cases: 0, potential_matches: 0, search_sessions: 0, pending_reviews: 0 };
    }
  }
};
