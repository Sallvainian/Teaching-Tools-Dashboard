-- Migration: Remove duplicate Jeopardy tables
-- This migration removes the old jeopardy_* tables and keeps the newer implementation

-- Step 1: Drop old Jeopardy tables (if they exist and have no data we need)
-- WARNING: Make sure to backup any needed data before running this!

-- Drop foreign key constraints first
ALTER TABLE jeopardy_questions DROP CONSTRAINT IF EXISTS jeopardy_questions_category_id_fkey;
ALTER TABLE jeopardy_categories DROP CONSTRAINT IF EXISTS jeopardy_categories_game_id_fkey;
ALTER TABLE jeopardy_teams DROP CONSTRAINT IF EXISTS jeopardy_teams_game_id_fkey;

-- Drop the tables
DROP TABLE IF EXISTS jeopardy_questions CASCADE;
DROP TABLE IF EXISTS jeopardy_categories CASCADE;
DROP TABLE IF EXISTS jeopardy_teams CASCADE;
DROP TABLE IF EXISTS jeopardy_games CASCADE;

-- Step 2: Add missing columns to the new tables if needed
-- Add user_id to teams table to track who created each team
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_users(id);

-- Add is_daily_double to questions (equivalent to is_double_jeopardy)
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS is_daily_double BOOLEAN DEFAULT FALSE;

-- Step 3: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_games_is_public ON games(is_public);
CREATE INDEX IF NOT EXISTS idx_games_owner_role ON games(owner_role);
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);