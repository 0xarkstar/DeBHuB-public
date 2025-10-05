# IrysBase Frontend (React + Vite)

Modern, high-performance frontend for the IrysBase decentralized documentation platform.

## 🚀 Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5 (Fast HMR, optimized builds)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**:
  - Zustand (global state)
  - TanStack Query (server state)
  - Apollo Client (GraphQL)
- **Web3**:
  - Wagmi v2
  - RainbowKit (wallet connections)
  - Ethers v6

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui base components
│   ├── dashboard/   # Dashboard-specific components
│   ├── editor/      # Document editor components
│   └── shared/      # Shared components
├── layouts/         # Layout components
├── pages/           # Page components (routes)
├── lib/             # Utilities and configurations
│   ├── graphql/     # GraphQL queries/mutations
│   ├── apollo.ts    # Apollo Client setup
│   ├── wagmi.ts     # Web3 configuration
│   └── utils.ts     # Helper functions
├── store/           # Zustand stores
├── types/           # TypeScript type definitions
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

## 🛠️ Development

### Prerequisites

- Node.js 20+
- pnpm 8+

### Environment Variables

Create a `.env.local` file:

```env
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_AUTH_ROLES_CONTRACT=0x...
VITE_POSTS_CONTRACT=0x...
```

### Commands

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## 🌐 Features

### Implemented Features

✅ **Wallet Integration**
- Multi-wallet support via RainbowKit
- IrysVM, Mainnet, Sepolia support
- Wallet connection persistence

✅ **Project Management**
- Create/view/edit projects
- Project visibility controls (Public/Private/Unlisted)
- Real-time project metrics

✅ **Document Editor**
- Rich text document editing
- Version history
- Comments and collaboration
- Real-time synchronization

✅ **Search**
- Full-text document search
- Semantic search with similarity scores
- Result highlighting

✅ **Dashboard**
- Project overview
- Recent activity feed
- Metrics and analytics

## 🔌 API Integration

The frontend communicates with the backend via:
- **HTTP**: GraphQL queries and mutations
- **WebSocket**: GraphQL subscriptions for real-time updates

## 🎨 UI Components

Using [shadcn/ui](https://ui.shadcn.com/) components:
- Button, Card, Input, Textarea
- Table, Dialog, Toast
- Custom components built on Radix UI

## 📦 Build Output

Production build includes:
- Optimized chunks with code splitting
- Lazy-loaded routes
- Compressed assets (gzip)
- Source maps for debugging

## 🚢 Deployment

### Static Hosting (Recommended)

Build and deploy to:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

```bash
pnpm build
# Upload 'dist/' directory to your hosting provider
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
RUN pnpm install -g serve
CMD ["serve", "-s", "dist", "-p", "3000"]
```

## 🔧 Configuration

### Vite Config

See `vite.config.ts` for:
- Path aliases (`@/` → `src/`)
- Build optimizations
- Dev server settings

### TypeScript

See `tsconfig.json` for:
- Strict type checking
- Modern ES features
- Vite-specific settings

## 📝 Notes

- This is a **client-side only** application (SPA)
- Requires backend API to be running
- Uses environment variables for configuration
- Fully typed with TypeScript

## 🔗 Related

- Backend API: `../api/`
- Shared Types: `../../packages/shared/`
- Smart Contracts: `../../packages/contracts/`
