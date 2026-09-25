-- Phase 14 Migration: Command Center Dashboard Aggregations & Camera Coverage Schema

-- 1. Read-only SQL view for Command Center Summary Aggregations
CREATE OR REPLACE VIEW public.command_center_summary AS
SELECT 
    (SELECT COUNT(*) FROM public.missing_persons WHERE status = 'active') AS active_cases_count,
    (SELECT COUNT(*) FROM public.missing_persons WHERE status = 'under_review') AS review_cases_count,
    (SELECT COUNT(*) FROM public.missing_persons WHERE status = 'resolved') AS resolved_cases_count,
    (SELECT COUNT(*) FROM public.missing_persons WHERE status = 'closed') AS closed_cases_count,
    (SELECT COUNT(*) FROM public.search_sessions WHERE status IN ('queued', 'processing', 'uploading')) AS active_searches_count,
    (SELECT COUNT(*) FROM public.search_sessions WHERE status = 'completed') AS completed_searches_count,
    (SELECT COUNT(*) FROM public.search_sessions WHERE status = 'partial') AS partial_searches_count,
    (SELECT COUNT(*) FROM public.search_sessions WHERE status = 'failed') AS failed_searches_count,
    (SELECT COUNT(*) FROM public.candidate_groups WHERE status = 'potential_match') AS pending_reviews_count,
    (SELECT COUNT(*) FROM public.investigation_tasks WHERE status = 'pending') AS open_tasks_count,
    (SELECT COUNT(*) FROM public.candidate_groups) AS candidate_groups_count,
    (SELECT COUNT(*) FROM public.record_matches) AS record_matches_count,
    (SELECT COUNT(*) FROM public.investigation_reports) AS reports_count;

-- 2. Additive Performance Indexes
CREATE INDEX IF NOT EXISTS idx_missing_persons_status_priority ON public.missing_persons(status, priority);
CREATE INDEX IF NOT EXISTS idx_missing_persons_updated_at ON public.missing_persons(updated_at DESC);
