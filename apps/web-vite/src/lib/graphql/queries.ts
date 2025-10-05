import { gql } from '@apollo/client';

// Fragment definitions
export const PROJECT_BASIC = gql`
  fragment ProjectBasic on Project {
    id
    name
    slug
    description
    visibility
    documentsCount
    collaboratorsCount
    createdAt
    updatedAt
  }
`;

export const DOCUMENT_BASIC = gql`
  fragment DocumentBasic on Document {
    id
    title
    path
    published
    publishedAt
    updatedAt
    createdAt
    irysId
    contentHash
  }
`;

export const USER_BASIC = gql`
  fragment UserBasic on User {
    id
    address
    createdAt
  }
`;

// User Queries
export const GET_ME = gql`
  ${USER_BASIC}
  query GetMe {
    me {
      ...UserBasic
      ownedProjects {
        id
        name
        slug
      }
    }
  }
`;

// Project Queries
export const GET_MY_PROJECTS = gql`
  ${PROJECT_BASIC}
  query GetMyProjects($limit: Int, $offset: Int) {
    myProjects(limit: $limit, offset: $offset) {
      ...ProjectBasic
      owner {
        address
      }
    }
  }
`;

export const GET_PROJECT = gql`
  ${PROJECT_BASIC}
  ${USER_BASIC}
  query GetProject($id: ID!) {
    project(id: $id) {
      ...ProjectBasic
      owner {
        ...UserBasic
      }
      settings
      irysId
      permanentUrl
      collaborators {
        id
        role
        user {
          ...UserBasic
        }
      }
    }
  }
`;

export const GET_PROJECT_BY_SLUG = gql`
  ${PROJECT_BASIC}
  query GetProjectBySlug($slug: String!) {
    projectBySlug(slug: $slug) {
      ...ProjectBasic
    }
  }
`;

export const GET_PUBLIC_PROJECTS = gql`
  ${PROJECT_BASIC}
  query GetPublicProjects($limit: Int, $offset: Int) {
    publicProjects(limit: $limit, offset: $offset) {
      ...ProjectBasic
      owner {
        address
      }
    }
  }
`;

// Document Queries
export const GET_DOCUMENT = gql`
  ${DOCUMENT_BASIC}
  ${USER_BASIC}
  query GetDocument($id: ID!) {
    document(id: $id) {
      ...DocumentBasic
      content
      tags
      metadata
      author {
        ...UserBasic
      }
      project {
        id
        name
        slug
      }
    }
  }
`;

export const GET_DOCUMENT_BY_PATH = gql`
  ${DOCUMENT_BASIC}
  query GetDocumentByPath($projectId: ID!, $path: String!) {
    documentByPath(projectId: $projectId, path: $path) {
      ...DocumentBasic
      content
      author {
        address
      }
    }
  }
`;

export const GET_PROJECT_DOCUMENTS = gql`
  ${DOCUMENT_BASIC}
  query GetProjectDocuments($projectId: ID!, $limit: Int, $offset: Int) {
    projectDocuments(projectId: $projectId, limit: $limit, offset: $offset) {
      ...DocumentBasic
      author {
        address
      }
    }
  }
`;

export const GET_DOCUMENT_HISTORY = gql`
  ${USER_BASIC}
  query GetDocumentHistory($documentId: ID!) {
    documentHistory(documentId: $documentId) {
      id
      versionNumber
      content
      message
      createdAt
      irysId
      contentHash
      author {
        ...UserBasic
      }
    }
  }
`;

// Search Queries
export const SEARCH_DOCUMENTS = gql`
  query SearchDocuments($query: String!, $projectId: ID, $limit: Int, $offset: Int) {
    searchDocuments(query: $query, projectId: $projectId, limit: $limit, offset: $offset) {
      documentId
      title
      content
      similarity
      highlights
      metadata
    }
  }
`;

// Analytics Queries
export const GET_PROJECT_METRICS = gql`
  query GetProjectMetrics($projectId: ID!) {
    projectMetrics(projectId: $projectId) {
      totalDocuments
      publishedDocuments
      draftDocuments
      totalVersions
      totalComments
      totalCollaborators
      recentActivity {
        type
        timestamp
        userId
        description
        metadata
      }
    }
  }
`;

// Comments Queries
export const GET_DOCUMENT_COMMENTS = gql`
  ${USER_BASIC}
  query GetDocumentComments($documentId: ID!) {
    document(id: $documentId) {
      id
      comments {
        id
        content
        position
        resolved
        resolvedAt
        createdAt
        updatedAt
        author {
          ...UserBasic
        }
        resolvedBy {
          ...UserBasic
        }
        replies {
          id
          content
          createdAt
          author {
            ...UserBasic
          }
        }
      }
    }
  }
`;
