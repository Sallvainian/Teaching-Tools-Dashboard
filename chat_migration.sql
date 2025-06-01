-- Chat system database schema
-- Run this in Supabase SQL editor to create chat tables

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE,
    reply_to UUID REFERENCES messages(id) ON DELETE SET NULL
);

-- Message attachments
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Updated_at trigger for conversations
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW(), last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- RLS (Row Level Security) policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Users can only see conversations they're part of
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM conversation_participants 
            WHERE conversation_id = conversations.id 
            AND user_id = auth.uid()
        )
    );

-- Users can only see participants in conversations they're part of
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM conversation_participants 
            WHERE conversation_id = conversation_participants.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Users can only see messages in conversations they're part of
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Users can only send messages to conversations they're part of
CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 
            FROM conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Users can view attachments in conversations they're part of
CREATE POLICY "Users can view attachments in their conversations" ON message_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
            WHERE m.id = message_attachments.message_id
            AND cp.user_id = auth.uid()
        )
    );

-- Users can create conversations (will be handled by functions)
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can join conversations (will be handled by functions)
CREATE POLICY "Users can join conversations" ON conversation_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Functions for chat operations

-- Function to create a direct conversation
CREATE OR REPLACE FUNCTION create_direct_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    current_user_id UUID := auth.uid();
BEGIN
    -- Check if conversation already exists between these users
    SELECT c.id INTO conversation_id
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE c.type = 'direct'
    AND cp1.user_id = current_user_id
    AND cp2.user_id = other_user_id;

    -- If conversation doesn't exist, create it
    IF conversation_id IS NULL THEN
        INSERT INTO conversations (type, created_by)
        VALUES ('direct', current_user_id)
        RETURNING id INTO conversation_id;

        -- Add both participants
        INSERT INTO conversation_participants (conversation_id, user_id, role)
        VALUES 
            (conversation_id, current_user_id, 'member'),
            (conversation_id, other_user_id, 'member');
    END IF;

    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a group conversation
CREATE OR REPLACE FUNCTION create_group_conversation(conversation_name TEXT, participant_ids UUID[])
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    participant_id UUID;
    current_user_id UUID := auth.uid();
BEGIN
    -- Create the conversation
    INSERT INTO conversations (name, type, created_by)
    VALUES (conversation_name, 'group', current_user_id)
    RETURNING id INTO conversation_id;

    -- Add creator as admin
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    VALUES (conversation_id, current_user_id, 'admin');

    -- Add other participants
    FOREACH participant_id IN ARRAY participant_ids
    LOOP
        IF participant_id != current_user_id THEN
            INSERT INTO conversation_participants (conversation_id, user_id, role)
            VALUES (conversation_id, participant_id, 'member');
        END IF;
    END LOOP;

    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for all chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_attachments;
