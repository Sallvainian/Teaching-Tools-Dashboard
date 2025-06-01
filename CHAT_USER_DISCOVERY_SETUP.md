# Chat User Discovery Setup

## 🎯 **What This Solves**

The chat system now includes **smart user discovery** that determines who you can chat with based on **educational relationships** rather than a simple friends list.

## 🏫 **Educational Chat Logic**

### **For Teachers:**
- ✅ Can chat with **students in their classes**
- ✅ Can chat with **other teachers** (school-wide)
- ✅ Can create **group chats** with their students
- ✅ Can create **group chats** with other teachers

### **For Students:**
- ✅ Can chat with **their teachers only**
- ✅ Can chat with **classmates** (currently disabled, see below)
- ❌ **Cannot** see teachers they don't have classes with
- ❌ **Cannot** see students from other classes

## 🗄️ **Database Setup**

### Step 1: Apply User Discovery Functions

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy the entire contents of chat_user_discovery.sql and run it
```

The key functions created:
- `get_available_chat_users()` - Returns users you can chat with
- `can_users_chat(user1, user2)` - Checks if two users can chat
- `create_direct_conversation_safe()` - Creates conversations with permission checks

### Step 2: Test User Relationships

To test the system, ensure you have proper class relationships:

```sql
-- Example: Create a class and add students
INSERT INTO classes (id, name, user_id) VALUES 
('test-class-1', 'Math 101', 'YOUR_TEACHER_USER_ID');

INSERT INTO students (id, name, user_id) VALUES 
('test-student-1', 'John Doe', 'STUDENT_USER_ID_1'),
('test-student-2', 'Jane Smith', 'STUDENT_USER_ID_2');

INSERT INTO class_students (class_id, student_id) VALUES 
('test-class-1', 'test-student-1'),
('test-class-1', 'test-student-2');
```

## 🚀 **How to Use**

### Starting New Conversations

1. **Click "New Chat"** in the chat interface
2. **Modal opens** showing available users based on your role
3. **Choose Direct Message** for 1-on-1 chat
4. **Choose Group Chat** for multiple users
5. **Search users** by name, email, or class name
6. **Select users** and create conversation

### User Categories Shown

Users are tagged with their relationship to you:
- 🔵 **teacher** - Other teachers (if you're a teacher)
- 🟢 **student** - Students in your classes (if you're a teacher)
- 🟣 **classmate** - Students in same classes (if enabled)

## ⚙️ **Configuration Options**

### Enable Student-to-Student Chat

By default, students can only chat with teachers. To enable student-to-student chat within classes:

1. **Edit `chat_user_discovery.sql`**
2. **Uncomment the student-to-student sections** (marked with `/* */`)
3. **Re-run the SQL** in Supabase

### Permission Levels

The system enforces these rules:
- **Teachers ↔ Teachers**: Always allowed
- **Teachers ↔ Students**: Only if student is in teacher's class
- **Students ↔ Students**: Only if in same classes (when enabled)

## 🔍 **Testing the System**

### As a Teacher:
```sql
-- Check what users you can see
SELECT * FROM get_available_chat_users();
```

You should see:
- Students from your classes with class names listed
- Other teachers in the system

### As a Student:
```sql
-- Check what users you can see (run as student)
SELECT * FROM get_available_chat_users();
```

You should see:
- Only teachers from your classes
- Class names showing which classes you share

## 🛡️ **Security Features**

### Row Level Security (RLS)
- Users can only see conversations they're part of
- Database enforces permission checks
- No way to bypass relationship requirements

### Permission Validation
- `create_direct_conversation_safe()` validates permissions
- Prevents unauthorized conversation creation
- Clear error messages for permission denials

## 🎨 **UI Features**

### User Selection Modal
- **Search functionality** by name, email, or class
- **Relationship badges** showing user types
- **Class information** showing shared classes
- **Direct vs Group** conversation toggle
- **Visual selection** with checkmarks

### Smart Filtering
- Only shows users you can actually chat with
- Groups by relationship type
- Shows context (which classes you share)

## 🔧 **Advanced Customization**

### Adding Custom Relationships

You can extend the system to support:
- **Department-based** teacher groupings
- **Grade-level** permissions  
- **Administrative** roles
- **Parent-teacher** communication

Edit the `get_available_chat_users()` function to add custom logic.

### Bulk Messaging

For announcements, you can create functions to:
- Message entire classes
- Message all teachers
- Message by grade level

## 📋 **File Structure Created**

```
chat_user_discovery.sql                    # Database functions
src/lib/components/UserSelectModal.svelte  # User selection UI
src/routes/chat/+page.svelte              # Updated with modal
src/lib/stores/chat.ts                    # Added getAvailableChatUsers()
```

## 🎉 **Ready to Use!**

The chat system now has **intelligent user discovery** based on educational relationships. Users will only see and be able to chat with people they have legitimate educational connections with, ensuring privacy and appropriate communication channels.

**Test it out:**
1. Navigate to `/chat`
2. Click "New Chat"  
3. See your available users based on your role and classes!