-- FindSafe AI - Phase 9 Database Schema & Security Migration
-- Authority Command Center, Role-Based Access Control & Global Search

-- 1. Extend missing_persons table with priority and assignment fields
ALTER TABLE public.missing_persons
    ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS priority_updated_at TIMESTAMPTZ;

-- 2. TABLE: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'investigator' CHECK (role IN ('admin', 'investigator', 'reviewer', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for user_roles updated_at
DROP TRIGGER IF EXISTS set_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER set_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update check constraint on profiles role column if needed
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'investigator', 'reviewer', 'viewer', 'operator'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_missing_persons_priority ON public.missing_persons(priority);
CREATE INDEX IF NOT EXISTS idx_missing_persons_assigned_to ON public.missing_persons(assigned_to);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- POLICIES for user_roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Authenticated users can view user roles') THEN
        CREATE POLICY "Authenticated users can view user roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Authenticated users can insert user roles') THEN
        CREATE POLICY "Authenticated users can insert user roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Authenticated users can update user roles') THEN
        CREATE POLICY "Authenticated users can update user roles" ON public.user_roles FOR UPDATE TO authenticated USING (auth.role() = 'authenticated');
    END IF;
END $$;
