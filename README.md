# IrysBase

A hybrid GraphQL-based Backend-as-a-Service (BaaS) platform that uses Irys for permanent storage and PostgreSQL for efficient querying, designed with Supabase-like developer experience.

## Architecture

IrysBase implements a hybrid architecture combining the best of decentralized and traditional systems:

- **Permanent Storage**: Irys DataChain serves as the source of truth for immutable data storage
- **Query Layer**: PostgreSQL provides fast, complex queries and real-time features
- **Business Logic**: Role-based access control (RBAC) runs on IrysVM smart contracts (Chain ID: 1270)
- **Authentication**: Wallet-based authentication using cryptographic signatures
- **Synchronization**: Background workers keep PostgreSQL synchronized with Irys data
- **Real-time Updates**: GraphQL subscriptions powered by blockchain events and database changes

## Project Structure

```
irysbase/
├── apps/
│   ├── api/           # GraphQL API server with sync workers
│   └── web/           # Next.js frontend with wallet integration
├── packages/
│   ├── contracts/     # Smart contracts (AuthRoles, Posts)
│   └── shared/        # Shared types and utilities
└── turbo.json         # Turborepo configuration
```

## Tech Stack

- **Monorepo**: Turborepo
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Apollo Client, ethers.js
- **Backend**: Node.js, Apollo Server, Prisma ORM, Bull Queue, Redis
- **Database**: PostgreSQL for querying, Irys for permanent storage
- **Blockchain**: IrysVM (Chain ID: 1270), Solidity, Hardhat
- **Storage**: @irys/upload, @irys/query
- **Real-time**: GraphQL Subscriptions, WebSocket support

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` files in `apps/api` and `apps/web`
   - Configure your environment variables

3. **Deploy smart contracts**
   ```bash
   cd packages/contracts
   npx hardhat run scripts/deploy.ts --network localhost
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

## Core Features

### Smart Contracts

- **AuthRoles.sol**: Manages user roles and permissions
- **Posts.sol**: Handles post registration and emits creation events

### GraphQL API

- **Queries**: Retrieve posts by author using Irys tag-based queries
- **Mutations**: Create posts with role verification and Irys upload
- **Subscriptions**: Real-time post notifications via smart contract events

### Frontend Dashboard

- **Wallet Connection**: MetaMask integration with ethers.js
- **Post Creation**: Rich text interface with cost estimation
- **Real-time Updates**: Live table updates via GraphQL subscriptions
- **Supabase-inspired UI**: Clean dashboard with sidebar navigation

## Development

```bash
# Start all services
npm run dev

# Build all packages
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Deployment

The system can be deployed across multiple environments:
- Smart contracts to any EVM-compatible network
- API server to any Node.js hosting platform
- Frontend to Vercel, Netlify, or similar
- Redis cache as required by the API

## Contributing

This project follows clean code principles and distributed architecture patterns. All data operations leverage Irys's immutable storage with mutable references for updates.