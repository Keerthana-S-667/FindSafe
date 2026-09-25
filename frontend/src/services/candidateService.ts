import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { MatchCandidate } from '../types';

export const candidateService = {
  async getPendingCandidates(): Promise<MatchCandidate[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const { data } = await supabase
      .from('candidates')
      .select('*')
      .eq('status', 'UNVERIFIED');
    return data || [];
  }
};
