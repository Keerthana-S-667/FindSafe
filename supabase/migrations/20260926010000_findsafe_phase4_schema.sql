-- FindSafe AI - Phase 4 CCTV Video Ingestion & Processing Schema Migration

-- 1. Extend search_sessions table with video metadata & status fields
ALTER TABLE public.search_sessions 
    ADD COLUMN IF NOT EXISTS video_path TEXT,
    ADD COLUMN IF NOT EXISTS video_filename TEXT,
    ADD COLUMN IF NOT EXISTS video_size_bytes BIGINT,
    ADD COLUMN IF NOT EXISTS video_duration_seconds NUMERIC,
    ADD COLUMN IF NOT EXISTS video_fps NUMERIC,
    ADD COLUMN IF NOT EXISTS video_width INTEGER,
    ADD COLUMN IF NOT EXISTS video_height INTEGER,
    ADD COLUMN IF NOT EXISTS total_frames INTEGER,
    ADD COLUMN IF NOT EXISTS sampled_frames INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS processing_progress INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS processing_stage TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS camera_name TEXT,
    ADD COLUMN IF NOT EXISTS location_name TEXT,
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update search_sessions status check constraint if present to allow 'uploading'
ALTER TABLE public.search_sessions DROP CONSTRAINT IF EXISTS search_sessions_status_check;
ALTER TABLE public.search_sessions ADD CONSTRAINT search_sessions_status_check 
    CHECK (status IN ('pending', 'uploading', 'processing', 'completed', 'failed', 'cancelled'));

-- Trigger for search_sessions updated_at
DROP TRIGGER IF EXISTS set_search_sessions_updated_at ON public.search_sessions;
CREATE TRIGGER set_search_sessions_updated_at
    BEFORE UPDATE ON public.search_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. CREATE TABLE: video_frames
CREATE TABLE IF NOT EXISTS public.video_frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_session_id UUID NOT NULL REFERENCES public.search_sessions(id) ON DELETE CASCADE,
    frame_index INTEGER NOT NULL,
    timestamp_seconds NUMERIC NOT NULL,
    frame_path TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_video_frames_session_id ON public.video_frames(search_session_id);
CREATE INDEX IF NOT EXISTS idx_video_frames_session_frame ON public.video_frames(search_session_id, frame_index);

-- RLS
ALTER TABLE public.video_frames ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_frames' AND policyname = 'Authenticated users can view video frames') THEN
        CREATE POLICY "Authenticated users can view video frames" ON public.video_frames FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_frames' AND policyname = 'Authenticated users can insert video frames') THEN
        CREATE POLICY "Authenticated users can insert video frames" ON public.video_frames FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_sessions' AND policyname = 'Authenticated users can update search sessions') THEN
        CREATE POLICY "Authenticated users can update search sessions" ON public.search_sessions FOR UPDATE TO authenticated USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 3. STORAGE BUCKET POLICIES FOR cctv-videos AND evidence-frames
DO $$
BEGIN
    -- cctv-videos SELECT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated user storage select cctv-videos') THEN
        CREATE POLICY "Authenticated user storage select cctv-videos" ON storage.objects
        FOR SELECT TO authenticated USING (bucket_id = 'cctv-videos');
    END IF;

    -- cctv-videos INSERT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated user storage insert cctv-videos') THEN
        CREATE POLICY "Authenticated user storage insert cctv-videos" ON storage.objects
        FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cctv-videos');
    END IF;

    -- evidence-frames SELECT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated user storage select evidence-frames') THEN
        CREATE POLICY "Authenticated user storage select evidence-frames" ON storage.objects
        FOR SELECT TO authenticated USING (bucket_id = 'evidence-frames');
    END IF;

    -- evidence-frames INSERT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated user storage insert evidence-frames') THEN
        CREATE POLICY "Authenticated user storage insert evidence-frames" ON storage.objects
        FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evidence-frames');
    END IF;
END $$;
