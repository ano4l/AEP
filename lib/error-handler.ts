// Production-safe error handling utility
// Sanitizes error messages to prevent information leakage

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
  retryable?: boolean;
}

interface ErrorContext {
  operation: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

/**
 * Sanitize error for production - removes sensitive details
 */
export function sanitizeError(error: any, context: string | ErrorContext): ErrorResponse {
  const errorContext = typeof context === 'string' ? { operation: context } : context;
  
  // In development, show full error details
  if (!IS_PRODUCTION) {
    return {
      error: error?.message || 'An error occurred',
      details: error?.stack || String(error),
      code: error?.code,
      retryable: isRetryableError(error)
    };
  }

  // In production, show generic messages only
  const response: ErrorResponse = {
    error: getGenericErrorMessage(errorContext.operation),
    retryable: isRetryableError(error)
  };

  // Log detailed error server-side for debugging
  console.error(`[${errorContext.operation}]`, {
    message: error?.message,
    code: error?.code,
    stack: error?.stack,
    userId: errorContext.userId,
    requestId: errorContext.requestId,
    metadata: errorContext.metadata,
    timestamp: new Date().toISOString()
  });

  return response;
}

/**
 * Get user-friendly generic error message based on context
 */
function getGenericErrorMessage(operation: string): string {
  const messages: Record<string, string> = {
    'AUTH_LOGIN': 'Login failed. Please check your credentials and try again.',
    'AUTH_REGISTER': 'Registration failed. Please try again later.',
    'AUTH_SESSION': 'Your session has expired. Please log in again.',
    'TASK_CREATE': 'Failed to create task. Please try again.',
    'TASK_UPDATE': 'Failed to update task. Please try again.',
    'TASK_DELETE': 'Failed to delete task. Please try again.',
    'REQUISITION_CREATE': 'Failed to create requisition. Please try again.',
    'REQUISITION_UPDATE': 'Failed to update requisition. Please try again.',
    'LEAVE_CREATE': 'Failed to create leave request. Please try again.',
    'LEAVE_UPDATE': 'Failed to update leave request. Please try again.',
    'FILE_UPLOAD': 'Failed to upload file. Please check file format and size.',
    'DATABASE_CONNECTION': 'Database temporarily unavailable. Please try again later.',
    'DATABASE_TIMEOUT': 'Operation timed out. Please try again.',
    'VALIDATION': 'Invalid input provided. Please check your data.',
    'UNAUTHORIZED': 'You are not authorized to perform this action.',
    'FORBIDDEN': 'Access denied.',
    'NOT_FOUND': 'The requested resource was not found.',
    'RATE_LIMIT': 'Too many requests. Please try again later.',
    'MAINTENANCE': 'System under maintenance. Please try again later.',
  };

  return messages[operation] || 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const retryableCodes = [
    'P1001', // Database connection error
    'P1002', // Database timeout
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND'
  ];
  
  const retryableMessages = [
    'timeout',
    'connection',
    'network',
    'temporary'
  ];
  
  return retryableCodes.includes(error?.code) ||
         retryableMessages.some(msg => error?.message?.toLowerCase().includes(msg));
}

/**
 * Check if error is a database connection error
 */
export function isDatabaseError(error: any): boolean {
  return error?.code === 'P1001' || 
         error?.message?.includes("Can't reach database") ||
         error?.message?.includes('connection');
}

/**
 * Check if error is a validation error (Zod)
 */
export function isValidationError(error: any): boolean {
  return error?.name === 'ZodError' || error?.issues;
}

/**
 * Check if error is an authentication error
 */
export function isAuthenticationError(error: any): boolean {
  return error?.message === 'UNAUTHENTICATED' ||
         error?.message === 'SESSION_EXPIRED' ||
         error?.code === 'AUTH_001';
}

/**
 * Check if error is an authorization error
 */
export function isAuthorizationError(error: any): boolean {
  return error?.message === 'FORBIDDEN' ||
         error?.code === 'AUTH_002';
}

/**
 * Format validation errors for user display
 */
export function formatValidationErrors(error: any): string[] {
  if (!error?.issues) return [];
  
  return error.issues.map((issue: any) => {
    const field = issue.path.join('.');
    return `${field}: ${issue.message}`;
  });
}

/**
 * Create standardized API error response
 */
export function createErrorResponse(
  error: any, 
  context: string | ErrorContext, 
  status: number = 500
): Response {
  const sanitized = sanitizeError(error, context);
  
  return new Response(JSON.stringify(sanitized), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Error-Code': error?.code || 'UNKNOWN',
      'X-Retryable': sanitized.retryable ? 'true' : 'false'
    }
  });
}

/**
 * Handle API errors consistently
 */
export function handleApiError(
  error: any, 
  context: string | ErrorContext,
  userId?: string
): Response {
  const errorContext = typeof context === 'string' 
    ? { operation: context, userId }
    : { ...context, userId };
  
  // Handle specific error types
  if (isValidationError(error)) {
    const errors = formatValidationErrors(error);
    return createErrorResponse(error, errorContext, 400);
  }
  
  if (isAuthenticationError(error)) {
    return createErrorResponse(error, errorContext, 401);
  }
  
  if (isAuthorizationError(error)) {
    return createErrorResponse(error, errorContext, 403);
  }
  
  if (error?.message === 'NOT_FOUND' || error?.code === 'PGRST116') {
    return createErrorResponse(error, errorContext, 404);
  }
  
  if (error?.message?.includes('RATE_LIMIT')) {
    return createErrorResponse(error, errorContext, 429);
  }
  
  // Default to 500 for unknown errors
  return createErrorResponse(error, errorContext, 500);
}
