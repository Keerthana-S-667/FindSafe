-- FindSafe AI - Phase 8 Database Schema & Storage Setup
-- Final Investigation Workspace, Outcome Management & PDF Report Generation

-- 1. Extend missing_persons table with investigation outcome fields
ALTER TABLE public.missing_persons
    ADD COLUMN IF NOT EXISTS investigation_outcome TEXT DEFAULT 'open' CHECK (investigation_outcome IN ('open', 'under_review', 'potential_match_identified', 'verified_by_reviewer', 'no_match_identified', 'closed')),
    ADD COLUMN IF NOT EXISTS outcome_notes TEXT,
    ADD COLUMN IF NOT EXISTS outcome_updated_at TIMESTAMPTZ;

-- 2. TABLE: investigation_reports
CREATE TABLE IF NOT EXISTS public.investigation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.missing_persons(id) ON DELETE CASCADE,
    report_id TEXT UNIQUE NOT NULL,
    report_version INT DEFAULT 1,
    storage_path TEXT,
    status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
    generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT
);

-- Trigger for investigation_reports updated_at
DROP TRIGGER IF EXISTS set_investigation_reports_updated_at ON public.investigation_reports;
CREATE TRIGGER set_investigation_reports_updated_at
    BEFORE UPDATE ON public.investigation_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_investigation_reports_case_id ON public.investigation_reports(case_id);
CREATE INDEX IF NOT EXISTS idx_investigation_reports_report_id ON public.investigation_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_investigation_reports_status ON public.investigation_reports(status);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.investigation_reports ENABLE ROW LEVEL SECURITY;

-- POLICIES (Authenticated user access)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'investigation_reports' AND policyname = 'Authenticated users can view investigation reports') THEN
        CREATE POLICY "Authenticated users can view investigation reports" ON public.investigation_reports FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'investigation_reports' AND policyname = 'Authenticated users can insert investigation reports') THEN
        CREATE POLICY "Authenticated users can insert investigation reports" ON public.investigation_reports FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'investigation_reports' AND policyname = 'Authenticated users can update investigation reports') THEN
        CREATE POLICY "Authenticated users can update investigation reports" ON public.investigation_reports FOR UPDATE TO authenticated USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 3. STORAGE BUCKET: reports (Private Bucket)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
    ('reports', 'reports', false, false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for reports
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated user storage select reports') THEN
        CREATE POLICY "Authenticated user storage select reports" ON storage.objects
        FOR SELECT TO authenticated USING (bucket_id = 'reports');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated user storage insert reports') THEN
        CREATE POLICY "Authenticated user storage insert reports" ON storage.objects
        FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reports');
    END IF;
END $$;
