# Supabase Documentation Reference Guide

This document provides a comprehensive reference for Supabase functionality, focusing on the JavaScript/TypeScript client and related features. Use this as a quick reference when implementing Supabase in our Teacher Dashboard application.

## Table of Contents

- [Client Initialization](#client-initialization)
- [Database Operations](#database-operations)
  - [Querying Data](#querying-data)
  - [Inserting Data](#inserting-data)
  - [Updating Data](#updating-data)
  - [Deleting Data](#deleting-data)
  - [Filtering Data](#filtering-data)
- [Authentication](#authentication)
  - [User Signup](#user-signup)
  - [User Login](#user-login)
  - [Session Management](#session-management)
- [Realtime Subscriptions](#realtime-subscriptions)
- [Storage](#storage)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Database Connection](#database-connection)
- [Troubleshooting](#troubleshooting)
  - [Infinite Recursion in RLS Policies](#infinite-recursion-in-rls-policies)
  - [Server-Side Rendering Issues](#server-side-rendering-issues)

---

## Client Initialization

Initialize the Supabase client to interact with your Supabase project:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project-url.supabase.co',
  'your-anon-key'
)
```

### Advanced Configuration

```typescript
const options = {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
}

const supabase = createClient(
  "https://your-project-url.supabase.co", 
  "your-anon-key", 
  options
)
```

---

## Database Operations

### Querying Data

#### Basic Select

```typescript
// Select all columns
const { data, error } = await supabase
  .from('table_name')
  .select()

// Select specific columns
const { data, error } = await supabase
  .from('table_name')
  .select('column1, column2')
```

#### Relationships

```typescript
// Select related data
const { data, error } = await supabase
  .from('table_name')
  .select(`
    column1,
    column2,
    related_table(
      related_column1,
      related_column2
    )
  `)
```

#### Count

```typescript
// Get count of rows
const { count, error } = await supabase
  .from('table_name')
  .select('*', { count: 'exact' })
```

### Inserting Data

#### Single Row

```typescript
const { data, error } = await supabase
  .from('table_name')
  .insert({ column1: 'value1', column2: 'value2' })
  .select()
```

#### Multiple Rows

```typescript
const { data, error } = await supabase
  .from('table_name')
  .insert([
    { column1: 'value1', column2: 'value2' },
    { column1: 'value3', column2: 'value4' }
  ])
  .select()
```

### Updating Data

```typescript
const { data, error } = await supabase
  .from('table_name')
  .update({ column1: 'new_value' })
  .eq('id', 1)
  .select()
```

### Deleting Data

```typescript
const { data, error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', 1)
```

### Filtering Data

```typescript
// Equals
const { data, error } = await supabase
  .from('table_name')
  .select()
  .eq('column', 'value')

// Greater than
const { data, error } = await supabase
  .from('table_name')
  .select()
  .gt('column', 'value')

// Less than
const { data, error } = await supabase
  .from('table_name')
  .select()
  .lt('column', 'value')

// Range
const { data, error } = await supabase
  .from('table_name')
  .select()
  .range(0, 9)

// Or condition
const { data, error } = await supabase
  .from('table_name')
  .select()
  .or('column1.eq.value1,column2.eq.value2')
```

---

## Authentication

### User Signup

#### Email and Password

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'example-password'
})
```

#### With Additional User Metadata

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'example-password',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe'
    }
  }
})
```

### User Login

#### Email and Password

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'example@email.com',
  password: 'example-password',
})
```

#### Phone and Password

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  phone: '+13334445555',
  password: 'example-password',
})
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut()
```

### Session Management

#### Get Current Session

```typescript
const { data, error } = await supabase.auth.getSession()
```

#### Get Current User

```typescript
const { data: { user } } = await supabase.auth.getUser()
```

#### Session State Change Listener

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session)
})
```

---

## Realtime Subscriptions

### Listen to Database Changes

```typescript
// Set up the channel
const channel = supabase
  .channel('schema-db-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // Listen to all changes
      schema: 'public',
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// Later, unsubscribe
supabase.removeChannel(channel)
```

### Listen to Specific Table

```typescript
const channel = supabase
  .channel('table-db-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // or 'INSERT' or 'UPDATE' or 'DELETE'
      schema: 'public',
      table: 'table_name',
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

### Presence

```typescript
// Track user presence
const channel = supabase.channel('room')
channel.on('presence', { event: 'sync' }, () => {
  const newPresenceState = channel.presenceState()
  console.log('Synced presence state:', newPresenceState)
}).subscribe()

// Update user presence
await channel.track({ user: 'user-1', online_at: new Date().toISOString() })
```

---

## Storage

### Create Bucket

```typescript
const { data, error } = await supabase
  .storage
  .createBucket('bucket-name', {
    public: false,
    allowedMimeTypes: ['image/png'],
    fileSizeLimit: 1024 * 1024 // 1MB
  })
```

### Upload File

```typescript
const file = event.target.files[0]
const { data, error } = await supabase
  .storage
  .from('bucket-name')
  .upload('folder/file-name.png', file, {
    cacheControl: '3600',
    upsert: false
  })
```

### Download File

```typescript
const { data, error } = await supabase
  .storage
  .from('bucket-name')
  .download('folder/file-name.png')
```

### Generate Public URL

```typescript
const { data } = supabase
  .storage
  .from('bucket-name')
  .getPublicUrl('folder/file-name.png')
```

### Delete File

```typescript
const { error } = await supabase
  .storage
  .from('bucket-name')
  .remove(['folder/file-name.png'])
```

---

## Row Level Security (RLS)

### Policy Examples

#### Authentication Required

```sql
CREATE POLICY "User can only access their own data" 
ON table_name 
FOR ALL 
USING (auth.uid() = user_id);
```

#### Select Policy

```sql
CREATE POLICY "Users can view their own items" 
ON table_name 
FOR SELECT 
USING (auth.uid() = user_id);
```

#### Insert Policy

```sql
CREATE POLICY "Users can create their own items" 
ON table_name 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
```

#### Update Policy

```sql
CREATE POLICY "Users can update their own items" 
ON table_name 
FOR UPDATE 
USING (auth.uid() = user_id);
```

#### Delete Policy

```sql
CREATE POLICY "Users can delete their own items" 
ON table_name 
FOR DELETE 
USING (auth.uid() = user_id);
```

---

## Database Connection

### Connection Methods

#### Frontend Applications
Use the Supabase client library for frontend connections.

#### Direct Connection (for persistent servers)
```
postgresql://postgres:[YOUR-PASSWORD]@db.example.supabase.co:5432/postgres
```

#### Pooled Connection (for serverless functions)
```
postgres://postgres.example:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Connection Pooler Options

1. **Direct Connection**
   - Best for persistent servers
   - Uses IPv6 by default

2. **Shared Pooler (Session Mode)**
   - Ideal when IPv6 is not supported
   - Port 5432

3. **Transaction Mode**
   - Best for serverless functions
   - Port 6543
   - Does not support prepared statements

4. **Dedicated Pooler**
   - For paying customers
   - Best performance and latency

---

## TypeScript Support

The Supabase client provides built-in TypeScript support through generics:

```typescript
// Define your table types
interface Profile {
  id: number
  name: string
  email: string
}

// Use type with operations
const { data, error } = await supabase
  .from<Profile>('profiles')
  .select('id, name, email')
```

For a more comprehensive type safety approach, you can generate types from your database schema:

```bash
# Install the Supabase CLI
pnpm install -g supabase

# Generate types
supabase gen types typescript --project-id your-project-id > supabase.types.ts
```

Then use the generated types:

```typescript
import { Database } from './supabase.types'
type Profile = Database['public']['Tables']['profiles']['Row']

const { data, error } = await supabase
  .from('profiles')
  .select()
  .returns<Profile[]>()
```

---

## Troubleshooting

### Infinite Recursion in RLS Policies

If you encounter this error:

```
Error during fetchJeopardyGames: {
  code: '42P17',
  details: null,
  hint: null,
  message: 'infinite recursion detected in policy for relation "users"'
}
```

This is caused by circular references in RLS policies. Here's how to fix it:

1. **Identify Problematic Policies**: The issue usually occurs in policies that reference other tables with their own policies, creating a circular dependency.

2. **Drop and Recreate Problematic Policies**: In the SQL editor of your Supabase dashboard, run:

```sql
-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Admin can view all user data" ON users;
DROP POLICY IF EXISTS "Admin can update all user data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Create simpler policies that avoid recursion
CREATE POLICY "Users can view their own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
  ON users FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- If you need admin policies, use direct role checks
CREATE POLICY "Admin role can view all user data" 
  ON users FOR SELECT 
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

3. **Avoid Nested SELECTs in Policies**: Instead of using:

```sql
-- This can cause recursion
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
```

Use direct checks:

```sql
-- This avoids recursion
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

4. **Simplify Complex Joins in Policies**: If policies reference multiple tables, ensure there are no circular dependencies.

#### Prevention Strategies:

1. **Layer your policies**: Use separate policies for different operations (SELECT, INSERT, UPDATE, DELETE)
2. **Use direct equality checks** when possible
3. **Avoid deep subqueries** in policy definitions
4. **Test policies incrementally** when adding complex rules

### Server-Side Rendering Issues

When using SvelteKit with Supabase, you may encounter errors like:

```
Error initializing gradebook store: ReferenceError: localStorage is not defined
```

This happens because SvelteKit runs on both the server and client, but browser APIs like `localStorage` are only available on the client. To fix this:

1. **Check for Browser Environment**:

```typescript
// Check if code is running in browser
if (typeof window !== 'undefined') {
  // Safe to use localStorage, window, document, etc.
  localStorage.getItem('key');
}
```

2. **Defer Initialization**:

```typescript
// In stores or components
import { browser } from '$app/environment';
import { onMount } from 'svelte';

// Store creation
export function createStore() {
  // Create stores without initializing data
  
  // Initialize only on client-side
  if (browser) {
    initialize();
  }

  // Or use onMount in components
  onMount(() => {
    initialize();
  });
}
```

3. **Use SvelteKit Load Functions**:

```typescript
// In +page.ts or +layout.ts
export const load = ({ data }) => {
  // This runs on server during SSR and on client during hydration
  return {
    // Return data needed by the page
  };
};
```

4. **Handle Both Environments Gracefully**:

```typescript
// In supabase client setup
import { browser } from '$app/environment';

// Set default values for server-side rendering
const supabaseUrl = browser 
  ? import.meta.env.PUBLIC_SUPABASE_URL 
  : 'placeholder-for-ssr';

const supabaseKey = browser 
  ? import.meta.env.PUBLIC_SUPABASE_ANON_KEY 
  : 'placeholder-for-ssr';
```

5. **Use Error Handling**:

```typescript
// Safely initialize data
try {
  // Potentially browser-only code
} catch (error) {
  console.error('Error initializing store:', error);
  // Provide fallback data for SSR
}
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [JavaScript Client Reference](https://supabase.com/docs/reference/javascript)
- [Auth Reference](https://supabase.com/docs/reference/javascript/auth-signup)
- [Database Reference](https://supabase.com/docs/reference/javascript/select)
- [Storage Reference](https://supabase.com/docs/reference/javascript/storage-createbucket)
- [Realtime Reference](https://supabase.com/docs/reference/javascript/subscribe)