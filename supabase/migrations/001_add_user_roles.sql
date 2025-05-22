-- Migration: Add role field to app_users table
-- This migration adds a role field to distinguish between teachers and students

-- Step 1: Add role column with default value
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'teacher' 
CHECK (role IN ('teacher', 'student'));

-- Step 2: Create an enum type for better type safety (optional)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('teacher', 'student');
    END IF;
END $$;

-- Step 3: Add a join_code field for student class enrollment
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

-- Step 4: Generate join codes for existing classes
UPDATE classes 
SET join_code = CONCAT(
    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3),
    '-',
    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3)
)
WHERE join_code IS NULL;

-- Step 5: Create a table to track student-teacher relationships
CREATE TABLE IF NOT EXISTS student_teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, teacher_id)
);

-- Step 6: Create index for performance
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_classes_join_code ON classes(join_code);