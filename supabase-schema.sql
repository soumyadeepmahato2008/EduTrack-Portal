-- ========================================================
-- Supabase PostgreSQL Schema for Student-Teacher Portal
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Subjects Table (Managed by Teachers)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial default subjects
INSERT INTO subjects (name, code, color) VALUES 
('Math', 'MATH101', '#3b82f6'),
('Science', 'SCI201', '#10b981'),
('History', 'HIST102', '#f59e0b'),
('English', 'ENG101', '#8b5cf6')
ON CONFLICT (name) DO NOTHING;

-- 2. Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
    description TEXT,
    created_by_teacher_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Student Assignment Completions Table (Tracking per-student "Mark as Done")
CREATE TABLE IF NOT EXISTS student_assignment_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (assignment_id, student_id)
);

-- 4. Tests Table (Managed by Teachers)
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    test_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    max_marks INTEGER DEFAULT 100,
    syllabus TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Announcements Table (Managed by Teachers)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    subject TEXT DEFAULT 'General',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Server-managed authentication challenges. Access is restricted to the
-- service-role key used by server API routes; never expose that key to browsers.
CREATE TABLE IF NOT EXISTS auth_challenges (
    email TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('login', 'teacher')),
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (email, purpose)
);

-- Keep direct anonymous/authenticated browser access disabled. Server routes use
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS after performing application checks.
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_challenges ENABLE ROW LEVEL SECURITY;

ALTER TABLE tests ADD COLUMN IF NOT EXISTS created_by TEXT;


-- Permanent role lock. A user's role is assigned once after server-side verification.
CREATE TABLE IF NOT EXISTS account_roles (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE account_roles ENABLE ROW LEVEL SECURITY;


-- Persistent rate limiting for server-side authentication endpoints.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
    bucket_key TEXT PRIMARY KEY,
    window_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0)
);
ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION consume_auth_rate_limit(
    p_bucket_key TEXT,
    p_window_seconds INTEGER,
    p_limit INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_count INTEGER;
BEGIN
    INSERT INTO auth_rate_limits (bucket_key, window_started_at, request_count)
    VALUES (p_bucket_key, NOW(), 1)
    ON CONFLICT (bucket_key) DO UPDATE SET
        window_started_at = CASE
            WHEN auth_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= NOW() THEN NOW()
            ELSE auth_rate_limits.window_started_at
        END,
        request_count = CASE
            WHEN auth_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= NOW() THEN 1
            ELSE auth_rate_limits.request_count + 1
        END
    RETURNING request_count INTO current_count;

    RETURN current_count <= p_limit;
END;
$$;
REVOKE ALL ON FUNCTION consume_auth_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_auth_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
