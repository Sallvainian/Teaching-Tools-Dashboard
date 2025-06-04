# Quick Start for Codex

## Ready-to-use Commands
```bash
npm run dev         # Start dev server (localhost:5173)
npm run check       # Check TypeScript
npm run lint        # Lint code
```

## Project Structure
- `src/routes/` - Pages and routes
- `src/lib/components/` - UI components  
- `src/lib/stores/` - State management
- `src/lib/supabaseClient.ts` - Database

## Environment
- All environment variables configured in .env
- Supabase database ready
- TypeScript strict mode enabled

## If Something Breaks
1. Check `CLAUDE.md` for full documentation
2. Try: `npm run check` for TypeScript errors
3. Try: `npm run lint:fix` for code formatting
