-- Phase 11 Migration: Advanced Investigation Intelligence Layer & Follow-up Tasks

-- 0. Ensure 'cases' view exists mapping to 'missing_persons' for full compatibility
CREATE OR REPLACE VIEW public.cases AS SELECT * FROM public.missing_persons;

-- 1. Create investigation_tasks table referencing public.missing_persons(id)
CREATE TABLE IF NOT EXISTS public.investigation_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.missing_persons(id) ON DELETE CASCADE,
    candidate_group_id UUID REFERENCES public.candidate_groups(id) ON DELETE SET NULL,
    record_match_id UUID REFERENCES public.record_matches(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_investigation_tasks_case_id ON public.investigation_tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_investigation_tasks_candidate_group_id ON public.investigation_tasks(candidate_group_id);
CREATE INDEX IF NOT EXISTS idx_investigation_tasks_status ON public.investigation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_investigation_tasks_assigned_to ON public.investigation_tasks(assigned_to);

-- Enable RLS
ALTER TABLE public.investigation_tasks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform operations
CREATE POLICY "Allow all operations for authenticated users on investigation_tasks"
    ON public.investigation_tasks
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Also allow anon for local development without full auth lockouts if needed
CREATE POLICY "Allow anon read/write for local dev on investigation_tasks"
    ON public.investigation_tasks
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);
