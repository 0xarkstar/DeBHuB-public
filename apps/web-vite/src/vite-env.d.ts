/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_URL: string
  readonly VITE_GRAPHQL_WS_URL: string
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_AUTH_ROLES_CONTRACT: string
  readonly VITE_POSTS_CONTRACT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
