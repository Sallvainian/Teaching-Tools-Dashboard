-- PERFORMANCE INDEXES FOR TEACHER DASHBOARD
-- These indexes will make queries blazing fast

-- User lookups (auth operations)
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_created_at ON app_users(created_at DESC);

-- Student queries (frequent lookups by user_id and class)
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);

-- Categories/Classes (filtered queries)
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_grade_level ON categories(grade_level);
CREATE INDEX IF NOT EXISTS idx_categories_subject ON categories(subject);
CREATE INDEX IF NOT EXISTS idx_categories_user_grade_subject ON categories(user_id, grade_level, subject);

-- Assignments (complex queries with joins)
CREATE INDEX IF NOT EXISTS idx_assignments_category_id ON assignments(category_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_category_due ON assignments(category_id, due_date);

-- Grades (heavy queries, needs optimization)
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_assignment_id ON grades(assignment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_assignment ON grades(student_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_grades_submitted_at ON grades(submitted_at DESC);

-- Log entries (time-based queries)
CREATE INDEX IF NOT EXISTS idx_log_entries_student_id ON log_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_log_entries_user_id ON log_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_log_entries_date ON log_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_log_entries_category ON log_entries(category);
CREATE INDEX IF NOT EXISTS idx_log_entries_student_date ON log_entries(student_id, date DESC);

-- File metadata (frequent lookups)
CREATE INDEX IF NOT EXISTS idx_file_metadata_user_id ON file_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_folder_id ON file_metadata(folder_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_created_at ON file_metadata(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_metadata_user_folder ON file_metadata(user_id, folder_id);

-- File folders (hierarchical queries)
CREATE INDEX IF NOT EXISTS idx_file_folders_user_id ON file_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_parent_id ON file_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_user_parent ON file_folders(user_id, parent_id);

-- Games (Jeopardy)
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

-- Shared games
CREATE INDEX IF NOT EXISTS idx_shared_games_shared_with ON shared_games(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_shared_games_game_id ON shared_games(game_id);

-- Class students (many-to-many joins)
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(category_id);
CREATE INDEX IF NOT EXISTS idx_class_students_joined_at ON class_students(joined_at DESC);

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assignments_upcoming ON assignments(due_date) 
WHERE due_date >= CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_grades_recent ON grades(submitted_at DESC) 
WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days';

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_students_name_search ON students USING gin(to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_log_entries_notes_search ON log_entries USING gin(to_tsvector('english', notes));
CREATE INDEX IF NOT EXISTS idx_file_metadata_name_search ON file_metadata USING gin(to_tsvector('english', file_name));