# SvelteKit Teacher Dashboard Architecture Documentation

## 🏗️ Architecture Overview

This is a modern SvelteKit application designed for teachers to manage their classrooms. The application uses Supabase as the backend with a flexible architecture that allows fallback to localStorage when Supabase is unavailable.

### Technology Stack

- **Frontend Framework**: SvelteKit with TypeScript
- **Backend/Database**: Supabase (PostgreSQL) with localStorage fallback
- **State Management**: Svelte stores (writable, derived)
- **Styling**: Tailwind CSS + DaisyUI components
- **Data Grid**: AG-Grid for complex data visualization
- **Icons**: Steeze UI Heroicons
- **Build Tool**: Vite
- **Package Manager**: pnpm

## 📁 Directory Structure

```
src/
├── app.css                         # Global styles and Tailwind directives
├── app.d.ts                        # TypeScript type definitions
├── app.html                        # HTML template
├── lib/
│   ├── ag-grid-modules.ts          # AG-Grid module configuration
│   ├── components/                 # Reusable Svelte components
│   │   ├── auth/                   # Authentication components
│   │   │   ├── LoginForm.svelte
│   │   │   ├── ProfileForm.svelte
│   │   │   ├── ResetPasswordForm.svelte
│   │   │   └── SignupForm.svelte
│   │   ├── ClassList.svelte
│   │   ├── FlipCard.svelte
│   │   ├── ImportWizard.svelte
│   │   ├── JeopardyTimer.svelte
│   │   ├── LoadingBounce.svelte
│   │   ├── LogEntriesDetails.svelte
│   │   ├── LogEntriesForm.svelte
│   │   ├── LogEntriesList.svelte
│   │   ├── LogEntriesSearch.svelte
│   │   ├── StudentRoster.svelte
│   │   └── TestHeadlessUI.svelte
│   ├── services/
│   │   └── supabaseService.ts      # Unified data access layer
│   ├── stores/                     # Svelte stores for state management
│   │   ├── auth.ts                 # Authentication state
│   │   ├── gradebook.ts            # Gradebook state and logic
│   │   ├── jeopardy.ts             # Jeopardy game state
│   │   └── log-entries.ts          # Log entries state
│   ├── supabaseClient.ts           # Supabase client initialization
│   ├── types/                      # TypeScript type definitions
│   │   ├── database.ts             # Database schema types
│   │   ├── gradebook.ts            # Gradebook-specific types
│   │   ├── jeopardy.ts             # Jeopardy game types
│   │   └── log-entries.ts          # Log entry types
│   └── utils/
│       ├── authGuard.ts            # Route protection utilities
│       └── modelConverters.ts      # Data transformation utilities
└── routes/                         # SvelteKit routes
    ├── +layout.svelte              # Root layout component
    ├── +layout.ts                  # Root layout load function
    ├── +page.svelte                # Landing page
    ├── auth/                       # Authentication routes
    │   ├── login/
    │   ├── reset-password/
    │   └── signup/
    ├── class-dojo-remake/          # Class behavior management
    ├── classes/                    # Class management
    ├── dashboard/                  # Main dashboard
    ├── gradebook/                  # Grade management
    ├── jeopardy/                   # Jeopardy game
    ├── lesson-planner/             # Lesson planning
    ├── log-entries/                # Student observation logs
    └── settings/                   # User settings
        └── profile/
```

## 🗃️ Database Schema

The application uses the following main tables:

### Core Tables

1. **students**
   - Student information and profiles
   - Fields: id, name, email, grade, birth_date, address, phone_number, parent_contact, notes

2. **categories**
   - Class/category definitions
   - Fields: id, name, description, color, order_index

3. **assignments**
   - Class assignments and assessments
   - Fields: id, name, max_points, category_id, due_date, description

4. **grades**
   - Student grades for assignments
   - Fields: id, student_id, assignment_id, points

5. **category_students**
   - Many-to-many relationship between categories and students
   - Fields: category_id, student_id

6. **log_entries**
   - Teacher observations of student behavior
   - Fields: id, observer, date, student, subject, objective, observation, actions, follow_up, tags

### Game Tables

7. **games**
   - Jeopardy game definitions
   - Fields: id, name, description, settings

8. **game_categories**
   - Categories within Jeopardy games
   - Fields: id, game_id, name, order_index

9. **questions**
   - Questions for Jeopardy categories
   - Fields: id, category_id, question, answer, points, order_index

## 🔄 Data Flow Architecture

### 1. Dual Storage Strategy

The application implements a unique dual storage strategy:

- **Primary**: Supabase (when available and authenticated)
- **Fallback**: localStorage (offline mode or when Supabase is unavailable)

This is implemented through the `SupabaseService` class which provides:
- Automatic fallback to localStorage when Supabase operations fail
- Synchronization between Supabase and localStorage
- Seamless transition between online and offline modes

### 2. State Management Pattern

```typescript
// Example from gradebook store
function createGradebookStore() {
  // Primary state atoms
  const students = writable<Student[]>([]);
  const categories = writable<Category[]>([]);
  const selectedCategoryId = writable<string | null>(null);
  
  // Derived state
  const store = derived(
    [students, categories, selectedCategoryId, ...],
    ([$students, $categories, $selectedCategoryId, ...]) => {
      return {
        // State values
        students: $students,
        categories: $categories,
        
        // Computed values
        getStudentsInSelectedCategory: computed logic here,
        getAssignmentsForSelectedCategory: computed logic here
      };
    }
  );
  
  // Actions
  async function loadAllData() { ... }
  async function addStudent() { ... }
  
  return {
    subscribe: store.subscribe,
    loadAllData,
    addStudent,
    // ... other actions
  };
}
```

### 3. Authentication Flow

1. **Initial Load** (`+layout.ts`):
   - Initialize Supabase client
   - Check for existing session
   - Initialize auth store

2. **Auth Store** (`auth.ts`):
   - Manages user state
   - Handles sign in/out operations
   - Listens for auth state changes
   - Provides derived stores for authentication status

3. **Route Protection**:
   - Uses derived `isAuthenticated` store
   - Conditional rendering in layout
   - Redirect logic in page components

### 4. Component Architecture

Components are organized by feature:
- **Auth Components**: Handle user authentication flows
- **Data Display**: AG-Grid integration for complex data
- **Game Components**: Jeopardy timer, flip cards
- **Form Components**: Student forms, log entry forms

## 🔐 Security Architecture

### Authentication
- Supabase Authentication with email/password
- Session persistence across browser refreshes
- Secure token storage in cookies
- Protected routes based on authentication state

### Data Security
- Row-level security (RLS) in Supabase
- User-scoped data access
- Secure API key handling (anon key only on client)

## 🎨 UI Architecture

### Design System
- **Color Scheme**: Dark theme with monochromatic palette
- **Component Library**: DaisyUI for base components
- **Custom Theme**: Tailwind configuration with custom colors
- **Responsive Design**: Mobile-first approach with breakpoints

### Layout Structure
1. **Navigation Bar**: Top navigation with user menu
2. **Sidebar**: Collapsible sidebar for class/section navigation
3. **Main Content**: Dynamic content area
4. **Footer**: Simple footer with copyright

### Dark Theme Configuration
```typescript
// tailwind.config.ts
colors: {
  'dark-bg': '#121212',
  'dark-card': '#1E1E1E',
  'dark-accent': '#2A2A2A',
  'dark-purple': '#404040',
  'dark-lavender': '#A0A0A0',
  'dark-highlight': '#E0E0E0',
  'dark-muted': '#6E6E6E',
  'dark-border': '#333333',
  'dark-surface': '#0A0A0A',
}
```

## 🚀 Performance Optimizations

1. **Lazy Loading**:
   - Dynamic imports for Supabase client
   - Component-level code splitting
   - Route-based data loading

2. **State Optimization**:
   - Derived stores for computed values
   - Minimal re-renders with fine-grained reactivity
   - LocalStorage caching for offline performance

3. **Data Grid Performance**:
   - AG-Grid with virtual scrolling
   - Lazy loading of grid modules
   - Optimized cell renderers

## 🔌 Service Layer

### SupabaseService Architecture

The service layer provides a unified interface for data operations:

```typescript
class SupabaseService {
  // CRUD operations with automatic fallback
  async getItems<T>(table: T, options?: QueryOptions): Promise<Tables<T>[]>
  async getItemById<T>(table: T, id: string): Promise<Tables<T> | null>
  async insertItem<T>(table: T, data: Inserts<T>): Promise<Tables<T> | null>
  async updateItem<T>(table: T, id: string, data: Updates<T>): Promise<Tables<T> | null>
  async deleteItem<T>(table: T, id: string | CompositeKey): Promise<boolean>
  
  // LocalStorage helpers
  loadFromStorage<T>(key: string, defaultValue: T): T
  saveToStorage<T>(key: string, value: T): void
  
  // Auth helpers
  async getCurrentUser(): Promise<User | null>
  async signIn(email: string, password: string): Promise<AuthResponse>
}
```

### Key Features:
- Type-safe database operations
- Automatic error handling and fallback
- LocalStorage synchronization
- Composite key support for junction tables

## 🧪 Testing Strategy

1. **Unit Tests**: Store logic and utility functions
2. **Component Tests**: Individual component behavior
3. **Integration Tests**: Full user flows
4. **E2E Tests**: Critical paths through the application

## 📱 Responsive Design

The application is built with a mobile-first approach:
- Collapsible sidebar for small screens
- Touch-friendly interface elements
- Responsive data grids
- Adaptive navigation

## 🚀 Deployment

- **Platform**: Vercel (configured in `vercel.json`)
- **Environment Variables**: Supabase URL and anon key
- **Build Command**: `pnpm build`
- **Node Version**: >=18.x

## 🔄 Future Considerations

1. **Offline Sync**: Implement queue for offline operations
2. **Real-time Updates**: Utilize Supabase real-time subscriptions
3. **PWA Support**: Add service worker for offline capability
4. **Data Export**: Add CSV/PDF export functionality
5. **Multi-tenancy**: Support for multiple schools/districts