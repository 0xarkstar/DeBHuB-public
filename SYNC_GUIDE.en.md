# DeBHuB Sync Guide

## Repository Structure

This repository uses **dual remote** setup:
- **private**: Development repository (DeBHuB-private)
- **public**: Production repository for Vercel deployment (DeBHuB-public)

## Daily Workflow

### 1. Development (Private Only)
```bash
# Work on features
git add .
git commit -m "feat: your feature"
git push private master
```

### 2. Release to Production (Private + Public)
```bash
# Push to both repositories
git push private master
git push public master:main
```

**Note**: Public repository uses `main` branch as default.

## Remote URLs

```bash
# View remotes
git remote -v

# Output:
# private   https://github.com/0xarkstar/DeBHuB-private.git
# public    https://github.com/0xarkstar/DeBHuB-public.git
```

## Important Notes

⚠️ **Before pushing to public:**
- Ensure no sensitive files (.env, API keys, etc.)
- .gitignore already configured to exclude:
  - `.env*` files
  - `.claude/` directory
  - `node_modules/`
  - Build artifacts

✅ **Safe to push:**
- All source code
- Documentation
- Configuration examples (.env.example)
- Package files (package.json, etc.)

## Vercel Deployment

Vercel is connected to **public** repository:
- Auto-deploys when you push to `public/main`
- Framework: Vite
- Root Directory: `apps/web-vite`

## Quick Commands

```bash
# Push to private only (development)
git push private master

# Push to both (release)
git push private master && git push public master:main

# Check remote status
git ls-remote private
git ls-remote public
```
