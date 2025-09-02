import { gql } from '@apollo/client'

export const GET_POSTS_BY_AUTHOR = gql`
  query GetPostsByAuthor($authorAddress: String!, $limit: Int, $offset: Int) {
    postsByAuthor(authorAddress: $authorAddress, limit: $limit, offset: $offset) {
      id
      irysTransactionId
      content
      authorAddress
      timestamp
      version
      previousVersionId
    }
  }
`

export const GET_POST_HISTORY = gql`
  query GetPostHistory($id: ID!) {
    postHistory(id: $id) {
      id
      irysTransactionId
      content
      authorAddress
      timestamp
      version
      previousVersionId
    }
  }
`

export const VERIFY_POST_FROM_IRYS = gql`
  query VerifyPostFromIrys($irysTransactionId: String!) {
    verifyPostFromIrys(irysTransactionId: $irysTransactionId) {
      id
      irysTransactionId
      content
      authorAddress
      timestamp
      version
      previousVersionId
    }
  }
`

export const CREATE_POST = gql`
  mutation CreatePost($content: String!) {
    createPost(content: $content) {
      id
      irysTransactionId
      content
      authorAddress
      timestamp
      version
      previousVersionId
    }
  }
`

export const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $content: String!) {
    updatePost(id: $id, content: $content) {
      id
      irysTransactionId
      content
      authorAddress
      timestamp
      version
      previousVersionId
    }
  }
`

export const POST_UPDATES_SUBSCRIPTION = gql`
  subscription PostUpdates {
    postUpdates {
      type
      post {
        id
        irysTransactionId
        content
        authorAddress
        timestamp
        version
        previousVersionId
      }
    }
  }
`