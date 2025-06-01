-- File Permissions System Migration
-- Microsoft Teams-style file sharing and permissions

-- Create file_permissions table
CREATE TABLE IF NOT EXISTS file_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
    
    -- Permission recipients (one of these should be set)
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('teacher', 'student', 'admin')),
    
    -- Permission details
    permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'edit', 'contribute', 'owner')),
    share_scope TEXT NOT NULL CHECK (share_scope IN ('private', 'class', 'school', 'public')),
    
    -- Audit fields
    granted_by UUID NOT NULL REFERENCES app_users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT file_permissions_recipient_check 
        CHECK (
            (user_id IS NOT NULL AND class_id IS NULL AND role IS NULL) OR
            (user_id IS NULL AND class_id IS NOT NULL AND role IS NULL) OR
            (user_id IS NULL AND class_id IS NULL AND role IS NOT NULL)
        ),
    
    -- Unique constraints to prevent duplicate permissions
    UNIQUE(file_id, user_id),
    UNIQUE(file_id, class_id),
    UNIQUE(file_id, role)
);-- Create classes table if it doesn't exist
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    grade_level TEXT,
    subject TEXT,
    teacher_id UUID NOT NULL REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create class_students junction table
CREATE TABLE IF NOT EXISTS class_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_permissions_file_id ON file_permissions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_permissions_user_id ON file_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_file_permissions_class_id ON file_permissions(class_id);
CREATE INDEX IF NOT EXISTS idx_file_permissions_role ON file_permissions(role);
CREATE INDEX IF NOT EXISTS idx_file_permissions_granted_by ON file_permissions(granted_by);
CREATE INDEX IF NOT EXISTS idx_file_permissions_expires_at ON file_permissions(expires_at);

-- Create indexes for class relationships
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);

-- Update existing file_metadata table with sharing flags
ALTER TABLE file_metadata 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS share_scope TEXT DEFAULT 'private' CHECK (share_scope IN ('private', 'class', 'school', 'public'));-- Create function to update file sharing status
CREATE OR REPLACE FUNCTION update_file_sharing_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update file_metadata to reflect sharing status
    UPDATE file_metadata 
    SET 
        is_shared = EXISTS (
            SELECT 1 FROM file_permissions 
            WHERE file_id = COALESCE(NEW.file_id, OLD.file_id)
        ),
        share_scope = COALESCE(
            (SELECT share_scope FROM file_permissions 
             WHERE file_id = COALESCE(NEW.file_id, OLD.file_id) 
             ORDER BY 
                CASE share_scope 
                    WHEN 'public' THEN 4
                    WHEN 'school' THEN 3
                    WHEN 'class' THEN 2
                    WHEN 'private' THEN 1
                END DESC
             LIMIT 1),
            'private'
        )
    WHERE id = COALESCE(NEW.file_id, OLD.file_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update sharing status
DROP TRIGGER IF EXISTS file_permissions_sharing_update ON file_permissions;
CREATE TRIGGER file_permissions_sharing_update
    AFTER INSERT OR UPDATE OR DELETE ON file_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_file_sharing_status();