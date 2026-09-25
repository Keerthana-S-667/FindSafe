-- FindSafe AI - Phase 7 Database Schema & Storage Setup
-- Missing-Person Information Matching & Search Everywhere

-- 1. Extend found_person_records table if columns missing
ALTER TABLE public.found_person_records 
    ADD COLUMN IF NOT EXISTS reference_name TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Trigger for found_person_records updated_at
DROP TRIGGER IF EXISTS set_found_person_records_updated_at ON public.found_person_records;
CREATE TRIGGER set_found_person_records_updated_at
    BEFORE UPDATE ON public.found_person_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. TABLE: record_matches
CREATE TABLE IF NOT EXISTS public.record_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_session_id UUID REFERENCES public.search_sessions(id) ON DELETE CASCADE,
    missing_person_id UUID REFERENCES public.missing_persons(id) ON DELETE CASCADE,
    record_id UUID REFERENCES public.found_person_records(id) ON DELETE CASCADE,
    visual_similarity DOUBLE PRECISION DEFAULT 0.0,
    attribute_score DOUBLE PRECISION DEFAULT 0.0,
    location_score DOUBLE PRECISION DEFAULT 0.0,
    time_score DOUBLE PRECISION DEFAULT 0.0,
    age_score DOUBLE PRECISION DEFAULT 0.0,
    overall_score DOUBLE PRECISION DEFAULT 0.0,
    match_status TEXT DEFAULT 'under_review' CHECK (match_status IN ('under_review', 'potential_match', 'rejected', 'verified')),
    evidence_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for record_matches updated_at
DROP TRIGGER IF EXISTS set_record_matches_updated_at ON public.record_matches;
CREATE TRIGGER set_record_matches_updated_at
    BEFORE UPDATE ON public.record_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. TABLE: record_embeddings
CREATE TABLE IF NOT EXISTS public.record_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID UNIQUE REFERENCES public.found_person_records(id) ON DELETE CASCADE,
    embedding JSONB NOT NULL,
    model_name TEXT DEFAULT 'osnet_ain_x1_0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for record_embeddings updated_at
DROP TRIGGER IF EXISTS set_record_embeddings_updated_at ON public.record_embeddings;
CREATE TRIGGER set_record_embeddings_updated_at
    BEFORE UPDATE ON public.record_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. TABLE: cross_source_associations
CREATE TABLE IF NOT EXISTS public.cross_source_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_session_id UUID REFERENCES public.search_sessions(id) ON DELETE CASCADE,
    candidate_group_id UUID REFERENCES public.candidate_groups(id) ON DELETE CASCADE,
    record_match_id UUID REFERENCES public.record_matches(id) ON DELETE CASCADE,
    visual_consistency DOUBLE PRECISION DEFAULT 0.0,
    attribute_consistency DOUBLE PRECISION DEFAULT 0.0,
    time_consistency DOUBLE PRECISION DEFAULT 0.0,
    location_consistency DOUBLE PRECISION DEFAULT 0.0,
    overall_score DOUBLE PRECISION DEFAULT 0.0,
    status TEXT DEFAULT 'under_review' CHECK (status IN ('under_review', 'potentially_related', 'rejected', 'verified')),
    evidence_summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for cross_source_associations updated_at
DROP TRIGGER IF EXISTS set_cross_source_associations_updated_at ON public.cross_source_associations;
CREATE TRIGGER set_cross_source_associations_updated_at
    BEFORE UPDATE ON public.cross_source_associations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_record_matches_session_id ON public.record_matches(search_session_id);
CREATE INDEX IF NOT EXISTS idx_record_matches_missing_person_id ON public.record_matches(missing_person_id);
CREATE INDEX IF NOT EXISTS idx_record_matches_record_id ON public.record_matches(record_id);
CREATE INDEX IF NOT EXISTS idx_record_matches_status ON public.record_matches(match_status);

CREATE INDEX IF NOT EXISTS idx_record_embeddings_record_id ON public.record_embeddings(record_id);

CREATE INDEX IF NOT EXISTS idx_cross_assoc_session_id ON public.cross_source_associations(search_session_id);
CREATE INDEX IF NOT EXISTS idx_cross_assoc_candidate_group ON public.cross_source_associations(candidate_group_id);
CREATE INDEX IF NOT EXISTS idx_cross_assoc_record_match ON public.cross_source_associations(record_match_id);
CREATE INDEX IF NOT EXISTS idx_cross_assoc_status ON public.cross_source_associations(status);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.record_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_source_associations ENABLE ROW LEVEL SECURITY;

-- POLICIES (Authenticated user access)
DO $$
BEGIN
    -- found_person_records write policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'found_person_records' AND policyname = 'Authenticated users can insert found person records') THEN
        CREATE POLICY "Authenticated users can insert found person records" ON public.found_person_records FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'found_person_records' AND policyname = 'Authenticated users can update found person records') THEN
        CREATE POLICY "Authenticated users can update found person records" ON public.found_person_records FOR UPDATE TO authenticated USING (auth.role() = 'authenticated');
    END IF;

    -- record_matches policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'record_matches' AND policyname = 'Authenticated users can view record matches') THEN
        CREATE POLICY "Authenticated users can view record matches" ON public.record_matches FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'record_matches' AND policyname = 'Authenticated users can insert record matches') THEN
        CREATE POLICY "Authenticated users can insert record matches" ON public.record_matches FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'record_matches' AND policyname = 'Authenticated users can update record matches') THEN
        CREATE POLICY "Authenticated users can update record matches" ON public.record_matches FOR UPDATE TO authenticated USING (auth.role() = 'authenticated');
    END IF;

    -- record_embeddings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'record_embeddings' AND policyname = 'Authenticated users can view record embeddings') THEN
        CREATE POLICY "Authenticated users can view record embeddings" ON public.record_embeddings FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'record_embeddings' AND policyname = 'Authenticated users can insert record embeddings') THEN
        CREATE POLICY "Authenticated users can insert record embeddings" ON public.record_embeddings FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- cross_source_associations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cross_source_associations' AND policyname = 'Authenticated users can view cross source associations') THEN
        CREATE POLICY "Authenticated users can view cross source associations" ON public.cross_source_associations FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cross_source_associations' AND policyname = 'Authenticated users can insert cross source associations') THEN
        CREATE POLICY "Authenticated users can insert cross source associations" ON public.cross_source_associations FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cross_source_associations' AND policyname = 'Authenticated users can update cross source associations') THEN
        CREATE POLICY "Authenticated users can update cross source associations" ON public.cross_source_associations FOR UPDATE TO authenticated USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 5. STORAGE BUCKET: found-person-records
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
    ('found-person-records', 'found-person-records', false, false, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for found-person-records
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated user storage select found-person-records') THEN
        CREATE POLICY "Authenticated user storage select found-person-records" ON storage.objects
        FOR SELECT TO authenticated USING (bucket_id = 'found-person-records');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated user storage insert found-person-records') THEN
        CREATE POLICY "Authenticated user storage insert found-person-records" ON storage.objects
        FOR INSERT TO authenticated WITH CHECK (bucket_id = 'found-person-records');
    END IF;
END $$;
