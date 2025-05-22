-- Migration: Create RLS policies for student access control
-- This migration sets up Row Level Security for students

-- Step 1: Enable RLS on all tables if not already enabled
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_teachers ENABLE ROW LEVEL SECURITY;

-- Step 2: Policies for app_users
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON app_users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON app_users
    FOR UPDATE USING (auth.uid() = id);

-- Students can view their teachers
CREATE POLICY "Students can view their teachers" ON app_users
    FOR SELECT USING (
        id IN (
            SELECT teacher_id FROM student_teachers 
            WHERE student_id = auth.uid()
        )
    );

-- Step 3: Policies for classes
-- Teachers can manage their own classes
CREATE POLICY "Teachers can manage own classes" ON classes
    FOR ALL USING (
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'teacher')
    );

-- Students can view classes they're enrolled in
CREATE POLICY "Students can view enrolled classes" ON classes
    FOR SELECT USING (
        id IN (
            SELECT class_id FROM class_students cs
            JOIN students s ON s.id = cs.student_id
            WHERE s.auth_user_id = auth.uid()
        )
    );

-- Step 4: Policies for games
-- Users can manage their own games
CREATE POLICY "Users can manage own games" ON games
    FOR ALL USING (user_id = auth.uid());

-- Students can view public games
CREATE POLICY "Students can view public games" ON games
    FOR SELECT USING (
        is_public = TRUE OR
        id IN (
            SELECT game_id FROM shared_games 
            WHERE shared_with_id = auth.uid()
        )
    );

-- Students can create their own games
CREATE POLICY "Students can create games" ON games
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'student') AND
        user_id = auth.uid()
    );

-- Step 5: Policies for shared_games
-- Users can see games shared with them
CREATE POLICY "Users can see shared games" ON shared_games
    FOR SELECT USING (shared_with_id = auth.uid());

-- Game owners can share their games
CREATE POLICY "Game owners can share games" ON shared_games
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM games 
            WHERE id = game_id AND user_id = auth.uid()
        )
    );

-- Step 6: Policies for student_teachers
-- Students can see their teacher relationships
CREATE POLICY "Students can see their teachers" ON student_teachers
    FOR SELECT USING (student_id = auth.uid());

-- Teachers can see their student relationships
CREATE POLICY "Teachers can see their students" ON student_teachers
    FOR SELECT USING (teacher_id = auth.uid());