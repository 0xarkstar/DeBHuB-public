# ⚠️ DEPRECATED - Next.js Frontend

This directory contains the **legacy Next.js** version of the IrysBase frontend.

## Migration Notice

**The frontend has been migrated to Vite + React.**

- **New Location**: `../web-vite/`
- **Old Stack**: Next.js 14 + App Router
- **New Stack**: React 18 + Vite 5 + React Router v6

## Why Migrated?

1. **Performance**: Vite provides significantly faster HMR and build times
2. **Simplicity**: Client-only app doesn't need Next.js SSR/SSG features
3. **Bundle Size**: Vite produces smaller, more optimized bundles
4. **Developer Experience**: Faster feedback loop during development

## Differences

| Feature | Next.js (Old) | Vite (New) |
|---------|--------------|------------|
| **Build Tool** | Webpack | Vite (esbuild/Rollup) |
| **Routing** | App Router | React Router v6 |
| **HMR Speed** | ~2-3s | ~50-200ms |
| **Build Time** | ~30-60s | ~10-15s |
| **Bundle Size** | Larger | Optimized |
| **'use client'** | Required | Not needed |

## What to Do?

### For Development
Use the new Vite version:
```bash
cd ../web-vite
pnpm install
pnpm dev
```

### For Deployment
Deploy the Vite version:
```bash
cd ../web-vite
pnpm build
# Deploy the 'dist/' directory
```

### Should I Delete This?

**Not yet!** Keep it for reference until you're comfortable with the new setup.

Once you've verified the Vite version works perfectly:
```bash
# From project root
rm -rf apps/web
```

## Need Help?

- New README: `../web-vite/README.md`
- Compare changes: `git diff apps/web apps/web-vite`

---

**Last Updated**: 2025-10-06
**Status**: Legacy/Deprecated
**Recommended**: Use `apps/web-vite` instead
