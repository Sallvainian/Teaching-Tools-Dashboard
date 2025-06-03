-- Enable Row Level Security on message_attachments table
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view attachments for messages they can see
-- This policy allows users to see attachments if they are participants in the conversation
CREATE POLICY "Users can view attachments for messages they can access" ON public.message_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM messages m
            JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
            WHERE m.id = message_attachments.message_id
            AND cp.user_id = auth.uid()
            AND cp.is_active = true
        )
    );

-- Policy 2: Users can insert attachments for their own messages
CREATE POLICY "Users can insert attachments for their own messages" ON public.message_attachments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM messages m
            WHERE m.id = message_attachments.message_id
            AND m.sender_id = auth.uid()
        )
    );

-- Policy 3: Users can update their own message attachments
CREATE POLICY "Users can update their own message attachments" ON public.message_attachments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 
            FROM messages m
            WHERE m.id = message_attachments.message_id
            AND m.sender_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM messages m
            WHERE m.id = message_attachments.message_id
            AND m.sender_id = auth.uid()
        )
    );

-- Policy 4: Users can delete their own message attachments
CREATE POLICY "Users can delete their own message attachments" ON public.message_attachments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 
            FROM messages m
            WHERE m.id = message_attachments.message_id
            AND m.sender_id = auth.uid()
        )
    );

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.message_attachments TO authenticated;

-- Add comment explaining the security model
COMMENT ON TABLE public.message_attachments IS 'Stores file attachments for messages. Access is controlled via RLS policies that check message ownership and conversation participation.';