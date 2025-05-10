-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create Role Types Enum
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');

-- Create Auth Schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users Table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'student',
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Create a separate view for role checks to avoid recursion
CREATE OR REPLACE VIEW user_roles AS
SELECT id, role FROM users;

-- Use the view for admin policies to avoid circular references
CREATE POLICY "Admin can view all user data"
  ON users FOR SELECT
  USING ((SELECT role FROM user_roles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin can update all user data"
  ON users FOR UPDATE
  USING ((SELECT role FROM user_roles WHERE id = auth.uid()) = 'admin');

-- ======= GRADEBOOK SCHEMA =======

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Categories Table (subjects/classes)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  weight DECIMAL(5,2) DEFAULT 1.0,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 100,
  due_date DATE,
  notes TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on assignments table
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Grades Table
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  score DECIMAL(10,2) NOT NULL,
  notes TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, assignment_id)
);

-- Enable RLS on grades table
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Student-Categories Join Table (for enrollment)
CREATE TABLE IF NOT EXISTS student_categories (
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, category_id)
);

-- Enable RLS on student_categories table
ALTER TABLE student_categories ENABLE ROW LEVEL SECURITY;

-- ======= JEOPARDY SCHEMA =======

-- Jeopardy Games Table
CREATE TABLE IF NOT EXISTS jeopardy_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{"defaultTimeLimit": 30, "useTimer": false, "allowWagers": true}'::jsonb,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on jeopardy_games table
ALTER TABLE jeopardy_games ENABLE ROW LEVEL SECURITY;

-- Jeopardy Categories Table
CREATE TABLE IF NOT EXISTS jeopardy_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  game_id UUID REFERENCES jeopardy_games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on jeopardy_categories table
ALTER TABLE jeopardy_categories ENABLE ROW LEVEL SECURITY;

-- Jeopardy Questions Table
CREATE TABLE IF NOT EXISTS jeopardy_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  answer TEXT NOT NULL,
  point_value INTEGER NOT NULL DEFAULT 100,
  is_answered BOOLEAN NOT NULL DEFAULT FALSE,
  is_double_jeopardy BOOLEAN NOT NULL DEFAULT FALSE,
  time_limit INTEGER,
  category_id UUID REFERENCES jeopardy_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on jeopardy_questions table
ALTER TABLE jeopardy_questions ENABLE ROW LEVEL SECURITY;

-- Jeopardy Teams Table
CREATE TABLE IF NOT EXISTS jeopardy_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  game_id UUID REFERENCES jeopardy_games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on jeopardy_teams table
ALTER TABLE jeopardy_teams ENABLE ROW LEVEL SECURITY;

-- ======= POLICIES FOR ALL TABLES =======

-- Policies for students
CREATE POLICY "Users can view their own students" 
  ON students FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students" 
  ON students FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students" 
  ON students FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students" 
  ON students FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for other tables
-- Categories
CREATE POLICY "Users can view their own categories" 
  ON categories FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" 
  ON categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Assignments
CREATE POLICY "Users can view their own assignments" 
  ON assignments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assignments" 
  ON assignments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments" 
  ON assignments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments" 
  ON assignments FOR DELETE
  USING (auth.uid() = user_id);

-- Grades
CREATE POLICY "Users can view their own grades" 
  ON grades FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grades" 
  ON grades FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grades" 
  ON grades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grades" 
  ON grades FOR DELETE
  USING (auth.uid() = user_id);

-- Student-Categories
CREATE POLICY "Users can view their own student_categories" 
  ON student_categories FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own student_categories" 
  ON student_categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own student_categories" 
  ON student_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Jeopardy Games
CREATE POLICY "Users can view their own jeopardy_games" 
  ON jeopardy_games FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jeopardy_games" 
  ON jeopardy_games FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jeopardy_games" 
  ON jeopardy_games FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jeopardy_games" 
  ON jeopardy_games FOR DELETE
  USING (auth.uid() = user_id);

-- Jeopardy Categories
CREATE POLICY "Users can view their own jeopardy_categories" 
  ON jeopardy_categories FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jeopardy_categories" 
  ON jeopardy_categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jeopardy_categories" 
  ON jeopardy_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jeopardy_categories" 
  ON jeopardy_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Jeopardy Questions
CREATE POLICY "Users can view their own jeopardy_questions" 
  ON jeopardy_questions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jeopardy_questions" 
  ON jeopardy_questions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jeopardy_questions" 
  ON jeopardy_questions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jeopardy_questions" 
  ON jeopardy_questions FOR DELETE
  USING (auth.uid() = user_id);

-- Jeopardy Teams
CREATE POLICY "Users can view their own jeopardy_teams" 
  ON jeopardy_teams FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jeopardy_teams" 
  ON jeopardy_teams FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jeopardy_teams" 
  ON jeopardy_teams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jeopardy_teams" 
  ON jeopardy_teams FOR DELETE
  USING (auth.uid() = user_id);

-- Create public access for students (if needed)
-- This allows students to view certain data
CREATE POLICY "Students can view public jeopardy games"
  ON jeopardy_games FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'student'
  ));

-- Create indexes for performance
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_assignments_category_id ON assignments(category_id);
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_assignment_id ON grades(assignment_id);
CREATE INDEX idx_grades_user_id ON grades(user_id);
CREATE INDEX idx_jeopardy_games_user_id ON jeopardy_games(user_id);
CREATE INDEX idx_jeopardy_categories_game_id ON jeopardy_categories(game_id);
CREATE INDEX idx_jeopardy_questions_category_id ON jeopardy_questions(category_id);
CREATE INDEX idx_jeopardy_teams_game_id ON jeopardy_teams(game_id);