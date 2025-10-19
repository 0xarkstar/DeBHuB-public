# Critical Fixes Needed for IrysVM Integration

**Priority**: 🔴 URGENT
**Impact**: Blocks full IrysVM testnet functionality
**Estimated Time**: 15 minutes

---

## Issue 1: Network Mismatch (Connected to Ethereum Mainnet instead of IrysVM Testnet)

### Current Behavior
- Application shows "Chain 1" (Ethereum Mainnet)
- Balance displays "0.0000 ETH"
- MetaMask connected to Ethereum Mainnet

### Expected Behavior
- Application shows "Chain 1270" or "Irys Testnet"
- Balance displays in "IRYS" tokens
- MetaMask connected to IrysVM Testnet

### Root Cause
The Wagmi configuration in `apps/web-vite/src/lib/wagmi.ts` was fixed, but:
1. User's MetaMask is still connected to Ethereum Mainnet
2. No UI prompt to switch networks

### Fix Required

#### Step 1: User Action (Immediate)
Switch MetaMask network manually:
1. Open MetaMask
2. Click network dropdown
3. Select "IrysVM Testnet" or add it manually:
   - **Network Name**: Irys Testnet
   - **RPC URL**: `https://testnet-rpc.irys.xyz/v1/execution-rpc`
   - **Chain ID**: 1270
   - **Currency Symbol**: IRYS
   - **Block Explorer**: (Not available yet)

#### Step 2: Code Fix (For Next Session)
Add network auto-switch prompt in `apps/web-vite/src/components/WalletConnect.tsx`:

```typescript
import { useSwitchChain } from 'wagmi';

const { switchChain } = useSwitchChain();

// Detect wrong network
useEffect(() => {
  if (chain?.id !== 1270) {
    toast.warning('Please switch to IrysVM Testnet', {
      action: {
        label: 'Switch Network',
        onClick: () => switchChain({ chainId: 1270 })
      }
    });
  }
}, [chain?.id]);
```

---

## Issue 2: Currency Symbol Display

### Current Behavior
Shows "ETH" throughout the UI

### Expected Behavior
Should show "IRYS" when connected to Chain 1270

### Files to Update

#### File: `apps/web-vite/src/components/Sidebar.tsx`
**Line**: Balance display section

**Before**:
```typescript
<div>ETH</div>
```

**After**:
```typescript
<div>{chain?.id === 1270 ? 'IRYS' : 'ETH'}</div>
```

---

## Issue 3: Network Indicator

### Current Behavior
Shows "Chain 1" as plain text

### Expected Behavior
- Show "Irys Testnet" when connected to Chain 1270
- Show "Ethereum Mainnet" when connected to Chain 1
- Add visual indicator (colored dot) for network status

### Files to Update

#### File: `apps/web-vite/src/components/Sidebar.tsx`
**Line**: Network indicator section

**Before**:
```typescript
<div>Chain {chain?.id || 1}</div>
```

**After**:
```typescript
<div className="flex items-center gap-2">
  <div className={cn(
    "w-2 h-2 rounded-full",
    chain?.id === 1270 ? "bg-green-500" : "bg-orange-500"
  )} />
  <span>
    {chain?.id === 1270 ? 'Irys Testnet' :
     chain?.id === 1 ? 'Ethereum Mainnet' :
     `Chain ${chain?.id}`}
  </span>
</div>
```

---

## Verification Checklist

After applying fixes, verify:

- [ ] MetaMask shows "Irys Testnet" in network dropdown
- [ ] Sidebar displays "Irys Testnet" or "Chain 1270"
- [ ] Balance shows "IRYS" currency symbol
- [ ] Balance displays actual IRYS testnet token balance (should be > 0 since user got from faucet)
- [ ] Create Data flow completes successfully with IRYS gas payment
- [ ] Document appears in Data Browser after creation
- [ ] No "Low balance" warning when IRYS balance > 0

---

## Testing Commands

```bash
# Check current balance on IrysVM testnet
curl -X POST https://testnet-rpc.irys.xyz/v1/execution-rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["YOUR_ADDRESS","latest"],"id":1}'

# Verify chain ID
curl -X POST https://testnet-rpc.irys.xyz/v1/execution-rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

Expected response for chain ID:
```json
{"jsonrpc":"2.0","id":1,"result":"0x4f6"}  // 0x4f6 = 1270 in decimal
```

---

## Success Criteria

✅ Application successfully:
1. Connects to IrysVM Testnet (Chain 1270)
2. Displays IRYS token balance from faucet
3. Uploads data to Irys DataChain
4. Registers document in VectorRegistry smart contract
5. Shows document in Data Browser
6. Allows document retrieval and viewing

---

## Next Steps After Fixes

1. **Complete End-to-End Test**:
   - Create document with IrysVM testnet
   - Verify smart contract registration succeeds
   - Check document appears in Data Browser
   - Test document retrieval

2. **Additional Features to Test**:
   - Vector DB integration
   - Search functionality
   - Export features (CSV/JSON)
   - Blockchain explorer page
   - Usage statistics

3. **Production Readiness**:
   - Add mainnet configuration (when IrysVM mainnet launches)
   - Implement proper error boundaries
   - Add analytics tracking
   - Set up monitoring and alerts

---

**Estimated Total Time**: 15-30 minutes (including testing)

**Priority Order**:
1. Switch MetaMask network (1 minute)
2. Test current functionality with correct network (5 minutes)
3. Apply code fixes if issues persist (10 minutes)
4. Final end-to-end testing (15 minutes)
