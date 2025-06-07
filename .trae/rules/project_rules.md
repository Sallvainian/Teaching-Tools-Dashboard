# 🤖 Trae AI Project Rules Guide

## Overview
This guide defines the development standards, best practices, and architectural decisions for the Trae AI Dashboard Module. Following these rules ensures consistency, maintainability, and high code quality across the project.

---

## 1. 🎯 Framework & Technology Stack

### Core Technologies
- **Frontend Framework**: SvelteKit (latest stable version)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: TailwindCSS + CSS Modules for component-specific styles
- **State Management**: Svelte stores + Context API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Build Tool**: Vite
- **Package Manager**: npm (not yarn or pnpm)

### Required Dependencies
- `@supabase/supabase-js` - Database and auth client
- `@supabase/auth-helpers-sveltekit` - SvelteKit integration
- `tailwindcss` - Utility-first CSS
- `@tailwindcss/forms` - Form styling
- `@tailwindcss/typography` - Typography plugin

---

## 2. 🏗️ Project Structure

### Directory Organization
```
src/
├── lib/
│   ├── components/      # Reusable UI components
│   ├── stores/          # Svelte stores
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types/interfaces
│   ├── supabase/        # Supabase client & queries
│   └── ai/              # AI-specific modules
├── routes/              # SvelteKit routes
├── app.html             # HTML template
├── app.css              # Global styles
└── hooks.server.ts      # Server hooks
```

### Naming Conventions
- **Components**: PascalCase (e.g., `ChatInterface.svelte`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase with 'I' prefix for interfaces (e.g., `IUserProfile`)
- **Stores**: camelCase with '$' prefix for subscriptions
- **Routes**: kebab-case (e.g., `dashboard-settings`)

---

## 3. 🔒 Database & Security Rules

### Row Level Security (RLS)
- **Always use RLS** for all tables
- Avoid circular dependencies between policies
- Use direct comparisons over subqueries where possible
- Test policies thoroughly to prevent infinite recursion

### Database Conventions
- **Table names**: snake_case, plural (e.g., `user_profiles`)
- **Column names**: snake_case (e.g., `created_at`)
- **Primary keys**: Always use `id` (UUID)
- **Timestamps**: Include `created_at` and `updated_at` on all tables
- **Soft deletes**: Use `deleted_at` instead of hard deletes

### Example RLS Pattern
```sql
-- Good: Direct comparison
CREATE POLICY "Users can view own data" ON table_name
FOR SELECT USING (user_id = auth.uid());

-- Avoid: Circular references between tables
```

---

## 4. 🎨 UI/UX Standards

### Component Guidelines
- All components must be responsive (mobile-first)
- Use TailwindCSS classes for styling
- Implement dark mode support using CSS variables
- Follow accessibility standards (WCAG 2.1 AA)
- Use semantic HTML elements

### Design System
- **Primary Color**: `blue-600` (Tailwind)
- **Success**: `green-500`
- **Warning**: `yellow-500`
- **Error**: `red-500`
- **Border Radius**: Use Tailwind's `rounded-lg` as default
- **Shadows**: Use `shadow-md` for cards, `shadow-lg` for modals

### Component Props
```typescript
// Always type component props
interface ComponentProps {
  required: string;
  optional?: boolean;
  children?: Snippet; // Use Svelte 5 snippets
}
```

---

## 5. 🤖 AI Integration Standards

### API Usage
- Always implement rate limiting for AI endpoints
- Cache AI responses when appropriate
- Implement proper error handling and fallbacks
- Use streaming responses for real-time feedback

### Data Handling
- Sanitize all user inputs before AI processing
- Store AI conversations with proper user association
- Implement token counting and limits
- Log AI interactions for debugging (excluding sensitive data)

### Security
- Never expose API keys in client-side code
- Use environment variables for all credentials
- Implement request validation on server-side
- Rate limit by user ID, not IP address

---

## 6. ⚡ Performance Guidelines

### Code Splitting
- Lazy load heavy components
- Use dynamic imports for route-specific code
- Implement proper loading states

### Optimization
- Use `{#key}` blocks sparingly
- Implement virtual scrolling for large lists
- Optimize images (WebP format, lazy loading)
- Minimize bundle size (check with `npm run build`)

### Caching Strategy
- Use SvelteKit's built-in caching
- Implement service workers for offline support
- Cache static assets aggressively
- Use Supabase's built-in caching for queries

---

## 7. 🧪 Testing Requirements

### Test Coverage
- Minimum 80% code coverage
- Unit tests for all utility functions
- Integration tests for critical user flows
- E2E tests for authentication and core features

### Testing Tools
- **Unit Tests**: Vitest
- **Component Tests**: Svelte Testing Library
- **E2E Tests**: Playwright
- **API Tests**: Supertest

### Test File Structure
```
component.svelte
component.test.ts    // Unit tests
component.e2e.ts     // E2E tests
```

---

## 8. 🚫 What to Avoid

### Code Smells
- ❌ Direct DOM manipulation (use Svelte's reactivity)
- ❌ Inline styles (use Tailwind classes)
- ❌ Any use of `any` type in TypeScript
- ❌ Hardcoded values (use constants/env vars)
- ❌ Synchronous operations in server routes
- ❌ Client-side API keys or secrets

### Anti-Patterns
- ❌ Circular dependencies between modules
- ❌ Storing sensitive data in localStorage
- ❌ Using `eval()` or `Function()` constructors
- ❌ Mutating props directly
- ❌ Ignoring TypeScript errors with `@ts-ignore`

### Security Don'ts
- ❌ SQL string concatenation (use parameterized queries)
- ❌ Trusting client-side validation alone
- ❌ Exposing internal error messages to users
- ❌ Using weak authentication methods
- ❌ Storing passwords or tokens in plain text

---

## 9. 📝 Code Style & Formatting

### Prettier Configuration
```json
{
  "useTabs": true,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100
}
```

### ESLint Rules
- Enforce TypeScript strict mode
- No unused variables
- Prefer const over let
- Require explicit return types
- Enforce consistent naming

### Comments & Documentation
- Use JSDoc for public functions
- Write clear commit messages (conventional commits)
- Document complex business logic
- Keep README files updated

---

## 10. 🚀 Deployment & DevOps

### Environment Variables
```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
PRIVATE_SUPABASE_SERVICE_KEY=
PRIVATE_OPENAI_API_KEY=
```

### Build Process
1. Run type checking: `npm run check`
2. Run tests: `npm test`
3. Build production: `npm run build`
4. Preview build: `npm run preview`

### Deployment Checklist
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies tested
- [ ] Performance benchmarks met
- [ ] Security headers configured

---

## 11. 🔄 Git Workflow

### Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/updates

### Commit Messages
Follow conventional commits:
```
feat: add new chat interface
fix: resolve RLS infinite recursion
docs: update project rules
refactor: optimize database queries
test: add auth flow tests
```

### Pull Request Process
1. Create feature branch from `main`
2. Write code following these rules
3. Add/update tests
4. Update documentation
5. Create PR with clear description
6. Pass all CI checks
7. Get code review approval
8. Squash and merge

---

## 12. 🆘 Getting Help

### Resources
- **SvelteKit Docs**: https://kit.svelte.dev
- **Supabase Docs**: https://supabase.com/docs
- **TailwindCSS Docs**: https://tailwindcss.com
- **Project Issues**: Use GitHub issues for bugs/features

### Team Contacts
- **Project Lead**: [Add contact]
- **Tech Lead**: [Add contact]
- **Design Lead**: [Add contact]

---

## 📋 Quick Reference Checklist

Before committing code, ensure:
- [ ] TypeScript has no errors
- [ ] All tests pass
- [ ] Code follows naming conventions
- [ ] No hardcoded values
- [ ] RLS policies don't create circular dependencies
- [ ] Components are accessible
- [ ] Performance impact considered
- [ ] Security best practices followed
- [ ] Documentation updated

---

**Last Updated**: ${new Date().toISOString().split('T')[0]}
**Version**: 1.0.0