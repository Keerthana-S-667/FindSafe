-- FindSafe AI - Phase 5 Multi-Camera Person Detection, ByteTrack, OSNet Re-ID & Candidate Grouping Schema Migration

-- 1. TABLE: search_session_videos (Multiple camera videos per search session)
CREATE TABLE IF NOT EXISTS public.search_session_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_session_id UUID NOT NULL REFERENCES public.search_sessions(id) ON DELETE CASCADE,
    camera_id UUID REFERENCES public.camera_sources(id) ON DELETE SET NULL,
    camera_name TEXT NOT NULL,
    video_path TEXT NOT NULL,
    video_filename TEXT NOT NULL,
    video_size_bytes BIGINT,
    video_duration_seconds NUMERIC,
    video_fps NUMERIC,
    video_width INTEGER,
    video_height INTEGER,
    total_frames INTEGER,
    sampled_frames INTEGER DEFAULT 0,
    recording_start_time TIMESTAMPTZ,
    recording_end_time TIMESTAMPTZ,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'uploading', 'processing', 'completed', 'failed', 'cancelled')),
    processing_stage TEXT DEFAULT 'pending',
    processing_progress INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLE: person_tracks (ByteTrack person trajectories per video)
CREATE TABLE IF NOT EXISTS public.person_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_session_video_id UUID NOT NULL REFERENCES public.search_session_videos(id) ON DELETE CASCADE,
    search_session_id UUID NOT NULL REFERENCES public.search_sessions(id) ON DELETE CASCADE,
    camera_id UUID REFERENCES public.camera_sources(id) ON DELETE SET NULL,
    camera_name TEXT,
    track_id INTEGER NOT NULL,
    first_seen_seconds NUMERIC NOT NULL,
    last_seen_seconds NUMERIC NOT NULL,
    frame_count INTEGER NOT NULL DEFAULT 1,
    best_crop_path TEXT,
    visual_similarity NUMERIC DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE: person_detections (YOLO bounding box detections per frame)
CREATE TABLE IF NOT EXISTS public.person_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_track_id UUID NOT NULL REFERENCES public.person_tracks(id) ON DELETE CASCADE,
    frame_index INTEGER NOT NULL,
    timestamp_seconds NUMERIC NOT NULL,
    x1 NUMERIC NOT NULL,
    y1 NUMERIC NOT NULL,
    x2 NUMERIC NOT NULL,
    y2 NUMERIC NOT NULL,
    confidence NUMERIC NOT NULL,
    crop_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE: person_embeddings (OSNet Re-ID appearance vector embeddings)
CREATE TABLE IF NOT EXISTS public.person_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_track_id UUID NOT NULL REFERENCES public.person_tracks(id) ON DELETE CASCADE,
    embedding JSONB NOT NULL,
    model_name TEXT DEFAULT 'osnet_x1_0',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE: candidate_groups (Aggregated cross-camera potential match candidate groups)
CREATE TABLE IF NOT EXISTS public.candidate_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_session_id UUID NOT NULL REFERENCES public.search_sessions(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.missing_persons(id) ON DELETE CASCADE,
    overall_score NUMERIC NOT NULL DEFAULT 0.0,
    evidence_level TEXT DEFAULT 'moderate' CHECK (evidence_level IN ('high', 'moderate', 'low')),
    status TEXT DEFAULT 'potential_match' CHECK (status IN ('under_review', 'potential_match', 'rejected', 'verified')),
    camera_count INTEGER DEFAULT 1,
    first_seen_timestamp TIMESTAMPTZ,
    last_seen_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLE: candidate_group_tracks (Sequence order of candidate tracks in candidate groups)
CREATE TABLE IF NOT EXISTS public.candidate_group_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_group_id UUID NOT NULL REFERENCES public.candidate_groups(id) ON DELETE CASCADE,
    person_track_id UUID NOT NULL REFERENCES public.person_tracks(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL DEFAULT 1,
    transition_time_seconds NUMERIC DEFAULT 0.0,
    transition_distance_meters NUMERIC DEFAULT 0.0,
    visual_similarity NUMERIC DEFAULT 0.0,
    transition_score NUMERIC DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_ss_videos_session_id ON public.search_session_videos(search_session_id);
CREATE INDEX IF NOT EXISTS idx_person_tracks_video_id ON public.person_tracks(search_session_video_id);
CREATE INDEX IF NOT EXISTS idx_person_tracks_session_id ON public.person_tracks(search_session_id);
CREATE INDEX IF NOT EXISTS idx_person_detections_track_id ON public.person_detections(person_track_id);
CREATE INDEX IF NOT EXISTS idx_person_embeddings_track_id ON public.person_embeddings(person_track_id);
CREATE INDEX IF NOT EXISTS idx_candidate_groups_session_id ON public.candidate_groups(search_session_id);
CREATE INDEX IF NOT EXISTS idx_candidate_group_tracks_group_id ON public.candidate_group_tracks(candidate_group_id);

-- RLS POLICIES
ALTER TABLE public.search_session_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_group_tracks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_session_videos' AND policyname = 'Authenticated select search_session_videos') THEN
        CREATE POLICY "Authenticated select search_session_videos" ON public.search_session_videos FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_session_videos' AND policyname = 'Authenticated insert search_session_videos') THEN
        CREATE POLICY "Authenticated insert search_session_videos" ON public.search_session_videos FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_session_videos' AND policyname = 'Authenticated update search_session_videos') THEN
        CREATE POLICY "Authenticated update search_session_videos" ON public.search_session_videos FOR UPDATE TO authenticated USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'person_tracks' AND policyname = 'Authenticated select person_tracks') THEN
        CREATE POLICY "Authenticated select person_tracks" ON public.person_tracks FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'person_tracks' AND policyname = 'Authenticated insert person_tracks') THEN
        CREATE POLICY "Authenticated insert person_tracks" ON public.person_tracks FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'person_detections' AND policyname = 'Authenticated select person_detections') THEN
        CREATE POLICY "Authenticated select person_detections" ON public.person_detections FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'person_detections' AND policyname = 'Authenticated insert person_detections') THEN
        CREATE POLICY "Authenticated insert person_detections" ON public.person_detections FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'person_embeddings' AND policyname = 'Authenticated select person_embeddings') THEN
        CREATE POLICY "Authenticated select person_embeddings" ON public.person_embeddings FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'person_embeddings' AND policyname = 'Authenticated insert person_embeddings') THEN
        CREATE POLICY "Authenticated insert person_embeddings" ON public.person_embeddings FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_groups' AND policyname = 'Authenticated select candidate_groups') THEN
        CREATE POLICY "Authenticated select candidate_groups" ON public.candidate_groups FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_groups' AND policyname = 'Authenticated insert candidate_groups') THEN
        CREATE POLICY "Authenticated insert candidate_groups" ON public.candidate_groups FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_groups' AND policyname = 'Authenticated update candidate_groups') THEN
        CREATE POLICY "Authenticated update candidate_groups" ON public.candidate_groups FOR UPDATE TO authenticated USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_group_tracks' AND policyname = 'Authenticated select candidate_group_tracks') THEN
        CREATE POLICY "Authenticated select candidate_group_tracks" ON public.candidate_group_tracks FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_group_tracks' AND policyname = 'Authenticated insert candidate_group_tracks') THEN
        CREATE POLICY "Authenticated insert candidate_group_tracks" ON public.candidate_group_tracks FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;
