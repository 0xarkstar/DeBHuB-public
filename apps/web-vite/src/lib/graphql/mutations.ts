import { gql } from '@apollo/client';

export const CREATE_DOCUMENT = gql`
  mutation CreateDocument($input: CreateDocumentInput!) {
    createDocument(input: $input) {
      id
      title
      content
      path
      version
    }
  }
`;

export const UPDATE_DOCUMENT = gql`
  mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {
    updateDocument(id: $id, input: $input) {
      id
      title
      content
      version
      updatedAt
    }
  }
`;

export const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
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

export const RESOLVE_COMMENT = gql`
  mutation ResolveComment($id: ID!) {
    resolveComment(id: $id) {
      id
      resolved
      resolvedAt
    }
  }
`;

export const REVERT_TO_VERSION = gql`
  mutation RevertToVersion($documentId: ID!, $versionId: ID!) {
    revertToVersion(documentId: $documentId, versionId: $versionId) {
      id
      version
      content
    }
  }
`;

export const REQUEST_CHALLENGE = gql`
  mutation RequestChallenge($address: String!) {
    requestChallenge(address: $address) {
      challenge
    }
  }
`;

export const AUTHENTICATE = gql`
  mutation Authenticate($address: String!, $signature: String!) {
    authenticate(address: $address, signature: $signature) {
      token
      user {
        id
        address
      }
    }
  }
`;

export const PUBLISH_DOCUMENT = gql`
  mutation PublishDocument($id: ID!) {
    publishDocument(id: $id) {
      id
      published
      irysId
      permanentUrl
    }
  }
`;

export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id) {
      id
    }
  }
`;
