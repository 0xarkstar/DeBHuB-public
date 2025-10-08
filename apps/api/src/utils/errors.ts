/**
 * Custom application error class with error codes
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error codes used throughout the application
 */
export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  CHALLENGE_EXPIRED: 'CHALLENGE_EXPIRED',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // External service errors
  IRYS_ERROR: 'IRYS_ERROR',
  BLOCKCHAIN_ERROR: 'BLOCKCHAIN_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Generic errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

/**
 * Helper functions to create specific error types
 */
export function unauthorizedError(message: string = 'Unauthorized'): AppError {
  return new AppError(message, ErrorCodes.UNAUTHORIZED, 401);
}

export function forbiddenError(message: string = 'Forbidden'): AppError {
  return new AppError(message, ErrorCodes.FORBIDDEN, 403);
}

export function notFoundError(resource: string): AppError {
  return new AppError(`${resource} not found`, ErrorCodes.NOT_FOUND, 404);
}

export function validationError(message: string): AppError {
  return new AppError(message, ErrorCodes.VALIDATION_ERROR, 400);
}

export function irysError(message: string): AppError {
  return new AppError(message, ErrorCodes.IRYS_ERROR, 500);
}

export function blockchainError(message: string): AppError {
  return new AppError(message, ErrorCodes.BLOCKCHAIN_ERROR, 500);
}

export function internalError(message: string = 'Internal server error'): AppError {
  return new AppError(message, ErrorCodes.INTERNAL_ERROR, 500);
}
