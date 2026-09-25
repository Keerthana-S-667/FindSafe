-- Phase 12 Migration: Investigation Operations Center, Search Processing Events & Review Locks

-- 1. Extend search_sessions table with operational tracking fields
ALTER TABLE public.search_sessions 
    ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'queued',
    ADD COLUMN IF NOT EXISTS stage_progress INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS processed_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_count INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS failed_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Update search_sessions status check constraint for Phase 12 states
ALTER TABLE public.search_sessions DROP CONSTRAINT IF EXISTS search_sessions_status_check;
ALTER TABLE public.search_sessions ADD CONSTRAINT search_sessions_status_check 
    CHECK (status IN ('queued', 'uploading', 'processing', 'completed', 'partial', 'failed', 'cancelled', 'requires_review'));

-- 2. CREATE TABLE: search_processing_events (Pipeline Stage Audit & Timeline)
CREATE TABLE IF NOT EXISTS public.search_processing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_session_id UUID NOT NULL REFERENCES public.search_sessions(id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('queued', 'processing', 'completed', 'partial', 'failed')),
    message TEXT,
    processed_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE TABLE: review_assignments (Reviewer Lock & Review Assignment tracking)
CREATE TABLE IF NOT EXISTS public.review_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    assigned_reviewer TEXT NOT NULL,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_search_events_session_id ON public.search_processing_events(search_session_id);
CREATE INDEX IF NOT EXISTS idx_search_events_created_at ON public.search_processing_events(created_at);
CREATE INDEX IF NOT EXISTS idx_review_assignments_entity ON public.review_assignments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_reviewer ON public.review_assignments(assigned_reviewer);

-- RLS POLICIES
ALTER TABLE public.search_processing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated operations on search_processing_events"
    ON public.search_processing_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write for local dev on search_processing_events"
    ON public.search_processing_events FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated operations on review_assignments"
    ON public.review_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write for local dev on review_assignments"
    ON public.review_assignments FOR ALL TO anon USING (true) WITH CHECK (true);
