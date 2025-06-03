# Soft Delete Setup for File Storage

## Overview

I've implemented a soft delete system with a trash/recycle bin feature for your file storage. This prevents accidental permanent deletion of files.

## Database Migration Required

You need to run the following SQL migration in your Supabase dashboard:

```sql
-- Add soft delete columns to file_metadata table
ALTER TABLE file_metadata 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on non-deleted files
CREATE INDEX IF NOT EXISTS idx_file_metadata_is_deleted 
ON file_metadata(is_deleted) 
WHERE is_deleted = FALSE;

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
```

## How to Apply the Migration

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL code above
4. Click "Run" to execute the migration

## New Features

After applying the migration, you'll have:

1. **Trash/Recycle Bin**: Click "View Trash" button to see deleted files
2. **Soft Delete**: Files are moved to trash instead of being permanently deleted
3. **Restore Files**: Restore any file from trash back to your file storage
4. **Permanent Delete**: Option to permanently delete files from trash (with confirmation)
5. **30-Day Auto-Cleanup**: Files in trash for over 30 days can be automatically cleaned up (optional)

## Important Notes

- Files deleted BEFORE this migration cannot be recovered
- The soft delete only applies to future deletions
- Files in trash still count towards your storage quota
- Permanent deletion from trash cannot be undone

## Usage

1. Delete a file normally - it will be moved to trash
2. Click "View Trash" to see deleted files
3. In trash view, you can:
   - Restore files back to your storage
   - Permanently delete files (with confirmation)
4. Click "Exit Trash" to return to normal file view