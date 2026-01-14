// Centralized authentication utilities for consistency
import { requireSession, requireAdminSession } from './auth'
import { handleApiError } from './error-handler'

export type UserRole = "ADMIN" | "EMPLOYEE" | "ACCOUNTING" | "HR"

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
}

/**
 * Standard authentication check for all API endpoints
 */
export async function authenticate(): Promise<AuthenticatedUser> {
  try {
    const session = await requireSession()
    
    // In a real implementation, you would fetch user details from database
    // For now, return session-based user info
    return {
      id: session.userId,
      email: '', // Would be fetched from database
      name: '',  // Would be fetched from database
      role: session.role,
      department: '' // Would be fetched from database
    }
  } catch (error) {
    throw handleApiError(error, 'AUTH_SESSION')
  }
}

/**
 * Admin authentication check
 */
export async function authenticateAdmin(): Promise<AuthenticatedUser> {
  try {
    const session = await requireAdminSession()
    
    return {
      id: session.userId,
      email: '', // Would be fetched from database
      name: '',  // Would be fetched from database
      role: session.role,
      department: '' // Would be fetched from database
    }
  } catch (error) {
    throw handleApiError(error, 'AUTH_ADMIN')
  }
}

/**
 * Role-based authentication check
 */
export async function authenticateWithRoles(
  allowedRoles: UserRole[]
): Promise<AuthenticatedUser> {
  try {
    const user = await authenticate()
    
    if (!allowedRoles.includes(user.role)) {
      throw new Error('FORBIDDEN')
    }
    
    return user
  } catch (error) {
    throw handleApiError(error, 'AUTH_ROLES')
  }
}

/**
 * Check if user has permission for specific action
 */
export function hasPermission(
  user: AuthenticatedUser,
  action: string,
  resource?: string
): boolean {
  const permissions: Record<UserRole, string[]> = {
    ADMIN: ['*'], // All permissions
    HR: ['user_management', 'leave_approval', 'view_all_users'],
    ACCOUNTING: ['requisition_approval', 'payment_processing', 'financial_reports'],
    EMPLOYEE: ['create_tasks', 'create_requisitions', 'create_leaves', 'view_own_data']
  }
  
  const userPermissions = permissions[user.role] || []
  
  // Admin has all permissions
  if (userPermissions.includes('*')) {
    return true
  }
  
  // Check specific permission
  if (userPermissions.includes(action)) {
    return true
  }
  
  // Check resource-specific permissions
  if (resource) {
    const resourcePermission = `${action}:${resource}`
    return userPermissions.includes(resourcePermission)
  }
  
  return false
}

/**
 * Middleware function for role-based access control
 */
export function requireRole(roles: UserRole[]) {
  return async (request: Request): Promise<AuthenticatedUser> => {
    return authenticateWithRoles(roles)
  }
}

/**
 * Middleware function for permission-based access control
 */
export function requirePermission(action: string, resource?: string) {
  return async (request: Request): Promise<AuthenticatedUser> => {
    const user = await authenticate()
    
    if (!hasPermission(user, action, resource)) {
      throw new Error('FORBIDDEN')
    }
    
    return user
  }
}

/**
 * Get user context for logging and auditing
 */
export function getUserContext(user: AuthenticatedUser): Record<string, string> {
  return {
    userId: user.id,
    userRole: user.role,
    userDepartment: user.department || 'unknown'
  }
}

/**
 * Standard session validation with enhanced error handling
 */
export async function validateSession(): Promise<AuthenticatedUser> {
  try {
    return await authenticate()
  } catch (error: any) {
    // Enhance session expiry detection
    if (error?.message?.includes('exp') || error?.message?.includes('session')) {
      throw new Error('SESSION_EXPIRED')
    }
    throw error
  }
}
