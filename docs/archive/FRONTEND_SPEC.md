# IrysBase Frontend Specification

**Last Updated**: 2025-10-06
**Status**: Living Document

---

## 🎯 Product Identity

IrysBase is a **Blockchain-based Backend-as-a-Service (BaaS)** platform that combines:
- **Permanent Storage** via Irys DataChain
- **Document Management** with version control
- **Blockchain Verification** on IrysVM
- **Developer-friendly** interface abstracting Web3 complexity

### Core Differentiation from Supabase

| Aspect | Supabase | IrysBase |
|--------|----------|----------|
| **Core Service** | PostgreSQL Database | Permanent Document Storage |
| **Primary Use Case** | CRUD operations | Content permanence & versioning |
| **Data Model** | Tables & Relations | Documents & Projects |
| **Auth Method** | Email/OAuth | Wallet Signature |
| **Key Feature** | Realtime Database | Immutable Storage + Blockchain Proof |

---

## 🏗️ Dashboard Architecture

### Organization Hierarchy
```
Organization (Wallet Address)
  └─ Projects (like Supabase Projects)
      ├─ Documents (like Supabase Tables)
      ├─ Storage Analytics (Irys usage)
      ├─ Blockchain Status (IrysVM sync)
      └─ Settings (Project config)
```

### Primary Navigation Structure

```
┌─────────────────────────────────────────────────────────┐
│  [IrysBase Logo]                    [Wallet] [Settings] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Sidebar:                    Main Content Area:         │
│  ┌──────────────────┐       ┌─────────────────────────┐│
│  │ 📂 Projects      │       │                         ││
│  │ 📊 Usage         │       │   [Dynamic Content]     ││
│  │ 💾 Storage       │       │                         ││
│  │ ⛓️  Blockchain    │       │                         ││
│  │ ⚙️  Settings     │       │                         ││
│  └──────────────────┘       └─────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Core Pages & Features

### 1. **Projects Page** (Dashboard)
**Supabase equivalent**: Projects overview
**Purpose**: Central hub for all user projects

**Components:**
- Project cards with:
  - Project name & description
  - Document count
  - Last updated
  - Storage used (Irys GB)
  - Sync status (Irys ↔ PostgreSQL)
- "New Project" button
- Search & filter projects
- Quick actions (Archive, Delete, Export)

**Read-only mode** (no wallet):
- Browse public projects
- View public documents
- Cannot create/edit

**Authenticated mode**:
- Full CRUD on owned projects
- Collaborate on shared projects

---

### 2. **Project Details Page**
**Supabase equivalent**: Table Editor
**Purpose**: Manage documents within a project

**Tabs:**

#### **Documents Tab**
- Document list with columns:
  - Title
  - Status (Draft/Published)
  - Irys ID (permanent link)
  - Last modified
  - Sync status icon
- Inline document creation
- Drag-and-drop reordering
- Bulk operations (Publish, Archive, Export)

#### **Storage Tab**
- **Irys Usage Dashboard**:
  - Total storage used (GB)
  - Number of transactions
  - Cost breakdown (by document)
  - Storage trend chart (last 30 days)
- **Permanent Links**:
  - List of all Irys transaction IDs
  - Copy permanent URL
  - View on Irys Explorer
- **Export Options**:
  - Download all documents (ZIP)
  - Export metadata (JSON/CSV)

#### **Blockchain Tab**
- **Sync Status**:
  - PostgreSQL ↔ Irys sync state
  - Last sync timestamp
  - Pending transactions queue
- **Network Info**:
  - IrysVM chain status
  - Current gas price
  - Wallet balance
- **Transaction History**:
  - Recent blockchain transactions
  - Explorer links
  - Success/failure status

#### **Settings Tab**
- **Project Settings**:
  - Name, description, slug
  - Visibility (Public/Private/Unlisted)
  - Default document template
- **Collaborators**:
  - Add/remove collaborators
  - Role management (Owner/Editor/Viewer)
- **Webhooks** (future):
  - Event notifications
  - API endpoints
- **Danger Zone**:
  - Archive project
  - Delete project (with warnings)

---

### 3. **Document Editor Page**
**Supabase equivalent**: Row editor
**Purpose**: Create and edit documents with blockchain integration

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  [< Back to Project]        [Draft/Published] [Actions ⋮]│
├──────────────────────────────────────────────────────────┤
│  Title: [_____________________________________]           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │   [Rich Text Editor]                              │ │
│  │   - Markdown support                              │ │
│  │   - Code blocks                                   │ │
│  │   - Image upload → IPFS/Irys                      │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 💰 Storage Cost: ~$0.05 USD                        ││
│  │ 📦 Size: 2.3 KB                                    ││
│  │ ⛓️  Network: IrysVM (Chain ID: 1270)               ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  [Save Draft]  [Publish to Irys] ──────────────────────►│
└──────────────────────────────────────────────────────────┘
```

**Right Sidebar:**
- **Version History**:
  - Timeline of all versions
  - Diff viewer
  - Restore to previous version
- **Comments**:
  - Inline comments
  - Resolve/Unresolve
  - @mention collaborators
- **Metadata**:
  - Tags
  - Custom fields
  - SEO settings

**Publishing Flow:**
1. Click "Publish to Irys"
2. Show cost confirmation modal:
   ```
   ┌─────────────────────────────────────┐
   │  Publish to Permanent Storage       │
   ├─────────────────────────────────────┤
   │  Document: "My Document"            │
   │  Size: 2.3 KB                       │
   │  Cost: $0.05 USD                    │
   │                                     │
   │  ⚠️  This action is PERMANENT       │
   │  and cannot be undone.              │
   │                                     │
   │  [Cancel]  [Confirm & Sign] ────────┤
   └─────────────────────────────────────┘
   ```
3. User signs transaction via MetaMask
4. Show progress:
   - Uploading to Irys...
   - Broadcasting to IrysVM...
   - Syncing to PostgreSQL...
   - ✅ Published!
5. Display permanent link:
   ```
   https://irys.xyz/tx/[IRYS_ID]
   ```

---

### 4. **Usage Page**
**Supabase equivalent**: Usage & Billing
**Purpose**: Monitor resource consumption and costs

**Sections:**

#### **Overview Dashboard**
- **Total Usage (Current Month)**:
  - Documents stored: 150
  - Storage used: 45.2 GB
  - Irys transactions: 234
  - Total cost: $12.50 USD

- **Charts**:
  - Storage growth (line chart)
  - Document creation rate (bar chart)
  - Cost trends (area chart)

#### **Per-Project Breakdown**
- Table showing each project:
  - Project name
  - Documents count
  - Storage (GB)
  - Cost (USD)
  - Actions (Export report)

#### **Transaction Logs**
- Filterable transaction list:
  - Date/Time
  - Type (Create/Update/Delete)
  - Document title
  - Irys TX ID
  - Cost
  - Status

---

### 5. **Storage Page**
**NEW** - IrysBase-specific
**Purpose**: Manage permanent storage and data integrity

**Tabs:**

#### **Irys Storage**
- **Storage Overview**:
  - Total data on Irys: 45.2 GB
  - Lifetime cost: $125.50
  - Avg cost per GB: $2.78
- **Permanent URLs**:
  - List all Irys transaction IDs
  - Copy permanent link
  - View on Irys Explorer
  - Download original file
- **Data Verification**:
  - Check Irys ↔ PostgreSQL consistency
  - "Verify All" button
  - Report mismatches

#### **PostgreSQL Cache**
- **Query Layer Stats**:
  - Cached documents: 148/150
  - Cache hit rate: 98.7%
  - Last sync: 2 mins ago
- **Manual Sync Controls**:
  - Force re-sync specific documents
  - Rebuild cache
  - Clear and re-index

---

### 6. **Blockchain Page**
**NEW** - IrysBase-specific
**Purpose**: Blockchain integration status and tools

**Sections:**

#### **Network Status**
- **IrysVM Connection**:
  - Chain ID: 1270
  - RPC Status: ✅ Connected
  - Block height: 1,234,567
  - Gas price: 0.1 gwei
- **Wallet Info**:
  - Connected address
  - Balance: 1.5 ETH
  - Recent transactions (last 10)

#### **Smart Contracts**
- **Deployed Contracts**:
  - Project Registry: 0x123...
  - Document Controller: 0x456...
  - Access Control: 0x789...
- **Contract Actions**:
  - View on Explorer
  - Verify on Etherscan
  - Interact (for advanced users)

#### **Sync Monitor**
- **Real-time Sync Status**:
  - Pending Irys uploads: 2
  - Confirming transactions: 1
  - Completed today: 45
- **Failed Transactions**:
  - List of failed syncs
  - Error messages
  - Retry button

---

### 7. **Settings Page** ✅ (Already Implemented)
**Supabase equivalent**: Organization Settings
**Purpose**: Account and application settings

**Current Tabs** (implemented in Priority 1):
- ✅ Profile
- ✅ API Keys (placeholder)
- ✅ Notifications
- ✅ Appearance
- ✅ Security

**To Add**:
- **Team Management**:
  - Invite members by wallet address
  - Role-based permissions
  - Activity log
- **Integrations**:
  - GitHub (for CI/CD)
  - Discord (notifications)
  - Webhooks (custom events)

---

## 🎨 Design System Alignment

### Color Semantics (Blockchain-aware)

```css
/* Primary Actions */
--action-create: #6366f1;      /* Create new document */
--action-publish: #8b5cf6;     /* Publish to Irys (permanent) */
--action-delete: #ef4444;      /* Destructive actions */

/* Status Colors */
--status-draft: #f59e0b;       /* Draft documents */
--status-published: #10b981;   /* Published to Irys */
--status-syncing: #3b82f6;     /* Syncing to PostgreSQL */
--status-failed: #ef4444;      /* Sync failed */

/* Blockchain-specific */
--chain-connected: #059669;    /* IrysVM connected */
--chain-pending: #d97706;      /* Transaction pending */
--chain-confirmed: #10b981;    /* Transaction confirmed */

/* Storage States */
--storage-irys: #8b5cf6;       /* On Irys permanent storage */
--storage-cache: #6366f1;      /* In PostgreSQL cache */
--storage-conflict: #ef4444;   /* Data mismatch */
```

### Component Library Expansion

**New Components Needed:**

1. **StorageIndicator**
   ```tsx
   <StorageIndicator
     location="irys" | "postgresql" | "both"
     size={sizeInBytes}
     cost={costInUSD}
     permanent={boolean}
   />
   ```

2. **IrysTransactionCard**
   ```tsx
   <IrysTransactionCard
     txId={string}
     timestamp={Date}
     cost={number}
     status="pending" | "confirmed" | "failed"
     explorerUrl={string}
   />
   ```

3. **CostEstimator**
   ```tsx
   <CostEstimator
     contentSize={number}
     estimatedCost={number}
     balance={number}
     onProceed={() => void}
     onCancel={() => void}
   />
   ```

4. **SyncStatusBadge**
   ```tsx
   <SyncStatusBadge
     irysStatus="synced" | "pending" | "failed"
     postgresStatus="synced" | "pending" | "failed"
     lastSync={timestamp}
     onRetry={() => void}
   />
   ```

5. **PermanentLinkDisplay**
   ```tsx
   <PermanentLinkDisplay
     irysId={string}
     copyable={boolean}
     explorerLink={boolean}
     qrCode={boolean}
   />
   ```

---

## 🔄 Key User Flows

### Flow 1: New User Onboarding

```
1. Land on IrysBase.com
   ↓
2. Browse public projects (read-only)
   ↓
3. Click "Create Project" → Prompt to connect wallet
   ↓
4. Connect MetaMask
   ↓
5. Auto-switch to IrysVM network (if needed)
   ↓
6. Authenticate via signature
   ↓
7. Create first project
   ↓
8. Guided tour:
   - Create a document
   - See cost estimate
   - Publish to Irys
   - View permanent link
   ↓
9. Success! → Dashboard
```

### Flow 2: Publishing a Document

```
1. Open Document Editor
   ↓
2. Write content
   ↓
3. [Auto-save to PostgreSQL as draft]
   ↓
4. Click "Publish to Irys"
   ↓
5. Cost Estimation Modal shows:
   - Document size
   - Storage cost
   - Current balance
   - Warning: "This is permanent"
   ↓
6. User confirms → MetaMask signature request
   ↓
7. Progress overlay:
   [Uploading...] → [Broadcasting...] → [Syncing...]
   ↓
8. Success screen:
   - Irys TX ID
   - Permanent URL
   - Copy button
   - Share button
   - View on Explorer
   ↓
9. Document status changes to "Published"
   - Badge: "🔗 Permanently stored on Irys"
```

### Flow 3: Version Recovery

```
1. Open published document
   ↓
2. Click "Version History" sidebar
   ↓
3. View timeline of all versions:
   - v1 (Irys: abc123) - 3 days ago
   - v2 (Irys: def456) - 2 days ago
   - v3 (Current) - 1 hour ago
   ↓
4. Click on v1 → Shows diff viewer
   ↓
5. Click "Restore this version"
   ↓
6. Warning modal:
   "This will create a new version (v4) with content from v1.
    Current v3 will remain in history.
    Cost: $0.05 USD"
   ↓
7. Confirm → New Irys transaction
   ↓
8. v4 created as current version
```

---

## 🚀 Implementation Roadmap

### Phase 1: Core Fixes ✅ (Completed)
- [x] Backend authentication integration
- [x] Read-only mode for non-connected wallets
- [x] Settings page with profile/preferences

### Phase 2: BaaS Foundation (Priority)
- [ ] Redesign Projects page with storage metrics
- [ ] Add Storage page (Irys dashboard)
- [ ] Add Blockchain page (network status)
- [ ] Implement cost estimation in Document Editor
- [ ] Create publishing flow with confirmations

### Phase 3: Data Management
- [ ] Enhanced version history with diff viewer
- [ ] Permanent link management UI
- [ ] Irys ↔ PostgreSQL sync monitor
- [ ] Data verification tools
- [ ] Export functionality (ZIP, JSON, CSV)

### Phase 4: Collaboration
- [ ] Team management (invite by wallet)
- [ ] Role-based permissions
- [ ] Real-time collaboration (comments)
- [ ] Activity logs
- [ ] Notification system

### Phase 5: Developer Tools
- [ ] Usage analytics dashboard
- [ ] Per-project cost breakdown
- [ ] Webhook management
- [ ] API key generation (for server-to-server)
- [ ] SDK documentation generator

### Phase 6: Advanced Features
- [ ] Batch operations (bulk publish)
- [ ] Smart contract deployment UI
- [ ] Custom domain for permanent links
- [ ] Data migration tools
- [ ] Compliance reporting (audit trails)

---

## 📊 Success Metrics

### User Experience
- **Time to First Document**: < 2 minutes
- **Publishing Success Rate**: > 99%
- **Sync Latency**: < 5 seconds
- **Error Recovery Rate**: > 95%

### Performance
- **Page Load Time**: < 1.5s
- **Document Editor Response**: < 100ms
- **Cache Hit Rate**: > 98%
- **Uptime**: 99.9%

### Business
- **User Retention (30-day)**: > 60%
- **Active Projects per User**: > 3
- **Documents per Project**: > 10
- **Monthly Active Storage**: > 1 TB

---

## 🔗 Related Documentation

- [Architecture](./ARCHITECTURE.md) - System design
- [UI/UX Guidelines](./UI_UX_GUIDELINES.md) - Design standards
- [API Reference](./API.md) - GraphQL schema
- [Getting Started](./GETTING_STARTED.md) - Setup guide

---

**Next Review**: When implementing Phase 2
**Maintainer**: Frontend Team
**Last Contributor**: Claude Code
