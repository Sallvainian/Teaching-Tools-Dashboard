-- noinspection SqlResolveForFile

-- noinspection SqlResolveForFile

-- noinspection SqlResolveForFile

-- noinspection SqlResolveForFile

-- noinspection SqlResolveForFile

-- Migration: Update student tables for authentication
-- This migration updates the students table to link with app_users

-- Step 1: Add auth_user_id to students table to link with app_users
ALTER TABLE students
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON students(auth_user_id);

-- Step 3: Add game sharing capability
CREATE TABLE IF NOT EXISTS shared_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    shared_with_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'play', 'edit')),
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, shared_with_id)
);

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_shared_games_game_id ON shared_games(game_id);
CREATE INDEX IF NOT EXISTS idx_shared_games_shared_with_id ON shared_games(shared_with_id);

-- Step 5: Add is_public field to games for student discovery
ALTER TABLE games
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS owner_role TEXT DEFAULT 'teacher' CHECK (owner_role IN ('teacher', 'student'));