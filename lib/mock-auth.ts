// Mock auth helper - provides context-appropriate user without real authentication
// NOTE: This uses the actual admin user ID from the database
// When you re-enable authentication, remove this file and use real auth

const mockUsers = {
  admin: {
    id: "clx4d6541674484bb0532dbc", // Real admin user ID from database
    email: "admin@acetech.com",
    name: "Admin User",
    role: "ADMIN" as const,
    department: "Management"
  },
  employee: {
    id: "emp-1",
    email: "john.doe@acetech.com",
    name: "John Doe",
    role: "EMPLOYEE" as const,
    department: "Engineering"
  }
}

export function getMockUser(context: "admin" | "employee" = "admin") {
  return mockUsers[context]
}

export function getMockSession(context: "admin" | "employee" = "admin") {
  return {
    user: getMockUser(context),
  }
}

