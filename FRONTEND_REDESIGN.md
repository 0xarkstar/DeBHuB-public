# IrysBase Frontend Redesign

Complete frontend redesign based on the comprehensive backend API and UI/UX guidelines.

## 🎯 Overview

The frontend has been completely redesigned to match the powerful backend capabilities:

- **Project Management** - Create, manage, and organize documentation projects
- **Document Editor** - Rich text editing with real-time collaboration
- **Version History** - Track and revert document changes
- **Comments & Collaboration** - Real-time commenting and team collaboration
- **Search** - Full-text search with highlighting
- **Analytics** - Project metrics and insights
- **Wallet Integration** - Seamless Web3 authentication with IrysVM

## 📂 New Structure

```
apps/web/src/
├── app/
│   ├── (dashboard)/              # Dashboard layout group
│   │   ├── layout.tsx            # Shared dashboard layout with sidebar
│   │   ├── page.tsx              # Dashboard home with project cards
│   │   ├── projects/
│   │   │   ├── new/              # Create new project
│   │   │   └── [id]/             # Project detail page
│   │   ├── documents/
│   │   │   └── [id]/             # Document editor
│   │   ├── search/               # Search page
│   │   └── settings/             # User settings
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Redirects to dashboard
├── components/
│   ├── dashboard/
│   │   ├── ProjectCard.tsx       # Project card component
│   │   ├── MetricsOverview.tsx   # Metrics display
│   │   └── RecentActivity.tsx    # Activity feed
│   ├── editor/
│   │   ├── DocumentEditor.tsx    # Main editor with auto-save
│   │   ├── VersionHistory.tsx    # Version history panel
│   │   └── CommentsPanel.tsx     # Comments sidebar
│   ├── shared/
│   │   ├── NetworkStatus.tsx     # IrysVM connection status
│   │   ├── SyncIndicator.tsx     # Data sync status
│   │   └── TxProgress.tsx        # Transaction progress
│   └── ui/                       # shadcn/ui components
└── lib/
    ├── graphql/
    │   ├── queries.ts            # GraphQL queries
    │   ├── mutations.ts          # GraphQL mutations
    │   └── subscriptions.ts      # GraphQL subscriptions
    └── utils.ts
```

## 🎨 Key Features

### 1. Dashboard

**Location:** `apps/web/src/app/(dashboard)/page.tsx`

Features:
- Project cards with quick stats
- Search and filter projects
- Create new project button
- Responsive grid layout

### 2. Project Detail Page

**Location:** `apps/web/src/app/(dashboard)/projects/[id]/page.tsx`

Features:
- Project header with visibility indicator
- Quick action cards (Documents, Team, Analytics, Settings)
- Project metrics overview
- Recent documents list
- Activity feed

### 3. Document Editor

**Location:** `apps/web/src/components/editor/DocumentEditor.tsx`

Features:
- Auto-save (2 seconds after last edit)
- Real-time sync indicator
- Version history access
- Comments panel
- Publish/unpublish toggle
- Irys storage indicator

### 4. Version History

**Location:** `apps/web/src/components/editor/VersionHistory.tsx`

Features:
- Complete version timeline
- Revert to any version
- Author and timestamp info
- Irys transaction links
- Version messages

### 5. Comments Panel

**Location:** `apps/web/src/components/editor/CommentsPanel.tsx`

Features:
- Add new comments
- Resolve/unresolve threads
- Delete comments
- Reply to comments
- Unresolved/resolved sections

### 6. Search

**Location:** `apps/web/src/app/(dashboard)/search/page.tsx`

Features:
- Full-text search
- Highlighted results
- Similarity scoring
- Project filtering

### 7. Network Status

**Location:** `apps/web/src/components/shared/NetworkStatus.tsx`

Features:
- IrysVM connection indicator
- Network switch button
- Chain ID display
- Visual status (green/orange)

### 8. Sync Indicator

**Location:** `apps/web/src/components/shared/SyncIndicator.tsx`

Features:
- Synced/Pending/Conflict states
- Last sync timestamp
- Animated loading states

## 🔄 GraphQL Integration

### Queries

**File:** `apps/web/src/lib/graphql/queries.ts`

- `GET_ME` - Current user
- `GET_MY_PROJECTS` - User's projects
- `GET_PROJECT` - Single project with details
- `GET_PROJECT_METRICS` - Project analytics
- `GET_DOCUMENT` - Document with content
- `GET_DOCUMENT_HISTORY` - Version history
- `GET_DOCUMENT_COMMENTS` - Comments
- `SEARCH_DOCUMENTS` - Search results

### Mutations

**File:** `apps/web/src/lib/graphql/mutations.ts`

- `CREATE_PROJECT` - New project
- `UPDATE_PROJECT` - Update project
- `CREATE_DOCUMENT` - New document
- `UPDATE_DOCUMENT` - Edit document
- `PUBLISH_DOCUMENT` - Publish document
- `CREATE_VERSION` - New version
- `REVERT_TO_VERSION` - Revert version
- `ADD_COLLABORATOR` - Add team member
- `CREATE_COMMENT` - Add comment
- `RESOLVE_COMMENT` - Resolve comment

### Subscriptions

**File:** `apps/web/src/lib/graphql/subscriptions.ts`

- `DOCUMENT_UPDATED` - Real-time document changes
- `COMMENT_ADDED` - New comments
- `VERSION_CREATED` - New versions
- `REVIEW_REQUESTED` - Review requests

## 🎯 UI/UX Guidelines Compliance

### Color Palette

Following `docs/UI_UX_GUIDELINES.md`:

- **Primary:** Indigo (`#6366f1`) for brand
- **Success:** Green for synced states
- **Warning:** Amber for pending states
- **Error:** Red for conflicts
- **Network Connected:** Green for IrysVM
- **Network Disconnected:** Orange for wrong network

### Typography

- **Headings:** Inter font family
- **Body:** 14px base size
- **Code:** Monospace for IDs and hashes

### Components

All components follow the design system:

1. **WalletConnection** - Prominent connect button, balance display
2. **NetworkStatus** - Clear IrysVM status with switch button
3. **DocumentEditor** - Progressive disclosure, cost estimation
4. **DataTable** - Real-time updates, virtual scrolling
5. **SyncIndicator** - Synced/Pending/Conflict states

### Responsive Design

- **Desktop:** Sidebar + Main content
- **Tablet:** Collapsible sidebar
- **Mobile:** Bottom navigation + Fullscreen (via layout)

## 🚀 Usage

### Start the frontend

```bash
pnpm dev:web
```

### Access the application

```
http://localhost:3000
```

### Workflow

1. **Connect Wallet** - MetaMask connection
2. **Switch to IrysVM** - Chain ID 1270
3. **Create Project** - Set name, slug, visibility
4. **Add Documents** - Create and edit documents
5. **Collaborate** - Add comments, create versions
6. **Search** - Find documents across projects

## 🔧 Configuration

### Apollo Client

**File:** `apps/web/src/app/apollo-wrapper.tsx`

- GraphQL endpoint: `http://localhost:4000/graphql`
- WebSocket for subscriptions
- Authentication header with JWT

### Environment Variables

```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:4000/graphql
```

## 📱 Pages Overview

| Route | Description |
|-------|-------------|
| `/` | Dashboard with project list |
| `/projects/new` | Create new project |
| `/projects/[id]` | Project detail page |
| `/documents/[id]` | Document editor |
| `/search` | Search across documents |
| `/settings` | User settings |

## 🎨 Component Library

Using **shadcn/ui** components:

- Button
- Input
- Textarea
- Card
- Table
- Dialog
- Dropdown
- Badge
- Tooltip

All styled with **Tailwind CSS** utility classes.

## 🔐 Authentication Flow

1. User clicks "Connect Wallet"
2. MetaMask prompts connection
3. Backend generates challenge
4. User signs challenge
5. Backend returns JWT token
6. Token stored and used for API calls

## 📊 Real-time Features

### Document Updates

```typescript
useSubscription(DOCUMENT_UPDATED, {
  variables: { documentId },
  onData: ({ data }) => {
    // Handle real-time updates
  },
});
```

### Comments

```typescript
useSubscription(COMMENT_ADDED, {
  variables: { documentId },
  onData: ({ data }) => {
    // Add comment to UI
  },
});
```

## 🎯 Next Steps

Potential enhancements:

1. **Rich Text Editor** - Add Markdown/WYSIWYG editor
2. **File Attachments** - Upload images and files
3. **Collaborative Editing** - Real-time cursor positions
4. **Advanced Search** - Filters, facets, autocomplete
5. **Notifications** - Toast notifications for events
6. **Dark Mode** - Theme switcher
7. **Export** - PDF, Markdown export
8. **Templates** - Project templates

## 📚 Related Documentation

- [UI/UX Guidelines](./docs/UI_UX_GUIDELINES.md)
- [API Reference](./docs/API.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Getting Started](./docs/GETTING_STARTED.md)

---

**Note:** This is a complete redesign that replaces the simple "Posts" interface with a full-featured documentation platform matching the backend capabilities.
