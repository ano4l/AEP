// Build-safe database module
// This file is used during build time to prevent environment variable errors

export const supabase = null
export const supabaseAdmin = null

// Mock database operations for build time
export const db = {
  user: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async () => null,
    update: async () => null,
    delete: async () => null,
    count: async () => 0,
  },
  task: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async () => null,
    update: async () => null,
    delete: async () => null,
    count: async () => 0,
  },
  leaveRequest: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async () => null,
    update: async () => null,
    delete: async () => null,
    count: async () => 0,
  },
  cashRequisition: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async () => null,
    update: async () => null,
    delete: async () => null,
    count: async () => 0,
  },
  leaveType: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async () => null,
    update: async () => null,
  },
  notification: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async () => null,
    update: async () => null,
    delete: async () => null,
  },
  auditLog: {
    create: async () => null,
  },
  fileAttachment: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async () => null,
    update: async () => null,
    delete: async () => null,
  },
}
