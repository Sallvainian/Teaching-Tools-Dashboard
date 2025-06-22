# Teacher Dashboard Development Guidelines

This document provides essential information for AI code pilots working on the Teacher Dashboard project. It includes build instructions, framework details, and development guidelines specific to this project.

## Build/Configuration Instructions

### Prerequisites
- Node.js 18+ (as specified in package.json engines)
- npm 10.2.4+ (recommended package manager)
- Supabase account (for backend services)

### Environment Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

   > **Note**: The project uses `bin-links=true` in .npmrc to ensure proper executable resolution across all platforms. Additionally, optional dependencies are disabled with `optional=false` and an override is added in package.json to replace platform-specific packages with cross-platform alternatives.
   >
   > **Important**: After making changes to .npmrc or package.json overrides, you must remove node_modules and package-lock.json before reinstalling:
   > ```bash
   > npm cache clean --force
   > rm -rf node_modules package-lock.json
   > npm install
   > ```

3. Configure environment variables:
   - Create a `.env.local` file based on `.env` with your Supabase credentials:
   ```
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### Development Commands
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run check` - Run svelte-check for TypeScript
- `npm run validate` - Run both lint and check
- `npm test` - Run tests with coverage
- `npm run test:unit` - Run tests in watch mode

## Framework

### Core Technologies
- **Frontend Framework**: SvelteKit 2.x with Svelte 5.x (using runes)
- **Build Tool**: Vite 6.x
- **Styling**: Tailwind CSS 3.x with DaisyUI components
- **Language**: TypeScript (strict mode)
- **API/Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Testing**: Vitest with JSDOM and Testing Library
- **Deployment**: Netlify

### Key Dependencies
- **State Management**: Native Svelte stores
- **Data Validation**: Zod
- **Date Handling**: date-fns
- **Unique IDs**: UUID

### Project Structure
```
src/
├── lib/               # Shared library code
│   ├── components/    # Reusable UI components
│   ├── services/      # Business logic and API interactions
│   ├── stores/        # State management
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── routes/            # SvelteKit routes (pages)
└── app.html           # HTML template
```

## Additional Development Information

### Code Style and Conventions
- **TypeScript Strict Mode**: No implicit `any`, explicit null checks
- **Svelte 5 Runes**: Modern reactivity with `$state`, `$derived`, `$props`
- **Component Structure**: Imports → Types → Props → State → Effects → Functions → Markup
- **Store Pattern**: Centralized state with actions and derived values
- **Path Aliases**:
  - `$components` - src/lib/components
  - `$stores` - src/lib/stores
  - `$services` - src/lib/services
  - `$utils` - src/lib/utils
  - `$types` - src/lib/types

### Architecture Patterns
- **Store-Based State Management**: The application uses stores for state management:
  - `authStore` - User authentication and session management
  - `settingsStore` - Theme, preferences, and app configuration
  - `chatStore` - Real-time messaging with typing indicators
  - `filesStore` - File upload, organization, and sharing
  - `gradebookStore` - Grade management with local/cloud sync
  - `uiStore` - Shared UI state (modals, views, search)

- **Service Layer**: Business logic is separated into services:
  - `fileService` - File operations and Supabase storage
  - `supabaseService` - Database operations with fallbacks
  - `cacheService` - Performance optimization and offline support

### Performance Optimizations
- Code splitting via SvelteKit's built-in lazy loading
- Image optimization with vite-imagetools
- Asset compression (Gzip/Brotli)
- Manual chunk splitting for large dependencies
- Performance utilities (debounce, throttle, memoize)

### Cross-Platform Development Support
The project is configured to work seamlessly across different development environments:

1. **Package Resolution**: The project uses both `bin-links=true` in .npmrc and npx prefixes in package.json scripts to ensure proper executable resolution in all environments, including Windows. This dual approach provides maximum compatibility across different systems.

2. **Cross-Platform Server Configuration**: The Vite server is configured to work in both native environments (Windows/macOS/Linux) and Windows Subsystem for Linux (WSL):
   - Listens on all network interfaces (`host: '0.0.0.0'`)
   - Optimized HMR (Hot Module Replacement) configuration
   - Efficient file watching with ignored patterns

### Testing Guidelines
- Tests are located in `__tests__` directories adjacent to the code they test
- Use Vitest's describe/it pattern similar to Jest
- Testing utilities are available from @testing-library/svelte
- Run tests before submitting changes

### Deployment
- The project is configured for deployment to Netlify
- Build command: `npm run build`
- Publish directory: `build`

## Database Schema Information

### Database Structure
- **Users & Authentication** - Role-based access (teacher/student)
- **Classes & Students** - Hierarchical class organization
- **Grades & Assignments** - Flexible grading with categories
- **Messages & Conversations** - Real-time chat with participants
- **Files & Folders** - Organized file storage with sharing

### Key Tables
- `app_users` - User profiles with roles
- `students` - Student records (linked to user_id)
- `categories` - Classes/grade categories
- `assignments` - Class assignments
- `grades` - Student grades
- `log_entries` - Student observation logs
- `games`, `game_categories`, `questions` - Jeopardy system
- `file_folders` - For folder organization
- `file_metadata` - For file information

## AI Development Patterns

### AI-Optimized Code
- **AI Context Headers**: Files should include context headers with module purpose, dependencies, side effects, and exports
- **Branded Types**: Use branded types to prevent ID mixups (e.g., `type StudentId = string & { __brand: 'StudentId' }`)
- **ActionResult Pattern**: Consistent error handling with `ActionResult<T>` return type
- **Flow Documentation**: Document data flow in functions with `@ai-flow` comments

## Key Features Implementation

### Gradebook System
- Flexible categories for assignment organization
- Bulk grade entry for multiple students
- Color-coded grading with customizable schemes
- PowerTeacher Pro import/export compatibility
- Real-time grade calculations

### Chat System
- Real-time messaging with typing indicators
- Conversation management for groups and direct messages
- Message history with search functionality
- Online status indicators

### File Management
- Drag & drop upload with progress tracking
- Hierarchical folder organization
- File sharing with specific users or classes
- Preview support for PDFs and images
- Trash/restore functionality with soft delete

## Security Best Practices
- Never commit secrets to the repository
- Use environment variables for sensitive data
- Validate user input on both client and server
- Use Row Level Security (RLS) policies in Supabase
- Sanitize HTML when displaying user content

## Git Workflow
- **Branch Naming**: Use prefixes like `feature/`, `fix/`, `docs/`, `refactor/`
- **Commit Messages**: Follow conventional commits format
  ```
  feat: add student import functionality
  fix: correct grade calculation in gradebook
  docs: update API documentation
  ```

## Debugging Tips
1. **TypeScript Errors**: Run `npm run check` to see all TS errors
2. **Component State**: Use Svelte DevTools browser extension
3. **Database Issues**: Check Supabase dashboard logs
4. **Build Errors**: Check `npm run build` output carefully
5. **Test Failures**: Run `npm test -- --reporter=verbose`

## Important Learnings
1. **Svelte 5 Event Handlers**: Always use callback syntax for events
   - Wrong: `onchange={handler}`
   - Right: `onchange={(e) => handler(e)}`
2. **TypeScript Catch Clauses**: Must use `any` or `unknown` type
   - Wrong: `catch (error: Error)`
   - Right: `catch (error: any)`
