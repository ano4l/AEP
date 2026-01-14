// Database error handling utilities
export interface DatabaseError {
  code?: string
  message?: string
  details?: any
  hint?: string
}

export class DatabaseConnectionError extends Error {
  constructor(message: string, public originalError: any) {
    super(message)
    this.name = 'DatabaseConnectionError'
  }
}

export class DatabaseTimeoutError extends Error {
  constructor(message: string, public originalError: any) {
    super(message)
    this.name = 'DatabaseTimeoutError'
  }
}

export function isDatabaseConnectionError(error: any): boolean {
  return (
    error?.code === 'P1001' ||
    error?.code === 'P1002' ||
    error?.message?.includes('Can\'t reach database') ||
    error?.message?.includes('Connection refused') ||
    error?.message?.includes('timeout') ||
    error?.message?.includes('ECONNREFUSED')
  )
}

export function isDatabaseTimeoutError(error: any): boolean {
  return (
    error?.code === 'P1002' ||
    error?.message?.includes('timeout') ||
    error?.message?.includes('ETIMEDOUT')
  )
}

export function handleDatabaseError(error: any): never {
  if (isDatabaseConnectionError(error)) {
    throw new DatabaseConnectionError('Database connection failed', error)
  }
  
  if (isDatabaseTimeoutError(error)) {
    throw new DatabaseTimeoutError('Database operation timed out', error)
  }
  
  // Handle other database errors
  if (error?.code === 'PGRST116') {
    throw new Error('Record not found')
  }
  
  if (error?.code === '23505') {
    throw new Error('Duplicate record violation')
  }
  
  if (error?.code === '23503') {
    throw new Error('Foreign key constraint violation')
  }
  
  if (error?.code === '23514') {
    throw new Error('Check constraint violation')
  }
  
  // Generic database error
  throw new Error(error?.message || 'Database operation failed')
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on certain errors
      if (
        error instanceof DatabaseConnectionError ||
        error?.code === '23505' || // Unique constraint
        error?.code === '23503' || // Foreign key
        error?.code === '23514'    // Check constraint
      ) {
        throw error
      }
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}
