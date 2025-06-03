# Linux Migration Guide for Teacher Dashboard

## Overview
This guide covers transferring the Teacher Dashboard project from Windows (WSL) to a Linux virtual drive.

## Pre-Transfer Checklist

### 1. Commit All Changes
```bash
git add .
git commit -m "Pre-migration commit"
git push origin claude-fixes-attempt
```

### 2. Document Environment Variables
Create a `.env.example` file with all required variables:
```env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Export Database Schema
```bash
# Generate latest types
supabase gen types typescript --local > src/lib/types/database.ts

# Export migrations
cp -r supabase/migrations ./migrations_backup
```

## Transfer Methods

### Method 1: Git Clone (Recommended)
1. **On Linux VM:**
```bash
# Install prerequisites
sudo apt update
sudo apt install -y git nodejs npm

# Clone repository
git clone https://github.com/your-username/teacher-dashboard.git
cd teacher-dashboard

# Checkout your branch
git checkout claude-fixes-attempt

# Install dependencies
npm install
```

### Method 2: Direct File Transfer
1. **Create archive on Windows/WSL:**
```bash
# Exclude node_modules and .svelte-kit
tar -czf teacher-dashboard.tar.gz \
  --exclude='node_modules' \
  --exclude='.svelte-kit' \
  --exclude='node_modules_backup' \
  .
```

2. **Transfer methods:**
   - **SCP**: `scp teacher-dashboard.tar.gz user@linux-vm:/home/user/`
   - **Shared Folder**: Copy to VM shared folder
   - **Cloud Storage**: Upload to Google Drive/Dropbox

3. **Extract on Linux:**
```bash
tar -xzf teacher-dashboard.tar.gz
cd teacher-dashboard
npm install
```

## Post-Transfer Setup

### 1. System Dependencies
```bash
# Node.js 18+ (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Build essentials
sudo apt-get install -y build-essential

# Git
sudo apt-get install -y git
```

### 2. Environment Configuration
```bash
# Create .env file
cp .env.example .env

# Edit with your Supabase credentials
nano .env
```

### 3. Supabase CLI (Optional)
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref yutlcpluuhjxwudfathv
```

### 4. Verify Installation
```bash
# Check Node version
node --version  # Should be 18+

# Check npm version
npm --version

# Run type checking
npm run check

# Run linting
npm run lint

# Test build
npm run build
```

### 5. Development Server
```bash
# Start dev server
npm run dev

# Access at http://localhost:5173
```

## Important Files to Transfer

### Critical Files
- `/src` - All source code
- `/static` - Static assets
- `package.json` & `package-lock.json` - Dependencies
- `svelte.config.js` - SvelteKit config
- `vite.config.ts` - Vite config
- `tailwind.config.ts` - Tailwind config
- `tsconfig.json` - TypeScript config
- `.env` - Environment variables
- `/supabase/migrations` - Database migrations

### Optional Files
- `/docs` - Documentation
- `CLAUDE.md` - AI assistant instructions
- `.gitignore` - Git ignore rules
- `eslint.config.ts` - Linting rules

## Common Issues & Solutions

### 1. Permission Issues
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 2. Port Already in Use
```bash
# Find process using port 5173
sudo lsof -i :5173

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- --port 5174
```

### 3. Memory Issues
```bash
# Increase Node memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 4. File Watching Issues
```bash
# Increase file watchers limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Verification Steps

1. **Check Git Status**
```bash
git status
git remote -v
```

2. **Test Database Connection**
```bash
# Run dev server and check console for Supabase connection
npm run dev
```

3. **Run Tests**
```bash
npm test
```

4. **Build Production**
```bash
npm run build
npm run preview
```

## Linux-Specific Optimizations

### 1. Use systemd for Production
Create `/etc/systemd/system/teacher-dashboard.service`:
```ini
[Unit]
Description=Teacher Dashboard
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/teacher-dashboard
ExecStart=/usr/bin/npm run preview
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 2. Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Backup Strategy

### Before Transfer
1. Export database schema
2. Backup migrations
3. Document all environment variables
4. Create git tag: `git tag pre-migration`

### After Transfer
1. Test all functionality
2. Verify database connections
3. Run full test suite
4. Create backup of working state

## Quick Reference Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run check        # TypeScript check
npm run validate     # Both lint and check

# Testing
npm test            # Run all tests
npm run test:unit   # Watch mode

# Database
supabase gen types typescript --local > src/lib/types/database.ts
```

## Support Resources

- [SvelteKit Docs](https://kit.svelte.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Project README](../README.md)
- [Architecture Guide](./ARCHITECTURE.md)