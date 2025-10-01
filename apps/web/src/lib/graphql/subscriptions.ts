import { gql } from '@apollo/client';
import { USER_BASIC } from './queries';

// Document Subscriptions
export const DOCUMENT_UPDATED = gql`
  subscription DocumentUpdated($documentId: ID!) {
    documentUpdated(documentId: $documentId) {
      documentId
      type
      data
      timestamp
    }
  }
`;

// Comment Subscriptions
export const COMMENT_ADDED = gql`
  ${USER_BASIC}
  subscription CommentAdded($documentId: ID!) {
    commentAdded(documentId: $documentId) {
      id
      content
      position
      createdAt
      author {
        ...UserBasic
      }
    }
  }
`;

// Version Subscriptions
export const VERSION_CREATED = gql`
  ${USER_BASIC}
  subscription VersionCreated($documentId: ID!) {
    versionCreated(documentId: $documentId) {
      id
      versionNumber
      message
      createdAt
      author {
        ...UserBasic
      }
    }
  }
`;

// Review Subscriptions
export const REVIEW_REQUESTED = gql`
  ${USER_BASIC}
  subscription ReviewRequested($userId: ID!) {
    reviewRequested(userId: $userId) {
      id
      message
      requestedBy {
        ...UserBasic
      }
      document {
        id
        title
      }
    }
  }
`;
