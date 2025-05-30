-- ROW LEVEL SECURITY POLICIES FOR TEACHER DASHBOARD
-- Secure data access at the database level

-- Enable RLS on all tables
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- App Users Policies
CREATE POLICY "Users can view own profile" ON app_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON app_users
    FOR UPDATE USING (auth.uid() = id);

-- Students Policies
CREATE POLICY "Teachers can view all students" ON students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE id = auth.uid() 
            AND role = 'teacher'
        )
    );

CREATE POLICY "Students can view own record" ON students
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Teachers can manage students" ON students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE id = auth.uid() 
            AND role = 'teacher'
        )
    );

-- Categories/Classes Policies
CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own categories" ON categories
    FOR ALL USING (user_id = auth.uid());

-- Assignments Policies
CREATE POLICY "Teachers can view assignments for their categories" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM categories 
            WHERE categories.id = assignments.category_id 
            AND categories.user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can manage assignments for their categories" ON assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM categories 
            WHERE categories.id = assignments.category_id 
            AND categories.user_id = auth.uid()
        )
    );

-- Grades Policies
CREATE POLICY "Teachers can view grades for their students" ON grades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN categories c ON a.category_id = c.id
            WHERE a.id = grades.assignment_id 
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Students can view own grades" ON grades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = grades.student_id 
            AND students.user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can manage grades" ON grades
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN categories c ON a.category_id = c.id
            WHERE a.id = grades.assignment_id 
            AND c.user_id = auth.uid()
        )
    );

-- Log Entries Policies
CREATE POLICY "Users can view own log entries" ON log_entries
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own log entries" ON log_entries
    FOR ALL USING (user_id = auth.uid());

-- File Metadata Policies
CREATE POLICY "Users can view own files" ON file_metadata
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own files" ON file_metadata
    FOR ALL USING (user_id = auth.uid());

-- File Folders Policies
CREATE POLICY "Users can view own folders" ON file_folders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own folders" ON file_folders
    FOR ALL USING (user_id = auth.uid());

-- Games Policies
CREATE POLICY "Users can view own games" ON games
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view shared games" ON games
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shared_games 
            WHERE shared_games.game_id = games.id 
            AND shared_games.shared_with_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own games" ON games
    FOR ALL USING (user_id = auth.uid());

-- Game Categories Policies
CREATE POLICY "Users can view categories for own games" ON game_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM games 
            WHERE games.id = game_categories.game_id 
            AND games.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view categories for shared games" ON game_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM games g
            JOIN shared_games sg ON g.id = sg.game_id
            WHERE g.id = game_categories.game_id 
            AND sg.shared_with_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage categories for own games" ON game_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM games 
            WHERE games.id = game_categories.game_id 
            AND games.user_id = auth.uid()
        )
    );

-- Questions Policies
CREATE POLICY "Users can view questions for own games" ON questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_categories gc
            JOIN games g ON gc.game_id = g.id
            WHERE gc.id = questions.category_id 
            AND g.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view questions for shared games" ON questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_categories gc
            JOIN games g ON gc.game_id = g.id
            JOIN shared_games sg ON g.id = sg.game_id
            WHERE gc.id = questions.category_id 
            AND sg.shared_with_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage questions for own games" ON questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM game_categories gc
            JOIN games g ON gc.game_id = g.id
            WHERE gc.id = questions.category_id 
            AND g.user_id = auth.uid()
        )
    );

-- Shared Games Policies
CREATE POLICY "Game owners can manage shares" ON shared_games
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM games 
            WHERE games.id = shared_games.game_id 
            AND games.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view games shared with them" ON shared_games
    FOR SELECT USING (shared_with_id = auth.uid());

-- Class Students Policies
CREATE POLICY "Teachers can view class enrollments" ON class_students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM categories 
            WHERE categories.id = class_students.category_id 
            AND categories.user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can manage class enrollments" ON class_students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM categories 
            WHERE categories.id = class_students.category_id 
            AND categories.user_id = auth.uid()
        )
    );

-- Storage bucket policies
CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'teacher-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'teacher-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'teacher-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'teacher-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );