// Testing mode configuration - bypasses auth and database
// Set NEXT_PUBLIC_TESTING_MODE=true in .env to enable
export const TESTING_MODE = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_TESTING_MODE === 'true'

export const mockUsers = [
  {
    id: "admin-1",
    email: "admin@acetech.com",
    name: "Admin User",
    role: "ADMIN" as const,
    department: "Management"
  },
  {
    id: "hr-1",
    email: "hr@acetech.com", 
    name: "HR Manager",
    role: "HR" as const,
    department: "Human Resources"
  },
  {
    id: "emp-1",
    email: "john.doe@acetech.com",
    name: "John Doe",
    role: "EMPLOYEE" as const,
    department: "Engineering"
  },
  {
    id: "acc-1",
    email: "accounting@acetech.com",
    name: "Accountant",
    role: "ACCOUNTING" as const,
    department: "Finance"
  }
]

export const mockTasks = [
  {
    id: "task-1",
    title: "Design new dashboard",
    description: "Create mockups for the new dashboard layout",
    status: "TODO" as const,
    priority: "HIGH" as const,
    assigneeId: "emp-1",
    creatorId: "admin-1",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignee: mockUsers[2],
    creator: mockUsers[0]
  },
  {
    id: "task-2", 
    title: "Review leave requests",
    description: "Approve pending leave requests",
    status: "IN_PROGRESS" as const,
    priority: "MEDIUM" as const,
    assigneeId: "hr-1",
    creatorId: "admin-1",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignee: mockUsers[1],
    creator: mockUsers[0]
  }
]

export const mockLeaveRequests = [
  {
    id: "leave-1",
    userId: "emp-1",
    leaveTypeId: "annual-1",
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    days: 5,
    reason: "Family vacation",
    status: "PENDING" as const,
    adminId: null,
    adminNotes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: mockUsers[2],
    leaveType: { id: "annual-1", name: "Annual Leave" }
  }
]

export const mockCashRequisitions = [
  {
    id: "req-1",
    requestDate: new Date().toISOString(),
    payee: "Office Supplies Co",
    customer: "Internal",
    details: "Office supplies for Q4",
    code: "SUP-001",
    amount: 1500.00,
    currency: "USD",
    preparedById: "admin-1",
    department: "Administration",
    allocation: "Operating Budget",
    status: "ADMIN_APPROVED" as const,
    authorisedById: null,
    adminNotes: null,
    rejectedById: null,
    rejectedAt: null,
    paidById: null,
    paidAt: null,
    overrideJustification: null,
    overrideById: null,
    overrideAt: null,
    closedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preparedBy: mockUsers[0]
  }
]

export function getCurrentMockUser(userId: string = "admin-1") {
  return mockUsers.find(u => u.id === userId) || mockUsers[0]
}

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
