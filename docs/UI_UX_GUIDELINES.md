# IrysBase UI/UX Design Guidelines

Design guidelines for building IrysBase user interfaces.

## 🎯 Core Design Philosophy

IrysBase is a **distributed BaaS platform** that should provide a **developer-friendly** experience while **abstracting blockchain complexity**. We benchmark Supabase's intuitive developer experience while reflecting the unique characteristics of distributed systems.

---

## 🏗️ Architecture-Aware Design Principles

### 1. Hybrid Architecture Transparency

- **Irys (Permanent Storage)** vs **PostgreSQL (Query Layer)** visual distinction
- Data flow: `User Input → Irys Upload → Blockchain Verification → PostgreSQL Sync`
- Clear UI representation of each stage status

### 2. Blockchain State Visibility

- **Network Status**: IrysVM connection status in sidebar
- **Transaction Progress**: Submit → Confirm → Finalize stages
- **Gas Estimation**: Real-time cost calculation and balance warnings

### 3. Data Integrity Emphasis

- **Version History**: Mutable reference chain visualization
- **Verification Status**: Irys vs PostgreSQL data consistency
- **Permanence Assurance**: "Permanently stored on Irys" trust messages

---

## 🎨 Visual Design Standards

### Color Palette

```css
/* Primary Colors - IrysBase Brand */
--irys-primary: #6366f1;      /* Indigo - main brand */
--irys-secondary: #8b5cf6;    /* Purple - accent */
--irys-success: #10b981;      /* Green - success states */
--irys-warning: #f59e0b;      /* Amber - warnings */
--irys-error: #ef4444;        /* Red - errors */

/* Network Status Colors */
--network-connected: #059669;  /* IrysVM connected */
--network-warning: #d97706;    /* Wrong network */
--network-disconnected: #6b7280; /* Disconnected */

/* Data States */
--data-synced: #10b981;       /* Data synchronized */
--data-pending: #f59e0b;      /* Sync pending */
--data-conflict: #ef4444;     /* Sync conflict */
```

### Typography

- **Headings**: Inter, with system font fallbacks
- **Body**: Readability-first, 14px base size
- **Code**: JetBrains Mono, Fira Code (developer-friendly)

### Iconography

- **Lucide React** based consistent icon system
- Blockchain: `Wallet`, `Network`, `Shield`, `Link`
- Data: `Database`, `FileText`, `GitBranch` (version history)
- Status: `CheckCircle`, `AlertCircle`, `RefreshCw`

---

## 📱 Component Design Guidelines

### 1. WalletConnection Component

**Required States:**
```typescript
- isConnected: boolean
- chainId: number (highlight if not IrysVM)
- balance: string (with funding option if low)
- address: string (shortened format)
```

**Visual Requirements:**
- Prominent connect button when disconnected
- Network mismatch warning with switch button
- Balance display with refresh and fund options

### 2. Document Editor Component

**Progressive Disclosure:**
1. Content Input (with live cost estimation)
2. Cost Review & Balance Check
3. Transaction Submission with Progress
4. Success with Irys Transaction ID

**Error Handling:**
- Insufficient balance → Funding options
- Network issues → Retry mechanisms
- Authentication failure → Re-connect wallet

### 3. DataTable Component

**Essential Features:**
- Real-time updates (GraphQL subscriptions)
- Version history indicator
- Sync status per row
- Infinite scroll with virtual scrolling
- Export functionality (CSV, JSON)

**Performance:**
- Virtual scrolling for large datasets
- Optimistic updates for better UX
- Loading skeletons during fetch

### 4. Status Indicators

```typescript
// Network Status
<NetworkStatus
  connected={isIrysVM}
  chainId={chainId}
  showSwitchButton={!isIrysVM}
/>

// Sync Status
<SyncIndicator
  status="synced" | "pending" | "conflict"
  lastSync={timestamp}
  showDetails={boolean}
/>

// Transaction Status
<TxProgress
  stage="submitting" | "confirming" | "finalized"
  txHash={string}
  explorerUrl={string}
/>
```

---

## 🔧 Interaction Patterns

### 1. Progressive Enhancement

- Basic features work without MetaMask (read-only)
- Progressively enable features on wallet connection
- Auto-adjust features on network switch

### 2. Contextual Guidance

- Onboarding flow for first-time visitors
- Expected cost and time for each action
- Solution suggestions on errors

### 3. Feedback & Confirmation

- Explicit confirmation for all blockchain transactions
- Clear feedback on success/failure
- Warnings for irreversible actions

### 4. Responsive Behavior

- **Desktop**: Sidebar + Main content
- **Tablet**: Collapsible sidebar
- **Mobile**: Bottom navigation + Fullscreen

---

## 🎯 User Journey Considerations

### New User Flow

1. **Landing** → Browse without wallet
2. **Connect Wallet** → MetaMask install/connect guide
3. **Network Setup** → Auto-add IrysVM
4. **First Document** → Step-by-step guide with cost explanation
5. **Explore Features** → Progressive feature exposure

### Developer Flow

1. **API Keys** → GraphQL endpoint and authentication
2. **Schema Explorer** → Real-time documentation
3. **Query Playground** → Testing environment
4. **SDK Integration** → Code examples and tutorials

### Power User Flow

1. **Batch Operations** → Bulk data processing
2. **Advanced Queries** → Complex filtering and sorting
3. **Data Export** → Backup and analysis export
4. **Monitoring** → Usage and performance monitoring

---

## ⚠️ Critical UX Considerations

### 1. Performance Expectations

- **Loading States**: Show loading for all async operations
- **Optimistic Updates**: Immediate UI update with server confirmation
- **Cache Management**: Proper caching for responsiveness
- **Error Recovery**: Auto-retry on network errors

### 2. Trust & Security

- **Data Permanence**: Emphasize Irys storage permanence
- **Transaction Transparency**: All on-chain actions public
- **Privacy Controls**: Clear privacy policy
- **Audit Trail**: All changes traceable

### 3. Accessibility

- **Keyboard Navigation**: All features keyboard-accessible
- **Screen Reader**: Proper ARIA labeling
- **Color Contrast**: WCAG 2.1 AA compliance
- **Focus Management**: Logical tab order

### 4. Error Handling

- **User-Friendly Messages**: Convert technical errors to understandable messages
- **Action Suggestions**: Specific guides for error resolution
- **Fallback Options**: Alternative paths on major feature failure
- **Support Integration**: Help and support connection

---

## 📋 Implementation Checklist

### Before UI Changes

- [ ] Check consistency with existing components
- [ ] Sync with Figma/design system
- [ ] Review accessibility requirements
- [ ] Evaluate performance impact

### During Development

- [ ] Maximize shadcn/ui component usage
- [ ] Prioritize Tailwind CSS utility classes
- [ ] Ensure TypeScript type safety
- [ ] Document components in Storybook

### After Implementation

- [ ] Cross-browser testing
- [ ] Responsive design validation
- [ ] Automated accessibility testing
- [ ] Performance metrics measurement

---

## 🔄 Continuous Improvement

### Analytics & Monitoring

- User journey analysis (PostHog, Google Analytics)
- Performance monitoring (Web Vitals)
- Error tracking (Sentry)
- Regular usability testing

### Feedback Collection

- In-app feedback system
- GitHub Issues integration
- Community Discord/Forum
- Developer surveys

---

## 🛠️ Technology Stack

### UI Framework
- **Next.js 14** - React framework with App Router
- **shadcn/ui** - Accessible component library
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled accessible components

### State Management
- **Zustand** - Lightweight state management
- **Apollo Client** - GraphQL client with caching

### Web3 Integration
- **ethers.js v6** - Ethereum wallet integration
- **MetaMask SDK** - Wallet connection

---

**Remember**: IrysBase is not just a web application—it's a **gateway to distributed infrastructure**. The key is providing an experience where users enjoy blockchain benefits without feeling its complexity.

---

For more information:
- [Architecture](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [Getting Started](./GETTING_STARTED.md)