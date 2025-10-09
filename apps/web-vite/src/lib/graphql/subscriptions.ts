import { gql } from '@apollo/client';

export const DOCUMENT_CHANGED = gql`
  subscription DocumentChanged($documentId: ID!) {
    documentChanged(documentId: $documentId) {
      id
      title
      content
      version
      updatedAt
      author {
        id
        address
      }
    }
  }
`;

export const COMMENT_ADDED = gql`
  subscription CommentAdded($documentId: ID!) {
    commentAdded(documentId: $documentId) {
      id
      content
      author {
        id
        address
      }
      createdAt
    }
  }
`;

export const DOCUMENT_UPDATED = gql`
  subscription DocumentUpdated($documentId: ID!) {
    documentUpdated(documentId: $documentId) {
      id
      type
      content
      version
      updatedAt
    }
  }
`;
