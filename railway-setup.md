# Railway SvelteKit Deployment Guide - COMPREHENSIVE

**CRITICAL: This guide is based on complete Railway documentation research. Follow EXACTLY.**

## Build System Options

Railway offers TWO build systems:
1. **NIXPACKS** (default, stable)
2. **RAILPACK** (beta, better performance, smaller images)

## Step 1: Install Required Adapter

```bash
npm i -D @sveltejs/adapter-node
```

## Step 2: Configure svelte.config.js

```javascript
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  }
};

export default config;
```

## Step 3: Update package.json Scripts

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build", 
    "start": "node build"
  }
}
```

**CRITICAL:** Start command is `node build` (NOT `node build/index.js`)

## Step 4: Create railway.toml Configuration

**CREATE railway.toml in project root:**

### Option A: Using NIXPACKS (Stable)
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "node build"
healthcheckPath = "/"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
```

### Option B: Using RAILPACK (Beta - Better Performance)
```toml
[build]
builder = "RAILPACK"
buildCommand = "npm run build"

[deploy]
startCommand = "node build"
healthcheckPath = "/"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
```

## Step 5: Optional - Create nixpacks.toml (for NIXPACKS only)

**If using NIXPACKS, optionally create nixpacks.toml:**
```toml
[phases.setup]
nixPkgs = ["nodejs", "npm"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "node build"

[variables]
NODE_ENV = "production"
```

## Step 6: Verification Steps

1. **Check adapter installation:**
   ```bash
   npm ls @sveltejs/adapter-node
   ```

2. **Test build process:**
   ```bash
   npm run build
   ```
   Should create `build/` directory with server files

3. **Test local start:**
   ```bash
   npm start
   ```

## Step 7: Deployment

### Method 1: GitHub Repository (Recommended)
1. Push all files (including railway.toml) to GitHub
2. Connect repository to Railway
3. Railway will automatically use railway.toml configuration

### Method 2: Railway CLI
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

## BUILDER COMPARISON

### NIXPACKS (Default)
- ✅ Stable and battle-tested
- ✅ Extensive documentation
- ❌ Larger image sizes
- ❌ Limited package version support

### RAILPACK (Beta)
- ✅ Smaller image sizes
- ✅ Better package version support
- ✅ Next generation builder
- ❌ Beta status (potential bugs)

## Required Files Checklist

- ✅ `svelte.config.js` with adapter-node
- ✅ `package.json` with correct start script
- ✅ `railway.toml` with build/deploy config
- ✅ `nixpacks.toml` (optional, for NIXPACKS only)

## Common Mistakes to AVOID

**DO NOT:**
- ❌ Forget to create railway.toml file
- ❌ Use wrong start command (`node build/index.js` vs `node build`)
- ❌ Mix RAILPACK configuration with nixpacks.toml
- ❌ Use adapter-netlify or adapter-auto
- ❌ Create custom Express servers

## Troubleshooting

**Build fails:**
- Check railway.toml has correct builder specified
- Verify buildCommand points to npm run build

**App won't start:**
- Ensure startCommand is `node build`
- Check that build/ directory was created

**Static files 404:**
- Confirm using adapter-node
- Verify railway.toml builder is NIXPACKS or RAILPACK

## RECOMMENDATION

**For production: Use NIXPACKS** (stable)
**For testing: Try RAILPACK** (better performance, beta)

**Both require railway.toml configuration file.**