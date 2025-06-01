# Chat System Setup Instructions

## 1. Database Setup

To set up the chat system, you need to run the SQL migration to create the necessary database tables.

### Steps:

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Migration**
   - Copy the entire contents of `chat_migration.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the migration

4. **Verify Tables Created**
   After running the migration, you should see these new tables in your database:
   - `conversations`
   - `conversation_participants` 
   - `messages`
   - `message_attachments`

## 2. Update TypeScript Types

After creating the database tables, you need to regenerate the TypeScript types:

```bash
# If using Supabase CLI locally
supabase gen types typescript --local > src/lib/types/database.ts

# If using remote Supabase project
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/types/database.ts
```

## 3. Test the Chat System

1. **Login to your application**
2. **Navigate to the Chat page** (`/chat`)
3. **The system should now:**
   - Load conversations from the database (initially empty)
   - Show a loading state while fetching data
   - Display "No conversations found" if you have no conversations yet
   - Allow you to send messages once conversations are created

## 4. Creating Test Conversations

To test the chat system, you can create conversations programmatically:

### Option A: Using the SQL Editor
```sql
-- Create a direct conversation between two users
SELECT create_direct_conversation('OTHER_USER_ID_HERE');

-- Create a group conversation
SELECT create_group_conversation(
  'Test Group Chat',
  ARRAY['USER_ID_1', 'USER_ID_2', 'USER_ID_3']
);
```

### Option B: Add UI for creating conversations
You can extend the "New Chat" button to actually create conversations by:
1. Adding a modal to select users
2. Calling `chatStore.createDirectConversation()` or `chatStore.createGroupConversation()`

## 5. Features Included

The chat system includes:

✅ **Real-time messaging** - Messages appear instantly using Supabase real-time subscriptions
✅ **Direct and group conversations** - Support for both 1-on-1 and group chats
✅ **Message history** - All messages are persisted in the database
✅ **Unread message counts** - Track which messages haven't been read
✅ **Online status indicators** - Framework for showing who's online
✅ **Message attachments** - Database schema supports file attachments
✅ **Row Level Security** - Users can only see conversations they're part of
✅ **Proper TypeScript types** - Full type safety throughout
✅ **Error handling** - Graceful error handling and loading states
✅ **Responsive UI** - Works on all device sizes

## 6. Next Steps (Optional Enhancements)

- **File attachments**: Implement actual file upload functionality
- **Online status**: Add real online/offline status tracking
- **Typing indicators**: Show when someone is typing
- **Message reactions**: Add emoji reactions to messages
- **Message editing/deletion**: Allow users to edit or delete messages
- **Push notifications**: Notify users of new messages
- **Search functionality**: Search through message history
- **Message pagination**: Load older messages on demand

## Troubleshooting

### Issue: TypeScript errors after migration
**Solution**: Regenerate the database types (step 2 above)

### Issue: "User not authenticated" errors
**Solution**: Make sure you're logged in and the auth system is working

### Issue: RLS policy errors
**Solution**: The migration includes proper RLS policies, but verify your user has the correct permissions

### Issue: Real-time not working
**Solution**: Ensure your Supabase project has real-time enabled for the chat tables

## Database Schema Overview

```
conversations
├── id (UUID, primary key)
├── name (text, nullable for direct chats)
├── type ('direct' | 'group')
├── created_at, updated_at, last_message_at
└── created_by (references app_users)

conversation_participants
├── conversation_id (references conversations)
├── user_id (references app_users) 
├── role ('member' | 'admin')
└── last_read_at (for unread counts)

messages
├── id (UUID, primary key)
├── conversation_id (references conversations)
├── sender_id (references app_users)
├── content (text)
├── message_type ('text' | 'image' | 'file')
└── created_at, updated_at, edited_at

message_attachments
├── message_id (references messages)
├── file_url, file_name, file_type
└── file_size
```

The chat system is now fully functional and ready to use!