# Deployment Guide

Complete guide for deploying IrysBase to production.

## Table of Contents

- [Deployment Overview](#deployment-overview)
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Docker Deployment](#docker-deployment)
- [Environment Configuration](#environment-configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## Deployment Overview

### Architecture

```
┌────────────────────────────────────────────────────────┐
│  CDN (Vercel/Netlify)                                  │
│  ├─ Next.js Frontend                                   │
│  └─ Static Assets                                      │
└────────────────┬───────────────────────────────────────┘
                 │
┌────────────────┴───────────────────────────────────────┐
│  Load Balancer (Optional)                              │
└────────────────┬───────────────────────────────────────┘
                 │
┌────────────────┴───────────────────────────────────────┐
│  API Servers (Railway/Render/AWS)                      │
│  └─ Node.js + Apollo Server                           │
└────────────────┬───────────────────────────────────────┘
                 │
┌────────────────┴───────────────────────────────────────┐
│  Databases & Storage                                   │
│  ├─ PostgreSQL (Supabase/Railway)                     │
│  ├─ Redis (Upstash/Railway)                           │
│  └─ Irys DataChain                                     │
└────────────────────────────────────────────────────────┘
```

### Deployment Platforms

| Component | Recommended | Alternatives |
|-----------|------------|--------------|
| Frontend | Vercel | Netlify, Cloudflare Pages |
| API | Railway | Render, AWS, GCP, Azure |
| Database | Supabase | Railway, AWS RDS, Neon |
| Redis | Upstash | Railway, AWS ElastiCache |
| Smart Contracts | IrysVM | Any EVM chain |

---

## Prerequisites

### Required Accounts

1. **Vercel** - Frontend hosting (https://vercel.com)
2. **Railway** - Backend & database hosting (https://railway.app)
3. **Supabase** - PostgreSQL database (https://supabase.com)
4. **Upstash** - Redis cache (https://upstash.com)

### Required Tools

```bash
# Vercel CLI
npm install -g vercel

# Railway CLI
npm install -g @railway/cli

# Docker (optional)
docker --version
```

---

## Database Setup

### Option 1: Supabase (Recommended)

1. **Create Project:**
   - Go to https://supabase.com
   - Create new project
   - Note down connection string

2. **Configure Connection:**
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
   ```

3. **Run Migrations:**
   ```bash
   cd apps/api
   pnpm db:migrate
   ```

### Option 2: Railway

1. **Create PostgreSQL Service:**
   ```bash
   railway up
   railway add postgresql
   ```

2. **Get Connection String:**
   ```bash
   railway variables get DATABASE_URL
   ```

### Option 3: Self-Hosted

#### Using Docker

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: irysbase
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### Using AWS RDS

1. Create RDS PostgreSQL instance
2. Configure security groups
3. Note connection endpoint
4. Update DATABASE_URL

---

## Backend Deployment

### Option 1: Railway (Recommended)

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

#### 2. Create New Project

```bash
cd apps/api
railway init
```

#### 3. Configure Environment

```bash
# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set REDIS_URL="redis://..."
railway variables set JWT_SECRET="your-secret"
railway variables set IRYSVM_PRIVATE_KEY="your-key"
```

#### 4. Deploy

```bash
railway up
```

#### 5. Configure Domain

```bash
railway domain
```

### Option 2: Render

#### 1. Create render.yaml

```yaml
# render.yaml
services:
  - type: web
    name: irysbase-api
    env: node
    buildCommand: pnpm install && pnpm run build:enhanced
    startCommand: node dist/index-enhanced.js
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: NODE_ENV
        value: production
```

#### 2. Deploy

1. Push to GitHub
2. Connect repository to Render
3. Configure environment variables
4. Deploy

### Option 3: Docker + AWS/GCP

#### 1. Build Docker Image

```dockerfile
# Dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build:enhanced

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 4000
CMD ["node", "dist/index-enhanced.js"]
```

#### 2. Build and Push

```bash
# Build
docker build -t irysbase-api .

# Tag
docker tag irysbase-api:latest your-registry/irysbase-api:latest

# Push
docker push your-registry/irysbase-api:latest
```

#### 3. Deploy to AWS ECS/GCP Cloud Run

Follow platform-specific instructions.

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Configure Project

```bash
cd apps/web
vercel
```

#### 3. Set Environment Variables

```bash
# Production environment
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_WS_URL production
vercel env add NEXT_PUBLIC_CHAIN_ID production
```

#### 4. Deploy

```bash
# Production deployment
vercel --prod
```

#### 5. Configure Domain

```bash
vercel domains add yourdomain.com
```

### Option 2: Netlify

#### 1. Create netlify.toml

```toml
[build]
  command = "pnpm install && pnpm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 2. Deploy

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Option 3: Self-Hosted

#### Build for Production

```bash
cd apps/web

# Build
pnpm run build

# Start
pnpm start
```

#### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start
pm2 start npm --name "irysbase-web" -- start

# Save
pm2 save
pm2 startup
```

---

## Docker Deployment

### Complete Stack with Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: irysbase
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # API Server
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/irysbase
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Frontend
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:4000/graphql
      NEXT_PUBLIC_WS_URL: ws://api:4000/graphql
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

### Deploy with Docker Compose

```bash
# Create .env file
cat > .env << EOF
POSTGRES_PASSWORD=your-password
JWT_SECRET=your-jwt-secret
EOF

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Environment Configuration

### Production Environment Variables

#### API (.env.production)

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/irysbase"

# Redis
REDIS_URL="redis://host:6379"

# Server
NODE_ENV=production
PORT=4000

# Security
JWT_SECRET="your-production-jwt-secret"
CORS_ORIGIN="https://yourdomain.com"

# Irys
IRYS_NETWORK="mainnet"
IRYS_TOKEN="matic"
IRYS_PRIVATE_KEY="your-private-key"

# IrysVM
IRYSVM_RPC_URL="https://rpc.irys.xyz"
IRYSVM_CHAIN_ID=1270
IRYSVM_PRIVATE_KEY="your-private-key"

# Monitoring (Optional)
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="info"
```

#### Frontend (.env.production)

```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/graphql"
NEXT_PUBLIC_WS_URL="wss://api.yourdomain.com/graphql"
NEXT_PUBLIC_CHAIN_ID=1270
NEXT_PUBLIC_RPC_URL="https://rpc.irys.xyz"
NEXT_PUBLIC_IRYS_GATEWAY="https://gateway.irys.xyz"
```

### Secrets Management

#### Using Railway

```bash
railway secrets set JWT_SECRET="secret"
railway secrets set DATABASE_URL="url"
```

#### Using Vercel

```bash
vercel env add JWT_SECRET production
```

#### Using AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name irysbase/jwt-secret \
  --secret-string "your-secret"
```

---

## SSL/TLS Configuration

### Using Vercel/Netlify

- Automatic SSL certificates
- No configuration needed

### Using Railway

- Automatic SSL for custom domains
- Configure domain in dashboard

### Self-Hosted with Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# API Health
curl https://api.yourdomain.com/health

# Response
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "services": {
    "database": true,
    "redis": true
  }
}
```

### Logging

#### Structured Logging

```typescript
// Use structured logging
logger.info('Document created', {
  documentId: 'doc-123',
  userId: 'user-456',
  timestamp: new Date()
});
```

#### Log Aggregation

**Using Papertrail:**

```bash
# Configure
railway logs --papertrail
```

**Using Datadog:**

```bash
# Install
npm install dd-trace

# Configure
require('dd-trace').init();
```

### Monitoring Tools

1. **Sentry** - Error tracking
   ```typescript
   import * as Sentry from "@sentry/node";

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: "production"
   });
   ```

2. **Prometheus** - Metrics
   ```typescript
   import { register } from 'prom-client';

   app.get('/metrics', (req, res) => {
     res.set('Content-Type', register.contentType);
     res.end(register.metrics());
   });
   ```

3. **Grafana** - Dashboards

### Database Backups

#### Automated Backups (Supabase)

- Automatic daily backups
- Configure in dashboard

#### Manual Backups

```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

#### Backup to Irys

```bash
# Use programmable data service
curl -X POST https://api.yourdomain.com/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createBackup(projectId: \"123\") { irysId } }"
  }'
```

### Performance Monitoring

#### Response Time Monitoring

```typescript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      duration
    });
  });
  next();
});
```

#### Database Query Monitoring

```typescript
// Enable Prisma logging
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'warn', emit: 'event' }
  ]
});

prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    logger.warn('Slow query detected', {
      query: e.query,
      duration: e.duration
    });
  }
});
```

---

## Scaling Strategies

### Horizontal Scaling

```
Load Balancer
    ├─→ API Server 1
    ├─→ API Server 2
    └─→ API Server N
```

### Database Scaling

1. **Read Replicas:**
   - Primary for writes
   - Replicas for reads

2. **Connection Pooling:**
   ```typescript
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: DATABASE_URL,
         poolSize: 20
       }
     }
   });
   ```

### Redis Scaling

1. **Redis Cluster:**
   - Multiple Redis nodes
   - Automatic sharding

2. **Redis Sentinel:**
   - High availability
   - Automatic failover

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Timeout

```bash
# Check connection
psql $DATABASE_URL

# Increase timeout
DATABASE_CONNECT_TIMEOUT=10000
```

#### 2. Memory Leaks

```bash
# Monitor memory
node --max-old-space-size=4096 dist/index-enhanced.js

# Profile memory
node --inspect dist/index-enhanced.js
```

#### 3. High CPU Usage

- Enable caching
- Optimize database queries
- Add read replicas

---

## Rollback Procedure

### Railway

```bash
# List deployments
railway deployments

# Rollback
railway rollback <deployment-id>
```

### Vercel

```bash
# List deployments
vercel ls

# Rollback
vercel rollback <deployment-url>
```

### Docker

```bash
# Rollback to previous image
docker-compose down
docker-compose pull
docker-compose up -d
```

---

## Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates obtained
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Load testing completed

### Post-Deployment

- [ ] Health checks passing
- [ ] Logs flowing correctly
- [ ] Monitoring active
- [ ] SSL working
- [ ] Performance acceptable
- [ ] Backups verified

---

For more information:
- [Getting Started](./GETTING_STARTED.md)
- [Architecture](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [Services Guide](./SERVICES.md)