# 🚀 IrysBase Quick Start Guide

## Prerequisites
- Node.js >= 18.0.0
- Docker & Docker Compose
- pnpm (`npm install -g pnpm`)

## Installation & Setup

### 1. Clone and Install
```bash
git clone https://github.com/your-org/irysbase.git
cd irysbase
pnpm install
```

### 2. Environment Setup
```bash
# Automated setup (creates .env files, starts Docker services, runs migrations)
pnpm setup

# Manual: Add your keys to .env
echo "IRYS_PRIVATE_KEY=your_private_key" >> .env
echo "OPENAI_API_KEY=your_openai_key" >> .env
echo "PINECONE_API_KEY=your_pinecone_key" >> .env
```

### 3. Deploy Contracts
```bash
# Deploy to Irys Testnet
pnpm deploy:contracts

# Or deploy locally for testing
pnpm deploy:local
```

### 4. Start Development
```bash
# Start all services
pnpm dev

# Or start individually
pnpm dev:api  # API server only
pnpm dev:web  # Web app only
```

### 5. Access Applications
- Web App: http://localhost:3000
- API: http://localhost:4000
- GraphQL Playground: http://localhost:4000/graphql

## Testing

```bash
# Run all tests
pnpm test:all

# Run specific test suites
pnpm test           # Unit tests
pnpm test:integration  # Integration tests
pnpm test:e2e       # End-to-end tests
```

## Production Deployment

### Using Docker
```bash
# Build Docker image
pnpm build:docker

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
```bash
# Build for production
pnpm build

# Start production server
pnpm start:prod
```

## Monitoring & Health

```bash
# Check system health
pnpm health

# Start monitoring dashboard
pnpm monitor
```

## Troubleshooting

### Database Issues
```bash
# Reset database
pnpm db:reset

# Run migrations manually
pnpm db:migrate
```

### Contract Issues
```bash
# Verify contract deployment
cat deployed-contracts.json

# Re-deploy contracts
pnpm deploy:contracts --force
```

### Clear Everything
```bash
# Complete clean start
pnpm setup:clean
```

## Available Scripts

- `pnpm setup` - Automated environment setup
- `pnpm dev` - Start development servers
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm deploy:contracts` - Deploy smart contracts
- `pnpm monitor` - Start monitoring dashboard
- `pnpm health` - Check system health

## Architecture

IrysBase is built as a comprehensive Web3 platform with:

- **Core Services**: Database, Storage, Realtime, Functions
- **Advanced Services**: Vector DB, Search, Analytics, Programmable Data
- **Smart Contracts**: AuthRoles, IrysBaseCore, Posts
- **Monitoring**: Health checks, Real-time metrics
- **Testing**: Unit, Integration, E2E test suites

For more details, see the [complete integration plan](./irysbase-complete-integration.md).