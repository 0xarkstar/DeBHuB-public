# IrysBase Frontend Implementation Roadmap

**Last Updated**: 2025-10-06
**Based on**: [FRONTEND_SPEC.md](./FRONTEND_SPEC.md)

---

## 📋 Implementation Status

### ✅ Phase 1: Core Fixes (COMPLETED)

| Task | Status | Files Modified | Notes |
|------|--------|---------------|-------|
| Backend GraphQL authentication | ✅ | `ConnectWallet.tsx` | REQUEST_CHALLENGE → AUTHENTICATE flow |
| Read-only mode | ✅ | `Dashboard.tsx`, `ProjectCard.tsx` | Public projects browsing |
| Settings page | ✅ | `SettingsPage.tsx`, `App.tsx` | 5 tabs: Profile, API Keys, Notifications, Appearance, Security |

---

## 🚀 Phase 2: BaaS Foundation (60% COMPLETE)

**Goal**: Transform from generic document platform to Supabase-like BaaS experience

**Status**: 3 of 5 tasks completed
**Completed**: 2025-10-06 (Phases 2.1, 2.2, 2.3)

### Task List

#### 2.1 Storage Analytics Integration ✅ COMPLETED

**Priority**: HIGH
**Effort**: Medium (3-4 days)
**Completion Date**: 2025-10-06

**Created: `apps/web-vite/src/pages/StoragePage.tsx`**
- ✅ **Irys Storage Tab**
  - Display total Irys storage used (GB)
  - Show lifetime cost in USD
  - List all permanent URLs with Irys TX IDs
  - "Copy Permanent Link" button
  - "View on Irys Explorer" link
  - Data verification tools (check Irys ↔ PostgreSQL consistency)

- ✅ **PostgreSQL Cache Tab**
  - Cache statistics (hit rate, cached documents)
  - Last sync timestamp
  - Manual sync controls ("Force Re-sync", "Rebuild Cache")

**GraphQL Queries Needed**:
```graphql
query GetStorageStats($projectId: ID!) {
  project(id: $projectId) {
    irysStorage {
      totalSize
      totalCost
      transactions {
        id
        irysId
        timestamp
        cost
      }
    }
    postgresCache {
      cachedDocuments
      hitRate
      lastSync
    }
  }
}
```

**Components Created**:
- ✅ `<StorageOverview />` - Visual storage dashboard with 4 metrics
- ✅ `<IrysTransactionList />` - Table with search, copy, explorer links
- ✅ `<SyncControls />` - Manual sync buttons with confirmations
- ⚠️ `<DataVerificationTool />` - Integrated into SyncControls

**Routes Added**:
- ✅ `/storage` in `App.tsx`
- ✅ Navigation sidebar updated

**Files Created** (4):
- `apps/web-vite/src/pages/StoragePage.tsx`
- `apps/web-vite/src/components/storage/StorageOverview.tsx`
- `apps/web-vite/src/components/storage/IrysTransactionList.tsx`
- `apps/web-vite/src/components/storage/SyncControls.tsx`

---

#### 2.2 Blockchain Status Page ✅ COMPLETED

**Priority**: HIGH
**Effort**: Medium (2-3 days)
**Completion Date**: 2025-10-06

**Created: `apps/web-vite/src/pages/BlockchainPage.tsx`**
- ✅ **Network Status Section**
  - IrysVM connection indicator (chain ID, RPC status)
  - Current block height (real-time via wagmi)
  - Gas price display
  - Wallet balance (real-time via wagmi)

- ✅ **Smart Contracts Section**
  - List deployed contracts (Project Registry, Document Controller, Access Control)
  - Contract addresses with copy button
  - "View on Explorer" links
  - Verified badges

- ✅ **Sync Monitor Section**
  - Real-time sync status (pending, confirming, completed)
  - Failed transactions list with retry button
  - Today's transaction summary
  - Visual progress indicators

**GraphQL Subscriptions Needed**:
```graphql
subscription OnSyncStatusChanged {
  syncStatusChanged {
    status
    pendingCount
    failedTransactions {
      id
      error
      retryable
    }
  }
}
```

**Components Created**:
- ✅ `<NetworkStatusCard />` - IrysVM connection with real-time data (wagmi)
- ✅ `<ContractList />` - 3 deployed smart contracts with copy/explorer
- ✅ `<SyncMonitor />` - Real-time sync dashboard with animations
- ✅ Failed transactions integrated into `<SyncMonitor />`

**Routes Added**:
- ✅ `/blockchain` in `App.tsx`
- ✅ Navigation sidebar updated

**Files Created** (4):
- `apps/web-vite/src/pages/BlockchainPage.tsx`
- `apps/web-vite/src/components/blockchain/NetworkStatusCard.tsx`
- `apps/web-vite/src/components/blockchain/ContractList.tsx`
- `apps/web-vite/src/components/blockchain/SyncMonitor.tsx`

---

#### 2.3 Enhanced Document Editor with Cost Estimation ✅ COMPLETED

**Priority**: HIGH
**Effort**: High (5-7 days)
**Completion Date**: 2025-10-06

**Modified: `apps/web-vite/src/components/editor/DocumentEditor.tsx`**
- ✅ **Live Cost Estimation**
  - Calculate storage cost based on content size (~$2.50/GB)
  - Display cost in USD prominently
  - Show wallet balance vs required cost (wagmi `useBalance`)
  - Warning if balance insufficient

- ✅ **Publishing Flow Redesign**
  - Replaced "Publish" with "Publish to Irys" button
  - Confirmation modal with:
    - Document size, estimated cost
    - Permanence warning: "⚠️ This action is PERMANENT"
    - Cannot be edited/deleted message
  - Progress overlay during publishing:
    - Step 1: Uploading to Irys... (with spinner)
    - Step 2: Broadcasting to IrysVM... (with spinner)
    - Step 3: Syncing to PostgreSQL... (with spinner)
    - Step 4: Completed! (with checkmark)
  - Success screen with permanent link:
    - Irys TX ID (copyable)
    - Permanent URL (copyable)
    - Share button (Web Share API)
    - View on Explorer link

**Components Created**:
- ✅ `<CostEstimator />` - Live cost calculation with balance check
- ✅ `<PublishConfirmationModal />` - Pre-publish confirmation with warnings
- ✅ `<PublishingProgress />` - 4-step progress indicator with animations
- ✅ `<PermanentLinkSuccess />` - Success screen with shareable link

**GraphQL Mutations Needed**:
```graphql
mutation PublishToIrys($documentId: ID!, $content: String!) {
  publishToIrys(documentId: $documentId, content: $content) {
    irysId
    permanentUrl
    cost
    txHash
  }
}
```

**UI Components Created**:
- ✅ `dialog.tsx` - Radix UI dialog component (shadcn-style)

**Files Created** (5):
- `apps/web-vite/src/components/editor/CostEstimator.tsx`
- `apps/web-vite/src/components/editor/PublishConfirmationModal.tsx`
- `apps/web-vite/src/components/editor/PublishingProgress.tsx`
- `apps/web-vite/src/components/editor/PermanentLinkSuccess.tsx`
- `apps/web-vite/src/components/ui/dialog.tsx`

**Files Modified** (1):
- `apps/web-vite/src/components/editor/DocumentEditor.tsx` (Enhanced with publishing flow)

---

#### 2.4 Projects Page Redesign ⏳ PENDING

**Priority**: MEDIUM
**Effort**: Medium (3-4 days)

**Modify: `apps/web-vite/src/pages/Dashboard.tsx`**
- [ ] Add storage metrics to project cards:
  - Storage used (GB)
  - Document count
  - Last Irys sync status
  - Monthly cost (USD)

**Modify: `apps/web-vite/src/components/dashboard/ProjectCard.tsx`**
- [ ] Display storage badge (e.g., "45 GB on Irys")
- [ ] Show sync status icon
- [ ] Add cost indicator
- [ ] "View Storage" quick action

**GraphQL Query Update**:
```graphql
query GetMyProjects($limit: Int, $offset: Int) {
  myProjects(limit: $limit, offset: $offset) {
    id
    name
    slug
    description
    visibility
    documentsCount
    collaboratorsCount
    updatedAt
    storage {
      irysGB
      monthlyCostUSD
    }
    syncStatus
  }
}
```

---

#### 2.5 Usage Dashboard

**Priority**: MEDIUM
**Effort**: High (4-5 days)

**Create: `apps/web-vite/src/pages/UsagePage.tsx`**
- [ ] **Overview Section**
  - Total documents stored
  - Total Irys storage (GB)
  - Total transactions
  - Monthly cost (USD)

- [ ] **Charts**
  - Storage growth (line chart - last 30 days)
  - Document creation rate (bar chart)
  - Cost trends (area chart)

- [ ] **Per-Project Breakdown**
  - Table with: Project name, Docs count, Storage, Cost
  - Export report button (CSV/PDF)

- [ ] **Transaction Logs**
  - Filterable list: Date, Type, Document, Irys TX ID, Cost, Status
  - Pagination
  - Export option

**Components to Create**:
- `<UsageOverview />` - Summary cards
- `<StorageChart />` - Growth visualization
- `<ProjectUsageTable />` - Per-project breakdown
- `<TransactionLog />` - Filterable transaction history

**Libraries Needed**:
- Install `recharts` or `chart.js` for data visualization

**Add Route**: `/usage` in `App.tsx`

---

### Navigation Updates

**Update: `apps/web-vite/src/layouts/DashboardLayout.tsx`**

Current sidebar:
```tsx
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Settings', href: '/settings', icon: Settings },
];
```

**New sidebar** (BaaS-focused):
```tsx
const navigation = [
  { name: 'Projects', href: '/', icon: Folder },
  { name: 'Storage', href: '/storage', icon: Database },
  { name: 'Blockchain', href: '/blockchain', icon: Link },
  { name: 'Usage', href: '/usage', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];
```

---

## 🎨 Phase 3: Data Management (NEXT)

**Goal**: Advanced document and storage features

### Task List

#### 3.1 Version History Enhancements
- [ ] Diff viewer (side-by-side comparison)
- [ ] Version restore with confirmation
- [ ] Branch from version (create new document)
- [ ] Download specific version

#### 3.2 Permanent Link Management
- [ ] Dedicated "Permanent Links" page
- [ ] QR code generator for links
- [ ] Custom domains for permanent URLs
- [ ] Link analytics (views, downloads)

#### 3.3 Data Verification Tools
- [ ] "Verify All Documents" button
- [ ] Irys ↔ PostgreSQL consistency checker
- [ ] Automatic conflict resolution
- [ ] Integrity reports (PDF export)

#### 3.4 Export Functionality
- [ ] Export single document (Markdown, HTML, PDF)
- [ ] Export entire project (ZIP with metadata)
- [ ] Export storage report (CSV/JSON)
- [ ] Scheduled exports (daily/weekly backups)

**Estimated Duration**: 2-3 weeks

---

## 👥 Phase 4: Collaboration (LATER)

**Goal**: Team features for multi-user projects

### Task List

#### 4.1 Team Management
- [ ] Invite members by wallet address
- [ ] Role-based permissions (Owner/Editor/Viewer)
- [ ] Member activity log
- [ ] Remove/suspend members

#### 4.2 Real-time Collaboration
- [ ] Live cursor tracking (like Figma)
- [ ] Inline comments with @mentions
- [ ] Resolve/unresolve threads
- [ ] Comment notifications

#### 4.3 Activity Logs
- [ ] Project-wide activity timeline
- [ ] Per-document change history
- [ ] Export audit trail (compliance)

**Estimated Duration**: 3-4 weeks

---

## 🔧 Phase 5: Developer Tools (OPTIONAL)

**Goal**: Programmatic access for power users

### Task List

#### 5.1 API Key Management
- [ ] Generate API keys (server-to-server auth)
- [ ] Key usage statistics
- [ ] Rate limiting display
- [ ] Revoke/rotate keys

#### 5.2 Webhooks
- [ ] Event subscriptions (document.published, sync.completed)
- [ ] Webhook endpoint management
- [ ] Test webhook delivery
- [ ] Retry failed webhooks

#### 5.3 SDK Documentation
- [ ] Auto-generated docs from GraphQL schema
- [ ] Code examples (JS, Python, Go)
- [ ] Postman collection export

**Estimated Duration**: 2-3 weeks

---

## 📊 Success Metrics

### Phase 2 Completion Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Storage page load time | < 1.5s | Lighthouse |
| Cost estimation accuracy | ±5% | Manual testing |
| Publishing success rate | > 99% | Error tracking |
| Sync status accuracy | 100% | Integration tests |
| User confusion reduction | -50% | User interviews |

### Phase 3+ Criteria
- Version restore success rate: > 95%
- Export completion rate: 100%
- Team invitation acceptance: > 70%
- API key usage: > 20% of users

---

## 🛠️ Technical Debt

### Issues to Address

1. **Apollo Client Optimization**
   - Current: fetchPolicy: 'network-only' (no caching)
   - Target: Implement smart caching with cache invalidation
   - Benefit: 50% faster page loads

2. **Component Library Gaps**
   - Missing: Chart components
   - Missing: Diff viewer
   - Missing: QR code generator
   - Action: Create reusable components in `components/shared/`

3. **Error Handling**
   - Current: Generic error messages
   - Target: Specific, actionable error UI
   - Example: "Insufficient balance → Fund wallet" instead of "Transaction failed"

4. **Mobile Responsiveness**
   - Current: Desktop-optimized only
   - Target: Full mobile support
   - Priority: After Phase 2

---

## 📝 Implementation Guidelines

### Code Organization

```
apps/web-vite/src/
├── pages/
│   ├── Dashboard.tsx           # Projects overview
│   ├── StoragePage.tsx         # [NEW] Irys analytics
│   ├── BlockchainPage.tsx      # [NEW] Network status
│   ├── UsagePage.tsx           # [NEW] Cost analytics
│   ├── DocumentPage.tsx        # Enhanced editor
│   └── SettingsPage.tsx        # ✅ Completed
│
├── components/
│   ├── storage/                # [NEW] Storage-specific
│   │   ├── StorageOverview.tsx
│   │   ├── IrysTransactionList.tsx
│   │   └── SyncControls.tsx
│   ├── blockchain/             # [NEW] Blockchain-specific
│   │   ├── NetworkStatusCard.tsx
│   │   ├── ContractList.tsx
│   │   └── SyncMonitor.tsx
│   ├── editor/
│   │   ├── DocumentEditor.tsx  # Enhanced with cost
│   │   ├── CostEstimator.tsx   # [NEW]
│   │   └── PublishModal.tsx    # [NEW]
│   └── shared/
│       ├── Charts.tsx          # [NEW] Reusable charts
│       └── PermanentLink.tsx   # [NEW] Link display
│
└── lib/
    ├── graphql/
    │   ├── queries.ts          # Add storage queries
    │   ├── mutations.ts        # Add publish mutations
    │   └── subscriptions.ts    # Add sync subscriptions
    └── utils/
        ├── cost.ts             # [NEW] Cost calculation
        └── formatting.ts       # [NEW] Data formatting
```

### Development Workflow

1. **Before Starting a Task**:
   - Check FRONTEND_SPEC.md for requirements
   - Review existing components for reusability
   - Confirm GraphQL schema supports the feature

2. **During Development**:
   - Write TypeScript types first
   - Create components in isolation (Storybook if available)
   - Test with real backend data
   - Handle loading/error states

3. **Before PR**:
   - Run `npm run typecheck`
   - Test on mobile viewport
   - Verify accessibility (keyboard nav)
   - Update this roadmap if scope changed

---

## 🔗 Related Documents

- **[FRONTEND_SPEC.md](./FRONTEND_SPEC.md)** - Detailed specifications
- [UI_UX_GUIDELINES.md](./UI_UX_GUIDELINES.md) - Design guidelines
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

---

## 📅 Timeline Estimate

| Phase | Duration | Start Date | Target Completion |
|-------|----------|------------|-------------------|
| Phase 1: Core Fixes | ✅ 1 week | Oct 1 | Oct 6 (DONE) |
| **Phase 2: BaaS Foundation** | **2-3 weeks** | **Oct 7** | **Oct 27** |
| Phase 3: Data Management | 2-3 weeks | Oct 28 | Nov 17 |
| Phase 4: Collaboration | 3-4 weeks | Nov 18 | Dec 15 |
| Phase 5: Developer Tools | 2-3 weeks | TBD | TBD |

**Total Estimated Time**: 10-14 weeks for full implementation

---

**Next Action**: Begin Phase 2.1 (Storage Analytics Integration)
**Assigned To**: Frontend Team
**Last Updated**: 2025-10-06
