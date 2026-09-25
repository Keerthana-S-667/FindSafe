-- Phase 13 Migration: Investigation Replay & Synthetic Scenario Center Schema

-- 1. CREATE TABLE: candidate_evidence_history (Historical evidence score snapshots for replay)
CREATE TABLE IF NOT EXISTS public.candidate_evidence_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_group_id UUID REFERENCES public.candidate_groups(id) ON DELETE CASCADE,
    search_session_id UUID REFERENCES public.search_sessions(id) ON DELETE CASCADE,
    evidence_score INTEGER DEFAULT 50,
    visual_score NUMERIC DEFAULT 50.0,
    attribute_score NUMERIC DEFAULT 50.0,
    time_score NUMERIC DEFAULT 50.0,
    location_score NUMERIC DEFAULT 50.0,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE TABLE: demo_scenarios (Precomputed synthetic demo scenarios for presentation)
CREATE TABLE IF NOT EXISTS public.demo_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    scenario_type TEXT DEFAULT 'crowded_transit',
    status TEXT DEFAULT 'ready',
    synthetic_data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE TABLE: demo_scenario_events (Sequential replay events for hackathon demo walkthrough)
CREATE TABLE IF NOT EXISTS public.demo_scenario_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.demo_scenarios(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    related_entity_type TEXT,
    related_entity_id TEXT,
    payload_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_evidence_hist_candidate ON public.candidate_evidence_history(candidate_group_id);
CREATE INDEX IF NOT EXISTS idx_evidence_hist_session ON public.candidate_evidence_history(search_session_id);
CREATE INDEX IF NOT EXISTS idx_demo_scenario_events_scen ON public.demo_scenario_events(scenario_id, sequence_number);

-- RLS POLICIES
ALTER TABLE public.candidate_evidence_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_scenario_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated operations on candidate_evidence_history"
    ON public.candidate_evidence_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write for local dev on candidate_evidence_history"
    ON public.candidate_evidence_history FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated operations on demo_scenarios"
    ON public.demo_scenarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write for local dev on demo_scenarios"
    ON public.demo_scenarios FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated operations on demo_scenario_events"
    ON public.demo_scenario_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read/write for local dev on demo_scenario_events"
    ON public.demo_scenario_events FOR ALL TO anon USING (true) WITH CHECK (true);
