#!/bin/bash

echo "🚀 IrysBase Environment Setup"
echo "=============================="

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. 환경 체크
check_requirements() {
    echo "📋 Checking requirements..."
    
    # Node.js 버전 체크
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required. Please install Node.js >= 18.0.0${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    MIN_NODE_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$MIN_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$MIN_NODE_VERSION" ]; then
        echo -e "${RED}❌ Node.js version must be >= 18.0.0${NC}"
        exit 1
    fi
    
    # pnpm 체크
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}📦 Installing pnpm...${NC}"
        npm install -g pnpm
    fi
    
    # Docker 체크
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is required. Please install Docker.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met${NC}"
}

# 2. 환경 변수 생성
create_env_files() {
    echo "🔐 Creating environment files..."
    
    # 루트 .env
    cat > .env << 'EOF'
# Network Configuration
NETWORK_ENV=testnet
IRYS_NETWORK=testnet
CHAIN_ID=1270

# Database
DATABASE_URL="postgresql://irysbase:password@localhost:5432/irysbase?schema=public"
REDIS_URL="redis://localhost:6379"

# Irys Configuration
IRYS_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc
IRYS_GATEWAY_URL=https://testnet-gateway.irys.xyz
IRYS_SUBMIT_LEDGER=https://testnet-submit.irys.xyz
IRYS_PUBLISH_LEDGER=https://testnet-publish.irys.xyz

# Private Keys (DO NOT COMMIT - Add your keys here)
DEPLOYER_PRIVATE_KEY=
IRYS_PRIVATE_KEY=

# API Keys
OPENAI_API_KEY=
COHERE_API_KEY=
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=us-east-1-aws

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-secret-key-here")

# Monitoring
SENTRY_DSN=
GRAFANA_API_KEY=
EOF

    # packages/database/.env
    mkdir -p packages/database
    cat > packages/database/.env << 'EOF'
DATABASE_URL="postgresql://irysbase:password@localhost:5432/irysbase?schema=public"
EOF

    # apps/web/.env.local
    mkdir -p apps/web
    cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
NEXT_PUBLIC_IRYS_GATEWAY=https://testnet-gateway.irys.xyz
NEXT_PUBLIC_CHAIN_ID=1270
EOF

    # apps/api/.env
    mkdir -p apps/api
    cat > apps/api/.env << 'EOF'
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://irysbase:password@localhost:5432/irysbase?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-jwt-secret-here")
EOF

    echo -e "${GREEN}✅ Environment files created${NC}"
}

# 3. Docker 서비스 시작
start_services() {
    echo "🐳 Starting Docker services..."
    
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: irysbase-postgres
    environment:
      POSTGRES_USER: irysbase
      POSTGRES_PASSWORD: password
      POSTGRES_DB: irysbase
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U irysbase"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: irysbase-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  vector-db:
    image: qdrant/qdrant
    container_name: irysbase-vector-db
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  postgres_data:
  qdrant_data:
EOF

    docker-compose up -d
    
    # 서비스가 준비될 때까지 대기
    echo "⏳ Waiting for services to be ready..."
    sleep 15
    
    echo -e "${GREEN}✅ Docker services started${NC}"
}

# 4. 종속성 설치
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    pnpm install
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# 5. 데이터베이스 마이그레이션
run_migrations() {
    echo "🗄️ Running database migrations..."
    
    if [ -d "packages/database" ]; then
        cd packages/database
        
        # Prisma 클라이언트 생성
        if [ -f "package.json" ]; then
            pnpm prisma generate
            
            # 마이그레이션 실행
            pnpm prisma migrate dev --name initial_setup
            
            # Seed 데이터 (선택사항)
            if pnpm prisma db seed 2>/dev/null; then
                echo "Seed data loaded"
            fi
        fi
        
        cd ../..
    fi
    
    echo -e "${GREEN}✅ Database migrations completed${NC}"
}

# 메인 실행
main() {
    check_requirements
    create_env_files
    start_services
    install_dependencies
    run_migrations
    
    echo ""
    echo -e "${GREEN}🎉 IrysBase environment setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Add your private keys to .env files"
    echo "2. Run: pnpm deploy:contracts"
    echo "3. Run: pnpm dev"
    echo ""
    echo "📖 For more information, see the documentation."
}

main