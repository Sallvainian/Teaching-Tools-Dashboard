# Sentry Setup Guide

## Overview

This project is configured with Sentry for error tracking and release management.

## Features

- ✅ Client-side error tracking
- ✅ Server-side error tracking
- ✅ **Performance monitoring** with automatic instrumentation
- ✅ **Custom transaction tracking** for API calls and database operations
- ✅ **Web Vitals monitoring** (LCP, FID, CLS, INP)
- ✅ **User interaction tracking** (clicks, navigation)
- ✅ **Long task detection** (>50ms)
- ✅ Source map uploads
- ✅ Release tracking
- ✅ Environment-specific configuration
- ✅ Session replay (10% sample rate)
- ✅ **Profiling** for function-level performance data

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Required for source map uploads
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Optional - will be auto-detected from deployment environment
SENTRY_RELEASE=your-release-name
```

### GitHub Secrets

For the GitHub Actions workflow to work, add these secrets to your repository:

1. Go to Settings → Secrets and variables → Actions
2. Add `SENTRY_AUTH_TOKEN` with your Sentry auth token

To get a Sentry auth token:
1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Create a new token with these scopes:
   - `project:releases`
   - `org:read`
   - `project:write`

## Usage

### Local Development

Errors are automatically captured in development mode with full stack traces.

### Creating a Release

1. **Manual Release**:
   ```bash
   pnpm run release
   ```
   This will validate, build, and create a Sentry release with source maps.

2. **Automatic Release** (via GitHub Actions):
   - Push to main branch
   - GitHub Action will automatically create a release

3. **Vercel Deployment**:
   - Releases are automatically created using the Git commit SHA

### Testing Sentry

Visit `/test-sentry` to trigger test errors and verify your setup.

### Performance Monitoring

The setup includes:
- **Automatic instrumentation** for page loads, route changes, and API calls
- **Custom tracking utilities** in `src/lib/utils/performance.ts`
- **Database operation tracking** with timing and metadata
- **User interaction breadcrumbs** for debugging
- **Web Vitals** monitoring for Core Web Vitals

### Using Custom Performance Tracking

```typescript
import { trackAsyncOperation, trackDatabaseOperation, trackUserInteraction } from '$lib/utils/performance';

// Track API calls
await trackAsyncOperation('api-call', async () => {
  return await fetch('/api/data');
}, { 'api.endpoint': '/api/data' });

// Track database operations
await trackDatabaseOperation('users', 'select', async () => {
  return await supabase.from('users').select('*');
});

// Track user interactions
trackUserInteraction('click', 'submit-button');
```

## Release Naming

Releases are named using this pattern:
- Production: `teacher-dashboard@{git-commit-sha}`
- Local builds: `teacher-dashboard@{version}-{short-sha}`
- Development: `development`

## Viewing Releases

View your releases at:
https://sentry.io/organizations/frank-cottone/releases/

## Troubleshooting

### Source Maps Not Working

1. Ensure `SENTRY_AUTH_TOKEN` is set correctly
2. Check that the release name matches between build and runtime
3. Verify source maps are being uploaded (check build logs)

### Errors Not Appearing

1. Check your DSN is correct in hooks files
2. Verify Sentry initialization in both client and server hooks
3. Check browser console for any Sentry errors
4. Try clearing browser cache

### Release Not Created

1. Ensure you have the correct org and project names in `vite.config.ts`
2. Verify your auth token has the correct permissions
3. Check build logs for any upload errors