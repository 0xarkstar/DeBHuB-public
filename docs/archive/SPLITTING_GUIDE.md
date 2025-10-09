# 📦 Frontend-Backend Repository Splitting Guide

This guide explains how to split the IrysBase monorepo into separate repositories for frontend and backend.

## 🏗️ Current Architecture

### Monorepo Structure (Current)
```
irysbase/
├── apps/
│   ├── api/          ← Backend (GraphQL API)
│   └── web-vite/     ← Frontend (React + Vite)
├── packages/
│   ├── shared/       ← Shared types (used by both)
│   ├── contracts/    ← Smart contracts
│   └── irys-integration/
```

### Communication
- **Protocol**: GraphQL over HTTP/WebSocket
- **Frontend → Backend**: HTTP queries/mutations, WS subscriptions
- **Port**: Backend (4000), Frontend (3000)
- **Completely decoupled**: No direct code dependencies

---

## ✅ Verification: Are They Truly Separate?

### Backend Dependencies (apps/api/package.json)
```json
{
  "dependencies": {
    "@apollo/server": "^4.9.3",
    "@irysbase/shared": "workspace:*",  ← Only shared dependency
    "graphql": "^16.8.1",
    // ... backend-only deps
  }
}
```

### Frontend Dependencies (apps/web-vite/package.json)
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "@irysbase/shared": "workspace:*",  ← Only shared dependency
    "@apollo/client": "^3.8.4",
    // ... frontend-only deps
  }
}
```

**✅ Yes, they are truly separate!** Only `@irysbase/shared` is shared.

---

## 🔀 Splitting Strategy

### Option 1: Full Separation (Recommended for Production)

**Two Independent Repositories**

```
irysbase-backend/          irysbase-frontend/
├── src/                   ├── src/
├── prisma/                ├── components/
├── package.json           ├── package.json
└── ...                    └── ...
```

**Steps:**

1. **Publish shared types to npm**
   ```bash
   cd packages/shared
   npm publish --access public
   ```

2. **Create backend repo**
   ```bash
   mkdir irysbase-backend
   cp -r apps/api/* irysbase-backend/
   # Update package.json to use published @irysbase/shared
   ```

3. **Create frontend repo**
   ```bash
   mkdir irysbase-frontend
   cp -r apps/web-vite/* irysbase-frontend/
   # Update package.json to use published @irysbase/shared
   ```

### Option 2: Mono-to-Multi (Keep contracts together)

```
irysbase-contracts/        irysbase-platform/
├── packages/              ├── backend/
│   ├── contracts/         │   └── (api code)
│   ├── shared/            └── frontend/
│   └── irys-integration/      └── (web-vite code)
```

### Option 3: Keep Monorepo (Current - Good for Small Teams)

**Pros:**
- Easy to update shared types
- Single source of truth
- Simplified deployment

**Cons:**
- Larger repository
- Coupled deployment

---

## 📋 Splitting Checklist

### 1. Prepare Shared Package

- [ ] Add proper versioning to `packages/shared`
- [ ] Add README to `packages/shared`
- [ ] Publish to npm or private registry
- [ ] Or: Use git submodules

### 2. Backend Repository

```bash
# Create new repo
git init irysbase-backend
cd irysbase-backend

# Copy backend code
cp -r ../irysbase/apps/api/* .

# Update package.json
npm install @irysbase/shared@latest

# Update imports if needed
# import { Types } from '@irysbase/shared'

# Test
npm install
npm run build
npm run dev
```

**Backend Environment Variables:**
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
IRYS_API_KEY=...
PORT=4000
```

### 3. Frontend Repository

```bash
# Create new repo
git init irysbase-frontend
cd irysbase-frontend

# Copy frontend code
cp -r ../irysbase/apps/web-vite/* .

# Update package.json
npm install @irysbase/shared@latest

# Test
npm install
npm run build
npm run dev
```

**Frontend Environment Variables:**
```env
VITE_GRAPHQL_URL=https://api.irysbase.com/graphql
VITE_GRAPHQL_WS_URL=wss://api.irysbase.com/graphql
VITE_WALLETCONNECT_PROJECT_ID=...
```

### 4. Update CI/CD

**Backend (backend/.github/workflows/deploy.yml)**
```yaml
name: Deploy Backend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          npm install
          npm run build
          # Deploy to your backend server
```

**Frontend (frontend/.github/workflows/deploy.yml)**
```yaml
name: Deploy Frontend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and Deploy
        run: |
          npm install
          npm run build
          # Deploy to Vercel/Netlify/S3
```

---

## 🔧 Shared Types Strategy

### Option A: NPM Package (Recommended)

**Pros:**
- Proper versioning
- Easy to use
- Standard approach

**Steps:**
```bash
# In packages/shared
npm init --scope=@irysbase
npm version 1.0.0
npm publish --access public

# In backend & frontend
npm install @irysbase/shared@^1.0.0
```

### Option B: Git Submodule

**Pros:**
- No npm publishing needed
- Easy updates

**Steps:**
```bash
# Create shared repo
git init irysbase-shared
cp -r packages/shared/* irysbase-shared/
git commit -m "Initial commit"

# In backend repo
git submodule add <shared-repo-url> shared

# In frontend repo
git submodule add <shared-repo-url> shared
```

### Option C: Copy Types (Simple)

**Pros:**
- No dependencies
- Full control

**Cons:**
- Manual sync needed
- Can get out of sync

```bash
# Just copy and maintain separately
cp packages/shared/src/* backend/src/types/
cp packages/shared/src/* frontend/src/types/
```

---

## 🚀 Deployment Architecture

### Separated Deployment

```
                  ┌─────────────────┐
                  │   CDN / Vercel  │
                  │   (Frontend)    │
                  └────────┬────────┘
                           │
                           │ GraphQL
                           ▼
                  ┌─────────────────┐
                  │  Load Balancer  │
                  └────────┬────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐   ┌────────┐   ┌────────┐
         │  API   │   │  API   │   │  API   │
         │Server 1│   │Server 2│   │Server 3│
         └────────┘   └────────┘   └────────┘
              │            │            │
              └────────────┼────────────┘
                           ▼
                  ┌─────────────────┐
                  │   PostgreSQL    │
                  │     + Redis     │
                  └─────────────────┘
```

---

## 📝 Sample Package.json for Shared Types

```json
{
  "name": "@irysbase/shared",
  "version": "1.0.0",
  "description": "Shared types for IrysBase platform",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "files": ["dist"],
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

---

## ⚠️ Important Notes

1. **CORS Configuration**: Update backend CORS to allow frontend domain
2. **Environment Variables**: Keep them separate and secure
3. **API Versioning**: Consider versioning your GraphQL API
4. **Database**: Keep database migrations in backend repo
5. **Testing**: Set up separate CI/CD for each repo

---

## 🎯 Quick Decision Matrix

| Scenario | Recommendation |
|----------|---------------|
| **Solo developer / Small team** | Keep monorepo |
| **Different deployment schedules** | Split repos |
| **Separate teams** | Split repos |
| **Tight coupling expected** | Keep monorepo |
| **Open source frontend** | Split repos |
| **Microservices architecture** | Split repos |

---

## 📚 Additional Resources

- [Monorepo vs Polyrepo](https://www.toptal.com/developers/blog/monorepo-vs-polyrepo)
- [Git Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [npm Organizations](https://docs.npmjs.com/creating-an-organization)

---

**Current Status**: ✅ Ready to split whenever needed
**Recommendation**: Keep monorepo for now, split when team/deployment needs require it
