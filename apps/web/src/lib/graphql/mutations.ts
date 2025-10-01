import { gql } from '@apollo/client';
import { PROJECT_BASIC, DOCUMENT_BASIC, USER_BASIC } from './queries';

// Authentication
export const REQUEST_CHALLENGE = gql`
  mutation RequestChallenge($address: String!) {
    requestChallenge(address: $address) {
      challenge
      expiresAt
    }
  }
`;

export const AUTHENTICATE = gql`
  ${USER_BASIC}
  mutation Authenticate($address: String!, $signature: String!) {
    authenticate(address: $address, signature: $signature) {
      token
      user {
        ...UserBasic
      }
    }
  }
`;

// Project Mutations
export const CREATE_PROJECT = gql`
  ${PROJECT_BASIC}
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      ...ProjectBasic
      irysId
    }
  }
`;

export const UPDATE_PROJECT = gql`
  ${PROJECT_BASIC}
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
      ...ProjectBasic
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

// Document Mutations
export const CREATE_DOCUMENT = gql`
  ${DOCUMENT_BASIC}
  mutation CreateDocument($input: CreateDocumentInput!) {
    createDocument(input: $input) {
      ...DocumentBasic
      content
      irysId
      contentHash
    }
  }
`;

export const UPDATE_DOCUMENT = gql`
  ${DOCUMENT_BASIC}
  mutation UpdateDocument($input: UpdateDocumentInput!) {
    updateDocument(input: $input) {
      ...DocumentBasic
      content
    }
  }
`;

export const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`;

export const PUBLISH_DOCUMENT = gql`
  ${DOCUMENT_BASIC}
  mutation PublishDocument($id: ID!) {
    publishDocument(id: $id) {
      ...DocumentBasic
    }
  }
`;

// Version Mutations
export const CREATE_VERSION = gql`
  mutation CreateVersion($documentId: ID!, $content: String!, $message: String) {
    createVersion(documentId: $documentId, content: $content, message: $message) {
      id
      versionNumber
      createdAt
      message
      irysId
    }
  }
`;

export const REVERT_TO_VERSION = gql`
  ${DOCUMENT_BASIC}
  mutation RevertToVersion($documentId: ID!, $versionId: ID!) {
    revertToVersion(documentId: $documentId, versionId: $versionId) {
      ...DocumentBasic
      content
    }
  }
`;

// Collaborator Mutations
export const ADD_COLLABORATOR = gql`
  ${USER_BASIC}
  mutation AddCollaborator($input: AddCollaboratorInput!) {
    addCollaborator(input: $input) {
      id
      role
      user {
        ...UserBasic
      }
    }
  }
`;

export const UPDATE_COLLABORATOR_ROLE = gql`
  mutation UpdateCollaboratorRole($collaboratorId: ID!, $role: CollaboratorRole!) {
    updateCollaboratorRole(collaboratorId: $collaboratorId, role: $role) {
      id
      role
    }
  }
`;

export const REMOVE_COLLABORATOR = gql`
  mutation RemoveCollaborator($collaboratorId: ID!) {
    removeCollaborator(collaboratorId: $collaboratorId)
  }
`;

// Comment Mutations
export const CREATE_COMMENT = gql`
  ${USER_BASIC}
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
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

export const RESOLVE_COMMENT = gql`
  ${USER_BASIC}
  mutation ResolveComment($id: ID!) {
    resolveComment(id: $id) {
      id
      resolved
      resolvedAt
      resolvedBy {
        ...UserBasic
      }
    }
  }
`;

export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;
