# 🚀 IrysBase Deployment Guide

Complete guide to deploying IrysBase with Programmable Data features.

---

## 📋 Prerequisites

### Required Tools

- Node.js 20+ & pnpm
- Git
- MetaMask or compatible wallet
- IrysVM testnet tokens (for contract deployment)

### Get IrysVM Testnet Tokens

Visit: https://irys.xyz/faucet
- Connect your wallet
- Request test tokens
- Wait for confirmation

---

## 🏗️ Step 1: Smart Contract Deployment

### 1.1 Setup Smart Contracts Project

```bash
# Navigate to smart contracts
cd apps/smart-contracts

# Install dependencies
pnpm install
```

### 1.2 Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env
nano .env
```

Add your configuration:

```env
# IrysVM Testnet
IRYS_VM_RPC_URL=https://rpc-testnet.irys.xyz
IRYS_CHAIN_ID=31337

# Your deployer wallet private key
DEPLOYER_PRIVATE_KEY=0x...your...private...key...

# Contract addresses (filled after deployment)
DOCUMENT_ACCESS_CONTRACT=
PROJECT_GOVERNANCE_CONTRACT=
PROVENANCE_TRACKER_CONTRACT=
```

⚠️ **IMPORTANT:** Never commit your private key! Add `.env` to `.gitignore`

### 1.3 Compile Contracts

```bash
pnpm compile
```

Expected output:
```
Compiled 3 Solidity files successfully
```

### 1.4 Deploy to IrysVM Testnet

```bash
pnpm deploy
```

Expected output:
```
🚀 Deploying IrysBase Programmable Data Contracts...

📝 Deploying contracts with account: 0x...
💰 Account balance: 10.0 ETH

📄 Deploying DocumentAccessControl...
✅ DocumentAccessControl deployed to: 0x1234...

🏛️  Deploying ProjectGovernance...
✅ ProjectGovernance deployed to: 0x5678...

🔍 Deploying ProvenanceTracker...
✅ ProvenanceTracker deployed to: 0x9abc...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 All contracts deployed successfully!

📋 Contract Addresses:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DocumentAccessControl: 0x1234...
ProjectGovernance:      0x5678...
ProvenanceTracker:      0x9abc...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.5 Save Contract Addresses

Copy the three contract addresses. You'll need them for frontend configuration.

---

## 🎨 Step 2: Frontend Deployment

### 2.1 Configure Frontend

```bash
# Navigate to frontend
cd ../../apps/web-vite

# Install dependencies
pnpm install

# Copy example env
cp .env.example .env

# Edit .env
nano .env
```

Add configuration:

```env
# Wallet Configuration
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Irys Configuration
VITE_IRYS_NETWORK=mainnet
VITE_IRYS_GATEWAY=https://gateway.irys.xyz

# IrysVM Configuration
VITE_IRYS_VM_RPC_URL=https://rpc-testnet.irys.xyz
VITE_IRYS_CHAIN_ID=31337

# Smart Contract Addresses (from Step 1.5)
VITE_DOCUMENT_ACCESS_CONTRACT=0x1234...
VITE_PROJECT_GOVERNANCE_CONTRACT=0x5678...
VITE_PROVENANCE_TRACKER_CONTRACT=0x9abc...

# Feature Flags
VITE_ENABLE_PROGRAMMABLE_DATA=true
VITE_ENABLE_PROVENANCE_TRACKING=true
VITE_ENABLE_ACCESS_CONTROL=true
```

### 2.2 Build Frontend

```bash
# Type check
pnpm typecheck

# Build production bundle
pnpm build
```

Expected output:
```
✓ built in 12.34s
✓ 123 modules transformed.
dist/index.html                   1.23 kB
dist/assets/index-abc123.js      234.56 kB
```

### 2.3 Test Locally

```bash
# Run development server
pnpm dev
```

Visit: http://localhost:5173

**Test Checklist:**
- [ ] Connect wallet
- [ ] Create project with programmable features
- [ ] Create document with AI provenance
- [ ] Grant access to another address
- [ ] Check permissions on-chain
- [ ] View version history

---

## ☁️ Step 3: Production Deployment

### Option A: Vercel (Recommended)

#### 3.1 Install Vercel CLI

```bash
npm i -g vercel
```

#### 3.2 Deploy

```bash
# From apps/web-vite
vercel

# Follow prompts:
# - Setup and deploy? Yes
# - Scope? Your account
# - Link to existing project? No
# - Project name? irysbase
# - Directory? ./
# - Override settings? No
```

#### 3.3 Set Environment Variables

```bash
# Add environment variables
vercel env add VITE_DOCUMENT_ACCESS_CONTRACT
vercel env add VITE_PROJECT_GOVERNANCE_CONTRACT
vercel env add VITE_PROVENANCE_TRACKER_CONTRACT
vercel env add VITE_IRYS_VM_RPC_URL
vercel env add VITE_IRYS_CHAIN_ID
vercel env add VITE_WALLETCONNECT_PROJECT_ID

# Redeploy with environment variables
vercel --prod
```

#### 3.4 Configure Custom Domain (Optional)

```bash
vercel domains add yourdomain.com
```

### Option B: Netlify

#### 3.1 Install Netlify CLI

```bash
npm i -g netlify-cli
```

#### 3.2 Deploy

```bash
# Login
netlify login

# Deploy from apps/web-vite
netlify deploy --prod

# Build command: pnpm build
# Publish directory: dist
```

#### 3.3 Set Environment Variables

Go to: Netlify Dashboard → Site Settings → Environment Variables

Add:
- `VITE_DOCUMENT_ACCESS_CONTRACT`
- `VITE_PROJECT_GOVERNANCE_CONTRACT`
- `VITE_PROVENANCE_TRACKER_CONTRACT`
- `VITE_IRYS_VM_RPC_URL`
- `VITE_IRYS_CHAIN_ID`
- `VITE_WALLETCONNECT_PROJECT_ID`

### Option C: Static Hosting (Arweave/Irys)

Deploy the entire app on Irys for true decentralization!

```bash
# Build
pnpm build

# Install @irys/upload globally
npm i -g @irys/upload

# Upload entire dist folder to Irys
irys upload-dir dist \
  --network mainnet \
  --token ethereum \
  --private-key $YOUR_PRIVATE_KEY

# Output: Gateway URL
# https://gateway.irys.xyz/abc123...
```

**Benefits:**
- ✅ 100% decentralized
- ✅ Censorship-resistant
- ✅ Permanent hosting
- ✅ No server costs

---

## 🔧 Step 4: Post-Deployment

### 4.1 Verify Smart Contracts

Visit IrysVM Block Explorer:
- Check DocumentAccessControl: `https://explorer.irys.xyz/address/0x1234...`
- Check ProjectGovernance: `https://explorer.irys.xyz/address/0x5678...`
- Check ProvenanceTracker: `https://explorer.irys.xyz/address/0x9abc...`

### 4.2 Test Production

**Functional Tests:**
1. Connect wallet to production URL
2. Create a test project
3. Create a test document
4. Grant access to test address
5. Verify on block explorer
6. Check provenance data

**Performance Tests:**
1. Check load times
2. Test with slow network
3. Monitor gas usage
4. Check cache performance

### 4.3 Monitor

Set up monitoring for:
- Frontend uptime
- Smart contract events
- Transaction failures
- Gas price alerts

**Recommended Tools:**
- Vercel Analytics (built-in)
- Tenderly (contract monitoring)
- Sentry (error tracking)

---

## 🐛 Troubleshooting

### Contract Deployment Fails

**Error:** "Insufficient funds"
```bash
# Check balance
npx hardhat run scripts/check-balance.ts --network irys_testnet

# Get more tokens from faucet
# Visit: https://irys.xyz/faucet
```

**Error:** "Network timeout"
```bash
# Check RPC URL
echo $IRYS_VM_RPC_URL

# Try alternative RPC
IRYS_VM_RPC_URL=https://rpc-backup.irys.xyz pnpm deploy
```

### Frontend Build Fails

**Error:** "Module not found"
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

**Error:** "Type errors"
```bash
# Check types
pnpm typecheck

# Fix common issues:
# - Check .env variables are set
# - Verify contract addresses are valid
# - Update import paths
```

### Programmable Features Not Working

**Error:** "Programmable features not initialized"
```typescript
// Make sure to initialize in correct order:
await db.init();
await db.connectWallet(provider);
await db.initProgrammable(signer, config);
```

**Error:** "Contract address not found"
```bash
# Check .env file
cat .env | grep CONTRACT

# Verify addresses match deployment output
# Should be 0x followed by 40 hex characters
```

---

## 📊 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Type checks passing
- [ ] Build successful locally
- [ ] Environment variables configured
- [ ] Smart contracts deployed
- [ ] Contract addresses saved

### Deployment
- [ ] Frontend deployed to hosting
- [ ] Environment variables set
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active

### Post-Deployment
- [ ] Smart contracts verified on explorer
- [ ] Frontend accessible
- [ ] Wallet connection works
- [ ] Programmable features enabled
- [ ] Test transactions successful
- [ ] Monitoring set up
- [ ] Documentation updated

---

## 🎉 Success!

Your IrysBase deployment is complete!

**Live URLs:**
- Frontend: `https://your-domain.com`
- DocumentAccessControl: `https://explorer.irys.xyz/address/0x1234...`
- ProjectGovernance: `https://explorer.irys.xyz/address/0x5678...`
- ProvenanceTracker: `https://explorer.irys.xyz/address/0x9abc...`

**Next Steps:**
1. Share with users
2. Monitor performance
3. Gather feedback
4. Iterate and improve

**Support:**
- GitHub Issues: `https://github.com/your-repo/issues`
- Irys Discord: `https://discord.gg/irys`
- Documentation: `./docs/`

---

## 🔄 Updating Contracts

If you need to update smart contracts:

```bash
# Deploy new versions
cd apps/smart-contracts
pnpm deploy

# Update frontend .env with new addresses
cd ../web-vite
nano .env  # Update contract addresses

# Redeploy frontend
pnpm build
vercel --prod  # or netlify deploy --prod
```

**Important:** Old contract data is immutable. New deployment = new contract state.

---

## 💰 Cost Estimate

### One-Time Costs
- Smart Contract Deployment: ~0.05 ETH (testnet free)
- Initial Data Upload: ~$2.50 per GB (one-time)

### Ongoing Costs
- Frontend Hosting: $0/month (static hosting)
- Smart Contract Calls: ~0.001 ETH per transaction
- Irys Storage: $0/month (paid upfront)

**Total:** Essentially free after deployment! 🎉

---

## 📚 Additional Resources

- [Irys Documentation](https://docs.irys.xyz)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Vite Documentation](https://vitejs.dev)
- [Programmable Data Guide](./PROGRAMMABLE_DATA_IMPLEMENTATION.md)
- [Architecture Overview](./PROGRAMMABLE_DATA_ARCHITECTURE.md)
