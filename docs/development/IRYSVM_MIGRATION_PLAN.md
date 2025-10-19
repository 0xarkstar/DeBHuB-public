# IrysVM Migration Plan
**Date**: 2025-10-20
**Goal**: Migrate DeBHuB from Ethereum + Irys to Pure IrysVM

## 🎯 Migration Overview

### Current Architecture (Before)
```
User → Ethereum Smart Contracts (❌ ETH 가스비)
         ↓
       Irys Storage (✅ 작동)
```

### Target Architecture (After)
```
User → IrysVM Smart Contracts (✅ IRYS 가스비)
         ↓
       Irys Storage (✅ 네이티브 통합)
```

---

## 📋 Step 1: Network Configuration

### IrysVM Testnet Details
```typescript
{
  chainId: 1270,
  name: "Irys Testnet",
  rpcUrl: "https://testnet-rpc.irys.xyz/v1/execution-rpc",
  currency: {
    name: "IRYS",
    symbol: "IRYS",
    decimals: 18
  },
  blockExplorer: "https://testnet-explorer.irys.xyz",
  faucet: "https://irys.xyz/faucet"
}
```

### Files to Update
1. `packages/pure-irys-client/src/contracts/addresses.ts`
2. `apps/web-vite/src/config/wagmi.ts`
3. `packages/pure-irys-client/src/types.ts`

---

## 📋 Step 2: Smart Contract Adaptation

### Programmable Data Feature
IrysVM has special precompile for reading Irys storage:

```solidity
// ProgrammableData.sol (Irys library)
interface IProgrammableData {
    function read(
        bytes32 transactionId,
        uint256 startOffset,
        uint256 length
    ) external view returns (bytes memory);
}
```

### Our Smart Contracts Need:
1. **DocumentRegistry** - 문서 메타데이터 등록
2. **AccessControl** - 접근 권한 관리
3. **ProvenanceChain** - 변경 이력
4. **SearchIndex** - 검색 인덱스

### New Contract: IrysStorageReader
```solidity
import "./ProgrammableData.sol";

contract IrysStorageReader is ProgrammableData {
    // Irys storage에서 문서 내용 읽기
    function readDocument(bytes32 irysId) public view returns (string memory) {
        bytes memory content = this.read(irysId, 0, 0); // 0,0 = 전체 읽기
        return string(content);
    }
}
```

---

## 📋 Step 3: PureIrysClient Updates

### Changes Needed
```typescript
// Before (Ethereum)
const provider = new BrowserProvider(transport);
const network = { chainId: 1, name: "Ethereum Mainnet" };

// After (IrysVM)
const provider = new BrowserProvider(transport);
const network = { chainId: 1270, name: "Irys Testnet" };
```

### Irys Uploader Configuration
```typescript
// IrysVM에서는 더 간단!
this.irysUploader = await WebUploader(WebEthereum)
  .withAdapter(EthersV6Adapter(provider))
  .withUrl("https://testnet-rpc.irys.xyz"); // IrysVM RPC
```

---

## 📋 Step 4: Contract Deployment Strategy

### Hardhat Config for IrysVM
```javascript
// hardhat.config.ts
module.exports = {
  networks: {
    irysTestnet: {
      url: "https://testnet-rpc.irys.xyz/v1/execution-rpc",
      chainId: 1270,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
```

### Deployment Scripts
```typescript
// scripts/deploy-irysvm.ts
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying to IrysVM with:", deployer.address);

  // Get IRYS balance
  const balance = await deployer.getBalance();
  console.log("IRYS Balance:", ethers.formatEther(balance));

  // Deploy DocumentRegistry
  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const registry = await DocumentRegistry.deploy();
  await registry.deployed();
  console.log("DocumentRegistry:", registry.address);

  // Deploy other contracts...
  // AccessControl, ProvenanceChain, etc.
}
```

---

## 📋 Step 5: Frontend Integration

### RainbowKit Configuration
```typescript
// apps/web-vite/src/config/wagmi.ts
import { defineChain } from 'viem';

export const irysTestnet = defineChain({
  id: 1270,
  name: 'Irys Testnet',
  network: 'irys-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'IRYS',
    symbol: 'IRYS',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.irys.xyz/v1/execution-rpc'],
    },
    public: {
      http: ['https://testnet-rpc.irys.xyz/v1/execution-rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Irys Explorer',
      url: 'https://testnet-explorer.irys.xyz',
    },
  },
  testnet: true,
});

// Add to wagmiConfig
const config = getDefaultConfig({
  chains: [irysTestnet], // IrysVM만 사용!
  // ...
});
```

---

## 📋 Step 6: Testing Plan

### Phase 1: Local Testing
1. ✅ Network config 확인
2. ✅ 지갑 연결 테스트
3. ✅ IRYS 토큰 받기 (faucet)

### Phase 2: Contract Deployment
1. ✅ Hardhat compile
2. ✅ Deploy to IrysVM testnet
3. ✅ Verify contracts on explorer

### Phase 3: Integration Testing
1. ✅ Irys 업로드 테스트
2. ✅ 스마트 컨트랙트 등록 테스트
3. ✅ Programmable Data 읽기 테스트
4. ✅ End-to-end 플로우

### Phase 4: UI Testing
1. ✅ 데이터 생성
2. ✅ 데이터 조회
3. ✅ 데이터 수정
4. ✅ 데이터 삭제

---

## 🚀 Implementation Order

### Step 1: Configuration (30분)
- [x] Network config 업데이트
- [x] Wagmi config 업데이트
- [ ] Contract addresses 업데이트

### Step 2: Smart Contracts (2시간)
- [ ] Review existing contracts
- [ ] Add ProgrammableData support
- [ ] Write deployment scripts
- [ ] Compile contracts

### Step 3: Deploy to IrysVM (30분)
- [ ] Get testnet IRYS from faucet
- [ ] Deploy DocumentRegistry
- [ ] Deploy AccessControl
- [ ] Deploy ProvenanceChain
- [ ] Deploy other contracts

### Step 4: Client Update (1시간)
- [ ] Update PureIrysClient for IrysVM
- [ ] Update contract addresses
- [ ] Test initialization

### Step 5: Frontend Update (30분)
- [ ] Update wallet config
- [ ] Add network switcher
- [ ] Update UI for IrysVM

### Step 6: Testing (1시간)
- [ ] Test with Playwright
- [ ] End-to-end flow
- [ ] Create test report

**Total Estimated Time**: ~5-6 hours

---

## 💰 Cost Comparison

### Before (Ethereum + Irys)
```
Data Upload: ~$0.01 (Irys)
Contract Call: ~$10-50 (Ethereum gas)
Total: $10-50 per document
```

### After (Pure IrysVM)
```
Data Upload: ~$0.01 (Irys)
Contract Call: ~$0.001 (IrysVM gas)
Total: ~$0.011 per document
```

**Cost Reduction: ~99.9%!** 🎉

---

## ✅ Success Criteria

1. ✅ Wallet connects to IrysVM testnet
2. ✅ Can claim IRYS from faucet
3. ✅ Smart contracts deployed successfully
4. ✅ Data uploads to Irys storage
5. ✅ Smart contracts register documents
6. ✅ Can query and retrieve documents
7. ✅ Programmable Data reads work
8. ✅ **Zero ETH required**

---

## 🎯 Next Actions

1. **Update network configuration** → `packages/pure-irys-client/src/contracts/addresses.ts`
2. **Update Wagmi config** → `apps/web-vite/src/config/wagmi.ts`
3. **Review smart contracts** → `packages/contracts/contracts/`
4. **Write deployment script** → `packages/contracts/scripts/deploy-irysvm.ts`
5. **Get testnet IRYS** → https://irys.xyz/faucet
6. **Deploy contracts** → `npx hardhat run scripts/deploy-irysvm.ts --network irysTestnet`

**Ready to start?** 🚀
