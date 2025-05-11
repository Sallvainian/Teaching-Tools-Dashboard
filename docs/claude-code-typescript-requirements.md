# TypeScript Strict Mode Requirements and Error Prevention

## My TypeScript Configuration

My project uses **STRICT** TypeScript configuration:

- `"strict": true`
- `"checkJs": true`
- `"forceConsistentCasingInFileNames": true`

## Recent Errors That Need to Be Avoided

### Errors from jeopardy-supabase.ts

1. **Missing Type Annotations in Catch Blocks**

   ```typescript
   // ❌ Error
   } catch (err) {

   // ✅ Fix
   } catch (err: any) {
   ```

2. **Unsafe Error Message Access**

   ```typescript
   // ❌ Error
   error.set(err.message);

   // ✅ Fix
   error.set(err?.message || 'An unknown error occurred');
   ```

3. **Missing Null Checks**

   ```typescript
   // ❌ Error
   const newGame = { id: data.id, name: data.name };

   // ✅ Fix
   if (!data) throw new Error('No data returned');
   const newGame = { id: data.id, name: data.name };
   ```

4. **Incorrect Supabase Order Syntax**

   ```typescript
   // ❌ Error
   .order(['category_id', 'point_value'])

   // ✅ Fix
   .order('category_id').order('point_value')
   ```

### Errors from migrator.ts

1. **Implicit 'any' Types in Array Methods**

   ```typescript
   // ❌ Error
   students.map(student => ...)

   // ✅ Fix
   students.map((student: LocalStudent) => ...)
   ```

2. **Undefined Error Type**

   ```typescript
   // ❌ Error
   } catch (error) {

   // ✅ Fix
   } catch (error: any) {
   ```

3. **Missing Type Definitions**

   ```typescript
   // ✅ Fix - Always define types for complex structures
   interface LocalStudent {
     id: string;
     name: string;
   }

   interface LocalCategory {
     id: string;
     name: string;
     studentIds: string[];
   }
   ```

## Strict Requirements for All Generated Code

### 1. Type Annotations - ALWAYS Required

```typescript
// ❌ Don't do this
.map(item => ...)
function myFunc(param) { ... }

// ✅ Always do this
.map((item: ItemType) => ...)
function myFunc(param: ParamType): ReturnType { ... }
```

### 2. Error Handling - ALWAYS Use Proper Types

```typescript
// ❌ Don't do this
} catch (error) {
  error.set(error.message);
}

// ✅ Always do this
} catch (error: any) {
  error.set(error?.message || 'An error occurred');
}
```

### 3. Null/Undefined Checks - ALWAYS Required

```typescript
// ❌ Don't do this
const user = get(auth.user);
const data = user.data;

// ✅ Always do this
const user = get(auth.user);
if (!user) throw new Error('User not authenticated');
const data = user.data;
```

### 4. Supabase Specific - No Array Syntax for Order

```typescript
// ❌ Don't do this
.order(['field1', 'field2'])

// ✅ Always do this
.order('field1').order('field2')
```

### 5. Type Definitions - Define Complex Structures

```typescript
// ✅ Always define types for complex data
interface LocalStudent {
  id: string;
  name: string;
}

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}
```

### 6. Import Types Properly

```typescript
// ✅ Use type imports where appropriate
import type { User, Session } from '@supabase/supabase-js';
import type { Student, Category } from '$lib/types/gradebook';
```

## Key Principles

1. **Generate code that compiles without ANY TypeScript errors**
2. **Use strict typing throughout - no implicit `any` types**
3. **Handle all potential null/undefined cases**
4. **Provide fallback values for error messages**
5. **Define interfaces for complex data structures**
6. **Test that Supabase queries use correct syntax**

## Additional Context

- I'm using Supabase with strict typing
- I have custom types defined in `$lib/types/`
- I need proper null checks for API responses
- All async functions should have proper error handling
- The project uses SvelteKit with strict TypeScript configuration

## Final Request

When you generate TypeScript code:

1. Fix any TypeScript errors immediately
2. Don't generate code that requires manual fixing
3. Follow all the patterns shown above
4. Generate production-ready TypeScript code that passes strict compilation on first attempt

Thank you for following these requirements!
