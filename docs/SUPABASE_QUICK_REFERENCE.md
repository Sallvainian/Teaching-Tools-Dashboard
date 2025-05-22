# Supabase Quick Reference

## Client Setup

```typescript
// Initialize Supabase client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'public' },
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
```

## Authentication

```typescript
// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: { name: 'John Doe', role: 'teacher' }
  }
});

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Sign Out
const { error } = await supabase.auth.signOut();

// Get Current User
const { data: { user }, error } = await supabase.auth.getUser();
```

## Database Operations

### Read Operations

```typescript
// Select all rows
const { data, error } = await supabase
  .from('table_name')
  .select();

// Select specific columns
const { data, error } = await supabase
  .from('table_name')
  .select('id, name, created_at');

// Get item by ID
const { data, error } = await supabase
  .from('table_name')
  .select()
  .eq('id', itemId)
  .single();

// Filter rows
const { data, error } = await supabase
  .from('table_name')
  .select()
  .eq('status', 'active')
  .lt('age', 30);

// Join tables
const { data, error } = await supabase
  .from('students')
  .select(`
    id, 
    name,
    grades (
      assignment_id,
      score
    )
  `);
```

### Write Operations

```typescript
// Insert row
const { data, error } = await supabase
  .from('table_name')
  .insert({ name: 'New Item', description: 'Description' })
  .select()
  .single();

// Update row
const { data, error } = await supabase
  .from('table_name')
  .update({ name: 'Updated Name' })
  .eq('id', itemId)
  .select()
  .single();

// Delete row
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', itemId);
```

## Teacher Dashboard SupabaseService

```typescript
import { supabaseService } from '$lib/services/supabaseService';

// Authentication
await supabaseService.signIn(email, password);
await supabaseService.signUp(email, password, userData);
await supabaseService.signOut();
const user = await supabaseService.getCurrentUser();

// CRUD Operations
const items = await supabaseService.getItems('table_name', {
  columns: 'id, name',
  filters: { status: 'active' }
});

const item = await supabaseService.getItemById('table_name', itemId);

const newItem = await supabaseService.insertItem('table_name', {
  name: 'New Item',
  description: 'Description'
});

const updatedItem = await supabaseService.updateItem('table_name', itemId, {
  name: 'Updated Name'
});

const success = await supabaseService.deleteItem('table_name', itemId);

// Relations
const relatedItems = await supabaseService.getItemsWithRelation(
  'assignments',
  'grades',
  'assignment_id',
  assignmentId
);

// LocalStorage Mode
supabaseService.setUseSupabase(false); // Switch to localStorage
const isOnline = supabaseService.isUsingSupabase(); // Check current mode
```

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- User can only see their own data
CREATE POLICY "Users can only view their own data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

-- User can only insert their own data  
CREATE POLICY "Users can only insert their own data" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User can only update their own data
CREATE POLICY "Users can only update their own data" ON table_name
  FOR UPDATE USING (auth.uid() = user_id);

-- User can only delete their own data
CREATE POLICY "Users can only delete their own data" ON table_name
  FOR DELETE USING (auth.uid() = user_id);
```

## TypeScript Integration

```typescript
// Generate types from Supabase schema
// supabase gen types typescript --linked > src/lib/types/database.ts

// Use generated types
import type { Database } from '$lib/types/database';

// Type-safe client
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Type-safe queries
const { data } = await supabase
  .from('students')
  .select()
  .returns<Tables<'students'>[]>();
```

## Error Handling

```typescript
try {
  const { data, error } = await supabase.from('table_name').select();
  
  if (error) {
    throw error;
  }
  
  // Process data...
} catch (error) {
  console.error('Database error:', error);
  // Show user-friendly error
}
```

## Realtime Subscriptions

```typescript
// Subscribe to table changes
const channel = supabase
  .channel('table_changes')
  .on(
    'postgres_changes',
    {
      event: '*', // or 'INSERT', 'UPDATE', 'DELETE'
      schema: 'public',
      table: 'table_name'
    },
    (payload) => {
      console.log('Change received:', payload);
      // Update UI or state
    }
  )
  .subscribe();

// Unsubscribe
channel.unsubscribe();
```

## Storage

```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('bucket_name')
  .upload('file_path', file);

// Download file
const { data, error } = await supabase.storage
  .from('bucket_name')
  .download('file_path');

// Get public URL
const { data } = supabase.storage
  .from('bucket_name')
  .getPublicUrl('file_path');
```

## Environment Variables

Set these in a `.env` file:

```
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```