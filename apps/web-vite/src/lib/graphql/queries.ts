import { gql } from '@apollo/client';

export const GET_DOCUMENT = gql`
  query GetDocument($id: ID!) {
    document(id: $id) {
      id
      title
      content
      path
      version
      createdAt
      updatedAt
      author {
        id
        address
      }
    }
  }
`;

export const GET_PROJECT_DOCUMENTS = gql`
  query GetProjectDocuments($projectId: ID!) {
    projectDocuments(projectId: $projectId) {
      id
      title
      path
      version
      createdAt
      updatedAt
    }
  }
`;

export const GET_DOCUMENT_VERSIONS = gql`
  query GetDocumentVersions($documentId: ID!) {
    documentHistory(documentId: $documentId) {
      id
      versionNumber
      content
      createdAt
      author {
        id
        address
      }
    }
  }
`;

export const GET_DOCUMENT_COMMENTS = gql`
  query GetDocumentComments($documentId: ID!) {
    comments(documentId: $documentId) {
      id
      content
      author {
        id
        address
      }
      position
      resolved
      createdAt
      replies {
        id
        content
        author {
          id
          address
        }
        createdAt
      }
    }
  }
`;

export const GET_DOCUMENT_HISTORY = gql`
  query GetDocumentHistory($documentId: ID!) {
    documentHistory(documentId: $documentId) {
      id
      versionNumber
      content
      createdAt
      author {
        id
        address
      }
    }
  }
`;
