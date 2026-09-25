-- FindSafe AI - Phase 6 Visual Attribute Intelligence & Explainable Evidence Schema Migration

-- 1. CREATE TABLE: track_attributes
CREATE TABLE IF NOT EXISTS public.track_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_track_id UUID NOT NULL REFERENCES public.person_tracks(id) ON DELETE CASCADE,
    upper_clothing_color TEXT DEFAULT 'unknown',
    upper_clothing_type TEXT DEFAULT 'unknown',
    lower_clothing_color TEXT DEFAULT 'unknown',
    lower_clothing_type TEXT DEFAULT 'unknown',
    bag_present BOOLEAN DEFAULT false,
    bag_type TEXT DEFAULT 'unknown',
    hat_present BOOLEAN DEFAULT false,
    other_accessory TEXT DEFAULT 'none',
    attribute_confidence NUMERIC DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Extend candidate_groups table with component evidence breakdown fields
ALTER TABLE public.candidate_groups 
    ADD COLUMN IF NOT EXISTS attribute_score NUMERIC DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS visual_score NUMERIC DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS time_score NUMERIC DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS location_score NUMERIC DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS cross_camera_score NUMERIC DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS explanation_json JSONB;

-- 3. Extend candidate_evidence table for structured attribute comparison
ALTER TABLE public.candidate_evidence
    ADD COLUMN IF NOT EXISTS attribute_type TEXT,
    ADD COLUMN IF NOT EXISTS reference_value TEXT,
    ADD COLUMN IF NOT EXISTS candidate_value TEXT,
    ADD COLUMN IF NOT EXISTS match_status TEXT DEFAULT 'unknown';

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_track_attributes_track_id ON public.track_attributes(person_track_id);

-- RLS
ALTER TABLE public.track_attributes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'track_attributes' AND policyname = 'Authenticated select track_attributes') THEN
        CREATE POLICY "Authenticated select track_attributes" ON public.track_attributes FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'track_attributes' AND policyname = 'Authenticated insert track_attributes') THEN
        CREATE POLICY "Authenticated insert track_attributes" ON public.track_attributes FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;
