# Pure Irys BaaS - Deployment Guide

**Zero Backend. Zero Database. Pure Frontend Deployment.**

Complete guide for deploying DeBHuB Pure Irys BaaS to production.

---

## Table of Contents

- [Deployment Overview](#deployment-overview)
- [Prerequisites](#prerequisites)
- [Frontend Deployment](#frontend-deployment)
- [Smart Contracts Deployment](#smart-contracts-deployment)
- [Environment Configuration](#environment-configuration)
- [Performance Optimization](#performance-optimization)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Deployment Overview

### Pure Irys Architecture

```
┌────────────────────────────────────────────────────────┐
│  CDN/Static Hosting (Vercel/Netlify/Cloudflare)        │
│  ├─ React Frontend (Vite 5)                            │
│  ├─ Pure Irys Client Package                           │
│  ├─ Static Assets                                      │
│  └─ Service Worker (Optional)                          │
└────────────────┬───────────────────────────────────────┘
                 │
                 │ Direct Connection
                 │ (No API Server!)
                 ▼
┌────────────────────────────────────────────────────────┐
│  Irys L1 DataChain + Smart Contracts                   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Irys DataChain (Layer 1 Blockchain)            │  │
│  │  - RPC: https://rpc.irys.xyz                    │  │
│  │  - Gateway: https://gateway.irys.xyz            │  │
│  │  - Chain ID: 1270 (Testnet) / 9990 (Mainnet)   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │  6 Smart Contracts (EVM-compatible)             │  │
│  │  - DocumentRegistry                             │  │
│  │  - AccessControl                                │  │
│  │  - ProvenanceChain                              │  │
│  │  - EventBus                                     │  │
│  │  - CacheController                              │  │
│  │  - SearchIndex                                  │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### What Gets Deployed?

| Component | Deployed Where | Cost |
|-----------|---------------|------|
| **React Frontend** | Vercel/Netlify/Cloudflare | Free - $20/mo |
| **Smart Contracts** | Irys L1 DataChain (one-time) | Gas fees only (~$5) |
| **Data Storage** | Irys Permanent Storage | Pay per upload |
| **Backend Server** | ❌ **NOT NEEDED** | $0 |
| **PostgreSQL** | ❌ **NOT NEEDED** | $0 |
| **Redis** | ❌ **NOT NEEDED** | $0 |

### Deployment Platforms

| Platform | Pros | Cons | Cost |
|----------|------|------|------|
| **Vercel** ⭐ | Auto-deploy, CDN, analytics | Commercial use requires Pro | Free tier generous |
| **Netlify** | Generous free tier, simple UI | Slower builds | Free tier excellent |
| **Cloudflare Pages** | Fastest CDN, unlimited bandwidth | Newer platform | Free tier best |
| **GitHub Pages** | Simple, integrated with GitHub | No server-side features | Free |
| **Self-Hosted** | Full control | Requires infrastructure | VPS cost (~$5/mo) |

---

## Prerequisites

### Required Accounts

1. **Wallet with Funds**
   - MetaMask or compatible wallet
   - ETH for gas fees (Testnet: free from faucet, Mainnet: ~$5-10)
   - Irys tokens (get from https://irys.xyz/faucet for testnet)

2. **Deployment Platform** (choose one):
   - Vercel account (https://vercel.com) ⭐ Recommended
   - Netlify account (https://netlify.com)
   - Cloudflare Pages account (https://pages.cloudflare.com)
   - GitHub account (for GitHub Pages)

3. **WalletConnect Project** (Optional but recommended):
   - Create project at https://cloud.walletconnect.com
   - Get Project ID for better wallet support

### Required Tools

```bash
# Node.js 18+
node --version

# pnpm 9+
pnpm --version

# Git
git --version

# Vercel CLI (if using Vercel)
npm install -g vercel

# Netlify CLI (if using Netlify)
npm install -g netlify-cli

# Wrangler CLI (if using Cloudflare Pages)
npm install -g wrangler
```

---

## Frontend Deployment

### Step 1: Build the Frontend

```bash
# Clone repository
git clone https://github.com/0xarkstar/irysbase.git
cd irysbase

# Install dependencies
pnpm install

# Build Pure Irys Client package
cd packages/pure-irys-client
pnpm build

# Build frontend
cd ../../apps/web-vite
pnpm build
```

The build output will be in `apps/web-vite/dist/`.

### Option 1: Vercel (Recommended)

#### A. Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
cd apps/web-vite
vercel --prod
```

#### B. Deploy via GitHub Integration

1. **Push to GitHub**:
   ```bash
   git push origin master
   ```

2. **Import to Vercel**:
   - Go to https://vercel.com/new
   - Import your repository
   - Select `apps/web-vite` as root directory
   - Configure environment variables (see below)
   - Click "Deploy"

3. **Configure Build Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web-vite`
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

#### C. Environment Variables (Vercel)

```bash
# Set via CLI
vercel env add VITE_ENABLE_BACKEND production
# Enter: false

vercel env add VITE_WALLETCONNECT_PROJECT_ID production
# Enter: your_project_id

vercel env add VITE_IRYS_NETWORK production
# Enter: mainnet (or testnet)

vercel env add VITE_CHAIN_ID production
# Enter: 9990 (mainnet) or 1270 (testnet)

vercel env add VITE_RPC_URL production
# Enter: https://rpc.irys.xyz
```

Or set via Vercel Dashboard:
- Settings → Environment Variables → Add

### Option 2: Netlify

#### A. Deploy via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build
cd apps/web-vite
pnpm build

# Deploy
netlify deploy --prod --dir=dist
```

#### B. Deploy via Git Integration

1. **Create netlify.toml** (in `apps/web-vite/`):

```toml
[build]
  base = "apps/web-vite"
  command = "pnpm install && pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Push to GitHub**:
   ```bash
   git add netlify.toml
   git commit -m "Add Netlify config"
   git push origin master
   ```

3. **Import to Netlify**:
   - Go to https://app.netlify.com/start
   - Connect your repository
   - Configure environment variables
   - Deploy

#### C. Environment Variables (Netlify)

Set via Netlify Dashboard:
- Site Settings → Environment Variables

```
VITE_ENABLE_BACKEND=false
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_IRYS_NETWORK=mainnet
VITE_CHAIN_ID=9990
VITE_RPC_URL=https://rpc.irys.xyz
```

### Option 3: Cloudflare Pages

#### A. Deploy via Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Build
cd apps/web-vite
pnpm build

# Deploy
wrangler pages deploy dist --project-name=debhub
```

#### B. Deploy via Git Integration

1. **Push to GitHub**:
   ```bash
   git push origin master
   ```

2. **Create Cloudflare Pages Project**:
   - Go to https://dash.cloudflare.com
   - Pages → Create a project
   - Connect GitHub repository
   - **Build settings**:
     - Build command: `cd apps/web-vite && pnpm install && pnpm build`
     - Build output directory: `apps/web-vite/dist`
     - Root directory: `/`
     - Environment variables: (see below)

#### C. Environment Variables (Cloudflare)

```
VITE_ENABLE_BACKEND=false
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_IRYS_NETWORK=mainnet
VITE_CHAIN_ID=9990
VITE_RPC_URL=https://rpc.irys.xyz
```

### Option 4: GitHub Pages

```bash
# Build
cd apps/web-vite
pnpm build

# Deploy to gh-pages branch
npx gh-pages -d dist
```

Configure GitHub Pages:
- Repository Settings → Pages
- Source: `gh-pages` branch
- Save

### Option 5: Self-Hosted (VPS/Docker)

#### Using Nginx

```bash
# Build locally
cd apps/web-vite
pnpm build

# Copy to server
scp -r dist/* user@your-server:/var/www/debhub/

# Nginx configuration
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/debhub;
    index index.html;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/debhub;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Using Docker

```dockerfile
# Dockerfile (in apps/web-vite/)
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/pure-irys-client ./packages/pure-irys-client

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/web-vite ./apps/web-vite

# Build
WORKDIR /app/apps/web-vite
RUN pnpm build

# Production image
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/web-vite/dist /usr/share/nginx/html

# Nginx config for SPA
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build image
docker build -t debhub-frontend .

# Run
docker run -p 80:80 debhub-frontend
```

---

## Smart Contracts Deployment

### For Testnet (Already Deployed)

Smart contracts are already deployed on Irys Testnet:

```
Chain ID: 1270
RPC: https://testnet-rpc.irys.xyz/v1/execution-rpc

DocumentRegistry:  0x937956DA31B42C3ad9f6eC4366360Ae763391566
AccessControl:     0xdD1ACe083c156296760aAe07718Baab969642B8D
ProvenanceChain:   0x44755E8C746Dc1819a0e8c74503AFC106FC800CB
EventBus:          0x042E4e6a56aA1680171Da5e234D9cE42CBa03E1c
CacheController:   0x8aFb8b9d57e9b6244e29a090ea4da1A9043a91E2
SearchIndex:       0x2345938F52790F1d8a1E3355cA66eA3e60494A36
```

**You can skip deployment and use these contracts for testing.**

### For Mainnet (Your Own Deployment)

#### Prerequisites

1. **Wallet with Mainnet ETH**:
   - Need ~0.05 ETH for deployment gas fees
   - Get mainnet address from your wallet

2. **Private Key**:
   - Export from MetaMask or your wallet
   - **KEEP THIS SECRET**

#### Deployment Steps

```bash
# Navigate to contracts package
cd packages/contracts

# Create .env file
cat > .env << EOF
PRIVATE_KEY=your_private_key_here
IRYS_RPC_URL=https://rpc.irys.xyz
IRYS_CHAIN_ID=9990
EOF

# Compile contracts
pnpm compile

# Deploy to mainnet
pnpm deploy:pure-irys
```

#### Update Contract Addresses

After deployment, update the addresses in your frontend:

```typescript
// packages/pure-irys-client/src/contracts/addresses.ts

export const CONTRACT_ADDRESSES = {
  mainnet: {
    DocumentRegistry: '0xYourNewAddress...',
    AccessControl: '0xYourNewAddress...',
    ProvenanceChain: '0xYourNewAddress...',
    EventBus: '0xYourNewAddress...',
    CacheController: '0xYourNewAddress...',
    SearchIndex: '0xYourNewAddress...',
  },
  testnet: {
    // Keep existing testnet addresses
    DocumentRegistry: '0x937956DA31B42C3ad9f6eC4366360Ae763391566',
    // ...
  }
};
```

Rebuild and redeploy frontend:

```bash
cd packages/pure-irys-client
pnpm build

cd ../../apps/web-vite
pnpm build
vercel --prod
```

---

## Environment Configuration

### Production Environment Variables

Create `.env.production` in `apps/web-vite/`:

```env
# ==========================================
# Pure Irys BaaS - Production Configuration
# ==========================================

# Mode
VITE_ENABLE_BACKEND=false

# Network (Mainnet)
VITE_IRYS_NETWORK=mainnet
VITE_IRYS_TOKEN=ethereum
VITE_CHAIN_ID=9990
VITE_RPC_URL=https://rpc.irys.xyz

# Wallet Connect
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: Analytics
VITE_ANALYTICS_ID=your_analytics_id

# Optional: Sentry (Error Tracking)
VITE_SENTRY_DSN=your_sentry_dsn
```

### Network Configurations

#### Testnet

```env
VITE_IRYS_NETWORK=testnet
VITE_CHAIN_ID=1270
VITE_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc
```

#### Mainnet

```env
VITE_IRYS_NETWORK=mainnet
VITE_CHAIN_ID=9990
VITE_RPC_URL=https://rpc.irys.xyz
```

### Security Best Practices

1. **Never Commit Private Keys**:
   ```bash
   # Add to .gitignore
   echo ".env.local" >> .gitignore
   echo ".env.production.local" >> .gitignore
   ```

2. **Use Environment Variables for Secrets**:
   - Set via platform UI (Vercel/Netlify/Cloudflare)
   - Never hardcode in source code

3. **HTTPS Only**:
   - All production deployments must use HTTPS
   - Modern wallets require secure context

4. **Content Security Policy**:
   ```html
   <!-- Add to index.html -->
   <meta http-equiv="Content-Security-Policy"
         content="default-src 'self';
                  connect-src 'self' https://*.irys.xyz https://*.walletconnect.com;
                  script-src 'self' 'unsafe-inline' 'unsafe-eval';
                  style-src 'self' 'unsafe-inline';">
   ```

---

## Performance Optimization

### Build Optimization

#### Vite Configuration

```typescript
// apps/web-vite/vite.config.ts
export default defineConfig({
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'web3': ['ethers', 'wagmi', '@rainbow-me/rainbowkit'],
          'irys': ['@irys/web-upload', '@irys/query']
        }
      }
    },

    // Compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    },

    // Source maps (only for error tracking)
    sourcemap: 'hidden',

    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  },

  // Asset optimization
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf']
});
```

### CDN Configuration

#### Cache Headers

```nginx
# Nginx example
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

location ~* \.(png|jpg|jpeg|gif|ico|svg|webp)$ {
    expires 6M;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

#### Vercel Configuration

```json
// vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Frontend Optimization

1. **Lazy Loading**:
   ```typescript
   // Lazy load pages
   const DashboardPure = lazy(() => import('./pages/DashboardPure'));
   const NewProjectPure = lazy(() => import('./pages/NewProjectPure'));
   ```

2. **Image Optimization**:
   ```bash
   # Install image optimizer
   pnpm add -D vite-plugin-imagemin
   ```

3. **Preload Critical Resources**:
   ```html
   <link rel="preconnect" href="https://rpc.irys.xyz">
   <link rel="preconnect" href="https://gateway.irys.xyz">
   ```

4. **Service Worker** (Optional):
   ```typescript
   // Cache Irys data responses
   self.addEventListener('fetch', (event) => {
     if (event.request.url.includes('gateway.irys.xyz')) {
       event.respondWith(
         caches.match(event.request).then(response => {
           return response || fetch(event.request);
         })
       );
     }
   });
   ```

### IndexedDB Optimization

```typescript
// Increase cache size for production
const client = new PureIrysClient(signer, {
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000, // More documents
    strategy: 'lru' // Least Recently Used
  }
});
```

---

## Monitoring

### Error Tracking with Sentry

```bash
# Install Sentry
pnpm add @sentry/react @sentry/vite-plugin
```

```typescript
// apps/web-vite/src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Analytics

#### Google Analytics

```typescript
// apps/web-vite/src/main.tsx
import ReactGA from 'react-ga4';

if (import.meta.env.PROD) {
  ReactGA.initialize(import.meta.env.VITE_ANALYTICS_ID);
}
```

#### Custom Analytics

```typescript
// Track blockchain transactions
const trackTransaction = (type: string, data: any) => {
  if (import.meta.env.PROD) {
    fetch('https://analytics.yourdomain.com/event', {
      method: 'POST',
      body: JSON.stringify({
        type,
        data,
        timestamp: Date.now()
      })
    });
  }
};

// Usage
await client.createDocument(...);
trackTransaction('document_created', { docId });
```

### Performance Monitoring

```typescript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Health Checks

Since there's no backend, monitor:

1. **Irys Network Status**: https://status.irys.xyz
2. **RPC Endpoint**: Ping https://rpc.irys.xyz
3. **Contract Interactions**: Test reads/writes periodically

```typescript
// Simple health check
const checkHealth = async () => {
  try {
    // Check RPC
    const provider = new ethers.JsonRpcProvider('https://rpc.irys.xyz');
    await provider.getBlockNumber();

    // Check contracts
    const client = new PureIrysClient(signer);
    await client.init();

    console.log('✅ All systems operational');
  } catch (error) {
    console.error('❌ Health check failed', error);
  }
};
```

---

## Troubleshooting

### Common Issues

#### 1. "Failed to connect wallet"

**Problem**: Wallet connection fails

**Solutions**:
1. Check HTTPS is enabled (wallets require secure context)
2. Verify WalletConnect Project ID is correct
3. Check user has MetaMask or compatible wallet installed
4. Try different wallet provider

```typescript
// Debug wallet connection
const { isConnected, address } = useAccount();
console.log('Wallet connected:', isConnected, address);
```

#### 2. "Contract call failed"

**Problem**: Smart contract interaction errors

**Solutions**:
1. Verify contract addresses are correct for network (testnet vs mainnet)
2. Check user is on correct network (Chain ID 1270 or 9990)
3. Ensure user has sufficient ETH for gas
4. Check contract ABIs match deployed contracts

```typescript
// Debug contract calls
try {
  const tx = await client.createDocument(...);
  console.log('Transaction:', tx);
} catch (error) {
  console.error('Contract error:', error.message);
}
```

#### 3. "Failed to upload to Irys"

**Problem**: Irys upload fails

**Solutions**:
1. Check Irys network status: https://status.irys.xyz
2. Verify wallet has funds for upload
3. Check RPC URL is correct
4. Try smaller upload size

```typescript
// Debug Irys uploads
const uploader = await WebUploader(WebEthereum)
  .withProvider(provider)
  .withRpc(rpcUrl);

console.log('Uploader ready:', uploader);
```

#### 4. Build Errors

**Problem**: `pnpm build` fails

**Solutions**:
```bash
# Clear cache
pnpm clean

# Delete node_modules
rm -rf node_modules
pnpm install

# Clear TypeScript cache
find . -name "*.tsbuildinfo" -delete

# Rebuild packages
cd packages/pure-irys-client
pnpm build

cd ../../apps/web-vite
pnpm build
```

#### 5. Environment Variables Not Working

**Problem**: Config not loaded

**Solutions**:
1. Ensure variables start with `VITE_` prefix
2. Restart dev server after changing `.env`
3. Rebuild for production
4. Check platform-specific env var syntax

```typescript
// Debug env vars
console.log('Config:', {
  backend: import.meta.env.VITE_ENABLE_BACKEND,
  chainId: import.meta.env.VITE_CHAIN_ID,
  rpcUrl: import.meta.env.VITE_RPC_URL
});
```

#### 6. Slow Performance

**Problem**: App feels sluggish

**Solutions**:
1. Enable IndexedDB caching
2. Implement pagination for large lists
3. Use React.memo for expensive components
4. Lazy load routes
5. Optimize bundle size

```typescript
// Check cache stats
const stats = await client.getCacheStats();
console.log('Cache hit rate:', stats.hits / (stats.hits + stats.misses));
```

### Network Debugging

```bash
# Check if Irys RPC is accessible
curl https://rpc.irys.xyz

# Check contract deployment
curl -X POST https://rpc.irys.xyz \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getCode",
    "params": ["0x937956DA31B42C3ad9f6eC4366360Ae763391566", "latest"],
    "id": 1
  }'
```

---

## Rollback Procedure

### Vercel

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>

# Or via dashboard
# Deployments → Select previous → Promote to Production
```

### Netlify

```bash
# List deploys
netlify deploy list

# Restore previous
netlify deploy restore <deploy-id>

# Or via dashboard
# Deploys → Select previous → Publish deploy
```

### Cloudflare Pages

- Dashboard → Deployments
- Select previous deployment
- Click "Rollback to this deployment"

### Self-Hosted

```bash
# Keep previous builds
cp -r dist dist.backup

# Deploy new build
pnpm build
rsync -avz dist/ user@server:/var/www/debhub/

# If issues, rollback
rsync -avz dist.backup/ user@server:/var/www/debhub/
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured for production
- [ ] Smart contracts deployed to target network (mainnet/testnet)
- [ ] Contract addresses updated in code
- [ ] WalletConnect Project ID obtained
- [ ] Build completes successfully
- [ ] All TypeScript checks pass (`pnpm typecheck`)
- [ ] Test on staging environment
- [ ] Browser compatibility tested
- [ ] Wallet connections tested
- [ ] Error tracking configured (Sentry)

### Post-Deployment

- [ ] Frontend accessible via HTTPS
- [ ] Wallet connection works
- [ ] Contract interactions work
- [ ] Document creation succeeds
- [ ] Document retrieval works
- [ ] Search functionality works
- [ ] Cache performance acceptable
- [ ] Analytics tracking works
- [ ] Error monitoring active
- [ ] Performance metrics good (Lighthouse score > 90)
- [ ] Mobile responsive
- [ ] Cross-browser tested

### Ongoing Maintenance

- [ ] Monitor error rates (Sentry)
- [ ] Track performance metrics
- [ ] Monitor Irys network status
- [ ] Update dependencies monthly
- [ ] Review smart contract gas costs
- [ ] Optimize based on usage patterns
- [ ] Keep documentation updated

---

## Cost Estimation

### Monthly Costs (Production)

| Item | Cost | Notes |
|------|------|-------|
| Frontend Hosting (Vercel Pro) | $20/mo | Can use free tier for testing |
| Irys Storage | Pay-per-use | ~$0.01 per MB, permanent |
| Irys Gas Fees | Variable | ~$0.001 per transaction |
| Domain Name | $12/yr | Optional |
| Error Tracking (Sentry) | $0-26/mo | Free tier available |
| **Total** | **~$20-50/mo** | Scales with usage |

**Compare to Traditional Stack**:
- Backend Server: $25-100/mo
- PostgreSQL: $15-50/mo
- Redis: $10-30/mo
- **Traditional Total**: **$50-180/mo** ❌

**Pure Irys Savings**: **60-75% cost reduction** ✅

---

## Advanced Topics

### Custom Domain

#### Vercel

```bash
vercel domains add yourdomain.com
```

Then configure DNS:
```
A     @        76.76.21.21
CNAME www      cname.vercel-dns.com
```

#### Netlify

Settings → Domain Management → Add custom domain

#### Cloudflare Pages

Pages → Custom Domains → Set up a custom domain

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Typecheck
        run: pnpm typecheck

      - name: Build
        run: pnpm build --filter @debhub/web-vite

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          vercel-args: '--prod'
          working-directory: ./apps/web-vite
```

### Multi-Environment Setup

```bash
# apps/web-vite/.env.staging
VITE_ENABLE_BACKEND=false
VITE_IRYS_NETWORK=testnet
VITE_CHAIN_ID=1270
VITE_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc

# apps/web-vite/.env.production
VITE_ENABLE_BACKEND=false
VITE_IRYS_NETWORK=mainnet
VITE_CHAIN_ID=9990
VITE_RPC_URL=https://rpc.irys.xyz
```

```bash
# Build for staging
pnpm build --mode staging

# Build for production
pnpm build --mode production
```

---

## Getting Help

1. **Documentation**: Check `docs/` directory
2. **GitHub Issues**: https://github.com/0xarkstar/irysbase/issues
3. **Irys Discord**: https://discord.gg/irys
4. **Deployment Logs**: Check platform-specific logs
5. **Browser Console**: Enable verbose logging

---

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System architecture
- [Getting Started](./GETTING_STARTED.md) - Development setup
- [Pure Irys Setup](../PURE_IRYS_SETUP.md) - Pure Irys quick start
- [Smart Contracts](./SERVICES.md) - Contract documentation

---

**DeBHuB Pure Irys BaaS** - World's First Pure Irys Deployment

**Zero Backend. Zero Database. Maximum Simplicity.**

Made with ❤️ by the DeBHuB Team

**Status**: 🟢 Production Ready | **Version**: 3.0.0-pure | **Updated**: 2025-10-16
