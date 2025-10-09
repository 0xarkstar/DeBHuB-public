# IrysBase User Flows

## Overview
This document describes the complete user journey through the IrysBase platform, from initial connection to advanced features.

---

## 1. Authentication Flow

```mermaid
flowchart TD
    A[User Visits Site] --> B{Wallet Connected?}
    B -->|No| C[Click 'Connect Wallet']
    B -->|Yes| D{On Correct Network?}

    C --> E[RainbowKit Modal Opens]
    E --> F[Select Wallet Provider]
    F --> G[Approve Connection]
    G --> D

    D -->|No| H[Show Network Warning]
    H --> I[Click 'Switch to IrysVM']
    I --> J[Approve Network Switch]
    J --> K{Authenticated?}

    D -->|Yes| K

    K -->|No| L[Show 'Authenticate' Button]
    L --> M[Click Authenticate]
    M --> N[Backend Generates Challenge]
    N --> O[Sign Message in Wallet]
    O --> P[Backend Verifies Signature]
    P --> Q{Valid?}

    Q -->|No| R[Show Error Message]
    R --> M

    Q -->|Yes| S[Receive JWT Token]
    S --> T[Store Token in localStorage]
    T --> U[Redirect to Dashboard]

    K -->|Yes| U
```

### Authentication Steps:
1. **Wallet Connection**: User connects wallet via RainbowKit
2. **Network Check**: Verify user is on IrysVM (Chain ID: 1270)
3. **Challenge Generation**: Backend creates unique challenge string
4. **Signature Request**: User signs message with wallet
5. **JWT Issuance**: Backend verifies signature and issues 7-day JWT
6. **Session Start**: Token stored, user authenticated

---

## 2. Project Management Flow

```mermaid
flowchart TD
    A[Dashboard] --> B[Click 'New Project']
    B --> C[Fill Project Form]
    C --> D[Enter Name & Slug]
    D --> E[Add Description]
    E --> F{Set Visibility}

    F -->|Public| G[Configure Settings]
    F -->|Private| G
    F -->|Unlisted| G

    G --> H[Click 'Create Project']
    H --> I[Frontend Validates Input]
    I --> J{Valid?}

    J -->|No| K[Show Validation Errors]
    K --> C

    J -->|Yes| L[Send GraphQL Mutation]
    L --> M[Backend Creates DB Entry]
    M --> N[Upload Metadata to Irys]
    N --> O{Irys Success?}

    O -->|No| P[Store in DB Only]
    P --> Q[Set syncStatus: 'syncing']

    O -->|Yes| R[Update DB with Irys ID]
    R --> S[Set syncStatus: 'synced']

    Q --> T[Publish Project Event]
    S --> T
    T --> U[Navigate to Project Page]
```

### Project Creation Steps:
1. **Form Input**: Name, slug, description, visibility
2. **Validation**: Check slug uniqueness, required fields
3. **Database**: Create project record with owner
4. **Irys Upload**: Store project metadata permanently
5. **Event**: Publish PROJECT_UPDATED subscription event
6. **Navigation**: Redirect to new project page

---

## 3. Document Creation & Editing Flow

```mermaid
flowchart TD
    A[Project Page] --> B[Click 'New Document']
    B --> C[Document Editor Opens]
    C --> D[Enter Title & Path]
    D --> E[Write Content Markdown]
    E --> F[Add Tags Optional]
    F --> G[Click 'Save']

    G --> H[Generate Content Hash SHA-256]
    H --> I[Create Document in DB]
    I --> J[Create Version 1]
    J --> K[Background: Upload to Irys]
    K --> L{User Continues Editing?}

    L -->|No| M[Document Saved]

    L -->|Yes| N[Edit Content]
    N --> O[Auto-save Draft]
    O --> P[Click 'Save' Again]
    P --> Q[New Content Hash]
    Q --> R[Update Document]
    R --> S[Increment Version]
    S --> T[Create Version Record]
    T --> U[Background: Upload to Irys]
    U --> V[Broadcast via Subscription]
    V --> W{Other Users Viewing?}

    W -->|Yes| X[Update Their UI Real-time]
    W -->|No| M
    X --> M
```

### Document Operations:
- **Create**: Title, path, content → DB + Irys
- **Update**: New version created automatically
- **Version Control**: Every save = new version with diff
- **Real-time Sync**: WebSocket broadcasts changes
- **Permanent Storage**: Irys background upload with proof

---

## 4. Search & Discovery Flow

```mermaid
flowchart TD
    A[User Enters Search] --> B{Search Type?}

    B -->|Full-text| C[Search Documents by Content]
    C --> D[PostgreSQL Full-text Search]
    D --> E[Return Ranked Results]

    B -->|Semantic| F[Generate Query Embedding]
    F --> G{OpenAI API Available?}
    G -->|Yes| H[Use text-embedding-ada-002]
    G -->|No| I[Use Mock Embedding]
    H --> J[Vector Similarity Search]
    I --> J
    J --> K[Return Similar Documents]

    B -->|Hybrid| L[Run Both Searches]
    L --> M[Merge Results with Weights]
    M --> N[Semantic: 70%, Full-text: 30%]
    N --> O[Return Combined Results]

    E --> P[Display Results]
    K --> P
    O --> P

    P --> Q[User Clicks Result]
    Q --> R[Navigate to Document]
```

### Search Features:
- **Full-text**: Traditional keyword search
- **Semantic**: AI-powered meaning-based search
- **Hybrid**: Best of both worlds
- **Filters**: By project, date, author
- **Highlights**: Matched terms highlighted

---

## 5. Collaboration Flow

```mermaid
flowchart TD
    A[Project Owner] --> B[Click 'Add Collaborator']
    B --> C[Enter User Address]
    C --> D{Select Role}

    D -->|Owner| E[Full Control]
    D -->|Admin| F[Manage + Edit]
    D -->|Editor| G[Edit Only]
    D -->|Reviewer| H[Comment Only]
    D -->|Viewer| I[Read Only]

    E --> J[Set Permissions]
    F --> J
    G --> J
    H --> J
    I --> J

    J --> K[Create Collaborator Record]
    K --> L[Notify User Optional]
    L --> M[User Sees Project in Dashboard]

    M --> N[User Opens Document]
    N --> O[Join Collaboration Session]
    O --> P[WebSocket Connection]
    P --> Q[Show Active Users]
    Q --> R[Display User Cursors]

    R --> S{User Makes Edit?}
    S -->|Yes| T[Broadcast Change via WS]
    T --> U[Other Users See Update]
    U --> V[Merge Changes OT]

    S -->|No| W[User Adds Comment]
    W --> X[Create Comment Record]
    X --> Y[Publish Comment Event]
    Y --> Z[Others See Comment]
```

### Collaboration Features:
- **Roles**: Owner, Admin, Editor, Reviewer, Viewer
- **Real-time**: WebSocket-based live editing
- **Presence**: See who's online and their cursor
- **Comments**: Inline threaded discussions
- **Permissions**: Granular access control

---

## 6. Storage & Usage Tracking Flow

```mermaid
flowchart TD
    A[User Views Usage Page] --> B[Query GET_USER_STORAGE]
    B --> C[Backend Aggregates Data]
    C --> D[Find All User Projects]
    D --> E[Get Confirmed Irys Transactions]
    E --> F[Calculate Total Bytes]
    F --> G[Convert to GB]
    G --> H[Calculate Cost $2.5/GB]
    H --> I[Count Projects]
    I --> J[Return Metrics]

    J --> K[Display in UI]
    K --> L{User Clicks Project}

    L -->|Yes| M[Query GET_PROJECT_STORAGE]
    M --> N[Get Project Transactions]
    N --> O[Calculate Per-Document Usage]
    O --> P[Show Breakdown]

    P --> Q{Over Quota?}
    Q -->|Yes| R[Show Warning]
    R --> S[Suggest Optimization]

    Q -->|No| T[Show Normal Stats]
```

### Storage Metrics:
- **User-level**: Total across all projects
- **Project-level**: Per-project breakdown
- **Document-level**: Individual file sizes
- **Cost Calculation**: Real Irys transaction data
- **Sync Status**: Track upload completion

---

## 7. Programmable Data Flow

```mermaid
flowchart TD
    A[User Opens Programmable Data] --> B{Select Rule Type}

    B -->|Access Control| C[Define Access Condition]
    C --> C1[Example: userRole === 'premium']
    C1 --> D[Define Action]
    D --> D1[Example: allow: 'read']

    B -->|Auto-Trigger| E[Define Event Trigger]
    E --> E1[Example: document.updated]
    E1 --> F[Define Action]
    F --> F1[Example: notify collaborators]

    B -->|Royalty| G[Define Payment Trigger]
    G --> G1[Example: document.accessed > 1000]
    G1 --> H[Define Distribution]
    H --> H1[Example: author 70%, platform 30%]

    D1 --> I[Enter as JSON]
    F1 --> I
    H1 --> I

    I --> J[Click 'Create Rule']
    J --> K[Validate JSON]
    K --> L{Valid?}

    L -->|No| M[Show Error]
    M --> I

    L -->|Yes| N[Create Rule in DB]
    N --> O[Rule Status: enabled]
    O --> P{Event Occurs?}

    P -->|Yes| Q[Evaluate Condition]
    Q --> R{Condition Met?}

    R -->|Yes| S[Execute Action]
    S --> T[Increment Execution Count]
    T --> U[Log Execution]

    R -->|No| V[Skip Action]
    P -->|No| V
```

### Programmable Data Types:
1. **Access Control**: Who can read/write data
2. **Auto-Triggers**: Automated workflows on events
3. **Royalty Distribution**: Automatic payments

---

## 8. AI-Powered Features Flow

```mermaid
flowchart TD
    A[User Action] --> B{Which AI Feature?}

    B -->|Semantic Search| C[User Enters Query]
    C --> D[Generate Embedding OpenAI]
    D --> E[Vector Similarity Search]
    E --> F[Return Similar Docs]

    B -->|Q&A System| G[User Asks Question]
    G --> H[Find Relevant Context]
    H --> I[Combine Top 5 Documents]
    I --> J[Send to GPT-4]
    J --> K[Generate Answer]
    K --> L[Return with Sources]

    B -->|Auto-Complete| M[User Types in Editor]
    M --> N[Get Similar Content]
    N --> O[Generate Suggestions]
    O --> P[Show Inline Completions]

    B -->|Content Analysis| Q[Document Saved]
    Q --> R[Extract Keywords]
    R --> S[Assess Difficulty]
    S --> T[Calculate Reading Time]
    T --> U[Generate Tags]
    U --> V[Store in Metadata]
```

### AI Features:
- **Semantic Search**: Meaning-based document discovery
- **Q&A**: Answer questions from document corpus
- **Auto-complete**: Smart content suggestions
- **Analysis**: Automatic tagging and categorization
- **Embeddings**: OpenAI ada-002 model

---

## 9. Version Control & History Flow

```mermaid
flowchart TD
    A[Document Page] --> B[Click 'History']
    B --> C[Load All Versions]
    C --> D[Display Version List]
    D --> E[Show: Version #, Author, Date, Message]

    E --> F{User Action}

    F -->|View Version| G[Load Historical Content]
    G --> H[Show Read-only View]
    H --> I[Display Diff if Available]

    F -->|Compare Versions| J[Select Two Versions]
    J --> K[Calculate Diff]
    K --> L[Show Side-by-side]
    L --> M[Highlight Changes]

    F -->|Revert| N[Confirm Revert]
    N --> O{Confirmed?}
    O -->|No| D
    O -->|Yes| P[Load Old Content]
    P --> Q[Create New Version]
    Q --> R[Message: 'Reverted to v X']
    R --> S[Save Document]
    S --> T[Upload to Irys]
    T --> U[Notify Collaborators]
```

### Version Control:
- **Automatic**: Every save creates new version
- **Git-like**: Version numbers, commit messages
- **Diff View**: See what changed
- **Revert**: Restore previous versions
- **Audit Trail**: Complete history with authors

---

## 10. Error Handling & Recovery Flow

```mermaid
flowchart TD
    A[User Action] --> B[Send Request]
    B --> C{Network OK?}

    C -->|No| D[Show Network Error]
    D --> E[Retry Button]
    E --> B

    C -->|Yes| F[Backend Processing]
    F --> G{Error Occurred?}

    G -->|No| H[Success Response]
    H --> I[Update UI]

    G -->|Yes| J{Error Type?}

    J -->|UNAUTHORIZED| K[Clear Auth Token]
    K --> L[Redirect to Home]
    L --> M[Show 'Please Sign In']

    J -->|VALIDATION_ERROR| N[Show Field Errors]
    N --> O[Highlight Invalid Fields]

    J -->|NOT_FOUND| P[Show 404 Page]
    P --> Q[Suggest Going Home]

    J -->|IRYS_ERROR| R[Show Irys Error]
    R --> S[Mark syncStatus: 'error']
    S --> T[Retry Upload Later]

    J -->|INTERNAL_ERROR| U[ErrorBoundary Catches]
    U --> V[Show Error UI]
    V --> W[Reload or Try Again]
```

### Error Types:
- **Network**: Connection issues
- **Authentication**: Invalid/expired tokens
- **Validation**: Bad user input
- **Not Found**: Missing resources
- **Irys**: Storage service errors
- **Internal**: Unexpected server errors

---

## 11. Complete User Journey Example

**Scenario**: Alice creates a documentation project with Bob as collaborator

```mermaid
flowchart TD
    A[Alice Visits IrysBase] --> B[Connects MetaMask]
    B --> C[Switches to IrysVM]
    C --> D[Signs Authentication]
    D --> E[JWT Received & Stored]
    E --> F[Dashboard Loads]

    F --> G[Clicks 'New Project']
    G --> H[Enters: 'API Docs', 'api-docs']
    H --> I[Sets Public, Clicks Create]
    I --> J[Project Created in DB]
    J --> K[Metadata Uploaded to Irys]
    K --> L[Project Page Opens]

    L --> M[Clicks 'New Document']
    M --> N[Enters: 'Getting Started']
    N --> O[Writes Markdown Content]
    O --> P[Adds tags: tutorial, beginner]
    P --> Q[Clicks Save]
    Q --> R[Document Saved + Irys Upload]

    R --> S[Clicks 'Add Collaborator']
    S --> T[Enters Bob's Address]
    T --> U[Sets Role: Editor]
    U --> V[Bob Added]

    V --> W[Bob Opens Project]
    W --> X[Bob Opens Document]
    X --> Y[WebSocket Connects]
    Y --> Z[Alice & Bob See Each Other]

    Z --> AA[Bob Edits Line 5]
    AA --> AB[Change Broadcasts to Alice]
    AB --> AC[Alice Sees Bob's Cursor]
    AC --> AD[Bob Saves]
    AD --> AE[Version 2 Created]
    AE --> AF[Both Users Updated]

    AF --> AG[Alice Clicks History]
    AG --> AH[Sees v1 by Alice, v2 by Bob]
    AH --> AI[Compares Versions]
    AI --> AJ[Views Diff]

    AJ --> AK[Alice Views Usage Page]
    AK --> AL[Sees: 0.0001 GB, $0.00]
    AL --> AM[Clicks Storage Details]
    AM --> AN[Sees Document Breakdown]
```

---

## Summary

The IrysBase platform provides a complete workflow for:

1. **Authentication**: Secure wallet-based login with JWT
2. **Project Management**: Create, organize, collaborate
3. **Document Editing**: Real-time collaborative markdown editor
4. **Version Control**: Git-like history with full audit trail
5. **Search**: AI-powered semantic and full-text search
6. **Storage**: Permanent Irys storage with usage tracking
7. **Programmable Data**: Rules for access, triggers, royalties
8. **AI Features**: Smart search, Q&A, auto-complete
9. **Collaboration**: Real-time editing with presence awareness
10. **Error Handling**: Graceful degradation and recovery

Each flow is designed to be intuitive, with clear feedback and error handling at every step.
