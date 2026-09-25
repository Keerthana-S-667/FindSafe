-- FindSafe AI - Phase 3 Supabase PostgreSQL Schema & Storage Setup Migration
-- Safe execution with IF NOT EXISTS checks

-- 1. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABLE: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'operator' CHECK (role IN ('operator', 'reviewer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'operator'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when a user registers in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. TABLE: missing_persons
CREATE TABLE IF NOT EXISTS public.missing_persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT UNIQUE NOT NULL,
    reference_name TEXT NOT NULL,
    age_range TEXT,
    upper_clothing TEXT,
    lower_clothing TEXT,
    bag TEXT,
    accessories TEXT,
    last_seen_location TEXT,
    last_seen_lat DOUBLE PRECISION,
    last_seen_lng DOUBLE PRECISION,
    last_seen_timestamp TIMESTAMPTZ,
    search_radius_km NUMERIC DEFAULT 5,
    notes TEXT,
    reference_image_path TEXT,
    reference_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'resolved', 'closed', 'archived')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for missing_persons updated_at
DROP TRIGGER IF EXISTS set_missing_persons_updated_at ON public.missing_persons;
CREATE TRIGGER set_missing_persons_updated_at
    BEFORE UPDATE ON public.missing_persons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. TABLE: search_sessions
CREATE TABLE IF NOT EXISTS public.search_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.missing_persons(id) ON DELETE CASCADE,
    search_type TEXT CHECK (search_type IN ('crowd', 'records', 'everywhere')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE: found_person_records
CREATE TABLE IF NOT EXISTS public.found_person_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id TEXT UNIQUE NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('police', 'hospital', 'shelter', 'public_report')),
    reference_image_path TEXT,
    reference_image_url TEXT,
    age_range TEXT,
    upper_clothing TEXT,
    lower_clothing TEXT,
    bag TEXT,
    accessories TEXT,
    location TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    record_timestamp TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLE: candidates
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_session_id UUID REFERENCES public.search_sessions(id) ON DELETE CASCADE,
    track_id TEXT,
    evidence_image_path TEXT,
    evidence_image_url TEXT,
    visual_similarity NUMERIC,
    clothing_score NUMERIC,
    accessory_score NUMERIC,
    location_score NUMERIC,
    time_score NUMERIC,
    overall_score NUMERIC,
    verification_status TEXT DEFAULT 'under_review' CHECK (verification_status IN ('under_review', 'potential_match', 'rejected', 'verified')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLE: candidate_evidence
CREATE TABLE IF NOT EXISTS public.candidate_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    evidence_type TEXT,
    description TEXT,
    value TEXT,
    confidence NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLE: camera_sources
CREATE TABLE IF NOT EXISTS public.camera_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_name TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLE: verification_notes
CREATE TABLE IF NOT EXISTS public.verification_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLE: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_missing_persons_case_id ON public.missing_persons(case_id);
CREATE INDEX IF NOT EXISTS idx_missing_persons_status ON public.missing_persons(status);
CREATE INDEX IF NOT EXISTS idx_missing_persons_created_by ON public.missing_persons(created_by);
CREATE INDEX IF NOT EXISTS idx_missing_persons_created_at ON public.missing_persons(created_at);

CREATE INDEX IF NOT EXISTS idx_search_sessions_case_id ON public.search_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_search_sessions_status ON public.search_sessions(status);

CREATE INDEX IF NOT EXISTS idx_found_records_record_id ON public.found_person_records(record_id);
CREATE INDEX IF NOT EXISTS idx_found_records_source_type ON public.found_person_records(source_type);

CREATE INDEX IF NOT EXISTS idx_candidates_search_session_id ON public.candidates(search_session_id);
CREATE INDEX IF NOT EXISTS idx_candidates_verification_status ON public.candidates(verification_status);

CREATE INDEX IF NOT EXISTS idx_verification_notes_candidate_id ON public.verification_notes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missing_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.found_person_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camera_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES (Authenticated user access)
DO $$
BEGIN
    -- profiles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Authenticated users can view profiles') THEN
        CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
    END IF;

    -- missing_persons policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'missing_persons' AND policyname = 'Authenticated users can view missing persons') THEN
        CREATE POLICY "Authenticated users can view missing persons" ON public.missing_persons FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'missing_persons' AND policyname = 'Authenticated users can insert missing persons') THEN
        CREATE POLICY "Authenticated users can insert missing persons" ON public.missing_persons FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'missing_persons' AND policyname = 'Authenticated users can update missing persons') THEN
        CREATE POLICY "Authenticated users can update missing persons" ON public.missing_persons FOR UPDATE TO authenticated USING (auth.role() = 'authenticated');
    END IF;

    -- search_sessions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_sessions' AND policyname = 'Authenticated users can view search sessions') THEN
        CREATE POLICY "Authenticated users can view search sessions" ON public.search_sessions FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_sessions' AND policyname = 'Authenticated users can insert search sessions') THEN
        CREATE POLICY "Authenticated users can insert search sessions" ON public.search_sessions FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- found_person_records policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'found_person_records' AND policyname = 'Authenticated users can view found person records') THEN
        CREATE POLICY "Authenticated users can view found person records" ON public.found_person_records FOR SELECT TO authenticated USING (true);
    END IF;

    -- candidates policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidates' AND policyname = 'Authenticated users can view candidates') THEN
        CREATE POLICY "Authenticated users can view candidates" ON public.candidates FOR SELECT TO authenticated USING (true);
    END IF;

    -- candidate_evidence policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_evidence' AND policyname = 'Authenticated users can view candidate evidence') THEN
        CREATE POLICY "Authenticated users can view candidate evidence" ON public.candidate_evidence FOR SELECT TO authenticated USING (true);
    END IF;

    -- camera_sources policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'camera_sources' AND policyname = 'Authenticated users can view camera sources') THEN
        CREATE POLICY "Authenticated users can view camera sources" ON public.camera_sources FOR SELECT TO authenticated USING (true);
    END IF;

    -- verification_notes policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_notes' AND policyname = 'Authenticated users can view verification notes') THEN
        CREATE POLICY "Authenticated users can view verification notes" ON public.verification_notes FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'verification_notes' AND policyname = 'Authenticated users can insert verification notes') THEN
        CREATE POLICY "Authenticated users can insert verification notes" ON public.verification_notes FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- audit_logs policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Authenticated users can view audit logs') THEN
        CREATE POLICY "Authenticated users can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Authenticated users can insert audit logs') THEN
        CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- 11. STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
    ('missing-person-photos', 'missing-person-photos', false, false, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
    ('cctv-videos', 'cctv-videos', false, false, 524288000, ARRAY['video/mp4', 'video/avi', 'video/quicktime']),
    ('evidence-frames', 'evidence-frames', false, false, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
    ('reports', 'reports', false, false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for missing-person-photos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated user storage select missing-person-photos') THEN
        CREATE POLICY "Authenticated user storage select missing-person-photos" ON storage.objects
        FOR SELECT TO authenticated USING (bucket_id = 'missing-person-photos');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated user storage insert missing-person-photos') THEN
        CREATE POLICY "Authenticated user storage insert missing-person-photos" ON storage.objects
        FOR INSERT TO authenticated WITH CHECK (bucket_id = 'missing-person-photos');
    END IF;
END $$;
