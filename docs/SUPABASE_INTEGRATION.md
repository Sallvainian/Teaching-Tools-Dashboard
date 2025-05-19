# Supabase Integration Documentation

## Overview

This document details the Supabase integration in the SvelteKit Teacher Dashboard application. The implementation provides a robust dual-storage system with Supabase as the primary database and localStorage as a fallback mechanism.

## Architecture

### 1. Client Initialization

The Supabase client is initialized in `src/lib/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://yutlcpluuhjxwudfathv.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  {
    db: { schema: 'public' },
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);
```

### 2. Service Layer Pattern

The application uses a service layer pattern implemented in `src/lib/services/supabaseService.ts`:

```typescript
export class SupabaseService {
  private useSupabase: boolean;
  private readonly storagePrefix: string;

  // Generic CRUD operations with fallback
  async getItems<T>(table: T, options?: QueryOptions): Promise<Tables<T>[]>
  async getItemById<T>(table: T, id: string): Promise<Tables<T> | null>
  async insertItem<T>(table: T, data: Inserts<T>): Promise<Tables<T> | null>
  async updateItem<T>(table: T, id: string, data: Updates<T>): Promise<Tables<T> | null>
  async deleteItem<T>(table: T, id: string | CompositeKey): Promise<boolean>
}
```

## Authentication Flow

### 1. Auth Store (`src/lib/stores/auth.ts`)

The auth store manages the authentication state:

```typescript
function createAuthStore() {
  const user = writable<User | null>(null);
  const session = writable<AuthSession | null>(null);
  const loading = writable(true);
  const isAuthenticated = derived(user, ($user) => !!$user);

  async function initialize() {
    // Check existing session on load
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      session.set(data.session);
      user.set(data.session.user);
    }
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, newSession) => {
      if (newSession) {
        session.set(newSession);
        user.set(newSession.user);
      } else {
        session.set(null);
        user.set(null);
      }
    });
  }

  // Auth methods
  async function signIn(email: string, password: string) { ... }
  async function signUp(email: string, password: string, userData: any) { ... }
  async function signOut() { ... }
  async function resetPassword(email: string) { ... }
}
```

### 2. Root Layout Integration

The authentication state is initialized in the root layout:

```typescript
// src/routes/+layout.ts
import { authStore } from '$lib/stores/auth';
import { initializeDB } from '$lib/supabaseClient';

if (typeof window !== 'undefined') {
  initializeDB();
  authStore.initialize();
}
```

### 3. Component Integration

Auth components interact with the auth store:

```svelte
<!-- src/lib/components/auth/LoginForm.svelte -->
<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  
  async function handleSubmit() {
    try {
      await authStore.signIn(email, password);
      // Success - auth store handles navigation
    } catch (err) {
      error = err.message;
    }
  }
</script>
```

## Data Management

### 1. Store Pattern

Stores follow a consistent pattern with Supabase integration:

```typescript
function createGradebookStore() {
  // State
  const students = writable<Student[]>([]);
  const categories = writable<Category[]>([]);
  
  // Load data from Supabase or localStorage
  async function loadAllData() {
    try {
      const studentsData = await gradebookService.getItems('students');
      const categoriesData = await gradebookService.getItems('categories');
      
      // Transform and set data
      students.set(studentsData.map(transformStudent));
      categories.set(categoriesData.map(transformCategory));
    } catch (err) {
      error.set(err.message);
    }
  }
  
  // CRUD operations
  async function addStudent(name: string) {
    const result = await gradebookService.insertItem('students', { name });
    if (result) {
      students.update(arr => [...arr, transformStudent(result)]);
    }
  }
}
```

### 2. Type Safety

The integration maintains full type safety with generated types:

```typescript
// src/lib/types/database.ts
export interface Database {
  public: {
    Tables: {
      students: {
        Row: { id: string; name: string; ... }
        Insert: { id?: string; name: string; ... }
        Update: { id?: string; name?: string; ... }
      }
      // ... other tables
    }
  }
}
```

### 3. Data Transformation

Data is transformed between database and application formats:

```typescript
// src/lib/utils/modelConverters.ts
export function dbStudentToAppStudent(dbStudent: Tables<'students'>): Student {
  return {
    id: dbStudent.id,
    name: dbStudent.name,
    email: dbStudent.email || '',
    // ... other fields
  };
}
```

## Dual Storage Strategy

### 1. Fallback Mechanism

The service layer automatically falls back to localStorage:

```typescript
public async getItems<T>(table: T): Promise<Tables<T>[]> {
  if (this.useSupabase) {
    try {
      const { data, error } = await supabase.from(table).select();
      if (error) throw error;
      return data;
    } catch (err) {
      // Fallback to localStorage
      return this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
    }
  } else {
    // Direct localStorage usage
    return this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
  }
}
```

### 2. Synchronization

Data is synchronized between Supabase and localStorage:

```typescript
public async insertItem<T>(table: T, data: Inserts<T>): Promise<Tables<T> | null> {
  if (this.useSupabase) {
    try {
      const { data: insertedData, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      
      // Also update localStorage
      const existingItems = this.loadFromStorage<Tables<T>[]>(`${String(table)}`, []);
      this.saveToStorage(`${String(table)}`, [...existingItems, insertedData]);
      
      return insertedData;
    } catch (err) {
      // Fallback to localStorage only
      return this.insertLocalOnly(table, data);
    }
  }
}
```

### 3. Mode Switching

Users can toggle between Supabase and localStorage:

```typescript
function setUseSupabase(value: boolean): void {
  useSupabase.set(value);
  gradebookService.setUseSupabase(value);
  if (value) {
    // Reload data from Supabase
    void loadAllData();
  }
}
```

## Security Considerations

### 1. Row Level Security (RLS)

Tables should have appropriate RLS policies:

```sql
-- Example RLS policy for students table
CREATE POLICY "Users can view their own students"
ON students FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students"
ON students FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 2. Authentication Guards

Routes can be protected using the auth state:

```svelte
<!-- src/routes/+layout.svelte -->
{#if $isAuthenticated}
  <AuthenticatedContent />
{:else}
  <LoginPrompt />
{/if}
```

### 3. Secure API Keys

Only the anon key is exposed to the client. Row Level Security ensures data access control.

## Performance Optimizations

### 1. Lazy Loading

Supabase client is imported dynamically:

```typescript
async function signIn(email: string, password: string) {
  const { supabase } = await import('$lib/supabaseClient');
  // Use supabase client
}
```

### 2. Batch Operations

Multiple related operations can be batched:

```typescript
async function loadAllData() {
  const [students, categories, assignments] = await Promise.all([
    gradebookService.getItems('students'),
    gradebookService.getItems('categories'),
    gradebookService.getItems('assignments')
  ]);
}
```

### 3. Caching Strategy

LocalStorage acts as a cache for offline performance:

```typescript
// Check localStorage first for immediate UI update
const cachedData = this.loadFromStorage(key, []);
if (cachedData.length > 0) {
  updateUI(cachedData);
}

// Then fetch fresh data from Supabase
const freshData = await this.fetchFromSupabase(key);
updateUI(freshData);
```

## Error Handling

### 1. Graceful Degradation

Errors are caught and the app continues with localStorage:

```typescript
try {
  const result = await supabase.from(table).select();
  return result.data;
} catch (error) {
  console.error(`Supabase error for ${table}:`, error);
  return this.loadFromStorage(table, []);
}
```

### 2. User Feedback

Error states are communicated to users:

```typescript
const error = writable<string | null>(null);

try {
  await performOperation();
} catch (err) {
  error.set(err.message || 'An error occurred');
}
```

## Real-time Features (Future)

The architecture supports real-time subscriptions:

```typescript
// Subscribe to changes
const subscription = supabase
  .channel('db-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'students' },
    (payload) => {
      // Update local state
      students.update(current => updateWithPayload(current, payload));
    }
  )
  .subscribe();

// Cleanup
onDestroy(() => {
  subscription.unsubscribe();
});
```

## Migration Strategy

### 1. From localStorage to Supabase

```typescript
async function migrateToSupabase() {
  const localData = this.loadFromStorage('students', []);
  
  for (const item of localData) {
    await supabase.from('students').upsert(item);
  }
}
```

### 2. Schema Updates

Use Supabase migrations for schema changes:

```sql
-- Example migration
ALTER TABLE students 
ADD COLUMN school_id UUID REFERENCES schools(id);
```

## Debugging

### 1. Enable Debug Mode

```typescript
if (import.meta.env.DEV) {
  const { data, error } = await supabase.from(table).select();
  console.log(`Supabase ${table} query:`, { data, error });
}
```

### 2. Network Monitoring

Monitor Supabase requests in browser DevTools Network tab.

### 3. State Inspection

Use Svelte DevTools to inspect store states.

## Best Practices

1. **Always handle offline scenarios**: Design with offline-first in mind
2. **Use type safety**: Leverage TypeScript types for all database operations
3. **Implement proper error boundaries**: Catch and handle errors gracefully
4. **Optimize queries**: Use select columns and proper filters
5. **Cache strategically**: Balance between fresh data and performance
6. **Secure sensitive data**: Never expose sensitive data to the client
7. **Monitor usage**: Keep track of Supabase quotas and limits
8. **Document RLS policies**: Maintain clear documentation of security rules