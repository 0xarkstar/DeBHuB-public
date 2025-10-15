# Frontend Development Guide

Complete guide for developing the DeBHuB frontend application.

## 📊 Current Status

### ✅ Backend (100% Complete)
- GraphQL API with all resolvers
- 9 Core services fully implemented
- Database schema complete
- Real-time subscriptions ready
- Authentication system ready

### 🚧 Frontend (To Be Developed)
- Basic structure exists in `apps/web`
- Needs complete UI implementation
- Components to be built
- Integration with backend API

---

## 🎯 Frontend Requirements

### Core Pages

1. **Landing Page** (`/`)
   - Hero section with product overview
   - Key features showcase
   - Call-to-action (Connect Wallet, Get Started)
   - Testimonials/use cases

2. **Dashboard** (`/dashboard`)
   - Project list overview
   - Quick actions
   - Recent activity feed
   - Analytics summary

3. **Projects** (`/projects`)
   - Project grid/list view
   - Create new project
   - Search and filter
   - Project cards with metadata

4. **Project Detail** (`/projects/[slug]`)
   - Document tree navigation
   - Project settings
   - Collaborators management
   - Analytics dashboard

5. **Document Editor** (`/projects/[slug]/docs/[path]`)
   - Rich text editor (Markdown/WYSIWYG)
   - Live preview
   - Version history sidebar
   - Comments panel
   - Real-time collaboration indicators

6. **Search** (`/search`)
   - Global search interface
   - Advanced filters
   - Result previews
   - Search history

7. **Settings** (`/settings`)
   - User profile
   - API keys
   - Preferences
   - Billing (future)

---

## 🏗️ Component Architecture

### Layout Components

```
app/
├── layout.tsx                 # Root layout
├── (auth)/
│   ├── layout.tsx            # Auth layout
│   └── login/page.tsx
├── (dashboard)/
│   ├── layout.tsx            # Dashboard layout
│   ├── dashboard/page.tsx
│   ├── projects/
│   │   ├── page.tsx
│   │   └── [slug]/
│   │       ├── page.tsx
│   │       └── docs/
│   │           └── [...path]/page.tsx
│   ├── search/page.tsx
│   └── settings/page.tsx
└── (marketing)/
    ├── layout.tsx            # Marketing layout
    └── page.tsx              # Landing page
```

### Core Components to Build

#### 1. Navigation Components

```typescript
// components/navigation/Sidebar.tsx
interface SidebarProps {
  projects: Project[];
  currentProject?: Project;
}

// components/navigation/TopBar.tsx
interface TopBarProps {
  user: User | null;
  onSearch: (query: string) => void;
}

// components/navigation/DocumentTree.tsx
interface DocumentTreeProps {
  projectId: string;
  documents: Document[];
  onDocumentSelect: (doc: Document) => void;
}
```

#### 2. Project Components

```typescript
// components/projects/ProjectCard.tsx
interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

// components/projects/ProjectGrid.tsx
interface ProjectGridProps {
  projects: Project[];
  loading: boolean;
}

// components/projects/CreateProjectDialog.tsx
interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}
```

#### 3. Document Components

```typescript
// components/documents/Editor.tsx
interface EditorProps {
  documentId: string;
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  readOnly?: boolean;
}

// components/documents/VersionHistory.tsx
interface VersionHistoryProps {
  documentId: string;
  versions: Version[];
  onRestore: (version: Version) => void;
}

// components/documents/CommentPanel.tsx
interface CommentPanelProps {
  documentId: string;
  comments: Comment[];
  onAddComment: (content: string) => void;
}

// components/documents/CollaborationBar.tsx
interface CollaborationBarProps {
  activeUsers: ActiveUser[];
  currentUser: User;
}
```

#### 4. Search Components

```typescript
// components/search/SearchBar.tsx
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

// components/search/SearchResults.tsx
interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  onResultClick: (result: SearchResult) => void;
}

// components/search/SearchFilters.tsx
interface SearchFiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}
```

#### 5. Analytics Components

```typescript
// components/analytics/MetricsCard.tsx
interface MetricsCardProps {
  title: string;
  value: number;
  change?: number;
  icon?: React.ReactNode;
}

// components/analytics/ActivityFeed.tsx
interface ActivityFeedProps {
  activities: ActivityItem[];
  loading: boolean;
}

// components/analytics/ChartWidget.tsx
interface ChartWidgetProps {
  data: ChartData;
  type: 'line' | 'bar' | 'pie';
  title: string;
}
```

#### 6. Wallet Components

```typescript
// components/wallet/ConnectWalletButton.tsx
interface ConnectWalletButtonProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

// components/wallet/WalletInfo.tsx
interface WalletInfoProps {
  address: string;
  balance: string;
  chainId: number;
}

// components/wallet/NetworkSwitcher.tsx
interface NetworkSwitcherProps {
  currentChainId: number;
  targetChainId: number;
  onSwitch: () => void;
}
```

---

## 🎨 Design System

### Using shadcn/ui

**Install Components:**

```bash
cd apps/web

# Install shadcn/ui CLI
npx shadcn-ui@latest init

# Add components as needed
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add toast
```

### Theme Configuration

```typescript
// app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Color Palette

```css
/* globals.css */
:root {
  /* Primary - Indigo */
  --primary: 239 84% 67%;
  --primary-foreground: 0 0% 100%;

  /* Secondary - Purple */
  --secondary: 262 83% 58%;
  --secondary-foreground: 0 0% 100%;

  /* Success - Green */
  --success: 142 71% 45%;

  /* Warning - Amber */
  --warning: 38 92% 50%;

  /* Error - Red */
  --error: 0 84% 60%;

  /* Background */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  /* Card */
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;

  /* Border */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;

  /* Ring */
  --ring: 239 84% 67%;

  /* Radius */
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode colors ... */
}
```

---

## 🔧 State Management

### Zustand Stores

#### Auth Store

```typescript
// store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

#### Wallet Store

```typescript
// store/wallet.ts
import { create } from 'zustand';

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  balance: string | null;
  setWallet: (address: string, chainId: number) => void;
  setBalance: (balance: string) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  chainId: null,
  isConnected: false,
  balance: null,
  setWallet: (address, chainId) =>
    set({ address, chainId, isConnected: true }),
  setBalance: (balance) => set({ balance }),
  disconnect: () =>
    set({ address: null, chainId: null, isConnected: false, balance: null }),
}));
```

#### UI Store

```typescript
// store/ui.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'system',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
```

---

## 📡 GraphQL Integration

### Apollo Client Setup

```typescript
// lib/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    authorization: `Bearer ${getToken()}`,
  },
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: process.env.NEXT_PUBLIC_WS_URL!,
    connectionParams: {
      authToken: getToken(),
    },
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
```

### Query Hooks

```typescript
// hooks/useProjects.ts
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECTS, CREATE_PROJECT } from '@/lib/queries';

export function useProjects() {
  const { data, loading, error } = useQuery(GET_PROJECTS);

  return {
    projects: data?.myProjects || [],
    loading,
    error,
  };
}

export function useCreateProject() {
  const [createProject, { loading, error }] = useMutation(CREATE_PROJECT);

  return {
    createProject,
    loading,
    error,
  };
}
```

### Subscription Hooks

```typescript
// hooks/useDocumentUpdates.ts
import { useSubscription } from '@apollo/client';
import { DOCUMENT_UPDATED } from '@/lib/queries';

export function useDocumentUpdates(documentId: string) {
  const { data, loading } = useSubscription(DOCUMENT_UPDATED, {
    variables: { documentId },
  });

  return {
    update: data?.documentUpdated,
    loading,
  };
}
```

---

## 🔐 Authentication Flow

### 1. Wallet Connection

```typescript
// components/wallet/ConnectWallet.tsx
import { useWalletStore } from '@/store/wallet';
import { useAuthStore } from '@/store/auth';

export function ConnectWallet() {
  const { setWallet } = useWalletStore();
  const { setToken, setUser } = useAuthStore();

  const connectWallet = async () => {
    // 1. Request wallet connection
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const chainId = (await provider.getNetwork()).chainId;

    // 2. Update wallet state
    setWallet(address, Number(chainId));

    // 3. Request challenge from backend
    const { data } = await requestChallenge({ variables: { address } });
    const challenge = data.requestChallenge.challenge;

    // 4. Sign challenge
    const signature = await signer.signMessage(challenge);

    // 5. Authenticate
    const { data: authData } = await authenticate({
      variables: { address, signature }
    });

    // 6. Store token and user
    setToken(authData.authenticate.token);
    setUser(authData.authenticate.user);
  };

  return <Button onClick={connectWallet}>Connect Wallet</Button>;
}
```

### 2. Protected Routes

```typescript
// components/auth/ProtectedRoute.tsx
import { useAuthStore } from '@/store/auth';
import { redirect } from 'next/navigation';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    redirect('/login');
  }

  return <>{children}</>;
}
```

---

## 📝 Rich Text Editor

### Using TipTap

```typescript
// components/documents/Editor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export function Editor({ initialContent, onSave }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      // Auto-save or update draft
      onSave(content);
    },
  });

  return (
    <div className="editor">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
```

---

## 🔄 Real-time Collaboration

### Cursor Sharing

```typescript
// components/collaboration/CollaborativeCursor.tsx
import { useEffect } from 'react';
import { useWalletStore } from '@/store/wallet';

export function CollaborativeCursor({ documentId }) {
  const { address } = useWalletStore();
  const [cursors, setCursors] = useState<CursorPosition[]>([]);

  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        documentId,
        userId: address,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'cursor') {
        setCursors(prev => ({
          ...prev,
          [data.userId]: data.position,
        }));
      }
    };

    return () => ws.close();
  }, [documentId, address]);

  return (
    <>
      {Object.entries(cursors).map(([userId, position]) => (
        <Cursor key={userId} userId={userId} position={position} />
      ))}
    </>
  );
}
```

---

## 📊 Analytics Dashboard

### Metrics Display

```typescript
// app/(dashboard)/projects/[slug]/page.tsx
import { useProjectMetrics } from '@/hooks/useProjectMetrics';

export default function ProjectPage({ params }) {
  const { metrics, loading } = useProjectMetrics(params.slug);

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricsCard
        title="Total Documents"
        value={metrics.totalDocuments}
        icon={<FileText />}
      />
      <MetricsCard
        title="Published"
        value={metrics.publishedDocuments}
        icon={<CheckCircle />}
      />
      <MetricsCard
        title="Comments"
        value={metrics.totalComments}
        icon={<MessageSquare />}
      />
      <MetricsCard
        title="Collaborators"
        value={metrics.totalCollaborators}
        icon={<Users />}
      />
    </div>
  );
}
```

---

## 🎯 Development Priorities

### Phase 1: Core Functionality (Week 1-2)

1. **Authentication & Wallet**
   - [ ] Connect wallet component
   - [ ] Authentication flow
   - [ ] Protected routes
   - [ ] User profile

2. **Projects**
   - [ ] Project list view
   - [ ] Create project form
   - [ ] Project card component
   - [ ] Project detail page

3. **Documents**
   - [ ] Document tree navigation
   - [ ] Basic text editor
   - [ ] Create/update documents
   - [ ] View document

### Phase 2: Advanced Features (Week 3-4)

1. **Rich Editor**
   - [ ] TipTap integration
   - [ ] Markdown support
   - [ ] Toolbar with formatting
   - [ ] Image upload

2. **Real-time**
   - [ ] Live cursors
   - [ ] Collaborative editing
   - [ ] Presence indicators
   - [ ] Activity feed

3. **Search**
   - [ ] Global search
   - [ ] Search results page
   - [ ] Advanced filters
   - [ ] Search suggestions

### Phase 3: Polish & Optimization (Week 5-6)

1. **UI/UX**
   - [ ] Responsive design
   - [ ] Dark mode
   - [ ] Loading states
   - [ ] Error boundaries

2. **Performance**
   - [ ] Code splitting
   - [ ] Image optimization
   - [ ] Lazy loading
   - [ ] Caching strategy

3. **Analytics**
   - [ ] Metrics dashboard
   - [ ] Charts and graphs
   - [ ] Activity timeline
   - [ ] Export reports

---

## 📚 Resources

### Required Libraries

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@apollo/client": "^3.8.0",
    "graphql": "^16.8.0",
    "graphql-ws": "^5.14.0",
    "ethers": "^6.9.0",
    "zustand": "^4.4.0",
    "@tiptap/react": "^2.1.0",
    "@tiptap/starter-kit": "^2.1.0",
    "lucide-react": "^0.292.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  }
}
```

### UI Component Examples

- **Sidebar**: [shadcn/ui sidebar example](https://ui.shadcn.com/examples/dashboard)
- **Editor**: [TipTap examples](https://tiptap.dev/examples)
- **Charts**: [Recharts](https://recharts.org/)
- **Tables**: [TanStack Table](https://tanstack.com/table)

### Learning Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [TipTap Editor](https://tiptap.dev/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd apps/web
pnpm install
```

### 2. Set Up Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
NEXT_PUBLIC_CHAIN_ID=1270
NEXT_PUBLIC_RPC_URL=https://rpc.irys.xyz
```

### 3. Start Development

```bash
# Start backend first
pnpm run api:dev:enhanced

# Then start frontend
pnpm run dev:web
```

### 4. Build Component

```bash
# Create new component
mkdir -p src/components/example
touch src/components/example/Example.tsx
```

---

For more information:
- [Architecture](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [UI/UX Guidelines](./UI_UX_GUIDELINES.md)