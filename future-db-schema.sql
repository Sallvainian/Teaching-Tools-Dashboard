-- This is a database schema for future use
-- Currently, all data is stored in localStorage
-- This schema will be implemented when we add persistent storage

-- Teacher Dashboard Database Schema
-- This schema defines the tables and relationships for the Teacher Dashboard application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- Options: 'user', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STUDENTS (for gradebook)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CATEGORIES (Classes/Subjects)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  weight NUMERIC DEFAULT 1,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STUDENT-CATEGORY enrollments
CREATE TABLE IF NOT EXISTS student_categories (
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (student_id, category_id)
);

-- ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  total_points NUMERIC NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GRADES
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  notes TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JEOPARDY GAMES
CREATE TABLE IF NOT EXISTS jeopardy_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{"defaultTimeLimit": 30, "useTimer": false, "allowWagers": true}'::jsonb,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JEOPARDY CATEGORIES
CREATE TABLE IF NOT EXISTS jeopardy_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  game_id UUID REFERENCES jeopardy_games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JEOPARDY QUESTIONS
CREATE TABLE IF NOT EXISTS jeopardy_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  answer TEXT NOT NULL,
  point_value INTEGER NOT NULL,
  is_answered BOOLEAN DEFAULT FALSE,
  is_double_jeopardy BOOLEAN DEFAULT FALSE,
  time_limit INTEGER,
  category_id UUID REFERENCES jeopardy_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JEOPARDY TEAMS
CREATE TABLE IF NOT EXISTS jeopardy_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  game_id UUID REFERENCES jeopardy_games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LESSON PLANNER 
CREATE TABLE IF NOT EXISTS lesson_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '[]'::jsonb,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLASS DOJO 
CREATE TABLE IF NOT EXISTS behavior_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  positive_behaviors JSONB DEFAULT '[]'::jsonb,
  negative_behaviors JSONB DEFAULT '[]'::jsonb,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS behavior_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  behavior_type TEXT NOT NULL, -- 'positive' or 'negative'
  behavior_name TEXT NOT NULL,
  points INTEGER NOT NULL,
  notes TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES for performance
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
CREATE INDEX idx_student_categories_student_id ON student_categories(student_id);
CREATE INDEX idx_student_categories_category_id ON student_categories(category_id);