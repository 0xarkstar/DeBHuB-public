# DeBHuB API Reference

Complete GraphQL API documentation for DeBHuB.

## Table of Contents

- [Schema Overview](#schema-overview)
- [Queries](#queries)
- [Mutations](#mutations)
- [Subscriptions](#subscriptions)
- [Types](#types)
- [Error Handling](#error-handling)
- [Authentication](#authentication)

---

## Schema Overview

DeBHuB exposes a comprehensive GraphQL API with:

- **44 Queries** - Data retrieval operations
- **19 Mutations** - Data modification operations
- **4 Subscriptions** - Real-time updates
- **30+ Types** - Strongly-typed schema

**GraphQL Endpoint:** `http://localhost:4000/graphql`

**Playground:** `http://localhost:4000/graphql` (development only)

---

## Queries

### Projects

#### `project(id: ID!): Project`

Get a single project by ID.

```graphql
query {
  project(id: "project-123") {
    id
    name
    slug
    description
    visibility
    owner {
      address
    }
    documents {
      id
      title
    }
    collaborators {
      user {
        address
      }
      role
    }
  }
}
```

#### `projectBySlug(slug: String!): Project`

Get project by slug.

```graphql
query {
  projectBySlug(slug: "my-docs") {
    id
    name
    documents {
      title
      path
    }
  }
}
```

#### `myProjects(limit: Int, offset: Int): [Project!]!`

Get current user's projects.

```graphql
query {
  myProjects(limit: 10, offset: 0) {
    id
    name
    documentsCount
    collaboratorsCount
  }
}
```

#### `publicProjects(limit: Int, offset: Int): [Project!]!`

Get all public projects.

```graphql
query {
  publicProjects(limit: 20) {
    id
    name
    description
    owner {
      address
    }
  }
}
```

### Documents

#### `document(id: ID!): Document`

Get single document by ID.

```graphql
query {
  document(id: "doc-456") {
    id
    title
    content
    path
    published
    irysId
    irysProof
    author {
      address
    }
    versions {
      versionNumber
      createdAt
    }
    comments {
      content
      author {
        address
      }
    }
  }
}
```

#### `documentByPath(projectId: ID!, path: String!): Document`

Get document by project and path.

```graphql
query {
  documentByPath(projectId: "project-123", path: "/getting-started") {
    id
    title
    content
  }
}
```

#### `projectDocuments(projectId: ID!, limit: Int, offset: Int): [Document!]!`

Get all documents in a project.

```graphql
query {
  projectDocuments(projectId: "project-123", limit: 50) {
    id
    title
    path
    published
    updatedAt
  }
}
```

#### `documentHistory(documentId: ID!): [Version!]!`

Get document version history.

```graphql
query {
  documentHistory(documentId: "doc-456") {
    id
    versionNumber
    content
    author {
      address
    }
    createdAt
  }
}
```

### Search

#### `searchDocuments(query: String!, projectId: ID, limit: Int, offset: Int): [SearchResult!]!`

Full-text search across documents.

```graphql
query {
  searchDocuments(query: "authentication", projectId: "project-123", limit: 10) {
    documentId
    title
    content
    similarity
    highlights
  }
}
```

### Analytics

#### `projectMetrics(projectId: ID!): ProjectMetrics!`

Get comprehensive project metrics.

```graphql
query {
  projectMetrics(projectId: "project-123") {
    totalDocuments
    publishedDocuments
    draftDocuments
    totalVersions
    totalComments
    totalCollaborators
    recentActivity {
      type
      description
      timestamp
    }
  }
}
```

### Users

#### `me: User`

Get current authenticated user.

```graphql
query {
  me {
    id
    address
    createdAt
    ownedProjects {
      name
    }
  }
}
```

#### `user(address: String!): User`

Get user by wallet address.

```graphql
query {
  user(address: "0x1234...") {
    address
    ownedProjects {
      name
      slug
    }
  }
}
```

---

## Mutations

### Projects

#### `createProject(input: CreateProjectInput!): Project!`

Create a new project.

```graphql
mutation {
  createProject(input: {
    name: "My Documentation"
    slug: "my-docs"
    description: "Project documentation"
    visibility: PUBLIC
    settings: {
      defaultBranch: "main"
      allowPublicEdit: false
    }
  }) {
    id
    name
    slug
    irysId
  }
}
```

**Input:**
```typescript
{
  name: string;
  slug: string;
  description?: string;
  visibility: ProjectVisibility; // PUBLIC | PRIVATE | UNLISTED
  settings?: {
    defaultBranch?: string;
    allowPublicEdit?: boolean;
    enableComments?: boolean;
  };
}
```

#### `updateProject(input: UpdateProjectInput!): Project!`

Update project details.

```graphql
mutation {
  updateProject(input: {
    id: "project-123"
    name: "Updated Name"
    description: "New description"
    visibility: PRIVATE
  }) {
    id
    name
    description
  }
}
```

#### `deleteProject(id: ID!): Boolean!`

Delete a project (soft delete).

```graphql
mutation {
  deleteProject(id: "project-123")
}
```

### Documents

#### `createDocument(input: CreateDocumentInput!): Document!`

Create a new document.

```graphql
mutation {
  createDocument(input: {
    projectId: "project-123"
    title: "Getting Started"
    content: "# Welcome\n\nThis is your first document."
    path: "/getting-started"
    tags: ["tutorial", "intro"]
    metadata: {
      category: "guides"
    }
  }) {
    id
    title
    irysId
    contentHash
  }
}
```

**Input:**
```typescript
{
  projectId: string;
  title: string;
  content: string;
  path: string;
  tags?: string[];
  metadata?: Record<string, any>;
}
```

#### `updateDocument(input: UpdateDocumentInput!): Document!`

Update document content.

```graphql
mutation {
  updateDocument(input: {
    id: "doc-456"
    title: "Updated Title"
    content: "Updated content..."
    tags: ["updated"]
  }) {
    id
    title
    updatedAt
  }
}
```

#### `deleteDocument(id: ID!): Boolean!`

Delete a document.

```graphql
mutation {
  deleteDocument(id: "doc-456")
}
```

#### `publishDocument(id: ID!): Document!`

Publish a document.

```graphql
mutation {
  publishDocument(id: "doc-456") {
    id
    published
    publishedAt
  }
}
```

### Versions

#### `createVersion(documentId: ID!, content: String!, message: String): Version!`

Create a new document version.

```graphql
mutation {
  createVersion(
    documentId: "doc-456"
    content: "Updated content..."
    message: "Fixed typos"
  ) {
    id
    versionNumber
    createdAt
  }
}
```

#### `revertToVersion(documentId: ID!, versionId: ID!): Document!`

Revert document to a specific version.

```graphql
mutation {
  revertToVersion(documentId: "doc-456", versionId: "ver-789") {
    id
    content
    updatedAt
  }
}
```

### Collaborators

#### `addCollaborator(input: AddCollaboratorInput!): Collaborator!`

Add collaborator to project.

```graphql
mutation {
  addCollaborator(input: {
    projectId: "project-123"
    userAddress: "0x5678..."
    role: EDITOR
  }) {
    id
    user {
      address
    }
    role
  }
}
```

**Roles:**
- `OWNER` - Project owner
- `ADMIN` - Can manage collaborators
- `EDITOR` - Can edit documents
- `VIEWER` - Read-only access

#### `updateCollaboratorRole(collaboratorId: ID!, role: CollaboratorRole!): Collaborator!`

Update collaborator role.

```graphql
mutation {
  updateCollaboratorRole(collaboratorId: "collab-123", role: ADMIN) {
    id
    role
  }
}
```

#### `removeCollaborator(collaboratorId: ID!): Boolean!`

Remove collaborator from project.

```graphql
mutation {
  removeCollaborator(collaboratorId: "collab-123")
}
```

### Comments

#### `createComment(input: CreateCommentInput!): Comment!`

Add comment to document.

```graphql
mutation {
  createComment(input: {
    documentId: "doc-456"
    content: "This section needs clarification"
    position: 150
    thread: null
  }) {
    id
    content
    author {
      address
    }
    createdAt
  }
}
```

#### `resolveComment(id: ID!): Comment!`

Mark comment as resolved.

```graphql
mutation {
  resolveComment(id: "comment-789") {
    id
    resolved
    resolvedAt
  }
}
```

#### `deleteComment(id: ID!): Boolean!`

Delete a comment.

```graphql
mutation {
  deleteComment(id: "comment-789")
}
```

---

## Subscriptions

### `documentUpdated(documentId: ID!): DocumentUpdate!`

Subscribe to document updates.

```graphql
subscription {
  documentUpdated(documentId: "doc-456") {
    documentId
    type
    data
    timestamp
  }
}
```

**Update Types:**
- `CONTENT_CHANGED` - Document content updated
- `PUBLISHED` - Document published
- `UNPUBLISHED` - Document unpublished
- `DELETED` - Document deleted

### `commentAdded(documentId: ID!): Comment!`

Subscribe to new comments.

```graphql
subscription {
  commentAdded(documentId: "doc-456") {
    id
    content
    author {
      address
    }
    createdAt
  }
}
```

### `versionCreated(documentId: ID!): Version!`

Subscribe to new versions.

```graphql
subscription {
  versionCreated(documentId: "doc-456") {
    id
    versionNumber
    message
    createdAt
  }
}
```

### `reviewRequested(userId: ID!): ReviewRequest!`

Subscribe to review requests for a user.

```graphql
subscription {
  reviewRequested(userId: "user-123") {
    id
    document {
      title
    }
    requestedBy {
      address
    }
    message
  }
}
```

---

## Types

### Project

```graphql
type Project {
  id: ID!
  name: String!
  slug: String!
  description: String
  visibility: ProjectVisibility!
  settings: ProjectSettings

  # Relationships
  owner: User!
  documents(limit: Int, offset: Int): [Document!]!
  collaborators: [Collaborator!]!

  # Irys
  irysId: String
  permanentUrl: String

  # Metadata
  createdAt: DateTime!
  updatedAt: DateTime!

  # Computed
  documentsCount: Int!
  collaboratorsCount: Int!
}
```

### Document

```graphql
type Document {
  id: ID!
  title: String!
  content: String!
  path: String!
  published: Boolean!
  order: Int!

  # Relationships
  project: Project!
  author: User!
  versions: [Version!]!
  comments: [Comment!]!

  # Irys
  irysId: String
  irysProof: String
  contentHash: String

  # Metadata
  tags: [String!]!
  metadata: JSON
  createdAt: DateTime!
  updatedAt: DateTime!
  publishedAt: DateTime
}
```

### User

```graphql
type User {
  id: ID!
  address: String!

  # Relationships
  ownedProjects: [Project!]!
  documents: [Document!]!
  comments: [Comment!]!
  collaborations: [Collaborator!]!

  # Metadata
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Version

```graphql
type Version {
  id: ID!
  versionNumber: Int!
  content: String!
  message: String

  # Relationships
  document: Document!
  author: User!

  # Irys
  irysId: String
  contentHash: String

  # Metadata
  createdAt: DateTime!
}
```

### Comment

```graphql
type Comment {
  id: ID!
  content: String!
  position: Int
  resolved: Boolean!

  # Relationships
  document: Document!
  author: User!
  thread: Comment
  replies: [Comment!]!

  # Metadata
  createdAt: DateTime!
  updatedAt: DateTime!
  resolvedAt: DateTime
  resolvedBy: User
}
```

### SearchResult

```graphql
type SearchResult {
  documentId: ID!
  title: String!
  content: String!
  similarity: Float!
  highlights: [String!]!
  metadata: JSON!
}
```

### ProjectMetrics

```graphql
type ProjectMetrics {
  totalDocuments: Int!
  publishedDocuments: Int!
  draftDocuments: Int!
  totalVersions: Int!
  totalComments: Int!
  totalCollaborators: Int!
  recentActivity: [ActivityItem!]!
}
```

### ActivityItem

```graphql
type ActivityItem {
  type: ActivityType!
  timestamp: DateTime!
  userId: String!
  description: String!
  metadata: JSON!
}

enum ActivityType {
  DOCUMENT_CREATED
  VERSION_CREATED
  COMMENT_ADDED
}
```

---

## Error Handling

### Error Format

All errors follow a consistent format:

```json
{
  "errors": [
    {
      "message": "Document not found",
      "extensions": {
        "code": "NOT_FOUND",
        "documentId": "doc-456"
      }
    }
  ]
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHENTICATED` | User not authenticated |
| `UNAUTHORIZED` | User lacks permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Input validation failed |
| `CONFLICT` | Resource conflict |
| `INTERNAL_ERROR` | Server error |

### Common Errors

**Authentication Error:**
```json
{
  "errors": [{
    "message": "Authentication required",
    "extensions": { "code": "UNAUTHENTICATED" }
  }]
}
```

**Authorization Error:**
```json
{
  "errors": [{
    "message": "Not authorized to update this document",
    "extensions": { "code": "UNAUTHORIZED" }
  }]
}
```

**Validation Error:**
```json
{
  "errors": [{
    "message": "Validation error",
    "extensions": {
      "code": "VALIDATION_ERROR",
      "fields": {
        "title": "Title is required",
        "slug": "Slug must be lowercase"
      }
    }
  }]
}
```

---

## Authentication

### Wallet-Based Authentication

DeBHuB uses cryptographic signature-based authentication:

1. **Request Challenge:**
```graphql
mutation {
  requestChallenge(address: "0x1234...") {
    challenge
    expiresAt
  }
}
```

2. **Sign Challenge:**
```typescript
const signature = await signer.signMessage(challenge);
```

3. **Authenticate:**
```graphql
mutation {
  authenticate(address: "0x1234...", signature: "0xabcd...") {
    token
    user {
      address
    }
  }
}
```

4. **Use Token:**
```typescript
const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  headers: {
    authorization: `Bearer ${token}`
  }
});
```

### Token Expiration

- JWT tokens expire after 7 days
- Refresh token before expiration
- Re-authenticate if token expires

---

## Rate Limiting

**Default Limits:**
- 100 requests per minute per IP
- 1000 requests per hour per user
- WebSocket: 50 connections per IP

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Best Practices

### Query Optimization

1. **Request Only Needed Fields:**
```graphql
# Good
query {
  project(id: "123") {
    id
    name
  }
}

# Bad
query {
  project(id: "123") {
    id
    name
    description
    documents {
      id
      title
      content  # Large field
      versions {
        ...
      }
    }
  }
}
```

2. **Use Pagination:**
```graphql
query {
  projectDocuments(projectId: "123", limit: 20, offset: 0) {
    id
    title
  }
}
```

3. **Use Fragments:**
```graphql
fragment ProjectBasic on Project {
  id
  name
  slug
}

query {
  myProjects {
    ...ProjectBasic
  }
}
```

### Mutation Best Practices

1. **Handle Errors:**
```typescript
try {
  const result = await client.mutate({
    mutation: CREATE_DOCUMENT,
    variables: { input }
  });
} catch (error) {
  console.error(error.graphQLErrors);
}
```

2. **Update Cache:**
```typescript
client.mutate({
  mutation: CREATE_DOCUMENT,
  update(cache, { data }) {
    cache.modify({
      fields: {
        projectDocuments(existing = []) {
          return [...existing, data.createDocument];
        }
      }
    });
  }
});
```

### Subscription Best Practices

1. **Clean Up Subscriptions:**
```typescript
const subscription = client.subscribe({
  query: DOCUMENT_UPDATED,
  variables: { documentId }
});

// Later...
subscription.unsubscribe();
```

2. **Handle Reconnection:**
```typescript
subscription.subscribe({
  next: (data) => { /* handle data */ },
  error: (error) => { /* reconnect */ }
});
```

---

For more information:
- [Services Guide](./SERVICES.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Getting Started](./GETTING_STARTED.md)