-- RLS Policies for file_permissions table
-- Secure Microsoft Teams-style file sharing

-- Enable RLS on file_permissions table
ALTER TABLE file_permissions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view permissions for files they own
CREATE POLICY "file_owners_can_view_permissions" ON file_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM file_metadata 
            WHERE file_metadata.id = file_permissions.file_id 
            AND file_metadata.user_id = auth.uid()::text
        )
    );

-- Policy 2: Users can view permissions granted directly to them
CREATE POLICY "users_can_view_their_permissions" ON file_permissions
    FOR SELECT USING (user_id = auth.uid()::text);

-- Policy 3: Users can view permissions for classes they're involved with
CREATE POLICY "users_can_view_class_permissions" ON file_permissions
    FOR SELECT USING (
        class_id IS NOT NULL AND (
            -- Teachers can view permissions for their classes
            EXISTS (
                SELECT 1 FROM classes 
                WHERE classes.id = file_permissions.class_id 
                AND classes.teacher_id = auth.uid()::text
            ) OR
            -- Students can view permissions for their enrolled classes
            EXISTS (
                SELECT 1 FROM class_students cs
                JOIN students s ON s.id = cs.student_id
                WHERE cs.class_id = file_permissions.class_id 
                AND s.user_id = auth.uid()::text
            )
        )
    );

-- Policy 4: Users can view role-based permissions that match their role
CREATE POLICY "users_can_view_matching_role_permissions" ON file_permissions
    FOR SELECT USING (
        role IS NOT NULL AND EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid()::text 
            AND app_users.role = file_permissions.role
        )
    );

-- Policy 5: File owners can grant permissions
CREATE POLICY "file_owners_can_grant_permissions" ON file_permissions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM file_metadata 
            WHERE file_metadata.id = file_permissions.file_id 
            AND file_metadata.user_id = auth.uid()::text
        )
    );

-- Policy 6: Users can update permissions they granted
CREATE POLICY "granters_can_update_permissions" ON file_permissions
    FOR UPDATE USING (granted_by = auth.uid()::text);

-- Policy 7: Users can delete permissions they granted or for files they own
CREATE POLICY "granters_and_owners_can_delete_permissions" ON file_permissions
    FOR DELETE USING (
        granted_by = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM file_metadata 
            WHERE file_metadata.id = file_permissions.file_id 
            AND file_metadata.user_id = auth.uid()::text
        )
    );