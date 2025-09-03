export const CONTRACT_ADDRESSES = {
  AUTH_ROLES: process.env.NEXT_PUBLIC_AUTH_ROLES_CONTRACT || '',
  POSTS: process.env.NEXT_PUBLIC_POSTS_CONTRACT || ''
};

export const IRYS_CONSTANTS = {
  GATEWAY_URL: 'https://gateway.irys.xyz',
  UPLOADER_URL: 'https://uploader.irys.xyz',
  QUERY_URL: 'https://query.irys.xyz',
  TOKEN: 'ethereum'
};

export const ROLES = {
  CREATOR: 'creator',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
} as const;

export const TABLES = {
  POSTS: 'posts',
  USERS: 'users'
} as const;

export const CACHE_KEYS = {
  POST: 'post',
  POSTS_BY_AUTHOR: 'postsByAuthor',
  USER_ROLES: 'userRoles',
  IRYS_BALANCE: 'irysBalance'
} as const;

export const CACHE_TTL = {
  SHORT: 60 * 5, // 5 minutes
  MEDIUM: 60 * 30, // 30 minutes
  LONG: 60 * 60 * 24 // 24 hours
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

export const VALIDATION = {
  MIN_CONTENT_LENGTH: 1,
  MAX_CONTENT_LENGTH: 10000,
  ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/
} as const;