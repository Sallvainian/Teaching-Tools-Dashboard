## Summary
Brief description of changes made in this PR.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement
- [ ] Test coverage improvement
- [ ] Style/UI improvements

## Related Issues
Closes #[issue number]

## Changes Made
- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

## CLAUDE.md Compliance Checklist

### Must Pass Requirements
- [ ] **TypeScript**: No TS errors (`pnpm check` passes)
- [ ] **Linting**: ESLint passes (`pnpm lint` passes)
- [ ] **Tests**: All tests pass (`pnpm test` passes)
- [ ] **Build**: Production build succeeds (`pnpm build` passes)
- [ ] **Validation**: Combined validation passes (`pnpm validate` passes)

### Code Quality Standards
- [ ] Uses proper Svelte 5 patterns (runes, callback props)
- [ ] Follows established store patterns
- [ ] Implements proper error handling with try/catch
- [ ] Includes loading states for async operations
- [ ] Uses correct Tailwind classes from project theme
- [ ] Maintains consistent file organization

### Svelte 5 Compliance
- [ ] Uses `$state()`, `$derived()`, `$effect()` instead of old patterns
- [ ] Uses `$props()` instead of `export let`
- [ ] Uses callback props instead of `createEventDispatcher`
- [ ] No legacy `$:` reactive statements (or justified if used)
- [ ] Follows component structure guidelines from CLAUDE.md

### Database Operations (if applicable)
- [ ] Uses correct table names (`log_entries` NOT `observation_logs`)
- [ ] Updates TypeScript types if schema changes
- [ ] Includes migration files for schema changes
- [ ] Updates model converters if needed
- [ ] Tests database operations

### Architecture Compliance
- [ ] Uses `supabaseService` for data operations
- [ ] Follows error handling patterns from CLAUDE.md
- [ ] Implements proper loading states
- [ ] Uses established store patterns
- [ ] Maintains type safety throughout

## Testing
- [ ] Unit tests added/updated for new functionality
- [ ] Component tests use Testing Library patterns
- [ ] Store tests follow established patterns from CLAUDE.md
- [ ] All existing tests pass locally
- [ ] Test coverage maintained or improved

## Code Quality & Security
- [ ] Code follows project style guidelines
- [ ] Self-review of code completed
- [ ] Code is properly documented
- [ ] No console.log statements left in production code
- [ ] No hardcoded secrets or API keys
- [ ] Input validation implemented where needed
- [ ] RLS policies considered for database changes

## Performance Considerations
- [ ] No performance regressions introduced
- [ ] Efficient patterns used (lazy loading, virtual scrolling, etc.)
- [ ] Bundle size impact considered
- [ ] Image optimization applied (if applicable)

## Accessibility & UX
- [ ] UI components are accessible
- [ ] Proper ARIA labels used
- [ ] Keyboard navigation works
- [ ] Color contrast meets standards
- [ ] Loading states provide good UX

## Screenshots/Videos
If applicable, add screenshots or videos demonstrating the changes.

## Deployment Notes
Special considerations for deployment:
- [ ] No special deployment requirements
- [ ] Requires database migration
- [ ] Requires environment variable updates
- [ ] Requires dependency updates
- [ ] Needs cache clearing

## Pre-commit Validation
Confirm you ran these commands locally:
- [ ] `pnpm validate` (ESLint + TypeScript)
- [ ] `pnpm test` (All tests pass)
- [ ] `pnpm build` (Production build works)

## Additional Notes
Any additional context or considerations for reviewers.

---

### For Reviewers
This PR should be reviewed against the criteria in [CLAUDE.md](../blob/main/CLAUDE.md). The automated Claude Code Review will check for compliance with project standards.

*This PR will be automatically reviewed by Claude Code Assistant following our established guidelines.*