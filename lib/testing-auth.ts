import { TESTING_MODE, getCurrentMockUser, mockTasks, mockLeaveRequests, mockCashRequisitions } from './testing-mode'

export async function requireAdminUser() {
  if (TESTING_MODE) {
    return getCurrentMockUser("admin-1")
  }
  
  // Original implementation would go here
  throw new Error("Testing mode disabled - implement real auth")
}

export async function requireUser() {
  if (TESTING_MODE) {
    return getCurrentMockUser("admin-1")
  }
  
  // Original implementation would go here
  throw new Error("Testing mode disabled - implement real auth")
}

export async function requireUserWithRoles(roles: Array<"ADMIN" | "EMPLOYEE" | "ACCOUNTING" | "HR">) {
  if (TESTING_MODE) {
    const user = getCurrentMockUser("admin-1")
    if (!roles.includes(user.role as any)) {
      throw new Error("FORBIDDEN")
    }
    return user
  }
  
  // Original implementation would go here
  throw new Error("Testing mode disabled - implement real auth")
}

// Mock data providers for API routes
export function getMockData(type: string) {
  switch (type) {
    case 'tasks':
      return mockTasks
    case 'leaves':
      return mockLeaveRequests
    case 'requisitions':
      return mockCashRequisitions
    default:
      return []
  }
}
