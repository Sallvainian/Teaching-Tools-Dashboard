-- Add soft delete columns to file_metadata table
ALTER TABLE file_metadata 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on non-deleted files
CREATE INDEX IF NOT EXISTS idx_file_metadata_is_deleted 
ON file_metadata(is_deleted) 
WHERE is_deleted = FALSE;

-- Create a view for active (non-deleted) files
CREATE OR REPLACE VIEW active_file_metadata AS
SELECT * FROM file_metadata
WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Create a view for deleted files (trash)
CREATE OR REPLACE VIEW deleted_file_metadata AS
SELECT * FROM file_metadata
WHERE is_deleted = TRUE;

-- Function to soft delete a file
CREATE OR REPLACE FUNCTION soft_delete_file(file_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE file_metadata
    SET 
        is_deleted = TRUE,
        deleted_at = NOW()
    WHERE id = file_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to restore a deleted file
CREATE OR REPLACE FUNCTION restore_deleted_file(file_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE file_metadata
    SET 
        is_deleted = FALSE,
        deleted_at = NULL
    WHERE id = file_id AND is_deleted = TRUE;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to permanently delete files older than 30 days
CREATE OR REPLACE FUNCTION purge_old_deleted_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    file_record RECORD;
BEGIN
    deleted_count := 0;
    
    -- Loop through files deleted more than 30 days ago
    FOR file_record IN 
        SELECT id, storage_path 
        FROM file_metadata 
        WHERE is_deleted = TRUE 
        AND deleted_at < NOW() - INTERVAL '30 days'
    LOOP
        -- Delete from storage (this needs to be done from the application)
        -- For now, just delete the metadata
        DELETE FROM file_metadata WHERE id = file_record.id;
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to respect soft delete
-- Drop existing select policy if it exists
DROP POLICY IF EXISTS "Users can view own files" ON file_metadata;

-- Create new policy that excludes deleted files by default
CREATE POLICY "Users can view own non-deleted files" ON file_metadata
    FOR SELECT USING (
        auth.uid() = user_id 
        AND (is_deleted = FALSE OR is_deleted IS NULL)
    );

-- Create policy for viewing deleted files (trash)
CREATE POLICY "Users can view own deleted files" ON file_metadata
    FOR SELECT USING (
        auth.uid() = user_id 
        AND is_deleted = TRUE
    );

-- Update policy for delete to use soft delete
DROP POLICY IF EXISTS "Users can delete own files" ON file_metadata;

CREATE POLICY "Users can soft delete own files" ON file_metadata
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);